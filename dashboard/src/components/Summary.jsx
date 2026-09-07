import { useState, useEffect } from "react";
import API from "../api";
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

  // helper function: Zerodha style compact current formatting
  const formatK = (val) => {
    if(val === undefined || val === null || isNaN(val)) return "0.00";
    const absVal = Math.abs(val);
    if(absVal >= 1000){
      return (val/1000).toFixed(2)+"k";
    }
    return Number(val).toFixed(2);
  }


// dynamic calculation across all live holdings
  let totalInvestment = 0;
  let totalCurrentValue = 0;

  allHoldings.forEach((stock) =>{
    totalInvestment += (stock.qty || 0) * (stock.avg || 0);
    totalCurrentValue += (stock.qty || 0) * (stock.price || 0);
  });

  const totalPnL = totalCurrentValue - totalInvestment;
  const pnlPercentage = totalInvestment > 0 ? (totalPnL/totalInvestment*100).toFixed(2) : "0.00";

  const isProfit = totalPnL >= 0;


  // equity/ funds calculations 
  const openingBalance = 100000;
  const marginsUsed = totalInvestment;
  const marginAvailable = Math.max(0, openingBalance - marginsUsed);

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
