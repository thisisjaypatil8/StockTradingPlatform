import { useState } from "react";

const url = "/support";

export default function CreateTicket() {
    // 1. Add activeState tracker for accordion toggles
    const [openIndex, setOpenIndex] = useState(null);

    // 2. Map items with nested dummy FAQs so accordion actually works
    const topics = [
        { 
            icon: "fa-regular fa-circle-plus", 
            title: "Account Opening",
            faqs: ["Online Account Opening", "Offline Account Opening", "Charges & Fees", "Company/HUF/Partnership"]
        },
        { 
            icon: "fa-regular fa-circle-user", 
            title: "Your Zerodha Account",
            faqs: ["Login Credentials", "Profile Details (KYC)", "Nominee Addition", "Re-KYC Processes"]
        },
        { 
            icon: "fa-solid fa-at", 
            title: "Kite",
            faqs: ["Order Types & Placement", "Charts & Indicators", "Margins & Leverage", "Kite Mobile App Issues"]
        },
        { 
            icon: "fa-solid fa-indian-rupee-sign", 
            title: "Funds",
            faqs: ["Adding Funds (UPI/Netbanking)", "Withdrawal Timeline", "Instant Withdrawal Feature", "Failed Transactions"]
        },
        { 
            icon: "fa-solid fa-chart-pie", 
            title: "Console",
            faqs: ["P&L Statements", "Tax Loss Harvesting", "Corporate Actions (Bonus/Splits)", "Ledger & Balances"]
        },
        { 
            icon: "fa-regular fa-clock", 
            title: "Coin",
            faqs: ["Direct Mutual Funds", "SIP Setup & Pausing", "Redemption Process", "NFO Implementations"]
        },
    ];

    // 3. Map list items directly to live authoritative URLs to avoid dead links
    const quickLinks = [
        { text: "1. Track account opening", url: url },
        { text: "2. Track segment activation", url: url },
        { text: "3. Intraday margins", url: url },
        { text: "4. Kite user manual", url: url },
        { text: "5. Learn how to create a ticket", url: url }
    ];

    const toggleAccordion = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="p-md-4 p-3">
            <div className="row g-4">
                
                {/* ── Left Column: Support Topic Bars (Accordions) ── */}
                <div className="col-12 col-md-8">
                    <div className="d-flex flex-column gap-3">
                        {topics.map((topic, index) => {
                            const isCurrentOpen = openIndex === index;
                            return (
                                <div key={index} className="border rounded shadow-sm bg-white overflow-hidden">
                                    {/* Header Toggle */}
                                    <div 
                                        onClick={() => toggleAccordion(index)}
                                        className="d-flex justify-content-between align-items-center p-3 px-4"
                                        style={{ cursor: "pointer", background: isCurrentOpen ? "#f8fafc" : "#fff", transition: "all 0.2s ease" }}
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
                                        <i className={`fa-solid fa-chevron-down text-primary fs-6 transition-transform ${isCurrentOpen ? 'rotate-180' : ''}`}
                                           style={{ transform: isCurrentOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}></i>
                                    </div>
                                    
                                    {/* Reusable Accordion Dropdown Content */}
                                    {isCurrentOpen && (
                                        <div className="p-3 px-4 border-top bg-light">
                                            <div className="row row-cols-1 row-cols-sm-2 g-2">
                                                {topic.faqs.map((faq, fIdx) => (
                                                    <div key={fIdx} className="col">
                                                        <a href={url} className="text-decoration-none text-primary" style={{ fontSize: "0.95rem" }}>
                                                            • {faq}
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
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
                                <a href={url} className="text-decoration-underline" style={{ color: "#387ed1" }}>
                                    Issue with IPO applications on BSE
                                </a>
                            </li>
                            <li>
                                <a href={url} className="text-decoration-underline" style={{ color: "#387ed1" }}>
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
                                    <a href={link.url} className="text-decoration-none" style={{ color: "#387ed1" }}>
                                        {link.text}
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
