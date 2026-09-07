import { useEffect, useState } from "react";
import API from "../api";

export default function Positions() {
  const [allPositions, setAllPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/allPositions")
      .then((res) => {
        setAllPositions(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Positions fetch failed: ", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="positions">
        <p>Loading Positions...</p>
      </div>
    );
  }

  return (
    <>
      <h3 className="title">Positions ({allPositions.length})</h3>

      <div className="order-table">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Instrument</th>
              <th>Qty.</th>
              <th>Avg.</th>
              <th>LTP</th>
              <th>P&L</th>
              <th>Chg.</th>
            </tr>
          </thead>
          <tbody>
            {allPositions.map((stock) => {
              const curValue = stock.price * stock.qty;
              const pnl = curValue - stock.avg * stock.qty;
              const profClass = pnl >= 0 ? "profit" : "loss";
              const dayClass = stock.isLoss ? "loss" : "profit";
              return (
                <tr key={stock._id || stock.name}>
                  <td>{stock.product}</td>
                  <td><strong>{stock.name}</strong></td>
                  <td>{stock.qty}</td>
                  <td>&#8377;{Number(stock.avg).toFixed(2)}</td>
                  <td>&#8377;{Number(stock.price).toFixed(2)}</td>
                  <td className={profClass}>
                    &#8377;{pnl >= 0 ? `+${pnl.toFixed(2)}` : pnl.toFixed(2)}
                  </td>
                  <td className={dayClass}>{stock.day || stock.net || "0.00%"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}


