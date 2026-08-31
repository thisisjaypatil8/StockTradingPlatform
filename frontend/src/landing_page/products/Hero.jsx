export default function Hero() {
    return (
        <div className="container border-bottom">
            <div className="row mt-md-5 mt-3 mb-md-5 mb-3">
                <div className="col-12 text-center gap-3 d-flex flex-column mt-md-5 mb-md-5 mb-3" style={{ color: "var(--secondary-color)" }}>
                    <h2 className="">Zerodha Products</h2>
                    <h4 className="" style={{ fontWeight: "400", fontSize: { md: "1.5rem", xs: "1rem" } }}>Sleek, modern, and intuitive trading platforms</h4>
                    <p className="para">Check out our  <a href="#" className="text-decoration-none">investment offerings <i className="fa-solid fa-long-arrow-right fs-6"></i> </a></p>
                </div>
            </div>
        </div>
    );
}