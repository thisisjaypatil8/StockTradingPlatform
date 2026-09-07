import { Grow, Tooltip } from "@mui/material";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUp from "@mui/icons-material/KeyboardArrowUp";
import BarChartIcon from '@mui/icons-material/BarChart';
import MoreHoriz from "@mui/icons-material/MoreHoriz";
import API from "../api";

import { watchlist } from "../data/data";
import { useState, useContext, useEffect } from "react";
import GeneralContext from "./GeneralContext";
import { DoughnutChart } from "./DoughnutChart";

export default function WatchList() {
  const labels = watchlist.map((stock) => stock.name);
  const data =
  {
    labels,
    datasets: [
      {
        label: "Price",
        data: watchlist.map((stock) => stock.price),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
          'rgba(255, 159, 64, 0.5)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  }

  return (
    <div className="watchlist-container">
      <div className="search-container">
        <input
          type="text"
          name="search"
          id="search"
          placeholder="Search eg:infy, bse, nifty fut weekly, gold mcx"
          className="search"
        />
        <span className="counts"> {watchlist.length} / 50</span>
      </div>

      <ul className="list">
        {watchlist.map((stock) => (
          <WatchListItem key={stock.name} stock={stock} />
        ))}
      </ul>
      <DoughnutChart data={data} />
    </div>
  );
};

const WatchListItem = ({ stock }) => {

  const [showWatchlistActions, setShowWatchlistActions] = useState(false);

  //1. Initial state come from static data.js (zero Loading Flicker)
  const [liveData, setLiveData] = useState({
    price: stock.price,
    percent: stock.percent,
    isDown: stock.isDown,
  });

  //2. As soon as Components mounts fetch live price of each stock in watchlist
  useEffect(() =>{
    let isMounted = true;

    const fetchLiveQuote = async () => {
      try {
        const res = await API.get(`/market/quote/${stock.name}`);
        if(isMounted && res.data){
          setLiveData({
            price: res.data.price,
            percent: res.data.percent,
            isDown: res.data.isLoss,
          })
        }
      } catch (error) {
        console.warn(`Fallback active for ${stock.name}`);
      }
    };

    fetchLiveQuote();

    return () => {
      isMounted = false;
    };

  },[stock.name]
);

  const handleMouseEnter = () => {
    setShowWatchlistActions(true);
  }
  const handleMouseLeave = () => {
    setShowWatchlistActions(false);
  }

  return (
    <li onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} key={stock.name}>
      <div className="item">
        <p className={liveData.isDown ? 'down' : 'up'}>{stock.name}</p>
        <div className="itemInfo">
          <span className="percent">{liveData.percent}</span>
          {liveData.isDown ? <KeyboardArrowDown className="down" /> : <KeyboardArrowUp className="up" />}
          <span className="price">{Number(liveData.price).toFixed(2)}</span>
        </div>
      </div>
      {showWatchlistActions && (
        <WatchListActions uid={stock.name} />
      )}
    </li>
  );
};

const WatchListActions = ({ uid }) => {
  const { openOrderWindow, openChartWindow } = useContext(GeneralContext);

  const handleOrderClick = (type) => {
    openOrderWindow(uid, type);
  }

  return (

    <span className="actions">
      <span>
        <Tooltip title="Buy" placement="top" arrow TransitionComponent={Grow} ><button className="buy" onClick={() => handleOrderClick("BUY")}>Buy</button></Tooltip>

        <Tooltip title="Sell" placement="top" arrow TransitionComponent={Grow}><button className="sell" onClick={() => handleOrderClick("SELL")}>Sell</button></Tooltip>

        <Tooltip title="Analytics" placement="top" arrow TransitionComponent={Grow}><button className="action" onClick={() => openChartWindow(uid)}><BarChartIcon className="icon" /></button></Tooltip>
        
        <Tooltip title="More" placement="top" arrow TransitionComponent={Grow}><button className="btn"><MoreHoriz className="icon" /></button></Tooltip>
      </span>
    </span>
  )
}
