/**
 * portfolioMath.js — Canonical Institutional Financial Math Module
 *
 * Core Accounting Invariant:
 *   Account Equity (E_t) = Cash + Margin Blocked + CNC Market Value + MIS Unrealized
 *   Net External Capital (F_t) = Gross Deposits - Gross Withdrawals
 *   Cumulative P&L (P_t) = Account Equity - Net External Capital
 *
 * Precision Rule:
 *   Calculations maintain full IEEE-754 precision without intermediate .toFixed()
 */

export const calculateAccountMetrics = ({
    cash = 0,
    holdings = [],
    positions = [],
    grossDeposited = 0,
    grossWithdrawn = 0,
}) => {
    const availableCash = Number(cash) || 0;
    const grossDep = Number(grossDeposited) || 0;
    const grossWith = Number(grossWithdrawn) || 0;
    const netExternalCapital = grossDep - grossWith;

    // 1. CNC Holdings Pass
    let cncCostBasis = 0;
    let cncMarketValue = 0;
    let cncDayPnL = 0;

    holdings.forEach((stock) => {
        const qty = Number(stock.qty) || 0;
        const avg = Number(stock.avg || stock.avgPrice) || 0;
        const ltp = Number(stock.price) || 0;
        const prevClose = Number(stock.previousClose) || ltp;

        cncCostBasis += qty * avg;
        cncMarketValue += qty * ltp;
        cncDayPnL += qty * (ltp - prevClose);
    });

    const cncUnrealizedPnL = cncMarketValue - cncCostBasis;

    // 2. MIS Positions Pass (Signed Branch-Free Formula)
    let misRealizedPnL = 0;
    let misUnrealizedPnL = 0;
    let totalMarginBlocked = 0;

    positions.forEach((stock) => {
        const net = stock.netQty !== undefined ? Number(stock.netQty) : (Number(stock.qty) || 0);
        const avg = Number(stock.avgEntry ?? stock.avg ?? 0);
        const ltp = Number(stock.price) || 0;
        const realized = Number(stock.realizedPnL) || 0;
        const marginBlocked = Number(stock.marginBlocked) || (Math.abs(net) * avg) / 5;

        // Signed formula handles Long (net > 0) & Short (net < 0) automatically:
        const unrealized = (ltp - avg) * net;

        misRealizedPnL += realized;
        misUnrealizedPnL += unrealized;
        totalMarginBlocked += marginBlocked;
    });

    // 3. Account Equity (Net Liquidation Value)
    // Cash already holds realized profits/losses; unrealized is floating
    const equity = availableCash + cncMarketValue + misUnrealizedPnL;

    // 4. Cumulative P&L (True Profit Created)
    const cumulativePnL = equity - netExternalCapital;

    // 5. Crash-Proof Lifetime Return % (Bound denominator to gross capital)
    const lifetimeReturnPct = grossDep > 0 ? (cumulativePnL / grossDep) * 100 : 0;

    // 6. Day P&L Separation
    const positionsDayPnL = misRealizedPnL + misUnrealizedPnL;
    const holdingsDayPnL = cncDayPnL;
    const totalDayPnL = positionsDayPnL + holdingsDayPnL;

    return {
        // External Flows
        grossDeposited: grossDep,
        grossWithdrawn: grossWith,
        netExternalCapital,

        // Balances & Values
        availableCash,
        marginBlocked: totalMarginBlocked,
        cncCostBasis,
        cncMarketValue,
        cncUnrealizedPnL,
        cncDayPnL: holdingsDayPnL,
        holdingsDayPnL,

        // MIS Metrics
        misRealizedPnL,
        misUnrealizedPnL,
        positionsDayPnL,

        // High-Level Syntheses
        equity,
        cumulativePnL,
        lifetimeReturnPct,
        unifiedDayPnL: totalDayPnL,
        totalDayPnL,
        isProfit: cumulativePnL >= 0,
        isDayProfit: totalDayPnL >= 0,
        isPositionsDayProfit: positionsDayPnL >= 0,
    };
};

export const calculateIntradayPositionMetrics = (stock) => {
    const net = stock.netQty !== undefined ? Number(stock.netQty) : (Number(stock.qty) || 0);
    const realized = Number(stock.realizedPnL || 0);
    const ltp = Number(stock.price) || 0;
    const avg = Number(stock.avgEntry ?? stock.avg ?? 0);

    // Signed branch-free unrealized P&L
    const unrealized = (ltp - avg) * net;
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

export const formatK = (val) => {
    if (val === undefined || val === null || isNaN(val)) return "0.00";
    const absVal = Math.abs(val);
    if (absVal >= 1000) {
        return (val / 1000).toFixed(2) + "k";
    }
    return Number(val).toFixed(2);
};

export const formatCurrency = val => {
    if (val === undefined || val === null || isNaN(val)) return "₹0.00";
    const num = Number(val);
    return `₹${num.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
};


export const formatPnL = val => {
    if(val === undefined || val === null || isNaN(val)) return "₹0.00";
    const num = Number(val);
    const sign = num > 0 ? "+" : num < 0 ? "-" : "";
    return `₹${sign}${Math.abs(num).toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
};