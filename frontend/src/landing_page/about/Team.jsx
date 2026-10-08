export default function Team() {
    return (
        <div className="container mb-md-5 mb-3">
            <div className="row mt-5">
                <h3 className="text-center mb-md-4 mb-2">People</h3>
            </div>
            <div className="row mt-4">
                <div className="col-12 col-md-4 offset-md-1 text-center">
                    <img src="media/images/nithin-kamath.jpg" alt="" className="border mb-2 mb-md-4" style={{maxWidth: "300px", borderRadius: "50%" }} />
                    <h4 className="mt-2">Nithin Kamath</h4>
                    <p>Founder, CEO &amp; Co-founder, Zerodha</p>
                </div>
                <div className="col-md-6 col-12 text-secondary p-3 p-md-4">
                    <p className="para">Nithin bootstrapped and founded Zerodha in 2010 to overcome the hurdles he faced during his decade long stint as a trader. Today, Zerodha has changed the landscape of the Indian broking industry.</p>

                    <p className="para">He is a member of the SEBI Secondary Market Advisory Committee (SMAC) and the Market Data Advisory Committee (MDAC).</p>

                    <p className="para">Playing basketball is his zen.</p>

                    <p className="para"><a href={import.meta.env.VITE_BASE_URL} className="text-decoration-none">Homepage</a> &nbsp;|&nbsp; <a href="#" className="text-decoration-none">TradingQnA</a> &nbsp;|&nbsp; <a href="#" className="text-decoration-none">Twitter</a></p>
                </div>
            </div>
        </div>
    );
}