import Navbar from "../Navbar";
import Footer from "../Footer";
import Hero from "./Hero";
import LeftSection from "./LeftSection";
import RightSection from "./RightSection";
import Universe from "./Universe";
import OpenAccount from "../OpenAccount";

export default function ProductsPage() {
    return (
        <>
            <Navbar />
            <Hero />
            <LeftSection />
            <RightSection />
            <Universe />
            <OpenAccount />
            <Footer />
        </>
    );
}