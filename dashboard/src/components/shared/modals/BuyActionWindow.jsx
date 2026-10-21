import { useState } from "react";
import styles from "./BuyActionWindow.module.css";
import { useModal } from "../../../context/ModalContext";
import API from "../../../api";
import { usePortfolio } from "../../../context/PortfolioContext";

export default function BuyActionWindow({ uid, mode }) {
  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockPrice, setStockPrice] = useState(0.0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productType, setProductType] = useState("CNC");

  const { closeOrderWindow, isSimulationMode } = useModal();
  const { refreshPortfolio, refreshFunds } = usePortfolio();
  const isSell = mode === "SELL";

  const snapToTick = (val) => {
    const num = Number(val);
    if (isNaN(num) || num <= 0) return 0;
    return Number((Math.round(num * 20) / 20).toFixed(2));
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await API.post("/newOrder", {
        name: uid,
        qty: Number(stockQuantity),
        price: snapToTick(stockPrice),
        mode,
        product: productType,
        isSimulation: isSimulationMode,
      }, {
        headers: {
          "X-Idempotency-Key": `${uid}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
        }
      });
      await Promise.all([refreshPortfolio(), refreshFunds()]);
      closeOrderWindow();
    } catch (err) {
      alert(err.response?.data?.message || "Order execution failed!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalContainer}>
      <div className={`${styles.header} ${isSell ? styles.sellHeader : ""}`}>
        <h3>
          {isSell ? "Sell" : "Buy"} {uid}
          <span>x {stockQuantity} Qty</span>
        </h3>
        <div className={styles.productOptions}>
          <label>
            <input
              type="radio"
              value="CNC"
              name="product"
              checked={productType === "CNC"}
              onChange={() => setProductType("CNC")}
            />
            CNC (Delivery)
          </label>
          <label>
            <input
              type="radio"
              value="MIS"
              name="product"
              checked={productType === "MIS"}
              onChange={() => setProductType("MIS")}
            />
            MIS (5x Intraday)
          </label>
        </div>
      </div>

      <form onSubmit={handleOrderSubmit} className={styles.body}>
        <div className={styles.inputGrid}>
          <div className={styles.fieldGroup}>
            <label>Qty</label>
            <input
              type="number"
              min="1"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              required
            />
          </div>
          <div className={styles.fieldGroup}>
            <label>Price</label>
            <input
              type="number"
              step="0.05"
              min="0"
              value={stockPrice}
              onChange={(e) => setStockPrice(e.target.value)}
              required
            />
          </div>
        </div>

        <div className={styles.footer}>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`${styles.btnAction} ${isSell ? styles.btnSell : ""}`}
          >
            {isSubmitting ? "Executing..." : isSell ? "Sell" : "Buy"}
          </button>
          <button
            type="button"
            onClick={closeOrderWindow}
            className={styles.btnCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
