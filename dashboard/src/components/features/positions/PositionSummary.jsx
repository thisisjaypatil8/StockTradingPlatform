import styles from "./Positions.module.css";

export default function PositionSummary({ metrics = {} }) {
  const { totalRealized = 0, totalUnrealized = 0, totalDayPnL = 0 } = metrics;

  return (
    <div className={styles.summaryRow}>
      <div className={styles.summaryCol}>
        <h5 className={totalRealized >= 0 ? styles.profit : styles.loss}>
          ₹{totalRealized >= 0 ? `+${totalRealized.toFixed(2)}` : totalRealized.toFixed(2)}
        </h5>
        <p>Realized P&L (Locked)</p>
      </div>
      <div className={styles.summaryCol}>
        <h5 className={totalUnrealized >= 0 ? styles.profit : styles.loss}>
          ₹{totalUnrealized >= 0 ? `+${totalUnrealized.toFixed(2)}` : totalUnrealized.toFixed(2)}
        </h5>
        <p>Unrealized P&L (Floating)</p>
      </div>
      <div className={styles.summaryCol}>
        <h5 className={totalDayPnL >= 0 ? styles.profit : styles.loss}>
          ₹{totalDayPnL >= 0 ? `+${totalDayPnL.toFixed(2)}` : totalDayPnL.toFixed(2)}
        </h5>
        <p>Net Total Intraday P&L</p>
      </div>
    </div>
  );
}
