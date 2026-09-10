import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function OpenAccount() {
    const { isLoggedIn, dashboardUrl } = useAuth();

    return (
        <div className="text-center my-5">
            <h1 className="mt-3 fs-3 fw-semibold">
                Open a Zerodha account
            </h1>
            <p className="text-muted">
                Modern platforms and apps, ₹0 investments, and flat ₹20 intraday and F&O trades.
            </p>
            
            {isLoggedIn ? (
                <a 
                    href={dashboardUrl}
                    className="btn px-4 py-2 mt-3 text-white fw-semibold fs-5 text-decoration-none shadow-sm" 
                    style={{ minWidth: "220px", width: "fit-content", margin: "0 auto", backgroundColor: "#387ED1" }}
                >
                    Go to Dashboard <i className="fa-solid fa-arrow-right ms-2 fs-6"></i>
                </a>
            ) : (
                <Link 
                    to="/signup"
                    className="btn px-4 py-2 mt-3 text-white fw-semibold fs-5 text-decoration-none shadow-sm" 
                    style={{ minWidth: "220px", width: "fit-content", margin: "0 auto", backgroundColor: "#387ED1" }}
                >
                    Sign up for free
                </Link>
            )}
        </div>
    );
}
