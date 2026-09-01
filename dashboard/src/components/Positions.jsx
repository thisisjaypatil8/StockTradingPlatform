import { positions } from "../data/data.js";

export default function Positions() {
  return (
    <>
      <h3 className="title">Positions ({positions.length})</h3>

      <div className="order-table">
        <table>
          <tr>
            <th>Product</th>
            <th>Instrument</th>
            <th>Qty.</th>
            <th>Avg.</th>
            <th>LTP</th>
            <th>P&L</th>
            <th>Chg.</th>
            <th></th>
          </tr>
          {positions.map((stock) => {
            const curValue = stock.price * stock.qty;
            const profClass = stock.pAndL ? "profit" : "loss";
            const dayClass = stock.change ? "loss" : "profit";
            return (
              <tr key={stock.name}>
                <td>{stock.product}</td>
                <td>{stock.name}</td>
                <td>{stock.qty}</td>
                <td>{stock.avg.toFixed(2)}</td>
                <td>{stock.price.toFixed(2)}</td>
                <td className={profClass}>{(curValue - stock.avg * stock.qty).toFixed(2)}</td>
                <td className={dayClass}>{stock.net}</td>
              </tr>
            );
          })}
        </table>
      </div>
    </>
  );
};


