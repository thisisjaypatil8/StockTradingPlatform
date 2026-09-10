import { VerticalGraph } from "./VerticalGraph.jsx";
import { calculatePortfolioMetrics } from "../utils/portfolioMath.js";
import { usePortfolio } from "../context/PortfolioContext.jsx";
import styles from "./Holdings.module.css";

export default function Holdings() {
 const {allHoldings,loading} = usePortfolio();


  if (loading) {
    return <div className={styles.loading}><p>Loading Holdings...</p></div>
  }

  const {
    totalInvestment,
    totalCurrentValue,
    totalPnL,
    pnlPercentage,
    isOverallProfit,
  } = calculatePortfolioMetrics(allHoldings);

  // Vertical graph data prepare kr
  const labels = allHoldings.map((stock) => stock.name);

  const data = {
    labels,
    datasets: [{
      label: "Stock Price",
      data: allHoldings.map((stock) => stock.price),
      backgroundColor: "rgba(75, 192, 192, 0.6)",
    }]
  }


  return (
    <div className={styles.holdingsContainer}>
      <h3 className={styles.title}>Holdings ({allHoldings.length})</h3>

      <div className={styles.orderTable}>
        <table>
          <thead>
            <tr>
              <th>Instrument</th>
              <th>Qty.</th>
              <th>Avg. cost</th>
              <th>LTP</th>
              <th>Cur. val</th>
              <th>P&L</th>
              <th>Net chg.</th>
              <th>Day chg.</th>
            </tr>
          </thead>

          <tbody>
            {allHoldings.map((stock) => {
              const curValue = stock.price * stock.qty;
              const pnl = curValue - (stock.avg * stock.qty);
              const profClass = pnl >= 0 ? styles.profit : styles.loss;
              const dayClass = stock.isLoss ? styles.loss : styles.profit;
              return (
                <tr key={stock.name}>
                  <td><strong className={styles.instrumentName}>{stock.name}</strong></td>
                  <td>{Number(stock.qty)}</td>
                  <td>&#8377;{Number(stock.avg).toFixed(2)}</td>
                  <td>&#8377;{Number(stock.price).toFixed(2)}</td>
                  <td>&#8377;{Number(curValue).toFixed(2)}</td>
                  <td className={profClass}>&#8377;{pnl >= 0 ? `+${pnl.toFixed(2)}` : pnl.toFixed(2)}</td>
                  <td className={profClass}>{stock.net || "+0.00%"}</td>
                  <td className={dayClass}>{stock.day || "+0.00%"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* dynamic summary Cards */}
      <div className={styles.summaryRow}>
        <div className={styles.summaryCol}>
          <h5>
            &#8377; {totalInvestment.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </h5>
          <p>Total investment</p>
        </div>
        <div className={styles.summaryCol}>
          <h5>
            &#8377; {totalCurrentValue.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </h5>
          <p>Current value</p>
        </div>
        <div className={styles.summaryCol}>
          <h5 className={isOverallProfit ? styles.profit : styles.loss}>
            &#8377; {isOverallProfit ? `+${totalPnL.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : totalPnL.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
            <span className={`${styles.pnlPercentage} ${isOverallProfit ? styles.profit : styles.loss}`}>({pnlPercentage}%)</span>
          </h5>
          <p>P&L</p>
        </div>
      </div>
      <VerticalGraph data={data} />
    </div>
  );
};

