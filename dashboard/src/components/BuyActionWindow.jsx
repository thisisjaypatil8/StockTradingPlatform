import {Link} from "react-router-dom";
import { useState, useContext } from "react";
import "./BuyActionWindow.css";
import GeneralContext from "./GeneralContext";
import axios from "axios";

export default function BuyActionWindow ({uid}) {

  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockPrice, setStockPrice] = useState(0.0);

 const {closeBuyWindow} = useContext(GeneralContext);

  const handleBuyClick = (e) => {
    e.preventDefault();
    try {
      axios.post("http://localhost:5000/newOrder",{
        name: uid,
        qty: stockQuantity,
        price: stockPrice,
        mode:"BUY",
    });
   closeBuyWindow();
    }catch (err) {
      console.log("Failed to execute order: ", err);
    }
  }

  const handleCancelClick = (e) => {
    e.preventDefault();
    closeBuyWindow();
  }
  


    return (
   <div className="container" id="buy-window" draggable="true">
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
            <legend>Price</legend>
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
        <span>Margin required ₹{(stockQuantity * stockPrice).toFixed(2)}</span>
        <div>
          <button className="btn btn-blue" onClick={handleBuyClick}>
            Buy
          </button>
          <button className="btn btn-grey" onClick={handleCancelClick}>
            Cancel
          </button>
        </div>
      </div>
    </div>
    );
}
