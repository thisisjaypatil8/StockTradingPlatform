export default function Platform({ description, imgUrl }) {
    return (
        <div className="col-12 col-md-4 text-center p-3 p-md-4 mb-2">
            <a href="" className="text-decoration-none">
            <div className="d-flex justify-content-center align-items-center mb-3" style={{ height: "55px" }}>
                <img
                    src={imgUrl}
                    alt="partner logo"
                    className="img-fluid"
                    style={{ maxHeight: "45px", maxWidth: "180px", minHeight: "60px", minWidth: "100px", objectFit: "contain" }}
                />
            </div>
            <p className="text-muted small px-3" style={{ fontSize: "0.82rem", lineHeight: "1.6" }}>
                {description}
            </p>
            </a>
        </div>
    );
}