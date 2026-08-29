export default function Awards() {
    return (
        <>
            <div className="container py-4 py-md-5">
                <div className="row g-4 g-lg-5 align-items-center">
                    <div className="col-12 col-md-6 text-center">
                        <img src="media/images/largestBroker.svg" alt="largestBroker" className="img-fluid" style={{ maxWidth: "100%" }} />
                    </div>
                    <div className="col-12 col-md-6 p-3 p-md-4">
                        <h2 className="fs-2 fw-bold mb-3 text-dark mb-3">Largest stock broker in India</h2>
                        <p className="text-muted lh-base mb-4">2.5+ million Zerodha clients contribute to over 15% of all retail equity trades by volume in India daily by trading and investing in:</p>
                        <div className="row mb-4">
                            <div className="col-6">
                                <ul className="text-secondary lh-lg mb-0 ps-3">
                                    <li>Futures and Options</li>
                                    <li>Stocks</li>
                                    <li>Government securities</li>
                                </ul>
                            </div>
                            <div className="col-6">
                                <ul className="text-secondary lh-lg mb-0 ps-3">
                                    <li>Mutual funds</li>
                                    <li>Bonds and NCDs</li>
                                    <li>IPO, SGBs, ETFs, InvITs, REITs</li>
                                </ul>
                            </div>

                        </div>
                        <div className="text-center text-md-start">
                            <img src="media/images/pressLogos.png" alt="pressLogos" className="img-fluid" style={{ maxWidth: "90%" }} />
                        </div>
                    </div>
                </div>
            </div>

        </>
    );
}
