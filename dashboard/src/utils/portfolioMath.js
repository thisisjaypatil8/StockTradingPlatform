export const calculatePortfolioMetrics = (allHoldings = [], availableCash = 100000) => {
    let totalInvestment = 0;
    let totalCurrentValue = 0;

    allHoldings.forEach(stock => {
        totalInvestment += (Number(stock.qty) || 0) * (Number(stock.avg || stock.avgPrice) || 0);
        totalCurrentValue += (Number(stock.qty) || 0) * (Number(stock.price) || 0);
    });

    const totalPnL = totalCurrentValue - totalInvestment;
    const pnlPercentage = totalInvestment > 0 ? (totalPnL / totalInvestment * 100).toFixed(2) : "0.00";

    const usedMargin = totalInvestment;
    const availableMargin = Number(availableCash) || 0;
    const openingBalance = availableMargin + usedMargin;

    return {
        totalInvestment,
        totalCurrentValue,
        totalPnL,
        pnlPercentage,
        isProfit: totalPnL >= 0,
        isOverallProfit: totalPnL >= 0,
        isoverallProfit: totalPnL >= 0,
        openingBalance,
        OpeningBalance: openingBalance,
        usedMargin,
        marginsUsed: usedMargin,
        availableMargin,
        marginAvailable: availableMargin,
    }
}
export const formatK = (val) => {
    if (val === undefined || val === null || isNaN(val)) return "0.00";
    const absVal = Math.abs(val);
    if (absVal >= 1000) {
        return (val / 1000).toFixed(2) + "k";
    }
    return Number(val).toFixed(2);
}


export const calculateIntradayPositionMetrics = (stock) => {
    const net = stock.netQty !== undefined ? stock.netQty : (stock.qty || 0);
    const realized = Number(stock.realizedPnL || 0);
    const ltp = Number(stock.price) || 0;
    const avg = Number(stock.avg) || 0;

    let unrealized = 0;
    if (net > 0) {
        // Long Position: (LTP - Buy Avg) * Net Qty
        const buyAvg = Number(stock.buyAvg) || avg;
        unrealized = (ltp - buyAvg) * net;
    } else if (net < 0) {
        // Short Position: (Sell Avg - LTP) * Abs(Net Qty)
        const sellAvg = Number(stock.sellAvg) || avg;
        unrealized = (sellAvg - ltp) * Math.abs(net);
    }

    const totalPnL = realized + unrealized;

    return {
        net,
        realized,
        unrealized,
        totalPnL,
        isLong: net > 0,
        isShort: net < 0,
        isClosed: net === 0,
    };
};

export const calculateTotalIntradayMetrics = (positions = []) => {
    let totalRealized = 0;
    let totalUnrealized = 0;

    positions.forEach((stock) => {
        const metrics = calculateIntradayPositionMetrics(stock);
        totalRealized += metrics.realized;
        totalUnrealized += metrics.unrealized;

    });

    return {
        totalRealized,
        totalUnrealized,
        totalDayPnL: totalRealized + totalUnrealized,
    };
};