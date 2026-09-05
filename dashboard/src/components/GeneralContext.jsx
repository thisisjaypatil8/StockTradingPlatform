import React, { useState } from "react";
import BuyActionWindow from "./BuyActionWindow";

const GeneralContext = React.createContext({
  openOrderWindow: (uid, type) => {},
  closeOrderWindow: () => {},
});

export const GeneralContextProvider = (props) => {
  const [isOrderWindowOpen, setIsOrderWindowOpen] = useState(false);
  const [selectedStockUID, setSelectedStockUID] = useState("");
  const [orderMode, setOrderMode] = useState("BUY");

  // Order Window open Handler
  const handleOpenOrderWindow = (uid, type) => {
    setIsOrderWindowOpen(true);
    setSelectedStockUID(uid);
    setOrderMode(type);
  }

  const handleCloseOrderWindow = () => {
    setIsOrderWindowOpen(false);
    setSelectedStockUID("");
  };

  return (
    <GeneralContext.Provider
      value={{
        openOrderWindow: handleOpenOrderWindow,
        closeOrderWindow: handleCloseOrderWindow,
      }}
    >
      {props.children}
      {isOrderWindowOpen && <BuyActionWindow uid={selectedStockUID} mode={orderMode}/>}
    </GeneralContext.Provider>
  );
};

export default GeneralContext;

