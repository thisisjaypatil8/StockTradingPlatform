import { useState, useCallback } from "react";
import API from "../../../api";
import { fetchBatchQuotes } from "../../../utils/marketQuotes";

/**
 * useHoldings — Data hook for CNC long-term holdings.
 *
 * Note: Holdings are sourced from PortfolioContext (which already fetches
 * them on mount and exposes refreshPortfolio). This hook adds live LTP
 * enrichment on top, following the same pattern as usePositions.js.
 *
 * Usage: Call this inside Holdings.jsx instead of pulling from PortfolioContext
 * directly if you want live price enrichment.
 */
export const useHoldings = (initialHoldings = []) => {
  const [holdings, setHoldings] = useState(initialHoldings);
  const [enriching, setEnriching] = useState(false);

  const enrichWithLivePrices = useCallback(async (rawHoldings) => {
    if (!rawHoldings.length) {
      setHoldings(rawHoldings);
      return;
    }

    setHoldings(rawHoldings); // Render immediately with DB prices
    setEnriching(true);

    try {
      const quoteMap = await fetchBatchQuotes(rawHoldings);
      setHoldings((prev) =>
        prev.map((stock) => {
          const live = quoteMap[stock.name.toUpperCase()] || quoteMap[stock.name];
          if (!live) return stock;
          return {
            ...stock,
            price: live.price != null ? Number(live.price) : stock.price,
            day: live.percent ?? stock.day,
            isLoss: live.isLoss ?? stock.isLoss,
          };
        })
      );
    } catch (err) {
      console.error("Holdings live price enrichment failed:", err);
    } finally {
      setEnriching(false);
    }
  }, []);

  // Fetch holdings + enrich with live quotes
  const fetchAndEnrich = useCallback(async () => {
    try {
      const res = await API.get("/allHoldings");
      await enrichWithLivePrices(res.data || []);
    } catch (err) {
      console.error("Holdings fetch failed:", err);
    }
  }, [enrichWithLivePrices]);

  return {
    holdings,
    enriching,
    enrichWithLivePrices,
    fetchAndEnrich,
  };
};
