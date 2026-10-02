import { useState } from "react";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUp from "@mui/icons-material/KeyboardArrowUp";
import styles from "./WatchList.module.css";
import WatchListActions from "./WatchListActions";

export default function WatchListItem({ stock, onRemove }) {
  const [showWatchlistActions, setShowWatchlistActions] = useState(false);
  const isDown = stock.isDown;

  return (
    <li
      onMouseEnter={() => setShowWatchlistActions(true)}
      onMouseLeave={() => setShowWatchlistActions(false)}
    >
      <div className={styles.item}>
        <p className={isDown ? styles.down : styles.up}>{stock.name}</p>
        <div className={styles.itemInfo}>
          <span className={`${styles.percent} ${isDown ? styles.down : styles.up}`}>
            {stock.percent || "+0.00%"}
          </span>
          {isDown ? (
            <KeyboardArrowDown className={styles.down} style={{ fontSize: "1.1rem" }} />
          ) : (
            <KeyboardArrowUp className={styles.up} style={{ fontSize: "1.1rem" }} />
          )}
          <span className={`${styles.price} ${isDown ? styles.down : styles.up}`}>
            ₹{(Number(stock.price) || 0).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>
      {showWatchlistActions && <WatchListActions uid={stock.name} onRemove={onRemove} />}
    </li>
  );
}
