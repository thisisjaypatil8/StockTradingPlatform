import Platforms from "./Platforms";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";

export default function Universe() {
    const { isLoggedIn, dashboardUrl } = useAuth();
    return (
        <div className="container py-5 my-md-4">
            <div className="text-center mb-5">
                <p className="text-muted fs-5 mb-4">
                    Want to know more about our technology stack? Check out the{" "}
                    <a href="#" className="text-decoration-none" style={{ color: "var(--primary-color, #387ED1)" }}>
                        Zerodha.tech
                    </a>{" "}
                    blog.
                </p>
                <h2 className="fw-semibold mt-5 mb-3" style={{ color: "var(--secondary-color, #424242)" }}>
                    The Zerodha Universe
                </h2>
                <p className="text-muted fs-6">
                    Extend your trading and investment experience even further with our partner platforms
                </p>
            </div>

            <Platforms />

            <div className="text-center mt-5 mb-4">
                {isLoggedIn ? (
                    <a href={dashboardUrl}
                        className='btn px-4 py-2 mt-3 text-white fw-semibold fs-5 text-decoration-none shadow-sm'
                        style={{ backgroundColor: "#387ED1", minWidth: "220px", width: "fit-content", margin: "0 auto" }}
                    >Go to Dashboard <i className='fa-solid fa-arrow-right ms-2 fs-6'></i></a>

                ) : (
                    <Link
                        to="/signup"
                        className="btn btn-primary px-4 py-2 fw-semibold fs-5"
                        style={{ backgroundColor: "#387ED1", borderColor: "#387ED1" }}
                    >
                        Sign up for free
                </Link>
            )}
            </div>
        </div>
    );
}