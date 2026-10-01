import styles from "./Positions.module.css";
import { formatPnL } from "../../../utils/portfolioMath";

export default function PositionSummary({ metrics = {} }) {
  const { totalRealized = 0, totalUnrealized = 0, totalDayPnL = 0 } = metrics;

  return (
    <div className={styles.summaryRow}>
      <div className={styles.summaryCol}>
        <h5 className={totalRealized >= 0 ? styles.profit : styles.loss}>
          {formatPnL(totalRealized)}
        </h5>
        <p>Realized P&L (Locked)</p>
      </div>
      <div className={styles.summaryCol}>
        <h5 className={totalUnrealized >= 0 ? styles.profit : styles.loss}>
          {formatPnL(totalUnrealized)}
        </h5>
        <p>Unrealized P&L (Floating)</p>
      </div>
      <div className={styles.summaryCol}>
        <h5 className={totalDayPnL >= 0 ? styles.profit : styles.loss}>
          {formatPnL(totalDayPnL)}
        </h5>
        <p>Net Total Intraday P&L</p>
      </div>
    </div>
  );
}
