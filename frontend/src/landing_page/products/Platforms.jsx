import Platform from "./Platform";

export default function Platforms() {
    const partners = [
        {
            imgUrl: "media/images/zerodhafundhouse.png",
            description: "Our asset management venture that is creating simple and transparent index funds to help you save for your goals."
        },
        {
            imgUrl: "media/images/sensibull-logo.svg",
            description: "Options trading platform that lets you create strategies, analyze positions, and examine data points like open interest, FII/DII, and more."
        },
        {
            imgUrl: "media/images/tijori.svg",
            description: "Investment research platform that offers detailed insights on stocks, sectors, supply chains, and more."
        },
        {
            imgUrl: "media/images/streak-logo.png",
            description: "Systematic trading platform that allows you to create and backtest strategies without coding."
        },
        {
            imgUrl: "media/images/smallcase-logo.png",
            description: "Thematic investing platform that helps you invest in diversified baskets of stocks on ETFs."
        },
        {
            imgUrl: "media/images/ditto-logo.png",
            description: "Personalized advice on life and health insurance. No spam and no mis-selling."
        }
    ];

    return (
        <div className="row justify-content-center mt-3 mx-md-4 mx-2">
            {partners.map((partner, index) => (
                <Platform
                    key={index}
                    imgUrl={partner.imgUrl}
                    description={partner.description}
                />
            ))}
        </div>
    );
}