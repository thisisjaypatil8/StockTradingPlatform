import { calculatePortfolioMetrics, formatK } from "../../../utils/portfolioMath";
import { usePortfolio } from "../../../context/PortfolioContext";
import { usePositions } from "../positions/usePositions";
import styles from "./Summary.module.css";

export default function Summary() {
  const { allPositions, metrics: positionMetrics } = usePositions();
  const totalDayPnL = positionMetrics?.totalDayPnL || 0;
  const totalRealized = positionMetrics?.totalRealized || 0;
  const totalUnrealized = positionMetrics?.totalUnrealized || 0;
  const isPositionProfit = totalDayPnL >= 0;

  const { allHoldings, funds, loading } = usePortfolio();

  const {
    openingBalance,
    totalInvestment,
    totalCurrentValue,
    totalPnL,
    pnlPercentage,
    isProfit,
    marginsUsed,
    marginAvailable,
  } = calculatePortfolioMetrics(allHoldings, funds?.availableCash);

  if (loading) {
    return (
      <div style={{ padding: "30px 20px" }}>
        <p style={{ color: "#888", fontSize: "0.95rem" }}>Loading your portfolio summary...</p>
      </div>
    );
  }

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const username = storedUser?.username || "Jay";

  return (
    <div className={styles.summaryContainer}>
      {/* User Greeting */}
      <div className={styles.greetingHeader}>
        <h6>Hi, {username}</h6>
        <p className={styles.greetingSubtext}>Here is your live trading and investment overview.</p>
      </div>
      <hr className={styles.divider} />

      {/* 1. Equity Pillar */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <span className={styles.iconDot}></span>
          <h4>Equity</h4>
        </div>

        <div className={styles.data}>
          <div className={styles.first}>
            <h3>{formatK(marginAvailable)}</h3>
            <p>Margin available</p>
          </div>

          <div className={styles.vDivider}></div>

          <div className={styles.second}>
            <div className={styles.metaRow}>
              <span>Margins used</span>
              <span className={styles.metaVal}>{formatK(marginsUsed)}</span>
            </div>
            <div className={styles.metaRow}>
              <span>Total Account Value</span>
              <span className={styles.metaVal}>{formatK(openingBalance)}</span>
            </div>
          </div>
        </div>
      </div>
      <hr className={styles.divider} />

      {/* 2. Holdings Pillar */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <span className={styles.iconDot}></span>
          <h4>Holdings</h4>
          <span className={styles.badge}>{allHoldings.length}</span>
        </div>

        <div className={styles.data}>
          <div className={styles.first}>
            <h3 className={isProfit ? styles.profit : styles.loss}>
              {isProfit ? `+${formatK(totalPnL)}` : formatK(totalPnL)}
              <small className={isProfit ? styles.profitBadge : styles.lossBadge}>
                {isProfit ? `+${pnlPercentage}%` : `${pnlPercentage}%`}
              </small>
            </h3>
            <p>Total P&L</p>
          </div>

          <div className={styles.vDivider}></div>

          <div className={styles.second}>
            <div className={styles.metaRow}>
              <span>Current Value</span>
              <span className={styles.metaVal}>{formatK(totalCurrentValue)}</span>
            </div>
            <div className={styles.metaRow}>
              <span>Investment</span>
              <span className={styles.metaVal}>{formatK(totalInvestment)}</span>
            </div>
          </div>
        </div>
      </div>
      <hr className={styles.divider} />

      {/* 3. Positions Pillar */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <span className={styles.iconDot}></span>
          <h4>Positions</h4>
          <span className={styles.badge}>{allPositions.length}</span>
        </div>

        <div className={styles.data}>
          <div className={styles.first}>
            <h3 className={isPositionProfit ? styles.profit : styles.loss}>
              {isPositionProfit ? `+${formatK(totalDayPnL)}` : formatK(totalDayPnL)}
            </h3>
            <p>Day P&L</p>
          </div>

          <div className={styles.vDivider}></div>

          <div className={styles.second}>
            <div className={styles.metaRow}>
              <span>Realized</span>
              <span className={`${styles.metaVal} ${totalRealized >= 0 ? styles.profit : styles.loss}`}>
                {totalRealized >= 0 ? `+${formatK(totalRealized)}` : formatK(totalRealized)}
              </span>
            </div>
            <div className={styles.metaRow}>
              <span>Unrealized</span>
              <span className={`${styles.metaVal} ${totalUnrealized >= 0 ? styles.profit : styles.loss}`}>
                {totalUnrealized >= 0 ? `+${formatK(totalUnrealized)}` : formatK(totalUnrealized)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
