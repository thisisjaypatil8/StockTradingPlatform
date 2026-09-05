import { holdings } from "../data/data.js";
import { useEffect, useState } from "react";
import axios from "axios";
export default function Holdings() {
  const [allHoldings, setAllHoldings] = useState([]);
  const [loading, setLoading] = useState(true);

  // backend se fresh holdings fetch kro
  useEffect(() =>{
    axios.get("http://localhost:5000/allHoldings")
      .then((res) =>{
        setAllHoldings(res.data);
        setLoading(false);
      })
      .catch((err) =>{
        console.error("Holdings fetch failed: ", err);
        setLoading(false);
      })
  },[]);

  if(loading){
    return <div className="holdings"><p>Loading Holdings...</p></div>
  }

  // dynamic calculations: Total investment, current value, and Total p&l]
    let totalInvestment = 0;
    let totalCurrentValue = 0;

    allHoldings.forEach((stock) =>{
      totalInvestment += stock.avg * stock.qty;
      totalCurrentValue += stock.price * stock.qty;
    })

    const totalPnL = totalCurrentValue - totalInvestment;
    const pnlPercentage = totalInvestment > 0 ? (totalPnL / totalInvestment * 100).toFixed(2) : 0;
    const isOverallProfit = totalPnL >= 0;
    

  return (
    <>
      <h3 className="title">Holdings ({allHoldings.length})</h3>

      <div className="order-table">
        <table>
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
        </table>
      </div>

{/* dynamic summary Cards */}
      <div className="row">
        <div className="col">
          <h5>
           &#8377; {totalInvestment.toLocaleString('en-IN', {
            minimumFractionDigits: 2, 
            maximumFractionDigits:2,
            
           })}
          </h5>
          <p>Total investment</p>
        </div>
        <div className="col">
          <h5>
            &#8377; {totalCurrentValue.toLocaleString('en-IN', {
              minimumFractionDigits: 2, 
              maximumFractionDigits:2,
            
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
    </>
  );
};

