import { useContext, useState, useEffect } from "react";
import Menu from "./Menu.jsx";
import styles from "./TopBar.module.css";
import GeneralContext from "../../context/GeneralContext.jsx";
import API from "../../api";

export default function TopBar() {
  const { isAdmin, isSimulationMode, toggleSimulationMode } = useContext(GeneralContext);

  const [indices, setIndices] = useState({
    nifty: { price: "24,952.10", percent: "+0.42%", isLoss: false },
    sensex: { price: "81,648.50", percent: "+0.38%", isLoss: false },
  });

  useEffect(() => {
    let isMounted = true;

    const fetchIndices = async () => {
      // Background tab check: user tab par nahi hai toh Yahoo call waste mat karo
      if (document.hidden) return;

      try {
        const res = await API.get("/market/indices");
        if (isMounted && res.data) {
          const { nifty, sensex } = res.data;
          setIndices({
            nifty: {
              price: Number(nifty.price).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
              percent: nifty.percent,
              isLoss: nifty.isLoss,
            },
            sensex: {
              price: Number(sensex.price).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
              percent: sensex.percent,
              isLoss: sensex.isLoss,
            },
          });
        }
      } catch (err) {
        console.warn("Indices fetch failed, preserving last known values:", err);
      }
    };

    fetchIndices();
    const interval = setInterval(fetchIndices, 30000); // 30-second smooth refresh

    const handleVisibilityChange = () => {
      if (!document.hidden) fetchIndices();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div className={styles.topbarContainer}>
      <div className={styles.indicesContainer}>
        <div className={styles.nifty}>
          <p className={styles.index}>NIFTY 50</p>
          <p className={styles.indexPoints} style={{ color: indices.nifty.isLoss ? "#df4949" : "#4caf50" }}>
            {indices.nifty.price}
          </p>
          <p className={styles.percent} style={{ color: indices.nifty.isLoss ? "#df4949" : "#4caf50" }}>
            {indices.nifty.percent}
          </p>
        </div>
        <div className={styles.sensex}>
          <p className={styles.index}>SENSEX</p>
          <p className={styles.indexPoints} style={{ color: indices.sensex.isLoss ? "#df4949" : "#4caf50" }}>
            {indices.sensex.price}
          </p>
          <p className={styles.percent} style={{ color: indices.sensex.isLoss ? "#df4949" : "#4caf50" }}>
            {indices.sensex.percent}
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
          <span>{isSimulationMode ? "SIMULATOR ON" : "LIVE MARKET"}</span>
        </button>
      )}

      <Menu />
    </div>
  );
}
