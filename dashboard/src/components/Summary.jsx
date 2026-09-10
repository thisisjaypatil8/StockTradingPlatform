
import { calculatePortfolioMetrics, formatK } from "../utils/portfolioMath";
import { usePortfolio } from "../context/PortfolioContext";
import styles from "./Summary.module.css";

export default function Summary() {

 const { allHoldings, loading} = usePortfolio();

const {
  openingBalance,
  totalInvestment,
  totalCurrentValue,
  totalPnL,
  pnlPercentage,
  isProfit,
  marginsUsed,
  marginAvailable,
} = calculatePortfolioMetrics(allHoldings);

  if(loading){
    return (
      <div style={{padding: "20px"}}>
        <p>Loading your portfolio...</p>
      </div>
    );
  }
  

  return (
    <>
      <div className={styles.username}>
        <h6>Hi, User!</h6>
        <hr className={styles.divider} />
      </div>

      <div className={styles.section}>
        <span>
          <p>Equity</p>
        </span>

        <div className={styles.data}>
          <div className={styles.first}>
            <h3>{formatK(marginAvailable)}</h3>
            <p>Margin available</p>
          </div>
          <hr />

          <div className={styles.second}>
            <p>
              Margins used <span>{formatK(marginsUsed)}</span>{" "}
            </p>
            <p>
              Opening balance <span>{formatK(openingBalance)}</span>{" "}
            </p>
          </div>
        </div>
        <hr className={styles.divider} />
      </div>

      <div className={styles.section}>
        <span>
          <p>Holdings ({allHoldings.length})</p>
        </span>

        <div className={styles.data}>
          <div className={styles.first}>
            <h3 className={isProfit ? styles.profit : styles.loss}>
              {isProfit ? `+${formatK(totalPnL)}` : formatK(totalPnL)}{" "}
              <small className={styles.small}>{isProfit ? `+${pnlPercentage}%` : `${pnlPercentage}%`}</small>
            </h3>
            <p>P&L</p>
          </div>
          <hr />

          <div className={styles.second}> 
            <p>
              Current Value <span>{formatK(totalCurrentValue)}</span>{" "}
            </p>
            <p>
              Investment <span>{formatK(totalInvestment)}</span>{" "}
            </p>
          </div>
        </div>
        <hr className={styles.divider} />
      </div>
    </>
  );
};
