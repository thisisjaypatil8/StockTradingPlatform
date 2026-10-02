const { roundPaise } = require("./money");

function applyFill(currentPos, fill) {
    const { netQty: oldNet, avgPaise: oldAvg } = currentPos;
    const { side, qty, pricePaise } = fill;

    if (!qty || qty <= 0 || !Number.isInteger(qty)) {
        throw new Error("Fill quantity must be a positive integer!");
    }
    if (!pricePaise || pricePaise <= 0 || !Number.isInteger(pricePaise)) {
        throw new Error("Fill price in paise must be a positive integer!");
    }

    const fillDelta = side === "BUY" ? qty : -qty;
    const newNet = oldNet + fillDelta;

    // Case 1: Opening or adding to an existing position in the SAME direction
    // (Both long, both short, or from flat)
    const isAdding = (oldNet === 0) || (Math.sign(oldNet) === Math.sign(fillDelta));

    if (isAdding) {
        const oldCostPaise = Math.abs(oldNet) * oldAvg;
        const addCostPaise = qty * pricePaise;
        const totalQty = Math.abs(newNet);
        const newAvg = totalQty === 0 ? 0 : roundPaise((oldCostPaise + addCostPaise) / totalQty);

        return {
            newNetQty: newNet,
            newAvgPaise: newAvg,
            realizedDeltaPaise: 0,
        };
    }

    // Case 2: Closing or reducing an existing position (Opposite direction)
    const isLong = oldNet > 0;
    const closedQty = Math.min(Math.abs(oldNet), qty);

    // Long closed by SELL: (sellPrice - avg) * qty
    // Short covered by BUY: (avg - buyPrice) * qty
    const perSharePnL = isLong ? (pricePaise - oldAvg) : (oldAvg - pricePaise);
    const realizedDeltaPaise = closedQty * perSharePnL;

    if (newNet === 0) {
        // Closed to flat -> reset average to 0 (Prevents contamination!)
        return {
            newNetQty: 0,
            newAvgPaise: 0,
            realizedDeltaPaise,
        };
    }

    if (Math.sign(newNet) === Math.sign(oldNet)) {
        // Partial reduce without flip -> Average cost remains unchanged!
        return {
            newNetQty: newNet,
            newAvgPaise: oldAvg,
            realizedDeltaPaise,
        };
    }

    // Case 3: Complete Flip (e.g. Long 10 -> Sell 15 -> Short 5)
    // New flipped position takes the fill price as its clean average!
    return {
        newNetQty: newNet,
        newAvgPaise: pricePaise,
        realizedDeltaPaise,
    };
}

module.exports = {
    applyFill,
};
