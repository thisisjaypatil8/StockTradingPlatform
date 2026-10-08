    import { useState } from "react";
    import { useAuth } from "../../context/AuthContext";
    import { useNavigate, useLocation } from "react-router-dom";

export default function Signup() {
    const location = useLocation();
    const navigate = useNavigate();

    const isLoginMode = location.pathname === "/login";
    const { isLoggedIn, user, logout, dashboardUrl, login} = useAuth();
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(""); // Clear error when typing
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const endpoint = isLoginMode ? "/login" : "/signup";

        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || "http://localhost:3000";

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Authentication failed!");
            }

            if (data.token) {
                login(data.token, data.user);

                window.location.href = `${DASHBOARD_URL}/?token=${data.token}&username=${encodeURIComponent(data.user.username)}&userId=${data.user.id}&role=${encodeURIComponent(data.user.role || "")}`;
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container py-5">
            <div className="row align-items-center justify-content-center mt-2">
                {/* Left Column: Visual Illustration */}
                <div className="col-12 col-md-6 text-center mb-5 mb-md-0">
                    <img
                        src="media/images/account_open.svg"
                        alt="Zerodha Auth"
                        style={{ maxWidth: "85%", height: "auto" }}
                    />
                    <h4 className="text-muted mt-4 fw-light">
                        {isLoginMode
                            ? "Login to your Kite Trading Terminal"
                            : "Open a free Zerodha Demat & Trading account"}
                    </h4>
                </div>

                {/* Right Column: Clean Auth Card */}
                <div className="col-12 col-md-5 col-lg-4 offset-md-1">
                    {isLoggedIn ?  (
                        // logged-in state card
                        <div className="card shadow-sm border-0 p-4 rouded-3">
                            <div className="mb-3"> 
                                <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill small fw-medium">
                                    <i className="fa-solid fa-circle-check me-1"></i> Active Session
                                </span>
                            </div>
                            <h4 className="fw-semibold text-dark mb-1">
                                Welcome, {user?.username}!
                            </h4>
                            <p className="text-muted small mb-4">
                                {user?.email}
                            </p>
                            <a href={dashboardUrl} className="btn btn-primary w-100 py-2 fw-medium shadow-sm mb-2 text-decoration-none" style={{backgroundColor:"#387ed1", borderColor:"#387ed1"}}>
                                Go to Kite Dashboard <i className="fa-solid fa-arrow-right ms-1"></i>
                            </a>
                            <button type="button" onClick={logout} className="btn btn-outline-danger w-100 py-2 fw-medium">
                                Log out & Switch Account
                            </button>
                        </div>
                    ):(
                         <div className="card shadow-sm border-0 p-4 p-md-4 rounded-3">
                        <h3 className="fw-semibold text-dark mb-1">
                            {isLoginMode ? "Login" : "Sign Up"}
                        </h3>
                        <p className="text-muted small mb-4">
                            {isLoginMode
                                ? "Enter your credentials to access your dashboard"
                                : "Start your stock market journey with India's #1 broker"}
                        </p>

                        {error && (
                            <div className="alert alert-danger py-2 small" role="alert">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            {/* Username Field */}
                            <div className="mb-3">
                                <label className="form-label small fw-medium text-secondary">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    className="form-control"
                                    placeholder="Enter your username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Email Field (Only on Signup) */}
                            {!isLoginMode && (
                                <div className="mb-3">
                                    <label className="form-label small fw-medium text-secondary">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="form-control"
                                        placeholder="name@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            )}

                            {/* Password Field */}
                            <div className="mb-4">
                                <label className="form-label small fw-medium text-secondary">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    className="form-control"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="btn btn-primary w-100 py-2 fw-medium shadow-sm"
                                style={{ backgroundColor: "#387ed1", borderColor: "#387ed1" }}
                                disabled={loading}
                            >
                                {loading
                                    ? "Processing..."
                                    : isLoginMode
                                    ? "Login to Dashboard"
                                    : "Create Account"}
                            </button>
                        </form>

                        {/* Mode Switcher */}
                        <div className="text-center mt-4">
                            <p className="small text-muted mb-0">
                                {isLoginMode ? "Don't have an account?" : "Already registered?"}{" "}
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigate(isLoginMode ? "/signup" : "/login");
                                        setError("");
                                    }}
                                    className="btn btn-link p-0 text-decoration-none small fw-semibold"
                                    style={{ color: "#387ed1" }}
                                >
                                    {isLoginMode ? "Sign up now" : "Login here"}
                                </button>
                            </p>
                        </div>
                    </div>
                    )}
                   
                </div>
            </div>
        </div>
    );
}
