const { test, describe } = require("node:test");
const assert = require("node:assert");
const { applyFill } = require("../domain/fills");
const { toPaise, toRupees } = require("../domain/money");

describe("Institutional Fills & Weighted Average Engine", () => {
    test("Vector 1: Buy 10 @ 100, Sell 10 @ 110 -> Flat, Realized ₹100, Avg 0", () => {
        // Step 1: Open Long 10 @ 100.00 (10000 paise)
        const pos1 = applyFill({ netQty: 0, avgPaise: 0 }, { side: "BUY", qty: 10, pricePaise: 10000 });
        assert.strictEqual(pos1.newNetQty, 10);
        assert.strictEqual(pos1.newAvgPaise, 10000);
        assert.strictEqual(pos1.realizedDeltaPaise, 0);

        // Step 2: Close Long 10 @ 110.00 (11000 paise)
        const pos2 = applyFill(
            { netQty: pos1.newNetQty, avgPaise: pos1.newAvgPaise },
            { side: "SELL", qty: 10, pricePaise: 11000 }
        );
        assert.strictEqual(pos2.newNetQty, 0);
        assert.strictEqual(pos2.newAvgPaise, 0); // Must be flat!
        assert.strictEqual(toRupees(pos2.realizedDeltaPaise), 100.00);
    });

    test("Vector 2: Average Contamination Shield -> Reopen 5 @ 120 after flat", () => {
        const flatPos = { netQty: 0, avgPaise: 0 };
        const reopened = applyFill(flatPos, { side: "BUY", qty: 5, pricePaise: 12000 });
        assert.strictEqual(reopened.newNetQty, 5);
        assert.strictEqual(reopened.newAvgPaise, 12000); // Clean 120, zero memory of past 100 avg!
    });

    test("Vector 3: Position Flip Long -> Short in single fill (Long 10 @ 100, Sell 15 @ 110)", () => {
        const initial = { netQty: 10, avgPaise: 10000 };
        const flipped = applyFill(initial, { side: "SELL", qty: 15, pricePaise: 11000 });

        assert.strictEqual(flipped.newNetQty, -5); // Now Short 5
        assert.strictEqual(flipped.newAvgPaise, 11000); // Short entry price is fill price
        assert.strictEqual(toRupees(flipped.realizedDeltaPaise), 100.00); // 10 shares * (110 - 100)
    });

    test("Vector 4: Position Flip Short -> Long in single fill (Short 5 @ 110, Buy 8 @ 90)", () => {
        const initial = { netQty: -5, avgPaise: 11000 };
        const flipped = applyFill(initial, { side: "BUY", qty: 8, pricePaise: 9000 });

        assert.strictEqual(flipped.newNetQty, 3); // Now Long 3
        assert.strictEqual(flipped.newAvgPaise, 9000); // Long entry price is fill price
        assert.strictEqual(toRupees(flipped.realizedDeltaPaise), 100.00); // 5 shares * (110 - 90)
    });

    test("Vector 5: Partial Long Reduce (Long 20 @ 150, Sell 5 @ 180)", () => {
        const initial = { netQty: 20, avgPaise: 15000 };
        const reduced = applyFill(initial, { side: "SELL", qty: 5, pricePaise: 18000 });

        assert.strictEqual(reduced.newNetQty, 15);
        assert.strictEqual(reduced.newAvgPaise, 15000); // Avg must NOT change on partial reduce!
        assert.strictEqual(toRupees(reduced.realizedDeltaPaise), 150.00); // 5 * (180 - 150)
    });

    test("Vector 6: Paise Precision Trap (Buy 3 @ 10.10, Buy 1 @ 10.20)", () => {
        // 3 * 1010 + 1 * 1020 = 3030 + 1020 = 4050 paise.
        // 4050 / 4 = 1012.5 paise -> rounds to 1013 paise (₹10.13)
        const pos1 = applyFill({ netQty: 0, avgPaise: 0 }, { side: "BUY", qty: 3, pricePaise: toPaise(10.10) });
        const pos2 = applyFill(
            { netQty: pos1.newNetQty, avgPaise: pos1.newAvgPaise },
            { side: "BUY", qty: 1, pricePaise: toPaise(10.20) }
        );

        assert.strictEqual(pos2.newNetQty, 4);
        assert.strictEqual(pos2.newAvgPaise, 1013);
        assert.strictEqual(toRupees(pos2.newAvgPaise), 10.13);
    });

    test("Vector 7: Invalid Input Rejection", () => {
        assert.throws(() => {
            applyFill({ netQty: 0, avgPaise: 0 }, { side: "BUY", qty: 0, pricePaise: 1000 });
        }, /quantity must be a positive integer/);

        assert.throws(() => {
            applyFill({ netQty: 0, avgPaise: 0 }, { side: "BUY", qty: 1.5, pricePaise: 1000 });
        }, /quantity must be a positive integer/);
    });
});
