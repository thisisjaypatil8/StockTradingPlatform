export default function Stats() {
    return (
        <section className="container py-4 py-md-5">
            <div className="row align-items-center g-4 g-lg-5">
                
                {/* Left Column: Text & Value Propositions */}
                <div className="col-12 col-lg-6 p-3 p-md-4">
                    <h2 className="fs-2 fw-bold mb-4 text-dark">Trust with confidence</h2>
                    
                    <div className="mb-4">
                        <h3 className="fs-5 fw-semibold text-secondary">Customer-first always</h3>
                        <p className="text-muted small lh-base">
                            That's why 1.6+ crore customers trust Zerodha with ~ ₹6 lakh crores of equity investments, 
                            making us India’s largest broker; contributing to 15% of daily retail exchange volumes in India.
                        </p>
                    </div>

                    <div className="mb-4">
                        <h3 className="fs-5 fw-semibold text-secondary">No spam or gimmicks</h3>
                        <p className="text-muted small lh-base">
                            No gimmicks, spam, "gamification", or annoying push notifications. High quality apps that you use at your pace, the way you like.
                        </p>
                    </div>

                    <div className="mb-4">
                        <h3 className="fs-5 fw-semibold text-secondary">The Zerodha universe</h3>
                        <p className="text-muted small lh-base">
                            Not just an app, but a whole ecosystem. Our investments in 30+ fintech startups offer you tailored services specific to your needs.
                        </p>
                    </div>

                    <div className="mb-4">
                        <h3 className="fs-5 fw-semibold text-secondary">Do better with money</h3>
                        <p className="text-muted small lh-base">
                            With initiatives like Nudge and Kill Switch, we don't just facilitate transactions, but actively help you do better with your money.
                        </p>
                    </div>
                </div>

                {/* Right Column: Ecosystem Image & Links */}
                <div className="col-12 col-lg-6 text-center p-3 p-md-4">
                    <img src="media/images/ecosystem.png" alt="Zerodha Ecosystem" className="img-fluid mb-4" style={{ maxWidth: "90%" }} />
                    <div className="d-flex justify-content-center gap-4 flex-wrap">
                        <a href="#" className="text-decoration-none fw-semibold text-primary">
                            Explore our products <i className="fa-solid fa-arrow-right-long ms-1"></i>
                        </a>
                        <a href="#" className="text-decoration-none fw-semibold text-primary">
                            Try Kite demo <i className="fa-solid fa-arrow-right-long ms-1"></i>
                        </a>
                    </div>
                </div>

            </div>
        </section>
    );
}
