import { calculateIntradayPositionMetrics } from "../../../utils/portfolioMath";
import styles from "./Positions.module.css";

export default function PositionRow({ stock, onSquareOff }) {
  const {
    net,
    realized,
    unrealized,
    totalPnL,
    isLong,
    isShort,
    isClosed,
  } = calculateIntradayPositionMetrics(stock);

  const realizedClass = realized > 0 ? styles.profit : realized < 0 ? styles.loss : styles.neutral;
  const unrealizedClass = unrealized > 0 ? styles.profit : unrealized < 0 ? styles.loss : styles.neutral;
  const totalClass = totalPnL >= 0 ? styles.profit : styles.loss;

  return (
    <tr>
      <td>{stock.product || "MIS"}</td>
      <td>
        <strong className={styles.instrumentName}>{stock.name}</strong>
      </td>
      <td>
        <span
          className={
            isLong
              ? styles.badgeLong
              : isShort
              ? styles.badgeShort
              : styles.badgeClosed
          }
        >
          {isLong ? "LONG" : isShort ? "SHORT" : "CLOSED"}
        </span>
      </td>
      <td>{net}</td>
      <td>₹{Number(stock.avg || 0).toFixed(2)}</td>
      <td>₹{Number(stock.price || 0).toFixed(2)}</td>
      <td className={realizedClass}>
        ₹{realized >= 0 ? `+${realized.toFixed(2)}` : realized.toFixed(2)}
      </td>
      <td className={unrealizedClass}>
        ₹{unrealized >= 0 ? `+${unrealized.toFixed(2)}` : unrealized.toFixed(2)}
      </td>
      <td className={totalClass}>
        ₹{totalPnL >= 0 ? `+${totalPnL.toFixed(2)}` : totalPnL.toFixed(2)}
      </td>
      <td>
        {!isClosed ? (
          <button
            className={styles.exitBtn}
            onClick={() => onSquareOff(stock)}
            title="1-Click Square Off Position at Market Price"
          >
            Exit
          </button>
        ) : (
          <span className={styles.closedIcon}>—</span>
        )}
      </td>
    </tr>
  );
}
