
import { Route, Routes } from "react-router-dom";

import Apps from "./Apps.jsx";
import Funds from "./Funds.jsx";
import Holdings from "./Holdings.jsx";
import { GeneralContextProvider } from "./GeneralContext.jsx";

import Orders from "./Orders.jsx";
import Positions from "./Positions.jsx";
import Summary from "./Summary.jsx";
import WatchList from "./WatchList.jsx";
import { useState } from "react";

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
};

