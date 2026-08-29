export default function Navbar() {
    return (
        <nav className="border-bottom" style={{position:"sticky", top:"0", zIndex:"1000", backgroundColor:"#FBFBFB"}}>
        <div className="container d-flex align-items-center justify-content-between py-4 ">
           
                <img src="media/images/logo.svg" alt="logo" style={{maxWidth:"120px" , width:"100%"}} className="mx-4 mx-md-0" />
          
           <div className="d-flex gap-5 fs-6 align-items-center justify-content-around">
                <a href="" className="text-muted text-decoration-none d-none d-md-block">Signup</a>
                <a href="" className="text-muted text-decoration-none d-none d-md-block">About</a>
                <a href="" className="text-muted text-decoration-none d-none d-md-block">Products</a>
                <a href="" className="text-muted text-decoration-none d-none d-md-block">Pricing</a>
                <a href="" className="text-muted text-decoration-none d-none d-md-block">Support</a>
           
            <a href="" className="text-muted text-decoration-none "><i className="fa-solid fa-bars fs-5 mx-md-2 mx-4"></i></a>
           </div>
        </div>
        </nav>
    );
}