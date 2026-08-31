export default function Console() {
    return (
        <div className="container">
            <div className="row mb-md-5 mb-3">
                <div className="col-12 col-md-4 order-md-1 order-2 align-self-center px-md-4 px-3 mt-md-5 ">
                    <h2 className="mt-3 fs-4">Console</h2>
                    <p className="para">The central dashboard for your Zerodha account. Gain insights into your trades and investments with in-depth reports and visualisations.</p>
                    <div className="d-flex gap-3 mt-3">
                        <a href="" className="text-decoration-none"><i className="fas fa-long-arrow-right"></i> Learn More</a>
                    </div>
                </div>
                <div className="col-12 col-md-7 px-md-5 px-4 offset-md-1 offset-0 order-md-2 order-1">
                    <img src="media/images/products-console.png" alt="" className="img-fluid" />
                </div>
            </div>
        </div>
    );
}