import styles from "./Positions.module.css";
import { usePositions } from "./usePositions";
import PositionRow from "./PositionRow";
import PositionSummary from "./PositionSummary";

export default function Positions() {
  const { allPositions, loading, metrics, handleSquareOff } = usePositions();

  if (loading) {
    return (
      <div className={styles.loading}>
        <p>Loading Positions...</p>
      </div>
    );
  }

  return (
    <div className={styles.positionsContainer}>
      <h3 className={styles.title}>Positions ({allPositions.length})</h3>

      <div className={styles.orderTable}>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Instrument</th>
              <th>Type</th>
              <th>Qty.</th>
              <th>Avg.</th>
              <th>LTP</th>
              <th>Realized</th>
              <th>Floating</th>
              <th>Total P&L</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {allPositions.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: "center", padding: "30px", color: "#888" }}>
                  No open or closed intraday positions today.
                </td>
              </tr>
            ) : (
              allPositions.map((stock) => (
                <PositionRow
                  key={stock._id || stock.name}
                  stock={stock}
                  onSquareOff={handleSquareOff}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <PositionSummary metrics={metrics} />
    </div>
  );
}
