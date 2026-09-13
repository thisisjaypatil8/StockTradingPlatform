import Menu from "./Menu.jsx";
import styles from "./TopBar.module.css";
import GeneralContext from "../../context/GeneralContext.jsx";
import { useContext } from "react";

export default function TopBar() {

  const { isAdmin, isSimulationMode, toggleSimulationMode } = useContext(GeneralContext);

  return (
    <div className={styles.topbarContainer}>
      <div className={styles.indicesContainer}>
        <div className={styles.nifty}>
          <p className={styles.index}>NIFTY 50</p>
          <p className={styles.indexPoints} style={{ color: "#4caf50" }}>
            24,952.10
          </p>
          <p className={styles.percent} style={{ color: "#4caf50" }}>
            +0.42%
          </p>
        </div>
        <div className={styles.sensex}>
          <p className={styles.index}>SENSEX</p>
          <p className={styles.indexPoints} style={{ color: "#4caf50" }}>
            81,648.50
          </p>
          <p className={styles.percent} style={{ color: "#4caf50" }}>
            +0.38%
          </p>
        </div>
      </div>
      {/* Admin-Exclusive Market Simulator Control Switch */}
      {isAdmin && (
        <button
          type="button"
          onClick={toggleSimulationMode}
          className={`${styles.simButton} ${isSimulationMode ? styles.simActive : styles.simLive}`}
          title="Toggle Market Simulation (Admin Only)"
        >
          <span className={styles.pulseDot}></span>
          <span>{isSimulationMode ? "⚡ SIMULATOR ON" : "🔴 LIVE MARKET"}</span>
        </button>
      )}
      <Menu />
    </div>
  );
}
