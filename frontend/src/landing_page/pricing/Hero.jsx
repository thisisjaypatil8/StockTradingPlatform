export default function Hero() {
    return (
       <div className="container mb-md-5 mb-">
            <div className="row mt-md-5 mt-3 mb-md-5 mb-3">
                <div className="col-12 text-center gap-3 d-flex flex-column mt-md-5 mb-md-5 mb-3" style={{ color: "var(--secondary-color)" }}>
                    <h2 className="">Charges</h2>
                    <h4 className="" style={{ fontWeight: "400", fontSize: { md: "1.5rem", xs: "1rem" } }}>List of all charges and taxes</h4>
                   
                </div>
            </div>
            <div className="row">
                <div className="col-12 col-md-4 text-center  mt-md-5 mt-3">
                    <img src="/media/images/pricing-eq.svg" alt="" className="img-fluid mb-md-4 mb-3" style={{maxWidth:"250px"}}/>
                    <h3>Free equity delivery</h3>
                    <p className="para">All equity delivery investments (NSE, BSE), are absolutely free — ₹ 0 brokerage.</p>
                </div>
                <div className="col-12 col-md-4 text-center mt-md-5 mt-3">
                    <img src="/media/images/other-trades.svg" alt="" className="img-fluid mb-md-4 mb-3" style={{maxWidth:"250px"}}/>
                    <h3>Intraday and F&O trades</h3>
                    <p className="para">Flat ₹ 20 or 0.03% (whichever is lower) per executed order on intraday trades across equity, currency, and commodity trades. Flat ₹20 on all option trades.</p>
                </div>
                <div className="col-12 col-md-4 text-center mt-md-5 mt-3">
                    <img src="/media/images/pricing-eq.svg" alt="" className="mb-md-4 mb-3" style={{maxWidth:"250px"}}/>
                    <h3>Free direct MF</h3>
                    <p className="para">All direct mutual fund investments are absolutely free — ₹ 0 commissions & DP charges.</p>
                </div>
            </div>
        </div>
    );
}
