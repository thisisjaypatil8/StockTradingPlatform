import { useState, useEffect, useRef, useCallback } from "react";
import API from "../../../api";

export const useOrders = () => {
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await API.get("/allOrders");
      if (!isMountedRef.current) return;
      setAllOrders(res.data || []);
    } catch (err) {
      if (isMountedRef.current) {
        console.error("Orders fetch failed:", err);
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchOrders();

    const handlePortfolioUpdate = () => fetchOrders();
    window.addEventListener("portfolioUpdated", handlePortfolioUpdate);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener("portfolioUpdated", handlePortfolioUpdate);
    };
  }, [fetchOrders]);

  return {
    allOrders,
    loading,
    refreshOrders: fetchOrders,
  };
};
