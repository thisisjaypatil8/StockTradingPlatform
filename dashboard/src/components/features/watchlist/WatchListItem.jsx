import { useState, useEffect } from "react";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUp from "@mui/icons-material/KeyboardArrowUp";
import API from "../../../api";
import styles from "./WatchList.module.css";
import WatchListActions from "./WatchListActions";

export default function WatchListItem({ stock }) {
  const [showWatchlistActions, setShowWatchlistActions] = useState(false);

  // 1. Initial state from static data (Zero loading flicker)
  const [liveData, setLiveData] = useState({
    price: stock.price,
    percent: stock.percent,
    isDown: stock.isDown,
  });

  // 2. Fetch live price for this stock
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
          });
        }
      } catch (error) {
        console.warn(`Fallback active for ${stock.name}`);
      }
    };

    fetchLiveQuote();

    return () => {
      isMounted = false;
    };
  }, [stock.name]);

  return (
    <li
      onMouseEnter={() => setShowWatchlistActions(true)}
      onMouseLeave={() => setShowWatchlistActions(false)}
    >
      <div className={styles.item}>
        <p className={liveData.isDown ? styles.down : styles.up}>{stock.name}</p>
        <div className={styles.itemInfo}>
          <span className={`${styles.percent} ${liveData.isDown ? styles.down : styles.up}`}>
            {liveData.percent}
          </span>
          {liveData.isDown ? (
            <KeyboardArrowDown className={styles.down} style={{ fontSize: "1.1rem" }} />
          ) : (
            <KeyboardArrowUp className={styles.up} style={{ fontSize: "1.1rem" }} />
          )}
          <span className={`${styles.price} ${liveData.isDown ? styles.down : styles.up}`}>
            ₹{(Number(liveData.price) || 0).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>
      {showWatchlistActions && <WatchListActions uid={stock.name} />}
    </li>
  );
}
