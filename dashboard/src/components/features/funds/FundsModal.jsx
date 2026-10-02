import { useState } from "react";
import { formatCurrency } from "../../../utils/portfolioMath";
import styles from "./Funds.module.css";

export default function FundsModal({
  isOpen,
  mode,
  onClose,
  availableMargin,
  onSubmit,
}) {
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handlePillClick = (val) => {
    setAmount(val.toString());
    setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = Number(amount);

    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg("Please enter a valid amount greater than ₹0.");
      return;
    }

    if (mode === "WITHDRAW" && numAmount > availableMargin) {
      setErrorMsg(`Cannot withdraw more than available margin (₹ ${formatCurrency(availableMargin)})`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      await onSubmit(mode, numAmount);
      setAmount("");
      onClose();
    } catch (err) {
      setErrorMsg(err.message || `Failed to ${mode === "ADD" ? "add" : "withdraw"} funds. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{mode === "ADD" ? "Deposit Funds (UPI)" : "Withdraw Funds"}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            &times;
          </button>
        </div>
        <div className={styles.modalBalanceInfo}>
          Available Margin: <span>{formatCurrency(availableMargin)}</span>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label>Enter Amount (₹)</label>
            <input
              type="number"
              className={styles.amountInput}
              placeholder="e.g. 10000"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setErrorMsg("");
              }}
              autoFocus
            />
          </div>
          {/* Quick Preset Pills */}
          <div className={styles.pillContainer}>
            {mode === "ADD" ? (
              <>
                <span className={styles.pill} onClick={() => handlePillClick(5000)}>+₹5,000</span>
                <span className={styles.pill} onClick={() => handlePillClick(10000)}>+₹10,000</span>
                <span className={styles.pill} onClick={() => handlePillClick(25000)}>+₹25,000</span>
                <span className={styles.pill} onClick={() => handlePillClick(50000)}>+₹50,000</span>
              </>
            ) : (
              <>
                <span className={styles.pill} onClick={() => handlePillClick(Math.min(availableMargin, 10000))}>₹10,000</span>
                <span className={styles.pill} onClick={() => handlePillClick(Math.min(availableMargin, 25000))}>₹25,000</span>
                <span className={styles.pill} onClick={() => handlePillClick(availableMargin)}>Withdraw All</span>
              </>
            )}
          </div>
          {errorMsg && (
            <p style={{ color: "#e53935", fontSize: "0.85rem", marginBottom: "14px" }}>
              {errorMsg}
            </p>
          )}
          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.btn} ${mode === "ADD" ? styles.btnGreen : styles.btnBlue}`}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Processing..."
                : mode === "ADD"
                ? `Add ₹${amount ? Number(amount).toLocaleString("en-IN") : ""}`
                : `Withdraw ₹${amount ? Number(amount).toLocaleString("en-IN") : ""}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
