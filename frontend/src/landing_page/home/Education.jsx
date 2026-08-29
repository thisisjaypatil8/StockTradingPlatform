export default function Education() {
    return (
        <>
            <div className="container py-4 py-md-5">
                <div className="row align-items-center justify-content-center">
                    <div className="col-12 col-md-5 text-center text-md-start">
                        <img src="/media/images/index-education.svg" alt="index-education" className="img-fluid" style={{ maxWidth: "500px", width: "95%" }} />
                    </div>
                    
                    <div className="col-12 col-md-6 offset-md-1 text-center text-md-start p-3 p-md-4">
                        <h2 className="fw-bold">Free and open market education</h2>
                        <p className="text-muted lh-base py-2">Varsity, the largest online stock market education book in the world covering everything from the basics to advanced trading.</p>
                        <a href="#" className="text-decoration-none fw-semibold text-primary d-block mb-3">Varsity <i className="fa-solid fa-arrow-right-long ms-1"></i></a>
                        <p className="text-muted lh-base py-2">TradingQ&A, the most active trading and investment community in India for all your market related queries.</p>
                        <a href="#" className="text-decoration-none fw-semibold text-primary">TradingQ&A <i className="fa-solid fa-arrow-right-long ms-1"></i></a>
                    </div>
                </div>
            </div>
        </>
    );
}