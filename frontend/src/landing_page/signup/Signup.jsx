import React, { useState } from "react";

export default function Signup() {
    const [isLoginMode, setIsLoginMode] = useState(false);
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

        try {
            const response = await fetch(`http://localhost:5000${endpoint}`, {
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
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));

                window.location.href = `http://localhost:3000/?token=${data.token}&username=${data.user.username}&userId=${data.user.id}`;
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
                                        setIsLoginMode(!isLoginMode);
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
                </div>
            </div>
        </div>
    );
}
