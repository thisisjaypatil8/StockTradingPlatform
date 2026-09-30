import { calculateAccountMetrics, formatK } from "../../../utils/portfolioMath";
import { usePortfolio } from "../../../context/PortfolioContext";
import { usePositions } from "../positions/usePositions";
import styles from "./Summary.module.css";

export default function Summary() {
  const { allPositions } = usePositions();
  const { allHoldings, funds, loading } = usePortfolio();

  if (loading || !funds) {
    return (
      <div style={{ padding: "30px 20px" }}>
        <p style={{ color: "#888", fontSize: "0.95rem" }}>Loading your portfolio summary...</p>
      </div>
    );
  }

  // Canonical Institutional Calculations (Single-Pass)
  const metrics = calculateAccountMetrics({
    cash: funds.availableCash,
    holdings: allHoldings,
    positions: allPositions,
    grossDeposited: funds.totalDeposited,
    grossWithdrawn: funds.totalWithdrawn,
  });

  const {
    equity,
    netExternalCapital,
    cumulativePnL,
    lifetimeReturnPct,
    isProfit,
    availableCash,
    marginBlocked,
    cncCostBasis,
    cncMarketValue,
    cncUnrealizedPnL,
    misRealizedPnL,
    misUnrealizedPnL,
    positionsDayPnL,
    holdingsDayPnL,
    totalDayPnL,
    isDayProfit,
    isPositionsDayProfit,
  } = metrics;

  const cncPnlPct = cncCostBasis > 0 ? ((cncUnrealizedPnL / cncCostBasis) * 100).toFixed(2) : "0.00";
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

      {/* 👑 Cumulative Performance & Account Equity Card */}
      <div className={styles.lifetimeCard}>
        <div className={styles.lifetimeHeader}>
          <div className={styles.lifetimeTitle}>
            <span className={styles.crownIcon}></span>
            <h5>Lifetime Profile Performance</h5>
          </div>
          <span className={isProfit ? styles.statusBadgeProfit : styles.statusBadgeLoss}>
            {isProfit ? "PROFITABLE INVESTOR" : "CAPITAL PRESERVATION"}
          </span>
        </div>
        <div className={styles.lifetimeGrid}>
          {/* 1. Live Account Equity */}
          <div className={styles.lifetimeCol}>
            <span className={styles.lifetimeLabel}>Account Equity</span>
            <h4 className={styles.lifetimeValue}>
              ₹{equity.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h4>
          </div>

          {/* 2. Net External Capital */}
          <div className={styles.lifetimeCol}>
            <span className={styles.lifetimeLabel}>Net External Capital</span>
            <h4 className={styles.lifetimeValue}>
              ₹{netExternalCapital.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h4>
          </div>

          {/* 3. Cumulative P&L (True Profit Created) */}
          <div className={styles.lifetimeCol}>
            <span className={styles.lifetimeLabel}>Cumulative P&L</span>
            <h4 className={isProfit ? styles.profit : styles.loss}>
              {isProfit
                ? `+₹${cumulativePnL.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : `-₹${Math.abs(cumulativePnL).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              <span className={isProfit ? styles.profitBadge : styles.lossBadge}>
                {isProfit ? `+${lifetimeReturnPct.toFixed(2)}%` : `${lifetimeReturnPct.toFixed(2)}%`}
              </span>
            </h4>
          </div>
        </div>
      </div>

      <hr className={styles.divider} />

      {/* 1. Equity & Margin Pillar */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <span className={styles.iconDot}></span>
          <h4>Equity & Margins</h4>
        </div>

        <div className={styles.data}>
          <div className={styles.first}>
            <h3>{formatK(availableCash)}</h3>
            <p>Available Cash</p>
          </div>

          <div className={styles.vDivider}></div>

          <div className={styles.second}>
            <div className={styles.metaRow}>
              <span>MIS Margin Blocked</span>
              <span className={styles.metaVal}>{formatK(marginBlocked)}</span>
            </div>
            <div className={styles.metaRow}>
              <span>Total Account Equity</span>
              <span className={styles.metaVal}>{formatK(equity)}</span>
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
            <h3 className={cncUnrealizedPnL >= 0 ? styles.profit : styles.loss}>
              {cncUnrealizedPnL >= 0 ? `+${formatK(cncUnrealizedPnL)}` : formatK(cncUnrealizedPnL)}
              <small className={cncUnrealizedPnL >= 0 ? styles.profitBadge : styles.lossBadge}>
                {cncUnrealizedPnL >= 0 ? `+${cncPnlPct}%` : `${cncPnlPct}%`}
              </small>
            </h3>
            <p>Unrealized P&L</p>
          </div>

          <div className={styles.vDivider}></div>

          <div className={styles.second}>
            <div className={styles.metaRow}>
              <span>Market Value</span>
              <span className={styles.metaVal}>{formatK(cncMarketValue)}</span>
            </div>
            <div className={styles.metaRow}>
              <span>Cost Basis</span>
              <span className={styles.metaVal}>{formatK(cncCostBasis)}</span>
            </div>
            <div className={styles.metaRow}>
              <span>Day's Change</span>
              <span className={`${styles.metaVal} ${holdingsDayPnL >= 0 ? styles.profit : styles.loss}`}>
                {holdingsDayPnL >= 0 ? `+${formatK(holdingsDayPnL)}` : formatK(holdingsDayPnL)}
              </span>
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
            <h3 className={isPositionsDayProfit ? styles.profit : styles.loss}>
              {isPositionsDayProfit ? `+${formatK(positionsDayPnL)}` : formatK(positionsDayPnL)}
            </h3>
            <p>Day P&L</p>
          </div>

          <div className={styles.vDivider}></div>

          <div className={styles.second}>
            <div className={styles.metaRow}>
              <span>Realized</span>
              <span className={`${styles.metaVal} ${misRealizedPnL >= 0 ? styles.profit : styles.loss}`}>
                {misRealizedPnL >= 0 ? `+${formatK(misRealizedPnL)}` : formatK(misRealizedPnL)}
              </span>
            </div>
            <div className={styles.metaRow}>
              <span>Unrealized</span>
              <span className={`${styles.metaVal} ${misUnrealizedPnL >= 0 ? styles.profit : styles.loss}`}>
                {misUnrealizedPnL >= 0 ? `+${formatK(misUnrealizedPnL)}` : formatK(misUnrealizedPnL)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
