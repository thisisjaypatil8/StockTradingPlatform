import { Route, Routes } from "react-router-dom";
import { useState } from "react";
import { GeneralContextProvider } from "../../context/GeneralContext";

import Apps from "../features/apps/Apps.jsx";
import Funds from "../features/funds/Funds.jsx";
import Holdings from "../features/holdings/Holdings.jsx";
import Orders from "../features/orders/Orders.jsx";
import Positions from "../features/positions/Positions.jsx";
import Summary from "../features/summary/Summary.jsx";
import WatchList from "../features/watchlist/WatchList.jsx";

export default function Dashboard() {
  const [mobileTab, setMobileTab] = useState("content");

  return (
    <div className="dashboard-wrapper">
      <div className="mobile-view-toggle">
        <button
          className={`toggle-btn ${mobileTab === "content" ? "active" : ""}`}
          onClick={() => setMobileTab("content")}
        >
          Portfolio
        </button>
        <button
          className={`toggle-btn ${mobileTab === "watchlist" ? "active" : ""}`}
          onClick={() => setMobileTab("watchlist")}
        >
          Watchlist
        </button>
      </div>

      <div className="dashboard-container">
        <GeneralContextProvider>
          <div className={`watchlist-pane ${mobileTab === "watchlist" ? "show-mobile" : "hide-mobile"}`}>
            <WatchList />
          </div>
        </GeneralContextProvider>
        <div className={`content ${mobileTab === "content" ? "show-mobile" : "hide-mobile"}`}>
          <Routes>
            <Route exact path="/" element={<Summary />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/holdings" element={<Holdings />} />
            <Route path="/positions" element={<Positions />} />
            <Route path="/funds" element={<Funds />} />
            <Route path="/apps" element={<Apps />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
