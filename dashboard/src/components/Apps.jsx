export default function Apps() {
    const appsList = [
        {
            title: "Kite Connect",
            tag: "API & Algo",
            desc: "Build powerful trading applications and algorithms using our clean REST HTTP/JSON APIs.",
            image: "/media/images/kite-connect.png",
            badgeColor: "#4184f3",
            externalUrl: "http://localhost:3000/apps",
        },
        {
            title: "Coin",
            tag: "Mutual Funds",
            desc: "Buy commission-free direct mutual funds online, delivered straight to your Demat account.",
            image: "/media/images/coin.png",
            badgeColor: "#4caf50",
            externalUrl: "https://coin.zerodha.com",
        },
        {
            title: "Varsity",
            tag: "Free Education",
            desc: "In-depth stock market education with clean illustrations, bite-sized modules, and certifications.",
            image: "/media/images/varsity.png",
            badgeColor: "#ff9800",
            externalUrl: "https://zerodha.com/varsity",
        },
        {
            title: "Smallcase",
            tag: "Thematic Investing",
            desc: "Diversified, thematic stock baskets created and managed by SEBI registered professionals.",
            image: "/media/images/smallcase.png",
            badgeColor: "#1ba9ba",
            externalUrl: "https://smallcase.zerodha.com",
        },
        {
            title: "Streak",
            tag: "Algo Trading",
            desc: "Create, backtest, and deploy algorithmic trading strategies without writing any code.",
            image: "/media/images/streak-logo.png",
            badgeColor: "#ea3b56",
            externalUrl: "https://streak.zerodha.com",
        },
        {
            title: "Sensibull",
            tag: "Options Trading",
            desc: "India's largest options trading platform with live option chains, Greeks, and pre-built strategies.",
            image: "/media/images/sensibull-logo.svg",
            badgeColor: "#7e3af2",
            externalUrl: "https://sensibull.com",
        },
        {
            title: "Tijori",
            tag: "Fundamental Analysis",
            desc: "Comprehensive stock research platform providing deep fundamental metrics, financials, and sector insights.",
            image: "/media/images/tijori.png",
            badgeColor: "#0284c7",
            externalUrl: "https://tijorifinance.com",
        },
        {
            title: "Ditto Insurance",
            tag: "Insurance Advisory",
            desc: "Understand and buy term life and health insurance with honest, zero-spam advice from trusted advisors.",
            image: "/media/images/ditto-logo.png",
            badgeColor: "#16a34a",
            externalUrl: "https://joinditto.in",
        },
    ];



    return (
        <div style={{ padding: "10px 20px" }}>
            <div style={{marginBottom:"1rem"}}>
                <h3 style={{ fontSize: "1.4rem", color: "#444", margin: "0 0 6px 0", fontWeight: "500" }}>Zerodha Ecosystem & Apps</h3>
                <p style={{ color: "#888", fontSize: "0.88rem", margin: 0 }}>Explore our suite of specialized investment products, developer APIs, and partner platforms.</p>
            </div>

            {/* responsive grid */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "24px",

            }}>
                {appsList.map((app, idx) => (
                    <div key={idx}
                        style={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #eaeaea",
                            borderRadius: "10px",
                            padding: "24px",
                            display: 'flex',
                            flexDirection: "column",
                            justifyContent: "space-between",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                            transition: "transform 0.2s ease, box-shadow 0.2s ease",
                        }}
                    >
                        <div>
                            {/* card top- logo and category badge */}
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginBottom: "16px",
                                    height: "44px"
                                }}
                            >
                                <div
                                    style={{
                                        height: "40px",
                                        maxWidth: "140px",
                                        display: "flex",
                                        alignItems: "center",
                                    }}>
                                    <img src={app.image} alt={app.title}
                                        style={{
                                            maxHeight: "36px",
                                            maxWidth: "130px",
                                            objectFit: "contain",

                                        }} />
                                </div>
                                <span
                                    style={{
                                        fontSize: "0.75rem",
                                        padding: "4px 10px",
                                        borderRadius: "20px",
                                        backgroundColor: `${app.badgeColor}25`,
                                        color: app.badgeColor,
                                        fontWeight: 600,
                                    }}
                                >{app.tag}</span>
                            </div>
                            {/* title & discription */}
                            <h4
                                style={{
                                    margin: "0 0 8px 0",
                                    fontSize: "1.15rem",
                                    fontWeight: 600,
                                    color: "#111",
                                }}
                            >{app.title}</h4>
                            <p
                                style={{
                                    color: "#666",
                                    fontSize: "0.86rem",
                                    lineHeight: "1.55",
                                    margin: 0,
                                }}
                            >{app.desc}</p>
                        </div>
                        {/* card footer - arrow and external link */}
                        <div
                            style={{
                                marginTop: "22px", paddingTop: "14px", borderTop: "1px solid #eee"
                            }}
                        >
                            <a href={app.externalUrl}
                                style={{
                                    display: "inline-block",
                                    textDecoration: "none",
                                    textAlign: "center",
                                    width: "100%",
                                    padding: "9px 0",
                                    backgroundColor: "#f8fafc",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "6px",
                                    color: "#3b82f6",
                                    fontSize: "0.85rem",
                                    fontWeight: 600,
                                    boxSizing: "border-box",
                                    cursor: "pointer",
                                }}
                            >Open {app.title}</a>
                        </div>


                    </div>
                ))}
            </div>

        </div>
    )
}
