import Hero from "./Hero";
import Awards from "./Awards";
import Stats from "./Stats";
import Pricing from "./Pricing";
import Education from "./Education";
import OpenAccount from "../OpenAccount";

import KiteStrip from "./KiteStrip";
export default function HomePage() {
    return (
        <>

            <Hero />
            <Awards />
            <Stats />
            <KiteStrip/>
            <Pricing />
            <Education />
            <OpenAccount/>

        </>
    );
}