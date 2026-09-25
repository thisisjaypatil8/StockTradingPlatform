import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "../../../api";
import styles from "./Orders.module.css";

export default function Orders() {
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    API.get("/allOrders")
      .then((res) => {
        setAllOrders(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching orders:", err);
        setLoading(false);
      });
  }, []);

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
 
  return (
    <div className={styles.ordersContainer}>
      <h3 className={styles.title}>Executed Orders ({allOrders.length})</h3>
         {/* Filter Tabs */}
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
              <th>Status</th>
            </tr>
          </thead>
          <tbody>

            { filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="6" style={{textAlign:"center", padding:'30px', color:"#888"
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
                    <span className={styles.statusComplete}>● COMPLETE</span>
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
