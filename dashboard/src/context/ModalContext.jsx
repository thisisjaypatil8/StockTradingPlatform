import React, { createContext, useContext, useState, useEffect } from "react";
import BuyActionWindow from "../components/shared/modals/BuyActionWindow";
import StockChartWindow from "../components/shared/modals/StockChartWindow";

const ModalContext = createContext({
  openOrderWindow: (uid, type) => {},
  closeOrderWindow: () => {},
  openChartWindow: (uid) => {},
  closeChartWindow: () => {},
  isSimulationMode: false,
  toggleSimulationMode: () => {},
  isAdmin: false,
});

export const ModalContextProvider = ({ children }) => {
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState("");
  const [orderMode, setOrderMode] = useState("BUY");

  const [isChartOpen, setIsChartOpen] = useState(false);
  const [selectedChartStock, setSelectedChartStock] = useState("");

  const [isAdmin, setIsAdmin] = useState(false);
  const [isSimulationMode, setIsSimulationMode] = useState(() => {
    return localStorage.getItem("isSimulationMode") === "true";
  });

  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const userIsAdmin = storedUser?.role === "admin";
      setIsAdmin(userIsAdmin);
      if (!userIsAdmin) {
        setIsSimulationMode(false);
        localStorage.setItem("isSimulationMode", "false");
      }
    } catch {
      setIsAdmin(false);
      setIsSimulationMode(false);
    }
  }, []);

  const toggleSimulationMode = () => {
    if (!isAdmin) return;
    setIsSimulationMode((prev) => {
      const next = !prev;
      localStorage.setItem("isSimulationMode", String(next));
      return next;
    });
  };

  const openOrderWindow = (uid, mode = "BUY") => {
    setSelectedStock(uid);
    setOrderMode(mode);
    setIsOrderOpen(true);
  };

  const closeOrderWindow = () => {
    setIsOrderOpen(false);
    setSelectedStock("");
  };

  const openChartWindow = (uid) => {
    setSelectedChartStock(uid);
    setIsChartOpen(true);
  };

  const closeChartWindow = () => {
    setIsChartOpen(false);
    setSelectedChartStock("");
  };

  return (
    <ModalContext.Provider
      value={{
        openOrderWindow,
        closeOrderWindow,
        openChartWindow,
        closeChartWindow,
        isSimulationMode,
        toggleSimulationMode,
        isAdmin,
      }}
    >
      {children}
      {isOrderOpen && <BuyActionWindow uid={selectedStock} mode={orderMode} />}
      {isChartOpen && (
        <StockChartWindow uid={selectedChartStock} onClose={closeChartWindow} />
      )}
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);
export default ModalContext;
