import { formatK, formatCurrency, formatPnL } from "../../../utils/portfolioMath";
import styles from "./Funds.module.css";

export default function FundsBreakdown({ metrics, availableMargin, lifetimeRealizedPnL }) {
  const {
    marginBlocked: usedMargin,
    equity: totalAccountValue,
    cncCostBasis,
    cncMarketValue,
    cncUnrealizedPnL,
    misRealizedPnL,
    misUnrealizedPnL,
    grossDeposited,
    grossWithdrawn,
    netExternalCapital,
  } = metrics;

  return (
    <div className={styles.row}>
      {/* Column 1: Equity Margins & Trading Power */}
      <div className={styles.col}>
        <h4 className={styles.colTitle}>Equity Margins</h4>

        <div className={styles.table}>
          <div className={styles.dataRow}>
            <p>Available margin</p>
            <p className={`${styles.imp} ${styles.colored}`}>
              {formatK(availableMargin)}
            </p>
          </div>
          <div className={styles.dataRow}>
            <p>Used margin (MIS)</p>
            <p className={styles.imp}>{formatK(usedMargin)}</p>
          </div>
          <div className={styles.dataRow}>
            <p>Available cash</p>
            <p className={styles.imp}>{formatK(availableMargin)}</p>
          </div>
          <hr className={styles.divider} />
          <div className={styles.dataRow}>
            <p>Total Account Value</p>
            <p className={styles.val}>{formatK(totalAccountValue)}</p>
          </div>
          <div className={styles.dataRow}>
            <p>Holdings Market Value</p>
            <p className={styles.val}>{formatK(cncMarketValue)}</p>
          </div>
          <div className={styles.dataRow}>
            <p>Holdings Cost Basis</p>
            <p className={styles.val}>{formatK(cncCostBasis)}</p>
          </div>
          <div className={styles.dataRow}>
            <p>Holdings Unrealized P&L</p>
            <p className={`${styles.val} ${cncUnrealizedPnL >= 0 ? styles.profit : styles.loss}`}>
              {cncUnrealizedPnL >= 0 ? `+${formatK(cncUnrealizedPnL)}` : formatK(cncUnrealizedPnL)}
            </p>
          </div>
          <hr className={styles.divider} />
          <div className={styles.dataRow}>
            <p>Intraday Realized P&L</p>
            <p className={`${styles.val} ${misRealizedPnL >= 0 ? styles.profit : styles.loss}`}>
              {misRealizedPnL >= 0 ? `+${formatK(misRealizedPnL)}` : formatK(misRealizedPnL)}
            </p>
          </div>
          <div className={styles.dataRow}>
            <p>Intraday Floating P&L</p>
            <p className={`${styles.val} ${misUnrealizedPnL >= 0 ? styles.profit : styles.loss}`}>
              {misUnrealizedPnL >= 0 ? `+${formatK(misUnrealizedPnL)}` : formatK(misUnrealizedPnL)}
            </p>
          </div>
        </div>
      </div>

      {/* Column 2: Capital Account & Ledger Passbook */}
      <div className={styles.col}>
        <h4 className={styles.colTitle}>Capital Account & Passbook</h4>

        <div className={styles.table}>
          <div className={styles.dataRow}>
            <p>Gross Deposited</p>
            <p className={styles.val}>{formatCurrency(grossDeposited)}</p>
          </div>
          <div className={styles.dataRow}>
            <p>Gross Withdrawn</p>
            <p className={styles.val}>{formatCurrency(grossWithdrawn)}</p>
          </div>
          <div className={styles.dataRow}>
            <p>Net Capital Deployed</p>
            <p className={`${styles.imp} ${styles.colored}`}>
              {formatCurrency(netExternalCapital)}
            </p>
          </div>
          <hr className={styles.divider} />
          <div className={styles.dataRow}>
            <p>Lifetime Trading Realized P&L</p>
            <p className={`${styles.val} ${lifetimeRealizedPnL >= 0 ? styles.profit : styles.loss}`}>
              {formatPnL(lifetimeRealizedPnL)}
            </p>
          </div>
          <div className={styles.dataRow}>
            <p>Exchange Segment</p>
            <span className={styles.badgeInfo}>NSE / BSE Capital Market</span>
          </div>
          <div className={styles.dataRow}>
            <p>Settlement Cycle</p>
            <span className={styles.badgeInfo}>T+1 Rolling Settlement</span>
          </div>
          <div className={styles.dataRow}>
            <p>Fund Transfer Rail</p>
            <span className={styles.badgeInfo}>Instant Zero-Fee UPI Rail</span>
          </div>
          <hr className={styles.divider} />
          <div className={styles.dataRow}>
            <p>Account Status</p>
            <span className={styles.badgeActive}>● Active & Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}
