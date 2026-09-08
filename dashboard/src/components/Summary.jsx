import { useState, useEffect } from "react";
import API from "../api";
import { calculatePortfolioMetrics, formatK } from "../utils/portfolioMath";

export default function Summary() {

  const [allHoldings, setAllHoldings] = useState([]);
  const [loading, setLoading] = useState(true);

  // bringing live holdings from backend to show it in real time
  useEffect(() => {
    API.get("/allHoldings")
      .then((res) => {
        setAllHoldings(res.data);
        setLoading(false);
      })
      .catch((err) =>{
        console.error("Failed to fetch holdings for Summary:", err);
        setLoading(false);
      });
  },[]);

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
      <div className="username">
        <h6>Hi, User!</h6>
        <hr className="divider" />
      </div>

      <div className="section">
        <span>
          <p>Equity</p>
        </span>

        <div className="data">
          <div className="first">
            <h3>{formatK(marginAvailable)}</h3>
            <p>Margin available</p>
          </div>
          <hr />

          <div className="second">
            <p>
              Margins used <span>{formatK(marginsUsed)}</span>{" "}
            </p>
            <p>
              Opening balance <span>{formatK(openingBalance)}</span>{" "}
            </p>
          </div>
        </div>
        <hr className="divider" />
      </div>

      <div className="section">
        <span>
          <p>Holdings ({allHoldings.length})</p>
        </span>

        <div className="data">
          <div className="first">
            <h3 className={isProfit ? "profit" : "loss"} >
              {formatK(totalPnL)}{" "} <small>{isProfit ? `+${pnlPercentage}%` : `${pnlPercentage}%`}</small>{" "}
            </h3>
            <p>P&L</p>
          </div>
          <hr />

          <div className="second"> 
            <p>
              Current Value <span>{formatK(totalCurrentValue)}</span>{" "}
            </p>
            <p>
              Investment <span>{formatK(totalInvestment)}</span>{" "}
            </p>
          </div>
        </div>
        <hr className="divider" />
      </div>
    </>
  );
};
