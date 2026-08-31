import { Link } from "react-router-dom";
export default function Navbar() {
    return (
        <nav className="border-bottom" style={{position:"sticky", top:"0", zIndex:"1000", backgroundColor:"#FBFBFB"}}>
        <div className="container d-flex align-items-center justify-content-between py-4 ">
           
               <Link to="/"> <img src="media/images/logo.svg" alt="logo" style={{maxWidth:"120px" , width:"100%"}} className="mx-4 mx-md-0" /></Link>
          
           <div className="d-flex gap-5 fs-6 align-items-center justify-content-around">
                <Link to="/signup" className="text-muted text-decoration-none d-none d-md-block">Signup</Link>
                <Link to="/about" className="text-muted text-decoration-none d-none d-md-block">About</Link>
                <Link to="/products" className="text-muted text-decoration-none d-none d-md-block">Products</Link>
                <Link to="/pricing" className="text-muted text-decoration-none d-none d-md-block">Pricing</Link>
                <Link to="/support" className="text-muted text-decoration-none d-none d-md-block">Support</Link>
           
            <a href="" className="text-muted text-decoration-none "><i className="fa-solid fa-bars fs-5 mx-md-2 mx-4"></i></a>
           </div>
        </div>
        </nav>
    );
}