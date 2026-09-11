import React, { useState } from "react";
import BuyActionWindow from "../components/shared/modals/BuyActionWindow";
import StockChartWindow from "../components/shared/modals/StockChartWindow";

const GeneralContext = React.createContext({
  openOrderWindow: (uid, type) => {},
  closeOrderWindow: () => {},
  openChartWindow: (uid) => {},
  closeChartWindow: () => {},
});

export const GeneralContextProvider = (props) => {
  const [isOrderWindowOpen, setIsOrderWindowOpen] = useState(false);
  const [selectedStockUID, setSelectedStockUID] = useState("");
  const [orderMode, setOrderMode] = useState("BUY");

  // Chart modal states
  const [isChartWindowOpen, setIsChartWindowOpen] = useState(false);
  const [selectedChartStockUID, setSelectedChartStockUID] = useState("");

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
      }}
    >
      {props.children}
      {isOrderWindowOpen && <BuyActionWindow uid={selectedStockUID} mode={orderMode} />}
      {isChartWindowOpen && <StockChartWindow uid={selectedChartStockUID} onClose={handleCloseChartWindow} />}
    </GeneralContext.Provider>
  );
};

export default GeneralContext;
