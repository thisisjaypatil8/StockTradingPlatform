import { useEffect, useState } from "react";
import API from "../api";

export default function Positions() {
  const [allPositions, setAllPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/allPositions")
      .then(async (res) => {
        const positionsData = res.data || [];
        setAllPositions(positionsData);
        setLoading(false);


        if(positionsData.length === 0) return;
        
        //fetch live LTP of each stock in parallel

        const quotePromises = positionsData.map((stock) =>
          API.get(`market/quote/${stock.name}`)
          .then((qRes) => ({ name: stock.name, quote: qRes.data}))
          .catch(() => ({name: stock.name, quote: null}))
        );

        const results = await Promise.allSettled(quotePromises);

        // prepare quoteMap for fast lookups
        const quoteMap = {};
        results.forEach((r) =>{
          if(r.status === 'fulfilled' && r.value?.quote){
            quoteMap[r.value.name] = r.value.quote;
          }
        });

        // update live prices in positions with portfolio math
        setAllPositions((prevPositions) => 
         prevPositions.map((stock) => {
          const live = quoteMap[stock.name];
          if(!live) return stock;

          const livePrice = Number(live.price) || stock.price;
          
          return {
            ...stock,
            price: livePrice,
            day: live.percent || stock.day,
            isLoss: live.isLoss !== undefined ? live.isLoss : stock.isLoss,
          };
         })
        );
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


