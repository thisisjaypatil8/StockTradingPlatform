import { Link } from "react-router-dom";
import { calculatePortfolioMetrics, formatK } from "../utils/portfolioMath";
import { usePortfolio } from "../context/PortfolioContext";
import styles from "./Funds.module.css";

export default function Funds() {
  const { allHoldings, loading } = usePortfolio();

  const { availableMargin, usedMargin, openingBalance } = calculatePortfolioMetrics(allHoldings);

  if (loading) {
    return (
      <div style={{ padding: "20px" }}>
        <p>Loading funds data...</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.fundsHeader}>
        <p>Instant, zero-cost fund transfers with UPI</p>
        <div className={styles.fundsActions}>
          <Link className={`${styles.btn} ${styles.btnGreen}`} onClick={() => alert("UPI / Netbanking payment gateway will open here to add funds. (For live trading only)")}>Add funds</Link>
          <Link className={`${styles.btn} ${styles.btnBlue}`} onClick={() => alert("Withdrawal requests will be processed within 24 hours. (For live trading only)")}>Withdraw</Link>
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.col}>
          <h4 className={styles.colTitle}>Equity</h4>

          <div className={styles.table}>
            <div className={styles.dataRow}>
              <p>Available margin</p>
              <p className={`${styles.imp} ${styles.colored}`}>{formatK(availableMargin)}</p>
            </div>
            <div className={styles.dataRow}>
              <p>Used margin</p>
              <p className={styles.imp}>{formatK(usedMargin)}</p>
            </div>
            <div className={styles.dataRow}>
              <p>Available cash</p>
              <p className={styles.imp}>{formatK(availableMargin)}</p>
            </div>
            <hr className={styles.divider} />
            <div className={styles.dataRow}>
              <p>Opening Balance</p>
              <p>{formatK(openingBalance)}</p>
            </div>
            <div className={styles.dataRow}>
              <p>Payin</p>
              <p>{formatK(0)}</p>
            </div>
            <div className={styles.dataRow}>
              <p>SPAN</p>
              <p>{formatK(0)}</p>
            </div>
            <div className={styles.dataRow}>
              <p>Delivery margin</p>
              <p>{formatK(0)}</p>
            </div>
            <div className={styles.dataRow}>
              <p>Exposure</p>
              <p>{formatK(0)}</p>
            </div>
            <div className={styles.dataRow}>
              <p>Options premium</p>
              <p>{formatK(0)}</p>
            </div>
            <hr className={styles.divider} />
            <div className={styles.dataRow}>
              <p>Collateral (Liquid funds)</p>
              <p>{formatK(0)}</p>
            </div>
            <div className={styles.dataRow}>
              <p>Collateral (Equity)</p>
              <p>{formatK(0)}</p>
            </div>
            <div className={styles.dataRow}>
              <p>Total Collateral</p>
              <p>{formatK(0)}</p>
            </div>
          </div>
        </div>

        <div className={styles.col}>
          <div className={styles.commodity}>
            <p>You don't have a commodity account</p>
            <Link className={`${styles.btn} ${styles.btnBlue}`}>Open Account</Link>
          </div>
        </div>
      </div>
    </>
  );
};
