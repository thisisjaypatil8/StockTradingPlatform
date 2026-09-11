import { appsList } from "../../../data/appsData";
import AppCard from "./AppCard";

export default function Apps() {
  return (
    <div style={{ padding: "10px 20px" }}>
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "1.4rem", color: "#444", margin: "0 0 6px 0", fontWeight: "500" }}>
          Zerodha Ecosystem & Apps
        </h3>
        <p style={{ color: "#888", fontSize: "0.88rem", margin: 0 }}>
          Explore our suite of specialized investment products, developer APIs, and partner platforms.
        </p>
      </div>

      {/* Responsive Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px",
        }}
      >
        {appsList.map((app, idx) => (
          <AppCard key={idx} app={app} />
        ))}
      </div>
    </div>
  );
}
