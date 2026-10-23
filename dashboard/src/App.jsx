import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./components/layout/Home.jsx";
import { useEffect, useState } from "react";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const queryParams = new URLSearchParams(window.location.search);
      const codeFromUrl = queryParams.get("code");
      const tokenFromUrl = queryParams.get("token");

      // Exchange single-use authorization code for session credentials
      if (codeFromUrl) {
        window.history.replaceState({}, document.title, window.location.pathname);
        try {
          const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
          const res = await fetch(`${API_URL}/auth/exchange-code`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: codeFromUrl }),
          });
          const data = await res.json();
          if (res.ok && data.token) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            setIsAuthenticated(true);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error("Auth code exchange failed:", err);
        }
      } else if (tokenFromUrl) {
        // Fallback for direct token migration
        const usernameFromUrl = queryParams.get("username");
        const userIdFromUrl = queryParams.get("userId");
        const roleFromUrl = queryParams.get("role") || "user";
        localStorage.setItem("token", tokenFromUrl);
        localStorage.setItem("user", JSON.stringify({ 
          username: usernameFromUrl, 
          id: userIdFromUrl,
          role: roleFromUrl
        }));
        window.history.replaceState({}, document.title, window.location.pathname);
        setIsAuthenticated(true);
        setLoading(false);
        return;
      }

      // Restore active user session from local storage
      const savedToken = localStorage.getItem("token");
      setIsAuthenticated(Boolean(savedToken));
      setLoading(false);
    };

    initAuth();
  }, []);

  if (loading) {
    return <div style={{ textAlign: "center", marginTop: "20%" }}><h4>Loading Kite Terminal...</h4></div>;
  }

  // Protected Route Guard
  if (!isAuthenticated) {
    const signupUrl = (import.meta.env.VITE_WWW_URL || "http://localhost:5173") + "/signup";
    return (
      <div style={{ textAlign: "center", marginTop: "15%", fontFamily: "sans-serif" }}>
        <img src="logo.png" alt="Zerodha" style={{ width: "60px", marginBottom: "20px" }} />
        <h2 style={{ color: "#444" }}>Session Expired or Unauthorized</h2>
        <p style={{ color: "#888", marginBottom: "25px" }}>Please log in via the Kite portal to access your trading dashboard.</p>
        <button
          onClick={() => window.location.href = signupUrl}
          style={{
            backgroundColor: "#387ed1",
            color: "#fff",
            padding: "10px 24px",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "15px",
            fontWeight: "500",
          }}
        >
          Go to Login / Sign Up
        </button>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
