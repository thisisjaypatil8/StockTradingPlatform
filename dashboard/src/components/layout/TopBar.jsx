import Menu from "./Menu.jsx";
import styles from "./TopBar.module.css";

export default function TopBar() {
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

      <Menu />
    </div>
  );
}
