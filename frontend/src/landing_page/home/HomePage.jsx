import Hero from "./Hero";
import Awards from "./Awards";
import Stats from "./Stats";
import Pricing from "./Pricing";
import Education from "./Education";
import OpenAccount from "../OpenAccount";
import Footer from "../Footer";
import Navbar from "../Navbar";
import KiteStrip from "./KiteStrip";
export default function HomePage() {
    return (
        <>
            <Navbar />
            <Hero />
            <Awards />
            <Stats />
            <KiteStrip/>
            <Pricing />
            <Education />
            <OpenAccount/>
            <Footer/>
        </>
    );
}