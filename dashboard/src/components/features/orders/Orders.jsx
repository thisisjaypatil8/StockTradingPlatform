import { Link } from "react-router-dom";
import { useState } from "react";
import { useOrders } from "./useOrders";
import styles from "./Orders.module.css";

export default function Orders() {
  const { allOrders, loading } = useOrders();
  const [filter, setFilter] = useState("ALL");


  if (loading) {
    return (
      <div className={styles.loading}>
        <p>Loading your orders...</p>
      </div>
    );
  }

  if (allOrders.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.noOrders}>
          <p>You haven't placed any orders today</p>
          <Link to={"/"} className={styles.btn}>
            Get started
          </Link>
        </div>
      </div>
    );
  }
  // Filter logic
  const cncCount = allOrders.filter((o) => (o.product || "CNC") !== "MIS").length;
  const misCount = allOrders.filter((o) => o.product === "MIS").length;
  const filteredOrders = allOrders.filter((order) => {
    const prod = order.product || "CNC";
    if (filter === "CNC") return prod !== "MIS";
    if (filter === "MIS") return prod === "MIS";
    return true;
  });
 
  const formatOrderTime = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className={styles.ordersContainer}>
      <h3 className={styles.title}>Executed Orders ({allOrders.length})</h3>
      <div className={styles.filterContainer}>
        <button
          className={`${styles.filterBtn} ${filter === "ALL" ? styles.filterBtnActive : ""}`}
          onClick={() => setFilter("ALL")}
        >
          All ({allOrders.length})
        </button>
        <button
          className={`${styles.filterBtn} ${filter === "CNC" ? styles.filterBtnActive : ""}`}
          onClick={() => setFilter("CNC")}
        >
          CNC Delivery ({cncCount})
        </button>
        <button
          className={`${styles.filterBtn} ${filter === "MIS" ? styles.filterBtnActive : ""}`}
          onClick={() => setFilter("MIS")}
        >
          MIS Intraday ({misCount})
        </button>
      </div>
      <div className={styles.orderTable}>
        <table>
          <thead>
            <tr>
              <th>Instrument</th>
              <th>Qty.</th>
              <th>Price (&#8377;)</th>
              <th>Mode</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>

            { filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{textAlign:"center", padding:'30px', color:"#888"
                }}>
                  No {filter} orders found</td>
              </tr>
            ) : (
            filteredOrders.map((order) => {
              const isBuy = order.mode === "BUY";
              return (
                <tr key={order._id}>
                 
                  <td>
                    <strong className={styles.instrumentName}>{order.name}</strong>
                  </td>
                  <td>{order.qty}</td>
                  <td>&#8377;{Number(order.price).toFixed(2)}</td>
                  <td>
                    <span className={`${styles.modeBadge} ${isBuy ? styles.modeBuy : styles.modeSell}`}>
                      {order.mode}
                    </span>
                  </td>
                   <td>
                    <span className={styles.orderTime}>{formatOrderTime(order.createdAt)}</span>
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
