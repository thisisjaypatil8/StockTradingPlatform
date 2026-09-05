export default function Footer() {
    return (
        <footer className="border-top" style={{ backgroundColor: "#FBFBFB" }}>
            <div className="container">
                <div className="row py-4 py-md-5 px-2 px-md-0">
                    <div className="col-12 col-md-3 mb-5 mb-md-0">
                        <img src="media/images/logo.svg" alt="logo" className="img-fluid" style={{ maxWidth: "150px", width: "100%" }} />
                        <p className="mt-3 text-muted" style={{ fontSize: "0.8rem" }}>© 2010 - 2026, Zerodha Broking Ltd. <br /> All rights reserved</p>
                        <div className="d-flex gap-4 fs-5 pb-3 mb-3 border-bottom ">
                            <a href="#">
                                <i className="fa-brands fa-x-twitter text-muted"></i>
                            </a>
                            <a href="#">
                                <i className="fa-brands fa-square-facebook text-muted"></i>
                            </a>

                            <a href="#">
                                <i className="fa-brands fa-instagram text-muted"></i>
                            </a>
                            <a href="#">
                               <i className="fa-brands fa-linkedin-in text-muted"></i>
                            </a>
                        </div>
                        <div className="d-flex gap-3 fs-5 ">
                            <a href="" className="text-muted"><i className="fa-brands fa-youtube"></i></a>
                            <a href="" className="text-muted"><i className="fa-brands fa-whatsapp"></i> </a>
                            <a href="" className="text-muted"><i className="fa-brands fa-telegram"></i> </a>
                        </div>
                        <div className="d-flex mt-4 gap-2">
                            <div>
                                <img src="/media/images/google-play-badge-light.svg" className="img-fluid" style={{ maxWidth: "110px", width: "100%" }} alt="" />
                            </div>
                            <div>
                                <img src="/media/images/appstore-badge-light.svg" className="img-fluid" style={{ maxWidth: "100px", width: "100%" }} alt="" />
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-md-9">
                        <div className="row">
                            <div className="col-6 col-md-3 mb-2 gap-2 px-3">
                                <h5 className="fw-semibold mb-3 "style={{ color: "var(--secondary-color)" }}>Account</h5>
                                <p><a href="#" className="text-muted text-decoration-none ">Open demat account</a></p>
                                <p><a href="#" className="text-muted text-decoration-none">Minor demat account</a></p>
                                <p><a href="#" className="text-muted text-decoration-none">NRI demat account</a></p>
                                <p><a href="#" className="text-muted text-decoration-none">HUF demat account</a></p>
                                <p><a href="#" className="text-muted text-decoration-none">Commodity</a></p>
                                <p><a href="#" className="text-muted text-decoration-none">Dematerialisation</a></p>
                                <p><a href="#" className="text-muted text-decoration-none">Fund transfer</a></p>
                                <p><a href="#" className="text-muted text-decoration-none">MTF</a></p>
                            </div>
                            <div className="col-6 col-md-3 mb-4 gap-2 px-3">
                                <h5 className="fw-semibold mb-3" style={{ color: "var(--secondary-color)" }}>Support</h5>
                                <p><a href="#" className="text-muted text-decoration-none">Contact us</a></p>
                                <p><a href="#" className="text-muted text-decoration-none">Support portal</a></p>
                                <p><a href="#" className="text-muted text-decoration-none">How to file a complaint?</a></p>
                                <p><a href="#" className="text-muted text-decoration-none">Status of your complaints</a></p>
                                <p><a href="#" className="text-muted text-decoration-none">Bulletin</a></p>
                                <p><a href="#" className="text-muted text-decoration-none">Circular</a></p>
                                <p><a href="#" className="text-muted text-decoration-none">Z-Connect blog</a></p>
                                <p><a href="#" className="text-muted text-decoration-none">Downloads</a></p>
                            </div>
                            <div className="col-6 col-md-3 mb-2 gap-2 px-3">
                                <h5 className="fw-semibold mb-3" style={{ color: "var(--secondary-color)" }}>Company</h5>
                                <p><a href="#" className="text-muted text-decoration-none">About</a></p>
                                <p><a href="#" className="text-muted text-decoration-none">Philosophy</a></p>
                                <p><a href="#" className="text-muted text-decoration-none">Press & media</a></p>
                                <p><a href="#" className="text-muted text-decoration-none">Careers</a></p>
                                <p><a href="#" className="text-muted text-decoration-none">Zerodha Cares (CSR)</a></p>
                                <p><a href="#" className="text-muted text-decoration-none">Zerodha.tech</a></p>
                                <p><a href="#" className="text-muted text-decoration-none">Open source</a></p>
                                <p><a href="#" className="text-muted text-decoration-none">Referral program</a></p>

                            </div>
                            <div className="col-6 col-md-3 mb-0 gap-2 px-3">
                                <h5 className="fw-semibold mb-3" style={{ color: "var(--secondary-color)" }}>Quick links</h5>
                                <p><a href="#" className="text-muted text-decoration-none">Upcoming IPOs</a></p>
                                <p><a href="#" className="text-muted text-decoration-none">Brokerage charges</a></p>
                                <p><a href="#" className="text-muted text-decoration-none">Market holidays</a></p>
                                <p><a href="#" className="text-muted text-decoration-none">Economic calendar</a></p>
                                <p><a href="#" className="text-muted text-decoration-none">Calculators</a></p>
                                <p><a href="#" className="text-muted text-decoration-none">Markets</a></p>
                                <p><a href="#" className="text-muted text-decoration-none">Sectors</a></p>
                                <p><a href="#" className="text-muted text-decoration-none">Gift Nifty</a></p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className=" container" style={{ fontSize: "0.75rem", color: "#9B9B9B" }}>
                    <p>Zerodha Broking Ltd.: Member of NSE, BSE, MCX & MSEI – SEBI Registration no.: INZ000031633 CDSL/NSDL: Depository services through Zerodha Broking Ltd. – SEBI Registration no.: IN-DP-431-2019 Registered Address: Zerodha Broking Ltd., #153/154, 4th Cross, Dollars Colony, Opp. Clarence Public School, J.P Nagar 4th Phase, Bengaluru - 560078, Karnataka, India. For any complaints pertaining to securities broking please write to <a href="" className="text-decoration-none">complaints@zerodha.com</a>, for DP related to <a href="" className="text-decoration-none">dp@zerodha.com</a>. Please ensure you carefully read the Risk Disclosure Document as prescribed by SEBI | ICF</p>

                    <p>Procedure to file a complaint on <a href="" className="text-decoration-none ">SEBI SCORES/SMARTODR</a>: Register on SCORES portal & SMARTODR. Mandatory details for filing complaints on SCORES: Name, PAN, Address, Mobile Number, E-mail ID. Benefits: Effective Communication, Speedy redressal of grievances</p>

                    <p><a href="" className="text-decoration-none ">Smart Online Dispute Resolution</a> | <a href="" className="text-decoration-none ">Grievances Redressal Mechanism</a></p>

                    <p>Investments in securities market are subject to market risks; read all the related documents carefully before investing.</p>

                    <p>Attention investors: 1) Stock brokers can accept securities as margins from clients only by way of pledge in the depository system w.e.f September 01, 2020. 2) Update your e-mail and phone number with your stock broker / depository participant and receive OTP directly from depository on your e-mail and/or mobile number to create pledge. 3) Check your securities / MF / bonds in the consolidated account statement issued by NSDL/CDSL every month.</p>

                    <p>India's largest broker based on networth as per NSE. <a href="" className="text-decoration-none">NSE broker factsheet</a></p>

                    <p>Prevent unauthorised transactions in your account. Update your mobile numbers/email IDs with your stock brokers/depository participants. Receive information of your transactions directly from Exchange/Depositories on your mobile/email at the end of the day. Issued in the interest of investors. KYC is one time exercise while dealing in securities markets - once KYC is done through a SEBI registered intermediary (broker, DP, Mutual Fund etc.), you need not undergo the same process again when you approach another intermediary." Dear Investor, if you are subscribing to an IPO, there is no need to issue a cheque. Please write the Bank account number and sign the IPO application form to authorize your bank to make payment in case of allotment. In case of non allotment the funds will remain in your bank account. As a business we don't give stock tips, and have not authorized anyone to trade on behalf of others. If you find anyone claiming to be part of Zerodha and offering such services, please <a className="text-decoration-none" href="">create a ticket here.</a></p>

                    <p>Customers availing insurance advisory services offered by Ditto (Tacterial Consulting Private Limited | IRDAI Registered Corporate Agent (Composite) License No CA0738) will not have access to the exchange investor grievance redressal forum, SEBI SCORES/ODR, or arbitration mechanism for such products.</p>

                    <p>Fixed deposit products offered on this platform are third-party products (TPP) and are not Exchange traded products. These are offered through Blostem Fintech Private Limited. Zerodha Broking Limited (SEBI Registration No.: INZ000031633) is acting solely as a distributor for these products. Any disputes arising with respect to such distribution activity will not have access to SEBI SCORES/ODR, Exchange Investor Grievance Redressal Forum, or Arbitration mechanism. Fixed deposits are regulated by the Reserve Bank of India (RBI).</p>
                </div>
                <div className=" d-flex flex-wrap justify-content-center justify-content-md-between gap-3 text-muted pt-3 border-top mt-3 px-5 mb-4" style={{ fontSize: "12px" }}>
                    <a href="" className="text-decoration-none text-muted">NSE</a>
                    <a href="" className="text-decoration-none text-muted">BSE</a>
                    <a href="" className="text-decoration-none text-muted">MCX</a>
                    <a href="" className="text-decoration-none text-muted">MSEI</a>
                    <a href="" className="text-decoration-none text-muted">Terms & conditions</a>
                    <a href="" className="text-decoration-none text-muted">Policies & procedures</a>
                    <a href="" className="text-decoration-none text-muted">Privacy policy</a>
                    <a href="" className="text-decoration-none text-muted">Disclosure</a>
                    <a href="" className="text-decoration-none text-muted">For investor's attention</a>
                    <a href="" className="text-decoration-none text-muted">Investor charter</a>
                    <a href="" className="text-decoration-none text-muted">Sitemap</a>

                </div>
            </div>
        </footer>
    );
}