import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
export default function Hero() {
    const { isLoggedIn, dashboardUrl } = useAuth();

    return (
        <>
            <div>
                <div className="container py-4 py-md-5 my-md-4">

                    <div className="row justify-content-center text-center">
                        <img src="media/images/homeHero.svg" alt="homeHero" className="img-fluid mb-4 mb-md-5" style={{ maxWidth: "600px", width: "100%" }} />
                        <h1 className="mt-3 fs-2 fw-bold">
                            Invest in everything
                        </h1>
                        <p className="text-muted fs-5">Online platform to invest and trade stocks, bonds, currencies, commodities, and cryptocurrencies</p>

                        {isLoggedIn ? (
                            <a href={dashboardUrl}
                                className='btn px-4 py-2 mt-3 text-white fw-semibold fs-5 text-decoration-none shadow-sm'
                                style={{ backgroundColor: "#387ED1", minWidth:"220px", width:"fit-content", margin:"0 auto"}}
                            >Go to Dashboard <i className='fa-solid fa-arrow-right ms-2 fs-6'></i></a>

                        ) : (
                            <Link to="/signup"
                                className="btn px-4 py-2 mt-3 text-white fw-semibold fs-5" style={{ minWidth: "220px", width: "fit-content", margin: "0 auto", backgroundColor: "#387ED1" }}>
                                Sign up for free</Link>
                        )}

                    </div>
                </div>
            </div>
        </>
    );
}