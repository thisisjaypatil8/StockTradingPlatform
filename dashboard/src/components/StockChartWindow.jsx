import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import API from "../api";
import "./StockChartWindow.css";

// Chart.js ke essential controllers register karo
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function StockChartWindow({ uid, onClose }) {
  const [chartData, setChartData] = useState(null);
  const [stockMeta, setStockMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!uid) return;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await API.get(`/market/history/${uid}?range=1d&interval=5m`);
        const { labels, prices, currentPrice, change, isLoss, symbol } = res.data;

        setStockMeta({
          symbol,
          name: uid,
          currentPrice,
          change,
          isLoss,
        });

        const strokeColor = isLoss ? "#df514c" : "#4caf50";
        const fillColor = isLoss ? "rgba(223, 81, 76, 0.08)" : "rgba(76, 175, 80, 0.08)";

        setChartData({
          labels,
          datasets: [
            {
              label: `${uid} Intraday (5m)`,
              data: prices,
              borderColor: strokeColor,
              backgroundColor: fillColor,
              fill: true,
              tension: 0.35, // Smooth line curves
              pointRadius: 0, // Clean TradingView style without dot clutter
              pointHoverRadius: 5,
              pointHoverBackgroundColor: strokeColor,
              borderWidth: 2,
            },
          ],
        });
      } catch (err) {
        console.error("Chart fetch error:", err);
        setError(err.response?.data?.error || "Failed to fetch live market chart data.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [uid]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: (context) => ` Price: ₹${context.raw}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          maxTicksLimit: 7,
          font: { size: 10 },
          color: "#999",
        },
      },
      y: {
        grid: { color: "#f0f0f0" },
        ticks: {
          font: { size: 10 },
          color: "#888",
          callback: (val) => `₹${val}`,
        },
      },
    },
  };

  return (
    <div className="chart-window-overlay" onClick={onClose}>
      <div className="chart-window-container" onClick={(e) => e.stopPropagation()}>
        <div className="chart-window-header">
          <div className="chart-header-info">
            <h3>{uid}</h3>
            {stockMeta && (
              <>
                <span className="chart-current-price">₹{stockMeta.currentPrice}</span>
                <span className={`chart-price-change ${stockMeta.isLoss ? "loss" : "gain"}`}>
                  {stockMeta.change >= 0 ? "+" : ""}
                  {stockMeta.change} ({stockMeta.isLoss ? "Down" : "Up"})
                </span>
              </>
            )}
          </div>
          <button className="chart-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="chart-window-body">
          {loading && <div className="chart-loading">Fetching live NSE market ticks... ⚡</div>}
          {error && <div className="chart-error">⚠️ {error}</div>}
          {!loading && !error && chartData && <Line data={chartData} options={options} />}
        </div>

        <div className="chart-window-footer">
          <span>Intraday (1D · 5m Interval)</span>
          <span>Data via Yahoo Finance</span>
        </div>
      </div>
    </div>
  );
}
