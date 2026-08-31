import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <div className="container text-center py-5 my-5 d-flex flex-column justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
            <h1 className="display-5 fw-bold mb-3" style={{ color: "var(--secondary-color, #424242)" }}>
                404 Not Found
            </h1>
            <p className="text-muted fs-5 mb-4">
                Sorry, the page you are looking for does not exist. Visit <Link to="/" className="text-decoration-none" style={{ color: "var(--primary-color, #387ED1)" }}>Zerodha’s home page</Link>.
            </p>
            <Link to="/" className="btn btn-primary px-4 py-2 fw-semibold" style={{ backgroundColor: "#387ED1", borderColor: "#387ED1" }}>
                Back to Home
            </Link>
        </div>
    );
}