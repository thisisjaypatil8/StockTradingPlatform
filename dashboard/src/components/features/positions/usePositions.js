import { useState, useEffect, useRef } from "react";
import API from "../../../api";
import { calculateTotalIntradayMetrics } from "../../../utils/portfolioMath";

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

      // Parallel fetch live LTP for each stock
      const quotePromises = positionsData.map((stock) =>
        API.get(`market/quote/${stock.name}`)
          .then((qRes) => ({ name: stock.name, quote: qRes.data }))
          .catch(() => ({ name: stock.name, quote: null }))
      );

      const results = await Promise.allSettled(quotePromises);
      if (!isMountedRef.current) return;

      const quoteMap = {};
      results.forEach((r) => {
        if (r.status === "fulfilled" && r.value?.quote) {
          quoteMap[r.value.name] = r.value.quote;
        }
      });

      setAllPositions((prevPositions) =>
        prevPositions.map((stock) => {
          const live = quoteMap[stock.name];
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
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 1-Click Square Off Exit Handler
  const handleSquareOff = async (stock) => {
    const net = stock.netQty !== undefined ? stock.netQty : (stock.qty || 0);
    if (net === 0) return;

    const squareOffMode = net > 0 ? "SELL" : "BUY";
    const squareOffQty = Math.abs(net);

    const isConfirmed = window.confirm(
      `Square Off Position?\n\nStock: ${stock.name}\nType: ${net > 0 ? "LONG EXIT" : "SHORT COVER"}\nAction: ${squareOffMode} ${squareOffQty} shares @ ~₹${stock.price}\n\nProceed?`
    );

    if (!isConfirmed) return;

    try {
      const res = await API.post("/newOrder", {
        name: stock.name,
        qty: squareOffQty,
        price: Number(stock.price),
        mode: squareOffMode,
        product: "MIS",
      });

      alert(res.data.message || `Position squared off successfully!`);
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
    if(!isConfirmed) return;

    try{
      const res = await API.post("/allPositions/squareoffAll");
      alert(res.data.message || "All open positions squared off successfully!");
      fetchPositions();  // instant re-fetch without page reload!
    }
    catch(err){
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
