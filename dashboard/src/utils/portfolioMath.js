export const calculatePortfolioMetrics = (allHoldings = []) => {
    let totalInvestment = 0;
    let totalCurrentValue = 0;

    allHoldings.forEach(stock => {
        totalInvestment += (Number(stock.qty) || 0) * (Number(stock.avg || stock.avgPrice) || 0);
        totalCurrentValue += (Number(stock.qty) || 0) * (Number(stock.price) || 0);
    });

    const totalPnL = totalCurrentValue - totalInvestment;
    const pnlPercentage = totalInvestment > 0 ? (totalPnL / totalInvestment * 100).toFixed(2) : "0.00";

    const openingBalance = 100000;
    const usedMargin = totalInvestment;
    const availableMargin = Math.max(0, openingBalance - usedMargin);

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