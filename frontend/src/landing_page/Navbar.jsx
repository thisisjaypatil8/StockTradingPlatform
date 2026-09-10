import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
export default function Navbar() {



    const { isLoggedIn, user, logout, dashboardUrl } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const avatarInitials = user?.username ? user.username.slice(0,1).toUpperCase() : "U"

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <nav className="border-bottom" style={{ position: "sticky", top: "0", zIndex: "1000", backgroundColor: "#FBFBFB" }}>
            <div className="container d-flex align-items-center justify-content-between py-4 ">

                <Link to="/"> <img src="media/images/logo.svg" alt="logo" style={{ maxWidth: "120px", width: "100%" }} className="mx-4 mx-md-0" /></Link>
                               <div className="d-flex gap-4 gap-lg-5 fs-6 align-items-center">
                    {/* 1. Signup / Dashboard Text Link (Zero bulky buttons!) */}
                    {isLoggedIn ? (
                        <a 
                            href={dashboardUrl} 
                            className="text-muted text-decoration-none d-none d-md-block"
                        >
                            Dashboard
                        </a>
                    ) : (
                        <>
                        <Link 
                            to="/signup" 
                            className="text-muted text-decoration-none d-none d-md-block"
                        >
                            Signup
                        </Link>
                        <Link to="/login" className="text-muted text-decoration-none d-none d-md-block">
                        Login
                        </Link>
                        </>
                    )}

                    {/* 2. Standard Nav Links */}
                    <Link to="/about" className="text-muted text-decoration-none d-none d-md-block">About</Link>
                    <Link to="/products" className="text-muted text-decoration-none d-none d-md-block">Products</Link>
                    <Link to="/pricing" className="text-muted text-decoration-none d-none d-md-block">Pricing</Link>
                    <Link to="/support" className="text-muted text-decoration-none d-none d-md-block">Support</Link>

                    {/* 3. Compact Circular Avatar & Dropdown (Only when logged in) */}
                    {isLoggedIn && (
                        <div className="position-relative d-none d-md-block">
                            {/* Circular Avatar Trigger */}
                            <div 
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="rounded-circle d-flex align-items-center justify-content-center text-primary fw-semibold shadow-sm"
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    backgroundColor: "#E8F0FE",
                                    cursor: "pointer",
                                    fontSize: "0.8rem",
                                    userSelect: "none"
                                }}
                                title={user?.username}
                            >
                                {avatarInitials}
                            </div>

                            {/* Minimal Profile Dropdown Popup */}
                            {isProfileOpen && (
                                <div 
                                    className="position-absolute end-0 mt-2 bg-white shadow-sm border rounded-3 p-3"
                                    style={{ minWidth: "180px", zIndex: 1050 }}
                                >
                                    <div className="pb-2 mb-2 border-bottom">
                                        <div className="fw-semibold small text-dark">{user?.username}</div>
                                        <div className="text-muted text-truncate" style={{ fontSize: "0.75rem" }}>
                                            {user?.email}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => { logout(); setIsProfileOpen(false); }}
                                        className="btn btn-sm btn-link text-danger text-decoration-none p-0 w-100 text-start fw-medium d-flex align-items-center gap-2"
                                        style={{ fontSize: "0.85rem" }}
                                    >
                                        <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Mobile Hamburger Toggle Button */}
                    <button
                        type="button"
                        className="btn btn-link text-decoration-none text-muted p-0 d-md-none border-0 mx-3"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle navigation menu"
                    >
                        <i className={`fa-solid ${isMobileMenuOpen ? "fa-xmark text-danger" : "fa-bars"} fs-4`}></i>
                    </button>
                </div>


            </div>
            {/* Mobile Dropdown Panel (d-md-none: only visible on mobile when open) */}
            {isMobileMenuOpen && (
                <div className="d-md-none border-top bg-white px-4 py-3 shadow-sm">
                    <div className="d-flex flex-column gap-3 fs-6">
                        {isLoggedIn ? (
                            <div className="d-flex flex-column gap-2 pb-2 border-bottom">
                                <div className="d-flex align-items-center justify-content-between">
                                    <span className="small text-muted">Signed in as:</span>
                                    <span className="badge bg-light text-secondary border px-2 py-1">
                                        <i className="fa-solid fa-user me-1 text-primary"></i> {user?.username}
                                    </span>
                                </div>

                            </div>
                        ) : (
                            <div className="pb-2 border-bottom d-flex gap-2 ">
                                <Link
                                    to="/signup"
                                    onClick={closeMobileMenu}
                                    className="btn btn-outline-primary w-50 py-2 fw-semibold text-decoration-none"
                                >
                                    Signup
                                </Link>
                                 <Link 
                                    to="/login" 
                                    onClick={closeMobileMenu} 
                                    className="btn btn-primary text-white w-50 py-2 fw-semibold text-decoration-none"
                                    style={{ backgroundColor: "#387ED1", borderColor: "#387ED1" }}
                                >
                                    Login
                                </Link>
                            </div>
                        )}

                        {/* Standard Navigation Links */}
                        <Link to="/about" onClick={closeMobileMenu} className="text-muted text-decoration-none py-1">About</Link>
                        <Link to="/products" onClick={closeMobileMenu} className="text-muted text-decoration-none py-1">Products</Link>
                        <Link to="/pricing" onClick={closeMobileMenu} className="text-muted text-decoration-none py-1">Pricing</Link>
                        <Link to="/support" onClick={closeMobileMenu} className="text-muted text-decoration-none py-1">Support</Link>
                    </div>
                </div>
            )}



        </nav>
    );
}