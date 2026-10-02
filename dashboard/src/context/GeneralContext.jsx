import React, { useState, useEffect } from "react";
import BuyActionWindow from "../components/shared/modals/BuyActionWindow";
import StockChartWindow from "../components/shared/modals/StockChartWindow";

const GeneralContext = React.createContext({
  openOrderWindow: (uid, type) => {},
  closeOrderWindow: () => {},
  openChartWindow: (uid) => {},
  closeChartWindow: () => {},
  isSimulationMode: false,
  toggleSimulationMode: () => {},
  isAdmin: false,
});

const envAdminUser = (import.meta.env.VITE_ADMIN_USERNAME || "").trim().toLowerCase();
const envAdminEmail = (import.meta.env.VITE_ADMIN_EMAIL || "").trim().toLowerCase();

const verifyIsAdmin = (role, uname, mail) => {
  const u = (uname || "").trim().toLowerCase();
  const m = (mail || "").trim().toLowerCase();
  const matchesEnv = (envAdminUser && u === envAdminUser) || (envAdminEmail && m === envAdminEmail);
  return role === "admin" && matchesEnv;
};

export const GeneralContextProvider = (props) => {
  const [isOrderWindowOpen, setIsOrderWindowOpen] = useState(false);
  const [selectedStockUID, setSelectedStockUID] = useState("");
  const [orderMode, setOrderMode] = useState("BUY");

  // Chart modal states
  const [isChartWindowOpen, setIsChartWindowOpen] = useState(false);
  const [selectedChartStockUID, setSelectedChartStockUID] = useState("");

  // Admin & Simulation State
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSimulationMode, setIsSimulationMode] = useState(() => {
    return localStorage.getItem("isSimulationMode") === "true";
  });

  // Check admin role strictly from server-authoritative session
  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const userIsAdmin = storedUser?.role === "admin";
      setIsAdmin(userIsAdmin);

      if (!userIsAdmin) {
        setIsSimulationMode(false);
        localStorage.setItem("isSimulationMode", "false");
      }
    } catch (e) {
      setIsAdmin(false);
      setIsSimulationMode(false);
    }
  }, []);

  const handleToggleSimulationMode = () => {
    if (!isAdmin) {
      alert("Access Denied: Market Simulator controls are restricted to authorized administrators only.");
      return;
    }
    setIsSimulationMode((prev) => {
      const nextVal = !prev;
      localStorage.setItem("isSimulationMode", String(nextVal));
      return nextVal;
    });
  };

  // Order Window Handlers
  const handleOpenOrderWindow = (uid, type) => {
    setIsOrderWindowOpen(true);
    setSelectedStockUID(uid);
    setOrderMode(type);
  };

  const handleCloseOrderWindow = () => {
    setIsOrderWindowOpen(false);
    setSelectedStockUID("");
  };

  // Chart Window Handlers
  const handleOpenChartWindow = (uid) => {
    setSelectedChartStockUID(uid);
    setIsChartWindowOpen(true);
  };

  const handleCloseChartWindow = () => {
    setIsChartWindowOpen(false);
    setSelectedChartStockUID("");
  };

  return (
    <GeneralContext.Provider
      value={{
        openOrderWindow: handleOpenOrderWindow,
        closeOrderWindow: handleCloseOrderWindow,
        openChartWindow: handleOpenChartWindow,
        closeChartWindow: handleCloseChartWindow,
        isSimulationMode,
        toggleSimulationMode: handleToggleSimulationMode,
        isAdmin,
      }}
    >
      {props.children}
      {isOrderWindowOpen && (
        <BuyActionWindow uid={selectedStockUID} mode={orderMode} />
      )}
      {isChartWindowOpen && (
        <StockChartWindow
          uid={selectedChartStockUID}
          onClose={handleCloseChartWindow}
        />
      )}
    </GeneralContext.Provider>
  );
};

export default GeneralContext;
