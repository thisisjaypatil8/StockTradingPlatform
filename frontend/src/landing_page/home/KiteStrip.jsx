export default function KiteStrip() {
    return (
        <section className="py-4 my-md-5" style={{ backgroundColor: "#f5f7fb" }}>
            <div className="container">
                <div className="row align-items-center g-3 g-md-4 text-center text-md-start" >
                    <div className="col-12 col-md-2 text-center text-md-start">
                        <img src="media/images/kc-logo-landing.svg" alt="kiteStrip" className="img-fluid" />
                    </div>
                    <div className="col-12 col-md-7" >
                        <p className="mb-0 text-muted small lh-base">
                            Need more? Build your own trading and investing experience with{" "}
                            <a href="#" className="text-decoration-none fw-semibold text-dark">Kite Connect</a>,
                            simple HTTP APIs to place orders, stream market data, manage your account, and more.&nbsp;
                            <a href="#" className="text-decoration-none fw-semibold text-primary">Explore <i className="fa-solid fa-arrow-right-long ms-1"></i></a> </p>

                    </div>
                    <div className="col-12 col-md-3 text-center text-md-end d-none d-md-block ">
                        <img src="media/images/kc-banner-image.svg" alt="" className="img-fluid" />
                    </div>
                </div>
            </div>

        </section>
    );
}