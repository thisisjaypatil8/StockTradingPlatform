import { useState } from "react";
import { calculateAccountMetrics, formatK, formatCurrency, formatPnL } from "../../../utils/portfolioMath";
import { usePortfolio } from "../../../context/PortfolioContext";
import { usePositions } from "../positions/usePositions";
import styles from "./Funds.module.css";


export default function Funds() {
  const { allPositions } = usePositions();
  const { allHoldings, loading, funds, addFunds, withdrawFunds } = usePortfolio();

  const [isModalOpen,setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("ADD");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
 
  const metrics = calculateAccountMetrics({
    cash: funds?.availableCash,
    holdings: allHoldings,
    positions: allPositions,
    grossDeposited: funds?.totalDeposited,
    grossWithdrawn: funds?.totalWithdrawn,
  });

  const { 
    availableCash,
    marginBlocked: usedMargin,
    equity: totalAccountValue,
    cncCostBasis,
    cncMarketValue,
    cncUnrealizedPnL,
    misRealizedPnL,
    misUnrealizedPnL,
    grossDeposited,
    grossWithdrawn,
    netExternalCapital,
  } = metrics;

  const availableMargin = availableCash;
  const lifetimeRealizedPnL = Number(funds?.lifetimeRealizedPnL) || 0;

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
      setErrorMsg(`Cannot withdraw more than available margin (₹ ${formatCurrency(availableMargin)})`)
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      if(modalMode === "ADD"){
        const res = await addFunds(numAmount);
        alert(res.message || `${formatCurrency(numAmount)} deposited successfully!`);
      }else{
        const res = await withdrawFunds(numAmount);
        alert(res.message || `${formatCurrency(numAmount)} withdrawn successfully!`)
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
        {/* Column 1: Equity Margins & Trading Power */}
        <div className={styles.col}>
          <h4 className={styles.colTitle}>Equity Margins</h4>

          <div className={styles.table}>
            <div className={styles.dataRow}>
              <p>Available margin</p>
              <p className={`${styles.imp} ${styles.colored}`}>
                {formatK(availableMargin)}
              </p>
            </div>
            <div className={styles.dataRow}>
              <p>Used margin (MIS)</p>
              <p className={styles.imp}>{formatK(usedMargin)}</p>
            </div>
            <div className={styles.dataRow}>
              <p>Available cash</p>
              <p className={styles.imp}>{formatK(availableMargin)}</p>
            </div>
            <hr className={styles.divider} />
            <div className={styles.dataRow}>
              <p>Total Account Value</p>
              <p className={styles.val}>{formatK(totalAccountValue)}</p>
            </div>
            <div className={styles.dataRow}>
              <p>Holdings Market Value</p>
              <p className={styles.val}>{formatK(cncMarketValue)}</p>
            </div>
            <div className={styles.dataRow}>
              <p>Holdings Cost Basis</p>
              <p className={styles.val}>{formatK(cncCostBasis)}</p>
            </div>
            <div className={styles.dataRow}>
              <p>Holdings Unrealized P&L</p>
              <p className={`${styles.val} ${cncUnrealizedPnL >= 0 ? styles.profit : styles.loss}`}>
                {cncUnrealizedPnL >= 0 ? `+${formatK(cncUnrealizedPnL)}` : formatK(cncUnrealizedPnL)}
              </p>
            </div>
            <hr className={styles.divider} />
            <div className={styles.dataRow}>
              <p>Intraday Realized P&L</p>
              <p className={`${styles.val} ${misRealizedPnL >= 0 ? styles.profit : styles.loss}`}>
                {misRealizedPnL >= 0 ? `+${formatK(misRealizedPnL)}` : formatK(misRealizedPnL)}
              </p>
            </div>
            <div className={styles.dataRow}>
              <p>Intraday Floating P&L</p>
              <p className={`${styles.val} ${misUnrealizedPnL >= 0 ? styles.profit : styles.loss}`}>
                {misUnrealizedPnL >= 0 ? `+${formatK(misUnrealizedPnL)}` : formatK(misUnrealizedPnL)}
              </p>
            </div>
          </div>
        </div>

        {/* Column 2: Capital Account & Ledger Passbook */}
        <div className={styles.col}>
          <h4 className={styles.colTitle}>Capital Account & Passbook</h4>

          <div className={styles.table}>
            <div className={styles.dataRow}>
              <p>Gross Deposited</p>
              <p className={styles.val}>{formatCurrency(grossDeposited)}</p>
            </div>
            <div className={styles.dataRow}>
              <p>Gross Withdrawn</p>
              <p className={styles.val}>{formatCurrency(grossWithdrawn)}</p>
            </div>
            <div className={styles.dataRow}>
              <p>Net Capital Deployed</p>
              <p className={`${styles.imp} ${styles.colored}`}>
                {formatCurrency(netExternalCapital)}
              </p>
            </div>
            <hr className={styles.divider} />
            <div className={styles.dataRow}>
              <p>Lifetime Trading Realized P&L</p>
              <p className={`${styles.val} ${lifetimeRealizedPnL >= 0 ? styles.profit : styles.loss}`}>
                {formatPnL(lifetimeRealizedPnL)}
              </p>
            </div>
            <div className={styles.dataRow}>
              <p>Exchange Segment</p>
              <span className={styles.badgeInfo}>NSE / BSE Capital Market</span>
            </div>
            <div className={styles.dataRow}>
              <p>Settlement Cycle</p>
              <span className={styles.badgeInfo}>T+1 Rolling Settlement</span>
            </div>
            <div className={styles.dataRow}>
              <p>Fund Transfer Rail</p>
              <span className={styles.badgeInfo}>Instant Zero-Fee UPI Rail</span>
            </div>
            <hr className={styles.divider} />
            <div className={styles.dataRow}>
              <p>Account Status</p>
              <span className={styles.badgeActive}>● Active & Verified</span>
            </div>
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
