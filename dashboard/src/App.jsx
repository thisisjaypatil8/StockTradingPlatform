
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./components/layout/Home.jsx";
import { useEffect, useState } from "react";



export default function App() {

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    //1. check the query parameter in url
    const queryParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = queryParams.get("token");
    const usernameFromUrl = queryParams.get("username");
    const userIdFromUrl = queryParams.get("userId");

    if (tokenFromUrl) {
      // Save token in Port 3000 Local Storage
      localStorage.setItem("token", tokenFromUrl);
      localStorage.setItem("user", JSON.stringify({ username: usernameFromUrl, id: userIdFromUrl }));
      // Remove the token from url (Zero security leakage)
      window.history.replaceState({}, document.title, window.location.pathname);
      setIsAuthenticated(true);
    }else{
      //2.Check if token is not in url , check in local storage for keep the user logged in
      const savedToken = localStorage.getItem("token");
      if(savedToken){
        setIsAuthenticated(true);
      }else{
        setIsAuthenticated(false);
      }
    }
    setLoading(false);
  },[]);

  if(loading){
    return <div style={{textAlign:"center", marginTop:"20%"}}><h4>Loading Kite Terminal...</h4></div>
  }

  //Protected Route Guard: If user is not authenticated redirect to login page
  if (!isAuthenticated) {
    return(
      <div style={{textAlign:"center", marginTop:"15%", fontFamily:"sans-serif"}}>
        <img src="logo.png" alt="Zerodha" style={{width:"60px", marginBottom:"20px"}} />
        <h2 style={{color:"#444"}}> Session Expired or Unauthorized</h2>
        <p style={{color:"#888", marginBottom:"25px"}}>Please log in via the Kite portal to access your trading dashboard.</p>
        <button
        onClick={() => window.location.href = "http://localhost:5173/signup"}
        style={{
          backgroundColor:"#387ed1",
          color:"#fff",
          padding:"10px 24px",
          border:"none",
          borderRadius:"4px",
          cursor:"pointer",
          fontSize:"15px",
          fontWeight:"500",
        }}>Go to Login / Sign Up</button>
      </div>
    )
  }
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
