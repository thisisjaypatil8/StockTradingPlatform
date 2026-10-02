import { useEffect, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
} from "lightweight-charts";
import API from "../../../api";
import "./StockChartWindow.css";

export default function StockChartWindow({ uid, onClose }) {
  const chartContainerRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const [stockMeta, setStockMeta] = useState(null);
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 1. Fetch 1D 5m Intraday Candle Data
  useEffect(() => {
    if (!uid) return;

    let isCancelled = false;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await API.get(`/market/history/${uid}?range=1d&interval=5m`);
        if (isCancelled) return;
        const { currentPrice, change, isLoss, symbol } = res.data;
        setStockMeta({
          symbol: symbol || uid,
          name: uid,
          currentPrice,
          change,
          isLoss,
        });

        const rawCandles = res.data.candles || [];
        let candleData = rawCandles;

        // Fallback: If candles array is empty but prices exist, build synthetic ticks so chart never renders blank
        if (!candleData.length && res.data.prices?.length) {
          const nowSec = Math.floor(Date.now() / 1000);
          const stepSec = 300; // 5 min interval
          const startSec = nowSec - res.data.prices.length * stepSec;
          candleData = res.data.prices.map((p, i) => ({
            time: startSec + i * stepSec,
            open: p,
            high: Number((p * 1.001).toFixed(2)),
            low: Number((p * 0.999).toFixed(2)),
            close: p,
          }));
        }

        setCandles(candleData);
      } catch (err) {
        if (isCancelled) return;
        console.error("Chart fetch error:", err);
        setError(err.response?.data?.error || "Failed to fetch live market chart data.");
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchHistory();

    return () => {
      isCancelled = true;
    };
  }, [uid]);

  // 2. Render Pure Candlestick Chart
  useEffect(() => {
    if (loading || error || !candles.length || !chartContainerRef.current) {
      return;
    }

    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const container = chartContainerRef.current;

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "#ffffff" },
        textColor: "#666666",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      },
      grid: {
        vertLines: { color: "#f0f0f0" },
        horzLines: { color: "#f0f0f0" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: "#e0e0e0",
      },
      timeScale: {
        borderColor: "#e0e0e0",
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time) => {
          const timestamp = typeof time === "number" ? time : time?.timestamp;
          if (!timestamp) return "";
          return new Date(timestamp * 1000).toLocaleTimeString("en-IN", {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
        },
      },
      localization: {
        timeFormatter: (time) => {
          const timestamp = typeof time === "number" ? time : time?.timestamp;
          if (!timestamp) return "";
          return new Date(timestamp * 1000).toLocaleTimeString("en-IN", {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
        },
      },
    });

    chartInstanceRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#4caf50",
      downColor: "#df514c",
      borderVisible: false,
      wickUpColor: "#4caf50",
      wickDownColor: "#df514c",
    });

    candleSeries.setData(candles);
    chart.timeScale().fitContent();

    return () => {
      chart.remove();
      chartInstanceRef.current = null;
    };
  }, [candles, loading, error]);

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
          {!loading && !error && !candles.length && (
            <div className="chart-error">⚠️ No market tick data available for this session.</div>
          )}
          <div
            ref={chartContainerRef}
            className="chart-canvas-container"
            style={{
              display: loading || error || !candles.length ? "none" : "block",
            }}
          />
        </div>

        <div className="chart-window-footer">
          <span>Intraday (1D · 5m Interval)</span>
          <span>TradingView Lightweight Charts™</span>
        </div>
      </div>
    </div>
  );
}
