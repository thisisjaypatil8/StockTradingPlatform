import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export default function Navbar() {

    const { isLoggedIn, user, logout, dashboardUrl } = useAuth();

    return (
        <nav className="border-bottom" style={{ position: "sticky", top: "0", zIndex: "1000", backgroundColor: "#FBFBFB" }}>
            <div className="container d-flex align-items-center justify-content-between py-4 ">

                <Link to="/"> <img src="media/images/logo.svg" alt="logo" style={{ maxWidth: "120px", width: "100%" }} className="mx-4 mx-md-0" /></Link>

                <div className="d-flex gap-5 fs-6 align-items-center justify-content-around">
                    {isLoggedIn ? (
                        <div className="d-flex align-items-center gap-3">
                            {/* Dashboard Direct Button */}
                            <a
                                href={dashboardUrl}
                                className="btn btn-sm text-white px-3 py-1 fw-semibold text-decoration-none"
                                style={{ backgroundColor: "#387ED1", borderColor: "#387ED1" }}
                            >
                                Dashboard
                            </a>

                            {/* Username Badge */}
                            <span className="badge bg-light text-secondary border px-2 py-1 small d-none d-md-inline-block">
                                <i className="fa-solid fa-user me-1 text-primary"></i> {user?.username}
                            </span>

                            {/* Logout Action */}
                            <button
                                onClick={logout}
                                className="btn btn-sm btn-outline-danger px-2 py-1 border-0 fw-medium small"
                                title="Sign out of your session"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <Link to="/signup" className="text-muted text-decoration-none d-none d-md-block">
                            Signup
                        </Link>
                    )}


                    <Link to="/about" className="text-muted text-decoration-none d-none d-md-block">About</Link>
                    <Link to="/products" className="text-muted text-decoration-none d-none d-md-block">Products</Link>
                    <Link to="/pricing" className="text-muted text-decoration-none d-none d-md-block">Pricing</Link>
                    <Link to="/support" className="text-muted text-decoration-none d-none d-md-block">Support</Link>

                    <a href="" className="text-muted text-decoration-none "><i className="fa-solid fa-bars fs-5 mx-md-2 mx-4"></i></a>
                </div>
            </div>
        </nav>
    );
}