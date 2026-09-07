import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "../api";

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
    return <div className="orders"><p>Loading your orders...</p></div>
  }

  // Agar koi order nahi hai
  if(allOrders.length === 0){
    return(
      <div className="orders">
      <div className="no-orders">
        <p>You haven't placed any orders Today</p>
        <Link to={"/"}  className="btn">Get started</Link>
      </div>
      </div>
    )
  }


  return (
      
    <div className="orders-container">
      <h3 className="title">Executed Orders ({allOrders.length})</h3>
      <div className="order-table">
      
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
                        <td><strong>{order.name}</strong></td>
                        <td>{order.qty}</td>
                        <td>{Number(order.price).toFixed(2)}</td>
                        <td>
                          <span style={{
                            padding: "3px 8px",
                            borderRadius:"4px",
                            fontWeight: "bold",
                            fontSize: "11px",
                            backgroundColor: isBuy ? "#e6f3ff" : "#ffebe6",
                            color: isBuy ? "#0066cc" : "#ff3b30"
                          }}>{order.mode}</span>
                        </td>
                        <td>
                          <span style={{ color: "#28a745", fontWeight:"600", fontSize:"12px"}}> ● COMPLETE</span>
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

