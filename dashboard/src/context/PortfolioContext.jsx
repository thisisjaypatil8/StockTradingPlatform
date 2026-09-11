import { createContext, useContext, useState, useEffect } from "react";
import API from "../api";

const PortfolioContext = createContext();

export const PortfolioProvider = ({children}) => {

    const [allHoldings, setAllHoldings] = useState([]);
    const [funds, setFunds] = useState({ availableCash: 100000});
    const [loading, setLoading] = useState(true);

    //1. Fetch live wallet balance from backend
    const fetchFunds = async () => {
        try {
            const res = await API.get("/funds");
            if(res.data && res.data.availableCash !== undefined){
                setFunds({ availableCash: res.data.availableCash});
            }
        } catch (err) {
            console.error("Failed to fetch funds", err);
        }
    };

    //2. add funds action
    const addFunds = async (amount) => {
        const res = await API.post("/funds/add", {amount});
        if(res.data && res.data.availableCash != undefined){
            setFunds({ availableCash: res.data.availableCash});
        }
        return res.data;
        
    }

    // 3. Withdraw funds action
    const withdrawFunds = async (amount) => {
        try {
            const res = await API.post("/funds/withdraw", {amount});

            if(res.data && res.data.availableCash != undefined){
                setFunds({ availableCash: res.data.availableCash });
            }
            return res.data;
        } catch (err) {
            throw err;
        }
    };
    
    //4. fetch holdings + live CMP
    const fetchPortfolio = async () => {
        try {
            const res = await API.get("/allHoldings");
            const holdingsData = res.data || [];

            if(holdingsData.length === 0){
                setAllHoldings([]);
                setLoading(false);
                return;
            }

            // Parallel live quotes fetch (backend cache se 0ms me aayega!)
            const quotePromises = holdingsData.map((stock) => 
                API.get(`/market/quote/${stock.name}`)
                .then((qRes) => ({ name: stock.name, quote:qRes.data}))
                .catch(() => ({ name: stock.name, quote: null}))
            );

            const results = await Promise.allSettled(quotePromises);

            const quoteMap = {};
            results.forEach((r) => {
                if(r.status === "fulfilled" && r.value?.quote){
                    quoteMap[r.value.name] = r.value.quote;
                }
            });

            // Attach latest LTP data
            const enrichedHoldings = holdingsData.map((stock) =>{
                const live = quoteMap[stock.name];
                if(!live) return stock;

                const livePrice = Number(live.price) || stock.price;
                const netChangePct = stock.avg > 0 ? (((livePrice - stock.avg)/ stock.avg) * 100).toFixed(2) : "0.00";

                return {
                    ...stock, 
                    price: livePrice,
                    day: live.percent || stock.day,
                    net:`${Number(netChangePct) >= 0 ? "+" : ""}${netChangePct}%`,
                    isLoss: live.isLoss != undefined ? live.isLoss : stock.isLoss,
                };
            });

            setAllHoldings(enrichedHoldings);
            setLoading(false);
        } catch (err) {
            console.error("Portfolio fetch failed: ", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPortfolio();
        fetchFunds();
    },[]);

    return (
        <PortfolioContext.Provider
         value={{
            allHoldings,
            funds,
            loading,
            refreshPortfolio:fetchPortfolio,
            refreshFunds: fetchFunds,
            addFunds,
            withdrawFunds,
         }}
        >
            {children}

        </PortfolioContext.Provider>
    );
    
};

// Custom hook for components
export const usePortfolio = () => {
    const context = useContext(PortfolioContext);
    if(!context){
        throw new Error("usePortfolio must be used within a PortfolioProvider");
    }
    return context;
}
