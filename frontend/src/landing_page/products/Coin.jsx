export default function Coin() {
    return (
        <div className="container">
            <div className="row mb-md-5 mb-3 mt-md-5 mt-5">
                <div className="col-12 col-md-8 px-md-5 px-4">
                    <img src="media/images/products-kite.png" alt="" className="img-fluid" />
                </div>
                <div className="col-12 col-md-4 align-self-center px-md-4 px-3">
                    <h2 className="mt-3">Coin</h2>
                    <p className="para">Buy direct mutual funds online, commission-free, delivered directly to your Demat account. Enjoy the investment experience on your Android and iOS devices.</p>
                    <div className="d-flex gap-3 mt-3">
                        <a href="" className="text-decoration-none"><i className="fas fa-long-arrow-right"></i> Coin</a>

                    </div>
                    <div className="d-flex gap-3 mt-3">
                        <a href=""><img src="media/images/appstore-badge.svg" className="img-fluid" width="140" height="45" alt="" /></a>
                        <a href=""><img src="media/images/google-play-badge.svg" className="img-fluid" width="140" height="45" alt="" /></a>
                    </div>
                </div>
            </div>
        </div>
    );
}