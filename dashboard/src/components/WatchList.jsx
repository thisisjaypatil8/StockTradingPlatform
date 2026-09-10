import { Grow, Tooltip } from "@mui/material";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUp from "@mui/icons-material/KeyboardArrowUp";
import BarChartIcon from '@mui/icons-material/BarChart';
import MoreHoriz from "@mui/icons-material/MoreHoriz";
import API from "../api";
import styles from './WatchList.module.css';
import { watchlist } from "../data/data";
import { useState, useContext, useEffect } from "react";
import GeneralContext from "./GeneralContext";
import { DoughnutChart } from "./DoughnutChart";

export default function WatchList() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredWatchlist = watchlist.filter((stock) =>
    stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );


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
    <div className={styles.watchlistContainer}>
      <div className={styles.searchContainer}>
        <input
          type="text"
          name="search"
          id="search"
          placeholder="Search eg: INFY, RELIANCE, TCS..."
          className={styles.search}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <span className={styles.counts}> {filteredWatchlist.length} / {watchlist.length}</span>
      </div>

      <ul className={styles.list}>
        {filteredWatchlist.map((stock) => (
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
  useEffect(() => {
    let isMounted = true;

    const fetchLiveQuote = async () => {
      try {
        const res = await API.get(`/market/quote/${stock.name}`);
        if (isMounted && res.data) {
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

  }, [stock.name]
  );

  const handleMouseEnter = () => {
    setShowWatchlistActions(true);
  }
  const handleMouseLeave = () => {
    setShowWatchlistActions(false);
  }

  return (
    <li onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} key={stock.name}>
      <div className={styles.item}>
        <p className={liveData.isDown ? styles.down : styles.up}>{stock.name}</p>
        <div className={styles.itemInfo}>
          <span className={`${styles.percent} ${liveData.isDown ? styles.down : styles.up}`}>{liveData.percent}</span>
          {liveData.isDown ? <KeyboardArrowDown className={styles.down} style={{ fontSize: "1.1rem" }} /> : <KeyboardArrowUp className={styles.up} style={{ fontSize: "1.1rem" }} />}
          <span className={`${styles.price} ${liveData.isDown ? styles.down : styles.up}`}>&#8377;{(Number(liveData.price) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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

    <span className={styles.actions}>
      <span className={styles.actionsGroup}>
        <Tooltip title="Buy" placement="top" arrow TransitionComponent={Grow} ><button className={styles.buy} onClick={() => handleOrderClick("BUY")}>Buy</button></Tooltip>

        <Tooltip title="Sell" placement="top" arrow TransitionComponent={Grow}><button className={styles.sell} onClick={() => handleOrderClick("SELL")}>Sell</button></Tooltip>

        <Tooltip title="Analytics" placement="top" arrow TransitionComponent={Grow}><button className={styles.action} onClick={() => openChartWindow(uid)}><BarChartIcon className={styles.icon} /></button></Tooltip>

        <Tooltip title="More" placement="top" arrow TransitionComponent={Grow}><button className={styles.action}><MoreHoriz className={styles.icon} /></button></Tooltip>
      </span>
    </span>
  )
}
