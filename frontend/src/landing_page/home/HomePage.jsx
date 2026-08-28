import Hero from "./Hero";
import Award from "./Award";
import Stats from "./Stats";
import Pricing from "./Pricing";
import Education from "./Education";
import OpenAccount from "../OpenAccount";
import Footer from "../Footer";
import Navbar from "../Navbar";
export default function HomePage() {
    return (
        <>
            <Navbar />
            <Hero />
            <Award />
            <Stats />
            <Pricing />
            <Education />
            <OpenAccount/>
            <Footer/>
        </>
    );
}