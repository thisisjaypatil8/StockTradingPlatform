export default function Pricing() {
    return (
        <section className="container py-4 py-md-5 my-md-4">
            <div className="row align-items-center g-4 g-lg-5">
                
                {/* Left side Text and Link */}
                <div className="col-12 col-md-5 col-lg-4">
                    <h2 className="fs-2 fw-bold text-dark mb-3">Unbeatable pricing</h2>
                    <p className="text-muted lh-base mb-4" style={{ fontSize: "14.5px" }}>
                        We pioneered the concept of discount broking and price transparency in India. 
                        Flat fees and no hidden charges.
                    </p>
                    <a href="#" className="text-decoration-none fw-semibold text-primary">
                        See our charges <i className="fa-solid fa-arrow-right ms-1"></i>
                    </a>
                </div>

                {/* Right side Cards */}
                <div className="col-12 col-md-7 col-lg-8">
                    <div className="row g-3 g-md-2 g-lg-4 align-items-center">
                        
                        {/* 1. Free Account Opening */}
                        <div className="col-4">
                            <div className="position-relative d-flex align-items-center">
                                <img 
                                    src="media/images/pricing-eq.svg" 
                                    alt="₹0" 
                                    className="w-75" 
                                />
                                <p 
                                    className="text-muted mb-0 position-absolute" 
                                    style={{ 
                                        left: "62%", 
                                        top: "60%", 
                                        transform: "translateY(-50%)", 
                                        fontSize: "11px", 
                                        lineHeight: "1.25",
                                        width: "40%"
                                    }}
                                >
                                    Free account<br />opening
                                </p>
                            </div>
                        </div>

                        {/* 2. Free Equity Delivery */}
                        <div className="col-4">
                            <div className="position-relative d-flex align-items-center">
                                <img 
                                    src="media/images/pricing-eq.svg" 
                                    alt="₹0" 
                                    className="w-75" 
                                />
                                <p 
                                    className="text-muted mb-0 position-absolute" 
                                    style={{ 
                                        left: "62%", 
                                        top: "60%", 
                                        transform: "translateY(-50%)", 
                                        fontSize: "11px", 
                                        lineHeight: "1.25",
                                        width: "40%"
                                    }}
                                >
                                    Free equity<br />delivery
                                </p>
                            </div>
                        </div>

                        {/* 3. Intraday and F&O */}
                        <div className="col-4">
                            <div className="position-relative d-flex align-items-center">
                                <img 
                                    src="media/images/other-trades.svg" 
                                    alt="₹20" 
                                    className="w-75" 
                                />
                                <p 
                                    className="text-muted mb-0 position-absolute" 
                                    style={{ 
                                        left: "70%", 
                                        top: "60%", 
                                        transform: "translateY(-50%)", 
                                        fontSize: "11px", 
                                        lineHeight: "1.25",
                                        width: "40%"
                                    }}
                                >
                                    Intraday and<br />F&amp;O
                                </p>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </section>
    );
}
