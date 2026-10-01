import { useContext } from "react";
import { Grow, Tooltip } from "@mui/material";
import BarChartIcon from "@mui/icons-material/BarChart";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import GeneralContext from "../../../context/GeneralContext";
import styles from "./WatchList.module.css";

export default function WatchListActions({ uid, onRemove }) {
  const { openOrderWindow, openChartWindow } = useContext(GeneralContext);

  const handleOrderClick = (type) => {
    openOrderWindow(uid, type);
  };

  const handleChartClick = () => {
    openChartWindow(uid);
  };

  return (
    <span className={styles.actions}>
      <span className={styles.actionsGroup}>
        <Tooltip title="Buy (B)" placement="top" arrow TransitionComponent={Grow}>
          <button className={styles.buyBtn} onClick={() => handleOrderClick("BUY")}>
            Buy
          </button>
        </Tooltip>

        <Tooltip title="Sell (S)" placement="top" arrow TransitionComponent={Grow}>
          <button className={styles.sellBtn} onClick={() => handleOrderClick("SELL")}>
            Sell
          </button>
        </Tooltip>

        <Tooltip title="Analytics Chart (C)" placement="top" arrow TransitionComponent={Grow}>
          <button className={styles.actionBtn} onClick={handleChartClick}>
            <BarChartIcon className={styles.actionIcon} />
          </button>
        </Tooltip>

        {onRemove && (
          <Tooltip title="Remove from Watchlist" placement="top" arrow TransitionComponent={Grow}>
            <button
              className={`${styles.actionBtn} ${styles.deleteBtn}`}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(uid);
              }}
            >
              <DeleteOutlineIcon className={styles.actionIcon} />
            </button>
          </Tooltip>
        )}
      </span>
    </span>
  );
}
