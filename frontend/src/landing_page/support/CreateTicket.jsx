export default function CreateTicket() {
    const topics = [
        { icon: "fa-regular fa-circle-plus", title: "Account Opening" },
        { icon: "fa-regular fa-circle-user", title: "Your Zerodha Account" },
        { icon: "fa-solid fa-at", title: "Kite" },
        { icon: "fa-solid fa-indian-rupee-sign", title: "Funds" },
        { icon: "fa-solid fa-chart-pie", title: "Console" },
        { icon: "fa-regular fa-clock", title: "Coin" },
    ];

    const quickLinks = [
        "1. Track account opening",
        "2. Track segment activation",
        "3. Intraday margins",
        "4. Kite user manual",
        "5. Learn how to create a ticket"
    ];

    return (
        <div className=" p-md-4 p-3">
            <div className="row g-4">
                
                {/* ── Left Column: Support Topic Bars ── */}
                <div className="col-12 col-md-8">
                    <div className="d-flex flex-column gap-3">
                        {topics.map((topic, index) => (
                            <div 
                                key={index}
                                className="d-flex justify-content-between align-items-center p-3 px-4 bg-white border rounded shadow-sm"
                                style={{ cursor: "pointer", transition: "all 0.2s ease" }}
                            >
                                <div className="d-flex align-items-center gap-3">
                                    <div 
                                        className="d-flex align-items-center justify-content-center rounded-circle"
                                        style={{ width: "36px", height: "36px", backgroundColor: "#eef2ff", color: "#387ed1" }}
                                    >
                                        <i className={`${topic.icon} fs-5`}></i>
                                    </div>
                                    <span className="fs-5 fw-medium text-dark">{topic.title}</span>
                                </div>
                                <i className="fa-solid fa-chevron-down text-primary fs-6"></i>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Right Column: Notices & Quick Links ── */}
                <div className="col-12 col-md-4">
                    
                    {/* Notice Box (Orange Left Accent) */}
                    <div 
                        className="p-3 mb-4 rounded" 
                        style={{ backgroundColor: "#FFF8E7", borderLeft: "4px solid #F59E0B" }}
                    >
                        <ul className="mb-0 ps-3" style={{ fontSize: "0.95rem" }}>
                            <li className="mb-2">
                                <a href="#" className="text-decoration-underline" style={{ color: "#387ed1" }}>
                                    Issue with IPO applications on BSE
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-decoration-underline" style={{ color: "#387ed1" }}>
                                    Offer for sale (OFS) – August 2026
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Quick Links Card */}
                    <div className="border rounded bg-white overflow-hidden shadow-sm">
                        <div className="py-2 px-3 fw-semibold text-muted" style={{ backgroundColor: "#F7F7F7" }}>
                            Quick links
                        </div>
                        <ul className="list-group list-group-flush" style={{ fontSize: "0.95rem" }}>
                            {quickLinks.map((link, idx) => (
                                <li key={idx} className="list-group-item py-3 px-3">
                                    <a href="#" className="text-decoration-none" style={{ color: "#387ed1" }}>
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>

            </div>
        </div>
    );
}
