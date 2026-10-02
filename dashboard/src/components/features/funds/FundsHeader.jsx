import styles from "./Funds.module.css";

export default function FundsHeader({ onAddFunds, onWithdrawFunds }) {
  return (
    <div className={styles.fundsHeader}>
      <p>Instant, zero-cost fund transfers with UPI</p>
      <div className={styles.fundsActions}>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnGreen}`}
          onClick={onAddFunds}
        >
          Add funds
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnBlue}`}
          onClick={onWithdrawFunds}
        >
          Withdraw
        </button>
      </div>
    </div>
  );
}
