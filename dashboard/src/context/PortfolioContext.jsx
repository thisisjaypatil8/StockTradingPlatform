import { createContext, useContext, useState, useEffect } from "react";
import API from "../api";
import { fetchBatchQuotes } from "../utils/marketQuotes";

const PortfolioContext = createContext();

export const PortfolioProvider = ({ children }) => {

    const [allHoldings, setAllHoldings] = useState([]);
    const [funds, setFunds] = useState({ availableCash: 100000 });
    const [loading, setLoading] = useState(true);

    const applyFundsUpdate = data => {
        if(data && data.availableCash !== undefined){
            setFunds({
                availableCash: Number(data.availableCash) || 0,
                totalDeposited: Number(data.totalDeposited) || 0,
                totalWithdrawn: Number(data.totalWithdrawn) || 0,
                lifetimeRealizedPnL: Number(data.lifetimeRealizedPnL) || 0,
            });
        }
    };

    const fetchFunds = async () => {
        try {
            const res = await API.get("/funds");
            applyFundsUpdate(res.data);
        } catch (err) {
            console.error("Failed to fetch funds", err);
        }
    };

    const addFunds = async (amount) => {
        const res = await API.post("/funds/add", { amount });
        applyFundsUpdate(res.data);
        return res.data;
    };

    const withdrawFunds = async (amount) => {
        const res = await API.post("/funds/withdraw", { amount });
        applyFundsUpdate(res.data);
        return res.data;
    };

    const fetchPortfolio = async () => {
        try {
            const res = await API.get("/allHoldings");
            const holdingsData = res.data || [];

            if (holdingsData.length === 0) {
                setAllHoldings([]);
                setLoading(false);
                return;
            }

            // Single batched quotes fetch (eliminates N+1 waterfall)
            const quoteMap = await fetchBatchQuotes(holdingsData);

            // Attach latest LTP data
            const enrichedHoldings = holdingsData.map((stock) => {
                const live = quoteMap[stock.name.toUpperCase()] || quoteMap[stock.name];
                if (!live) return stock;

                const livePrice = Number(live.price) || stock.price;
                const prevClose = Number(live.previousClose) || livePrice;
                const netChangePct = stock.avg > 0 ? (((livePrice - stock.avg) / stock.avg) * 100).toFixed(2) : "0.00";

                return {
                    ...stock,
                    price: livePrice,
                    previousClose: prevClose,
                    day: live.percent || stock.day,
                    net: `${Number(netChangePct) >= 0 ? "+" : ""}${netChangePct}%`,
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
    }, []);

    return (
        <PortfolioContext.Provider
            value={{
                allHoldings,
                funds,
                loading,
                refreshPortfolio: fetchPortfolio,
                refreshFunds: fetchFunds,
                addFunds,
                withdrawFunds,
            }}
        >
            {children}

        </PortfolioContext.Provider>
    );

};

/**
 * Hook to consume real-time portfolio metrics, balances, and positions.
 */
export const usePortfolio = () => {
    const context = useContext(PortfolioContext);
    if (!context) {
        throw new Error("usePortfolio must be used within a PortfolioProvider");
    }
    return context;
}
