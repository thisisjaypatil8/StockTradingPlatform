import { useState, useEffect, useRef } from "react";
import styles from "./BuyActionWindow.module.css";
import { useModal } from "../../../context/ModalContext";
import API from "../../../api";
import { usePortfolio } from "../../../context/PortfolioContext";

export default function BuyActionWindow({ uid, mode = "BUY" }) {
  const [stockQuantity, setStockQuantity] = useState("1");
  const quantity = Number(stockQuantity);
  const isQuantityValid =
    stockQuantity.trim() !== "" &&
    Number.isSafeInteger(quantity) &&
    quantity > 0;

  const [stockPrice, setStockPrice] = useState("0");
  const price = Number(stockPrice);
  const isPriceValid =
    stockPrice.trim() !== "" &&
    Number.isFinite(price) &&
    price > 0;

  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [productType, setProductType] = useState("CNC");

  const { closeOrderWindow, isSimulationMode } = useModal();
  const { refreshPortfolio, refreshFunds } = usePortfolio();
  const isSell = mode === "SELL";

  const modalRef = useRef(null);
  const idempotencyKeyRef = useRef(
    `${uid}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  );

  // Click outside listener to close window without full-screen blur overlay
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        closeOrderWindow();
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        closeOrderWindow();
      }
    }

    // Small timeout ensures the opening click doesn't immediately close it
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeOrderWindow]);

  // Auto-fetch live market price on mount
  useEffect(() => {
    let isMounted = true;
    async function fetchQuote() {
      if (!uid) return;
      try {
        setIsLoadingPrice(true);
        const res = await API.get(`/market/quote/${uid}`);
        if (isMounted && res.data && res.data.price) {
          setStockPrice(String(res.data.price));
        }
      } catch (err) {
        console.warn("Could not fetch live quote for", uid, err);
      } finally {
        if (isMounted) setIsLoadingPrice(false);
      }
    }
    fetchQuote();
    return () => {
      isMounted = false;
    };
  }, [uid]);

  const snapToTick = (val) => {
    const num = Number(val);
    if (isNaN(num) || num <= 0) return 0;
    return Number((Math.round(num * 20) / 20).toFixed(2));
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    // to stop the invalid quantity from being submitted
    if (!isQuantityValid) {
      setSubmitError("Quantity must be a positive whole number.");
      return;
    }

    setIsSubmitting(true);
    try {
      await API.post(
        "/newOrder",
        {
          name: uid,
          qty: Number(stockQuantity),
          price: snapToTick(stockPrice),
          mode,
          product: productType,
          isSimulation: isSimulationMode,
        },
        {
          headers: {
            "X-Idempotency-Key": idempotencyKeyRef.current,
          },
        }
      );
    } catch (err) {
      console.log(err);

      idempotencyKeyRef.current =
        `${uid}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setSubmitError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Order could not be submitted."
      );
      setIsSubmitting(false);
      return;
    }
    // 2. Order succeeded in DB -> close modal immediately.
    closeOrderWindow();

    // 3. Refresh portfolio and funds in background
    const refreshResults = await Promise.allSettled([
      refreshPortfolio(),
      refreshFunds()
    ]);

    // 4. Notify all components that data has changed
    window.dispatchEvent(new Event("portfolioUpdated"));

    if (refreshResults.some((result) => result.status === 'rejected')) {
      console.error("Failed to refresh portfolio or funds");
    }
  };

  const currentPriceNum = Number(stockPrice) || 0;
  const currentQtyNum = Number(stockQuantity) || 1;
  const marginRequired = (currentQtyNum * currentPriceNum) / (productType === "MIS" ? 5 : 1);

  return (
    <div ref={modalRef} className={styles.modalContainer}>
      <div className={`${styles.header} ${isSell ? styles.sellHeader : ""}`}>
        <div className={styles.headerTop}>
          <h3>
            {isSell ? "Sell" : "Buy"} {uid}
            <span>NSE · x {stockQuantity} Qty</span>
          </h3>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={closeOrderWindow}
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Prominent Segmented Toggle Switcher */}
        <div className={styles.tabSwitchGroup}>
          <button
            type="button"
            className={`${styles.tabBtn} ${productType === "CNC"
              ? isSell
                ? styles.sellTabActive
                : styles.tabBtnActive
              : ""
              }`}
            onClick={() => setProductType("CNC")}
          >
            CNC
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${productType === "MIS"
              ? isSell
                ? styles.sellTabActive
                : styles.tabBtnActive
              : ""
              }`}
            onClick={() => setProductType("MIS")}
          >
            MIS
          </button>
        </div>
      </div>

      <form onSubmit={handleOrderSubmit} className={styles.body}>
        {submitError && (
          <div className={styles.errorAlert}>
            <i className="bi bi-exclamation-triangle-fill"></i> {submitError}
          </div>
        )}
        <div className={styles.inputGrid}>
          <div className={styles.fieldGroup}>
            <label>Quantity</label>
            <input
              id="quantity"
              type="number"
              min="1"
              step="1"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              className={styles.inputControl}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label>
              Price
              {isSimulationMode ? (
                <span className={styles.simBadge}>SIM (EDITABLE)</span>
              ) : (
                <span className={styles.marketBadge}>MARKET (LTP)</span>
              )}
            </label>

            <div className={styles.inputWrapper}>
              <span className={styles.currencyPrefix}>₹</span>
              <input
                type="number"
                step="0.05"
                min="0.05"
                value={isLoadingPrice ? "" : stockPrice}
                placeholder={isLoadingPrice ? "Fetching..." : "0.00"}
                readOnly={!isSimulationMode}
                onChange={(e) => setStockPrice(e.target.value)}
                className={`${styles.inputControl} ${styles.inputWithPrefix} ${!isSimulationMode ? styles.lockedInput : ""
                  }`}
                required
              />
            </div>
          </div>
        </div>

        <div className={styles.marginInfo}>
          <div className={styles.marginText}>
            <span>Margin required:</span>
            <strong>
              ₹{marginRequired.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </strong>
          </div>
          {productType === "MIS" && <span className={styles.leverageBadge}>5x Margin</span>}
        </div>

        <div className={styles.footer}>
          <button
            type="submit"
            disabled={isSubmitting || isLoadingPrice}
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
