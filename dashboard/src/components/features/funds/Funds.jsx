import { useState } from "react";
import { Link } from "react-router-dom";
import { calculatePortfolioMetrics, formatK } from "../../../utils/portfolioMath";
import { usePortfolio } from "../../../context/PortfolioContext";
import styles from "./Funds.module.css";


export default function Funds() {
  const { allHoldings, loading, funds, addFunds, withdrawFunds } = usePortfolio();

  const [isModalOpen,setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("ADD");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { availableMargin, usedMargin, openingBalance } = calculatePortfolioMetrics(allHoldings, funds?.availableCash);

  const handleOpenModal = (mode) =>{
    setModalMode(mode);
    setAmount("");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setAmount("");
    setErrorMsg("");
  };

  const handlePillClick = (value) =>{
    setAmount(value.toString());
    setErrorMsg("");
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    const numAmount = Number(amount);

    if(!numAmount || isNaN(numAmount) || numAmount <= 0){
      setErrorMsg("Please enter a valid amount greater than ₹0.")
      return;
    }

    if(modalMode === "WITHDRAW" && numAmount > availableMargin){
      setErrorMsg(`Cannot withdraw more than available margin (₹ ${availableMargin.toLocaleString("en-In")})`)
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      if(modalMode === "ADD"){
        const res = await addFunds(numAmount);
        alert(res.message || `₹${numAmount.toLocaleString("en-IN")} deposited successfully!`);
      }else{
        const res = await withdrawFunds(numAmount);
        alert(res.message || `₹${numAmount.toLocaleString("en-IN")} withdrawn successfully!`)
      }
      handleCloseModal();
    }catch(err){
      setErrorMsg(err.message || `Failed to ${modalMode === "ADD" ? "add" : "withdraw"} funds. Please try again.`)
    }finally{
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "20px" }}>
        <p>Loading funds data...</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.fundsHeader}>
        <p>Instant, zero-cost fund transfers with UPI</p>
        <div className={styles.fundsActions}>
          <button
          type="button"
            className={`${styles.btn} ${styles.btnGreen}`}
            onClick={() => handleOpenModal("ADD")}
          >
            Add funds
          </button>
          <button
          type="button"
            className={`${styles.btn} ${styles.btnBlue}`}
            onClick={() => handleOpenModal("WITHDRAW")}
          >
            Withdraw
          </button>
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.col}>
          <h4 className={styles.colTitle}>Equity</h4>

          <div className={styles.table}>
            <div className={styles.dataRow}>
              <p>Available margin</p>
              <p className={`${styles.imp} ${styles.colored}`}>
                {formatK(availableMargin)}
              </p>
            </div>
            <div className={styles.dataRow}>
              <p>Used margin</p>
              <p className={styles.imp}>{formatK(usedMargin)}</p>
            </div>
            <div className={styles.dataRow}>
              <p>Available cash</p>
              <p className={styles.imp}>{formatK(availableMargin)}</p>
            </div>
            <hr className={styles.divider} />
            <div className={styles.dataRow}>
              <p>Total Account Value</p>
              <p>{formatK(openingBalance)}</p>
            </div>
            <div className={styles.dataRow}>
              <p>Payin</p>
              <p>{formatK(0)}</p>
            </div>
            <div className={styles.dataRow}>
              <p>SPAN</p>
              <p>{formatK(0)}</p>
            </div>
            <div className={styles.dataRow}>
              <p>Delivery margin</p>
              <p>{formatK(0)}</p>
            </div>
            <div className={styles.dataRow}>
              <p>Exposure</p>
              <p>{formatK(0)}</p>
            </div>
            <div className={styles.dataRow}>
              <p>Options premium</p>
              <p>{formatK(0)}</p>
            </div>
            <hr className={styles.divider} />
            <div className={styles.dataRow}>
              <p>Collateral (Liquid funds)</p>
              <p>{formatK(0)}</p>
            </div>
            <div className={styles.dataRow}>
              <p>Collateral (Equity)</p>
              <p>{formatK(0)}</p>
            </div>
            <div className={styles.dataRow}>
              <p>Total Collateral</p>
              <p>{formatK(0)}</p>
            </div>
          </div>
        </div>

        <div className={styles.col}>
          <div className={styles.commodity}>
            <p>You don't have a commodity account</p>
            <Link className={`${styles.btn} ${styles.btnBlue}`}>Open Account</Link>
          </div>
        </div>
      </div>

       {/* Modern Interactive Funds Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{modalMode === "ADD" ? "Deposit Funds (UPI)" : "Withdraw Funds"}</h3>
              <button className={styles.closeBtn} onClick={handleCloseModal}>
                &times;
              </button>
            </div>
            <div className={styles.modalBalanceInfo}>
              Available Margin: <span>₹{availableMargin.toLocaleString("en-IN")}</span>
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
                {modalMode === "ADD" ? (
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
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${styles.btn} ${modalMode === "ADD" ? styles.btnGreen : styles.btnBlue}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Processing..."
                    : modalMode === "ADD"
                    ? `Add ₹${amount ? Number(amount).toLocaleString("en-IN") : ""}`
                    : `Withdraw ₹${amount ? Number(amount).toLocaleString("en-IN") : ""}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
