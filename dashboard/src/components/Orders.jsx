import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "../api";
import styles from "./Orders.module.css";

export default function Orders() {

   const [allOrders, setAllOrders] = useState([]);
   const [loading, setLoading] = useState(true);

  // Compo load hote hi backend se saare orders mangwao
  useEffect(() => {
    API.get("/allOrders")
      .then((res) => {
        setAllOrders(res.data);
        setLoading(false);
      })
      .catch((err)=>{
        console.error("Error fetching orders:", err);
        setLoading(false);
      })
  },[]);

  if(loading){
    return <div className={styles.loading}><p>Loading your orders...</p></div>
  }

  // Agar koi order nahi hai
  if(allOrders.length === 0){
    return(
      <div className={styles.emptyContainer}>
        <div className={styles.noOrders}>
          <p>You haven't placed any orders today</p>
          <Link to={"/"} className={styles.btn}>Get started</Link>
        </div>
      </div>
    );
  }


  return (
    <div className={styles.ordersContainer}>
      <h3 className={styles.title}>Executed Orders ({allOrders.length})</h3>
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
                {allOrders.map((order)=> {
                    const isBuy = order.mode === "BUY";
                    return(
                      <tr key={order._id}>
                        <td><strong className={styles.instrumentName}>{order.name}</strong></td>
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
                })}
            </tbody>
        </table>
      </div>
    </div>
  );
};

