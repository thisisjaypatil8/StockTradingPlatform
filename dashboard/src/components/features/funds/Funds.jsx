import { useState } from "react";
import { calculateAccountMetrics, formatCurrency } from "../../../utils/portfolioMath";
import { usePortfolio } from "../../../context/PortfolioContext";
import { usePositions } from "../positions/usePositions";
import FundsHeader from "./FundsHeader";
import FundsBreakdown from "./FundsBreakdown";
import FundsModal from "./FundsModal";

export default function Funds() {
  const { allPositions } = usePositions();
  const { allHoldings, loading, funds, addFunds, withdrawFunds } = usePortfolio();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("ADD");

  const metrics = calculateAccountMetrics({
    cash: funds?.availableCash,
    margin: funds?.marginBlocked,
    holdings: allHoldings,
    positions: allPositions,
    grossDeposited: funds?.totalDeposited,
    grossWithdrawn: funds?.totalWithdrawn,
  });

  const availableMargin = metrics.availableCash;
  const lifetimeRealizedPnL = Number(funds?.lifetimeRealizedPnL) || 0;

  const handleOpenModal = (mode) => {
    setModalMode(mode);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleModalSubmit = async (mode, amount) => {
    if (mode === "ADD") {
      const res = await addFunds(amount);
      alert(res.message || `${formatCurrency(amount)} deposited successfully!`);
    } else {
      const res = await withdrawFunds(amount);
      alert(res.message || `${formatCurrency(amount)} withdrawn successfully!`);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "20px" }}>
        <p>Loading funds data...</p>
      </div>
    );
  }

  return (
    <>
      <FundsHeader
        onAddFunds={() => handleOpenModal("ADD")}
        onWithdrawFunds={() => handleOpenModal("WITHDRAW")}
      />

      <FundsBreakdown
        metrics={metrics}
        availableMargin={availableMargin}
        lifetimeRealizedPnL={lifetimeRealizedPnL}
      />

      <FundsModal
        isOpen={isModalOpen}
        mode={modalMode}
        onClose={handleCloseModal}
        availableMargin={availableMargin}
        onSubmit={handleModalSubmit}
      />
    </>
  );
}
