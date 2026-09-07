import {Link} from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import "./BuyActionWindow.css";
import GeneralContext from "./GeneralContext";
import API from "../api";

export default function BuyActionWindow ({uid,mode}) {

  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockPrice, setStockPrice] = useState(0.0);
  const [isSubmitting, setIsSubmitting] = useState(false);

 const {closeOrderWindow} = useContext(GeneralContext);
 const isSell = mode === "SELL";

 const handleOrderSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  try {
    // Backend ko dynamic mode (buy ya sell) pass karo
    const res = await API.post("/newOrder", {
      name: uid,
      qty: Number(stockQuantity),
      price: Number(stockPrice),
      mode:mode,
    });
    alert(res.data.message || `${mode} order placed Successfully!`);
    closeOrderWindow();
    window.location.reload();
  } catch (err) {
    alert(err.response?.data?.error || `Failed to execute ${mode} order?!`);
  } finally {
    setIsSubmitting(false);
  }
 }

  const handleCancelClick = (e) => {
    e.preventDefault();
    closeOrderWindow();
  }
  
  useEffect(() =>{
    if(!uid){
      return;
    }

    const fetchCurrentPrice = async () =>{
      try {
        const res = await API.get(`/market/quote/${uid}`);
        if(res.data && res.data.price){
          setStockPrice(res.data.price);
        }
      } catch (err) {
        console.warn(`Could not fetch live CMP for ${uid}, fallback to 0.0`);
      }
    };

    fetchCurrentPrice();
  },[uid]);


    return (
   <div className="container" id="buy-window" draggable="true">
{/* Title me dynamic BUY / SELL  + CMP Badge */}
      <h4 style={{color: isSell ? "#ff5722":"#4184f3", marginBottom:"10px"}}>{mode} {uid} {stockPrice > 0 && <span style={{fontSize:"0.8rem", color:"#666", fontWeight:"normal"}}>(CMP: &#8377;{Number(stockPrice).toFixed(2)})</span>}</h4>
      <div className="regular-order">
        <div className="inputs">
          <fieldset>
            <legend>Qty.</legend>
            <input
              type="number"
              name="qty"
              id="qty"
              onChange={(e) => setStockQuantity(e.target.value)}
              value={stockQuantity}
            />
          </fieldset>
          <fieldset>
            <legend>Price (&#8377;)</legend>
            <input
              type="number"
              name="price"
              id="price"
              step="0.05"
              onChange={(e) => setStockPrice(e.target.value)}
              value={stockPrice}
            />
          </fieldset>
        </div>
      </div>

      <div className="buttons">
        <span>Total Value: ₹{(stockQuantity * stockPrice).toFixed(2)}</span>
        <div>
          {/* sell ke case me button orage/red hoga, buy ke case me blue*/}
          <button className={`btn btn-${isSell ? "orange" : "blue"}`}
          style={{
            backgroundColor: isSell ? "#ff5722": "#4184f3"
          }}
          onClick={handleOrderSubmit}
          disabled = {isSubmitting}
          >
            
            {isSubmitting? "Executing..." : mode}
          </button>
          <button className="btn btn-grey" onClick={handleCancelClick}>
            Cancel
          </button>
        </div>
      </div>
    </div>
    );
}
