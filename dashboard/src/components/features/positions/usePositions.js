import { useState, useEffect, useRef } from "react";
import API from "../../../api";
import { calculateTotalIntradayMetrics } from "../../../utils/portfolioMath";
import { fetchBatchQuotes } from "../../../utils/marketQuotes";

export const usePositions = () => {
  const [allPositions, setAllPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  const fetchPositions = async () => {
    try {
      const res = await API.get("/allPositions");
      if (!isMountedRef.current) return;
      const positionsData = res.data || [];
      setAllPositions(positionsData);
      setLoading(false);

      if (positionsData.length === 0) return;

      // Single batched quotes fetch (eliminates N+1 waterfall)
      const quoteMap = await fetchBatchQuotes(positionsData);

      if (!isMountedRef.current) return;

      setAllPositions((prevPositions) =>
        prevPositions.map((stock) => {
          const live = quoteMap[stock.name.toUpperCase()] || quoteMap[stock.name];
          if (!live) return stock;

          const livePrice = live.price != null ? Number(live.price) : stock.price;
          return {
            ...stock,
            price: livePrice,
            day: live.percent ?? stock.day,
            isLoss: live.isLoss ?? stock.isLoss,
          };
        })
      );
    } catch (err) {
      if (isMountedRef.current) {
        console.error("Positions fetch failed: ", err);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchPositions();

    const handlePortfolioUpdate = () => fetchPositions();
    window.addEventListener("portfolioUpdated", handlePortfolioUpdate);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener("portfolioUpdated", handlePortfolioUpdate);
    };
  }, []);

  // 1-Click Square Off Exit Handler
  const handleSquareOff = async (stock) => {
    const net = stock.netQty !== undefined ? stock.netQty : (stock.qty || 0);
    if (net === 0) return;

    const squareOffMode = net > 0 ? "SELL" : "BUY";
    const squareOffQty = Math.abs(net);

    let executionPrice = Number(stock.price);

    // ⚡ Simulator check: User se exit price input maango!
    const isSimMode = localStorage.getItem("isSimulationMode") === "true";
    if (isSimMode) {
      const userPrice = window.prompt(
        `Simulator Mode Active!\nEnter Exit Execution Price for ${stock.name} (${squareOffMode} ${squareOffQty} shares):`,
        stock.price || stock.avg
      );
      if (userPrice === null) return; // User ne Cancel dabaya
      const parsed = parseFloat(userPrice);
      if (!isNaN(parsed) && parsed > 0) {
        executionPrice = parsed;
      }
    } else {
      const isConfirmed = window.confirm(
        `Square Off Position?\n\nStock: ${stock.name}\nType: ${net > 0 ? "LONG EXIT" : "SHORT COVER"}\nAction: ${squareOffMode} ${squareOffQty} shares @ ~₹${stock.price}\n\nProceed?`
      );
      if (!isConfirmed) return;
    }

    try {
      const res = await API.post("/newOrder", {
        name: stock.name,
        qty: squareOffQty,
        price: executionPrice,
        mode: squareOffMode,
        product: "MIS",
        isSimulation: isSimMode,
      });

      const settlement = res.data.settlement;
      let msg = `Position squared off successfully!`;
      if (settlement && settlement.realizedPnL !== undefined) {
        const sign = settlement.realizedPnL >= 0 ? "+" : "";
        msg += `\n\n Math Settlement:\n• Exit Price: ₹${executionPrice.toFixed(2)}\n• Realized P&L: ${sign}₹${Number(settlement.realizedPnL).toFixed(2)}\n• Available Cash: ₹${Number(settlement.availableCash).toLocaleString("en-IN")}`;
      }
      alert(msg);
      // Reactive re-fetch: zero page reload!
      fetchPositions();
    } catch (err) {
      alert(err.response?.data?.error || `Failed to square off position!`);
    }
  };


  // 1-Click RMS Auto Square-Off for All open positions
  const handleSquareOffAll = async () => {
    const isConfirmed = window.confirm(
      " RMS Liquidation Alert\n\nDo you want to square-off all MIS positions now?\n\nThis action cannot be undone."
    );
    if (!isConfirmed) return;

    try {
      const res = await API.post("/allPositions/squareoffAll");
      alert(res.data.message || "All open positions squared off successfully!");
      fetchPositions();  // instant re-fetch without page reload!
    }
    catch (err) {
      alert(err.response?.data?.error || "Failed to executed RMS Square-Off");
    }
  };

  const metrics = calculateTotalIntradayMetrics(allPositions);

  return {
    allPositions,
    loading,
    metrics,
    handleSquareOff,
    handleSquareOffAll,
    refreshPositions: fetchPositions,
  };
};
