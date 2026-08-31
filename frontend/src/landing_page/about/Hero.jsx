export default function Hero() {
    return (
        <div className="container">
            <div className="row mt-2 mb-2 mt-md-5 mb-md-5 p-4 p-md-5 border-bottom ">
                <div className="col-12  text-center" style={{ color: "var(--secondary)" }}>
                    <h1 className=" fs-4 mb-md-5 mb-2">
                        We pioneered the discount broking model in India.
                        <br />
                        Now, we are breaking ground with our technology.
                    </h1>
                </div>
            </div>
            <div className="row p-4 mt-md-2 pt-md-2 mt-2 pt-3">
                <div className="col-md-5 col-12 ps-md-1 p-2 offset-md-1 pt-md-4 text-secondary" style={{ fontSize: "1.05rem", fontWeight: "400", lineHeight: "1.7" }}>
                    <p>We kick-started operations on the 15th of August, 2010 with the goal of breaking all barriers that traders and investors face in India in terms of cost, support, and technology. We named the company Zerodha, a combination of Zero and "Rodha", the Sanskrit word for barrier.</p>

                    <p>Today, our disruptive pricing models and in-house technology have made us the biggest stock broker in India.</p>

                    <p>Over 1.6+ crore clients place billions of orders every year through our powerful ecosystem of investment platforms, contributing over 15% of all Indian retail trading volumes.</p>
                </div>
                <div className="col-md-5 text-secondary pt-md-4 ps-md-5 ps-2" style={{ fontSize: "1.05rem", fontWeight: "400", lineHeight: "1.7" }}>
                    <p>In addition, we run a number of popular open online educational and community initiatives to empower retail traders and investors.</p>

                    <p><a href="" style={{ color: "#006175ff", textDecoration: "none" }}>Rainmatter</a>, our fintech fund and incubator, has invested in several fintech startups with the goal of growing the Indian capital markets.</p>

                    <p>And yet, we are always up to something new every day. Catch up on the latest updates on <a href="" style={{ color: "#006175ff", textDecoration: "none" }}>our blog</a> or see what the media is saying about us or learn more about our business and product philosophies.</p>
                </div>
            </div>
           
        </div>
    );
}