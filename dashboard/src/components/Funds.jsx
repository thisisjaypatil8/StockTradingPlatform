import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
export default function Funds() {

   const [allHoldings, setAllHoldings] = useState([]);
   const [loading, setLoading] = useState(true);

   useEffect(() =>{
    axios.get("http://localhost:5000/allHoldings")
      .then((res) =>{
        setAllHoldings(res.data);
        setLoading(false);
      })
      .catch((err) =>{
        console.error("Funds fetch error:",err);
        setLoading(false);
      });
   },[]);


   let totalInvestment = 0;
   allHoldings.forEach((stock) =>{
    totalInvestment += (stock.qty || 0) * (stock.avg || 0);
   });

   const openingBalance = 100000;
   const usedMargin = totalInvestment;
   const availableMargin = Math.max(0, openingBalance - usedMargin);

   const formatK = (val) => {
    if(val === undefined || val === null || isNaN(val)) return "0.00";
    const absVal = Math.abs(val);
    if(absVal >= 1000){
      return (val/1000).toFixed(2)+"k";
    }
    return Number(val).toFixed(2);
   };

  
  return (
    <>
      <div className="funds">
        <p>Instant, zero-cost fund transfers with UPI </p>
        <Link className="btn btn-green" onClick={() => alert("UPI / Netbanking payment gateway will open here to add funds. (For live trading only)")}>Add funds</Link>
        <Link className="btn btn-blue" onClick={() => alert("Withdrawal requests will be processed within 24 hours. (For live trading only)")}>Withdraw</Link>
      </div>

      <div className="row">
        <div className="col">
          <span>
            <p>Equity</p>
          </span>

          <div className="table">
            <div className="data">
              <p>Available margin</p>
              <p className="imp colored">{formatK(availableMargin)}</p>
            </div>
            <div className="data">
              <p>Used margin</p>
              <p className="imp">{formatK(usedMargin)}</p>
            </div>
            <div className="data">
              <p>Available cash</p>
              <p className="imp">{formatK(availableMargin)}</p>
            </div>
            <hr />
            <div className="data">
              <p>Opening Balance</p>
              <p>{formatK(openingBalance)}</p>
            </div>
            <div className="data">
              <p>Payin</p>
              <p>{formatK(0)}</p>
            </div>
            <div className="data">
              <p>SPAN</p>
              <p>{formatK(0)}</p>
            </div>
            <div className="data">
              <p>Delivery margin</p>
              <p>{formatK(0)}</p>
            </div>
            <div className="data">
              <p>Exposure</p>
              <p>{formatK(0)}</p>
            </div>
            <div className="data">
              <p>Options premium</p>
              <p>{formatK(0)}</p>
            </div>
            <hr />
            <div className="data">
              <p>Collateral (Liquid funds)</p>
              <p>{formatK(0)}</p>
            </div>
            <div className="data">
              <p>Collateral (Equity)</p>
              <p>{formatK(0)}</p>
            </div>
            <div className="data">
              <p>Total Collateral</p>
              <p>{formatK(0)}</p>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="commodity">
            <p>You don't have a commodity account</p>
            <Link className="btn btn-blue">Open Account</Link>
          </div>
        </div>
      </div>
    </>
  );
};
