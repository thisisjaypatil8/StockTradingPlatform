import Hero from "./Hero";
import Brokerage from "./Brokerage";
import OpenAccount from "../OpenAccount";
import Footer from "../Footer";
import Navbar from "../Navbar";

export default function PricingPage() {
    return (
        <>
            <Navbar />
            <Hero />
            <Brokerage />
            <OpenAccount />
            <Footer />
        </>
    );
}