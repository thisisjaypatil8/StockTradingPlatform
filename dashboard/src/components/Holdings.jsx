import { useEffect, useState } from "react";
import { VerticalGraph } from "./VerticalGraph.jsx";
import API from "../api.js";
import { calculatePortfolioMetrics } from "../utils/portfolioMath.js";
export default function Holdings() {
  const [allHoldings, setAllHoldings] = useState([]);
  const [loading, setLoading] = useState(true);

  // backend se fresh holdings fetch kro
  useEffect(() => {
    API.get("/allHoldings")
      .then(async (res) => {
        const holdingsData = res.data || [];
        setAllHoldings(holdingsData);
        setLoading(false);

        if (holdingsData.length === 0) {
          return;
        }

        // fetch live quote of each stock in parallel
        const quotePromises = holdingsData.map((stock) =>
          API.get(`/market/quote/${stock.name}`)
            .then((qRes) => ({ name: stock.name, quote: qRes.data }))
            .catch(() => ({ name: stock.name, quote: null }))
        );

        const results = await Promise.allSettled(quotePromises);

        // create Map (INFY: quoteData, RELIANCE: quoteData)
        const quoteMap = {};
        results.forEach((r) => {
          if (r.status === "fulfilled" && r.value?.quote) {
            quoteMap[r.value.name] = r.value.quote;
          }
        });

        // Enrich holdings with live LTP and day change
        setAllHoldings((prevHoldings) =>
          prevHoldings.map((stock) => {
            const live = quoteMap[stock.name];
            if (!live) return stock;

            const livePrice = Number(live.price) || stock.price;
            const netChangePct = stock.avg > 0 ? (((livePrice - stock.avg) / stock.avg) * 100).toFixed(2) : "0.00";

            return {
              ...stock,
              price: livePrice,
              day: live.percent || stock.day,

              net: `${Number(netChangePct) >= 0 ? `+` : ``}${netChangePct}%`,
              isLoss: live.isLoss !== undefined ? live.isLoss : stock.isLoss,
            };
          })
        );
      })
      .catch((err) => {
        console.error("Holdings fetch failed: ", err);
        setLoading(false);
      })
  }, []);

  if (loading) {
    return <div className="holdings"><p>Loading Holdings...</p></div>
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
    <>
      <h3 className="title">Holdings ({allHoldings.length})</h3>

      <div className="order-table">
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
              const profClass = pnl >= 0 ? "profit" : "loss";
              const dayClass = stock.isLoss ? "loss" : "profit";
              return (
                <tr key={stock.name} >
                  <td><strong>{stock.name}</strong></td>
                  <td>{Number(stock.qty)}</td>
                  <td>&#8377;{Number(stock.avg).toFixed(2)}</td>
                  <td>&#8377;{Number(stock.price).toFixed(2)}</td>
                  <td >&#8377;{Number(curValue).toFixed(2)}</td>
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
      <div className="row">
        <div className="col">
          <h5>
            &#8377; {totalInvestment.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,

            })}
          </h5>
          <p>Total investment</p>
        </div>
        <div className="col">
          <h5>
            &#8377; {totalCurrentValue.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,

            })}
          </h5>
          <p>Current value</p>
        </div>
        <div className="col">
          <h5>
            {isOverallProfit ? `+${totalPnL.toFixed(2)}` : totalPnL.toFixed(2)} <span className={`pnl-percentage ${isOverallProfit ? "profit" : "loss"}`}>{pnlPercentage}%</span>

          </h5>
          <p>P&L</p>
        </div>
      </div>
      <VerticalGraph data={data} />
    </>
  );
};

