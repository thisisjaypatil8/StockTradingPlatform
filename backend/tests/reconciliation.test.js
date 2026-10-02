const { test, describe } = require("node:test");
const assert = require("node:assert");
const { applyFill } = require("../domain/fills");
const { toPaise, toRupees } = require("../domain/money");

describe("Accounting & Double-Entry Invariant Reconciliation", () => {
    test("Equity Invariant: Equity = Cash + Margin + CNC Market Value + MIS Unrealized", () => {
        const initialDeposit = 100000;
        let cash = initialDeposit;
        const externalCapital = initialDeposit;

        // 1. Simulate Buy 10 @ 100 CNC
        const cncQty = 10;
        const cncAvg = 100;
        cash -= cncQty * cncAvg; // cash = 99,000

        // 2. Simulate MIS Long 10 @ 50 (5x leverage -> 20% margin blocked)
        const misFill = applyFill({ netQty: 0, avgPaise: 0 }, { side: "BUY", qty: 10, pricePaise: toPaise(50) });
        const misQty = misFill.newNetQty;
        const misAvgRupees = toRupees(misFill.newAvgPaise);
        const marginBlocked = (misQty * misAvgRupees) / 5; // ₹100
        cash -= marginBlocked; // cash = 98,900

        // 3. Market moves: CNC LTP = 120, MIS LTP = 60
        const cncLtp = 120;
        const misLtp = 60;

        const cncMarketVal = cncQty * cncLtp; // 10 * 120 = 1200
        const cncUnrealized = cncMarketVal - (cncQty * cncAvg); // 1200 - 1000 = +200
        const misUnrealized = (misLtp - misAvgRupees) * misQty; // (60 - 50) * 10 = +100

        // Invariant: Account Equity (Net Liquidation Value)
        const accountEquity = cash + marginBlocked + cncMarketVal + misUnrealized;

        // Invariant: Cumulative P&L = Account Equity - External Capital
        const cumulativePnL = accountEquity - externalCapital;

        assert.strictEqual(accountEquity, 100300);
        assert.strictEqual(cumulativePnL, 300);
        assert.strictEqual(cumulativePnL, cncUnrealized + misUnrealized);
    });
});
