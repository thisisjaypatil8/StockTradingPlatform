export default function Kite() {
    return (
        <div className="container">
            <div className="row mb-md-5 mb-3 mt-md-5 mt-3">
                <div className="col-12 col-md-8 px-md-5 px-4">
                    <img src="media/images/products-kite.png" alt="" className="img-fluid" />
                </div>
                <div className="col-12 col-md-4 align-items-md-center align-self-center px-md-4 px-3">
                    <h2 className="mt-3">Kite</h2>
                    <p className="para">Our ultra-fast flagship trading platform with streaming market data, advanced charts, an elegant UI, and more. Enjoy the Kite experience seamlessly on your Android and iOS devices.</p>
                    <div className="d-flex gap-3 mt-3">
                        <a href="" className="text-decoration-none"><i className="fas fa-long-arrow-right"></i> Learn More</a>
                        <a href="" className="text-decoration-none"><i className="fas fa-long-arrow-right"></i> Try Demo</a>
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