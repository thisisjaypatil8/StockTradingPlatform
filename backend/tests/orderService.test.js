"use strict";

/**
 * orderService.test.js
 *
 * Business-logic tests for the order execution engine.
 *
 * What is covered:
 *   1.  CNC BUY — happy path (balance debited, holding created)
 *   2.  CNC BUY — average cost recalculated on second buy
 *   3.  CNC BUY — insufficient funds (throws, nothing mutated)
 *   4.  CNC SELL — insufficient holdings (throws, nothing mutated)
 *   5.  CNC SELL — partial position closure (qty reduced, cash credited, PnL correct)
 *   6.  CNC SELL — full position closure (holding document deleted)
 *   7.  Idempotency — duplicate idempotencyKey returns cached reply, balance unchanged
 *   8.  MIS BUY — margin locked correctly (1/5 of notional)
 *   9.  MIS SELL close — margin released, realizedPnL credited
 *   10. Transaction rollback — DB error mid-flight leaves no partial state
 *
 * Runtime: node:test (built-in, Node ≥ 18).  Run via: npm test
 *
 * Requires: mongodb-memory-server  — in-process replica set, supports sessions+transactions.
 * marketService is stubbed so tests never hit Yahoo Finance.
 */

const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");

// ─── Stub marketService BEFORE requiring orderService ────────────────────────
// Must intercept the module cache before the first require of orderService.

const FIXED_PRICE = 500; // ₹500 per share used across all tests

const marketServicePath = require.resolve("../services/marketService");
require.cache[marketServicePath] = {
    id: marketServicePath,
    filename: marketServicePath,
    loaded: true,
    exports: {
        getLiveMarketPrice: async () => FIXED_PRICE,
        getSingleQuote: async () => null,
        getBatchQuotes: async () => ({}),
        getCurrentStockPrice: async () => FIXED_PRICE,
        getHistory: async () => null,
        searchSymbols: async () => [],
        getMarketIndices: async () => ({}),
    },
};

const { executeOrder } = require("../services/orderService");
const { User, Orders, Holdings, Positions } = require("../models");

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function makeUser(cashOverride) {
    const uid = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const u = new User({
        email: `test_${uid}@sim.test`,
        username: `user_${uid}`,
        role: "user",
    });
    u.funds = {
        availableCash: cashOverride ?? 100_000,
        marginBlocked: 0,
        totalDeposited: cashOverride ?? 100_000,
        totalWithdrawn: 0,
        lifetimeRealizedPnL: 0,
    };
    await u.save();
    return u;
}

async function funds(userId) {
    const u = await User.findById(userId).lean();
    return u.funds;
}

function setStubPrice(price) {
    require.cache[marketServicePath].exports.getLiveMarketPrice = async () => price;
}
function resetStubPrice() {
    setStubPrice(FIXED_PRICE);
}

const r2 = (n) => Math.round(n * 100) / 100;

// ─── Suite setup ─────────────────────────────────────────────────────────────

let replset;

before(async () => {
    // Single-node replica set — supports sessions and multi-document transactions.
    replset = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    const uri = replset.getUri();
    await mongoose.connect(uri);
});

after(async () => {
    await mongoose.disconnect();
    await replset.stop();
});

beforeEach(async () => {
    resetStubPrice();
    await Promise.all([
        User.deleteMany({}),
        Orders.deleteMany({}),
        Holdings.deleteMany({}),
        Positions.deleteMany({}),
    ]);
});

// ─── 1. CNC BUY — happy path ─────────────────────────────────────────────────

describe("CNC BUY — happy path", () => {
    it("debits cash and creates a holding", async () => {
        const user = await makeUser();
        const qty = 10;
        const expectedCost = r2(qty * FIXED_PRICE); // 5 000

        const { executedOrder, settlement } = await executeOrder({
            userId: user._id,
            name: "RELIANCE",
            qty,
            price: FIXED_PRICE,
            mode: "BUY",
            product: "CNC",
            isSimulation: true,
        });

        assert.ok(executedOrder, "executedOrder should exist");
        assert.equal(executedOrder.name, "RELIANCE");
        assert.equal(executedOrder.qty, qty);
        assert.equal(executedOrder.mode, "BUY");

        const f = await funds(user._id);
        assert.equal(f.availableCash, 100_000 - expectedCost);

        const holding = await Holdings.findOne({ user: user._id, name: "RELIANCE" }).lean();
        assert.ok(holding, "holding document should exist");
        assert.equal(holding.qty, qty);
        assert.equal(holding.avg, FIXED_PRICE);

        assert.equal(settlement.cashDiff, -expectedCost);
    });

    it("adds to an existing holding and recalculates weighted average", async () => {
        const user = await makeUser();

        // First buy: 10 @ ₹500
        await executeOrder({
            userId: user._id, name: "TCS", qty: 10, price: FIXED_PRICE,
            mode: "BUY", product: "CNC", isSimulation: true,
        });

        // Second buy: 10 @ ₹600
        setStubPrice(600);
        await executeOrder({
            userId: user._id, name: "TCS", qty: 10, price: 600,
            mode: "BUY", product: "CNC", isSimulation: true,
        });
        resetStubPrice();

        const holding = await Holdings.findOne({ user: user._id, name: "TCS" }).lean();
        assert.equal(holding.qty, 20);
        // avg = (10×500 + 10×600) / 20 = 550
        assert.equal(holding.avg, 550);
    });
});

// ─── 2. CNC BUY — insufficient funds ─────────────────────────────────────────

describe("CNC BUY — insufficient funds", () => {
    it("throws 400 and leaves balance + holdings unchanged", async () => {
        const user = await makeUser(100); // only ₹100, need ₹5 000

        await assert.rejects(
            () => executeOrder({
                userId: user._id,
                name: "INFY",
                qty: 10,
                price: FIXED_PRICE,
                mode: "BUY",
                product: "CNC",
                isSimulation: true,
            }),
            (err) => {
                assert.equal(err.statusCode, 400, `expected statusCode 400, got ${err.statusCode}: ${err.message}`);
                assert.match(err.message, /Insufficient funds/i);
                return true;
            }
        );

        const f = await funds(user._id);
        assert.equal(f.availableCash, 100, "cash must not change after failed buy");

        const orderCount = await Orders.countDocuments({ user: user._id });
        assert.equal(orderCount, 0, "no order should be persisted");

        const holdingCount = await Holdings.countDocuments({ user: user._id });
        assert.equal(holdingCount, 0, "no holding should be created");
    });
});

// ─── 3. CNC SELL — insufficient holdings ─────────────────────────────────────

describe("CNC SELL — insufficient holdings", () => {
    it("throws 400 when selling more shares than owned", async () => {
        const user = await makeUser();

        await executeOrder({
            userId: user._id, name: "WIPRO", qty: 5, price: FIXED_PRICE,
            mode: "BUY", product: "CNC", isSimulation: true,
        });

        const cashAfterBuy = (await funds(user._id)).availableCash;

        await assert.rejects(
            () => executeOrder({
                userId: user._id, name: "WIPRO", qty: 10, price: FIXED_PRICE,
                mode: "SELL", product: "CNC", isSimulation: true,
            }),
            (err) => {
                assert.equal(err.statusCode, 400);
                assert.match(err.message, /Insufficient holdings/i);
                return true;
            }
        );

        const f = await funds(user._id);
        assert.equal(f.availableCash, cashAfterBuy, "cash must be unchanged after failed sell");

        const holding = await Holdings.findOne({ user: user._id, name: "WIPRO" }).lean();
        assert.ok(holding, "holding should still exist");
        assert.equal(holding.qty, 5);
    });
});

// ─── 4. CNC SELL — partial position closure ──────────────────────────────────

describe("CNC SELL — partial position closure", () => {
    it("reduces holding qty, credits cash, records correct realizedPnL", async () => {
        const user = await makeUser();

        // Buy 10 @ ₹500
        await executeOrder({
            userId: user._id, name: "HDFCBANK", qty: 10, price: 500,
            mode: "BUY", product: "CNC", isSimulation: true,
        });

        const cashAfterBuy = (await funds(user._id)).availableCash;

        // Sell 4 @ ₹600
        setStubPrice(600);
        const { settlement } = await executeOrder({
            userId: user._id, name: "HDFCBANK", qty: 4, price: 600,
            mode: "SELL", product: "CNC", isSimulation: true,
        });
        resetStubPrice();

        const f = await funds(user._id);
        assert.equal(r2(f.availableCash), r2(cashAfterBuy + 4 * 600));

        // realizedPnL = (600 − 500) × 4 = 400
        assert.equal(settlement.realizedPnL, 400);
        assert.equal(f.lifetimeRealizedPnL, 400);

        const holding = await Holdings.findOne({ user: user._id, name: "HDFCBANK" }).lean();
        assert.ok(holding);
        assert.equal(holding.qty, 6);
    });
});

// ─── 5. CNC SELL — full position closure ─────────────────────────────────────

describe("CNC SELL — full position closure", () => {
    it("deletes the Holdings document when all shares are sold", async () => {
        const user = await makeUser();

        await executeOrder({
            userId: user._id, name: "SBIN", qty: 5, price: FIXED_PRICE,
            mode: "BUY", product: "CNC", isSimulation: true,
        });

        await executeOrder({
            userId: user._id, name: "SBIN", qty: 5, price: FIXED_PRICE,
            mode: "SELL", product: "CNC", isSimulation: true,
        });

        const holding = await Holdings.findOne({ user: user._id, name: "SBIN" }).lean();
        assert.equal(holding, null, "holding document must be deleted after full sell");
    });
});

// ─── 6. Idempotency — duplicate key ──────────────────────────────────────────

describe("Idempotency", () => {
    it("returns cached reply on duplicate key and does not debit twice", async () => {
        const user = await makeUser();
        const key = "order-abc-123";

        await executeOrder({
            userId: user._id, name: "AXISBANK", qty: 2, price: FIXED_PRICE,
            mode: "BUY", product: "CNC", isSimulation: true,
            idempotencyKey: key,
        });

        const cashAfterFirst = (await funds(user._id)).availableCash;

        const second = await executeOrder({
            userId: user._id, name: "AXISBANK", qty: 2, price: FIXED_PRICE,
            mode: "BUY", product: "CNC", isSimulation: true,
            idempotencyKey: key,
        });

        assert.equal(second.settlement.isIdempotentReply, true,
            "second call must be flagged as idempotent reply");

        const cashAfterSecond = (await funds(user._id)).availableCash;
        assert.equal(cashAfterSecond, cashAfterFirst, "cash must not be debited twice");

        const orderCount = await Orders.countDocuments({ user: user._id });
        assert.equal(orderCount, 1, "only one order must be persisted");

        assert.equal(second.settlement.cashDiff, 0);
        assert.equal(second.settlement.realizedPnL, 0);
    });
});

// ─── 7. MIS BUY — margin locking ─────────────────────────────────────────────

describe("MIS BUY — margin locking", () => {
    it("blocks 1/5 of notional from availableCash into marginBlocked", async () => {
        const user = await makeUser();
        const qty = 10;
        // notional = 10 × 500 = 5 000  →  margin (20%) = 1 000

        await executeOrder({
            userId: user._id,
            name: "ICICIBANK",
            qty,
            price: FIXED_PRICE,
            mode: "BUY",
            product: "MIS",
            isSimulation: true,
        });

        const f = await funds(user._id);
        const expectedMargin = r2((qty * FIXED_PRICE) / 5); // 1 000
        assert.equal(f.marginBlocked, expectedMargin);
        assert.equal(r2(f.availableCash), 100_000 - expectedMargin);

        const pos = await Positions.findOne({ user: user._id, name: "ICICIBANK" }).lean();
        assert.ok(pos, "position document should exist");
        assert.equal(pos.netQty, qty);
        assert.equal(pos.marginBlocked, expectedMargin);
    });
});

// ─── 8. MIS SELL — full position close ───────────────────────────────────────

describe("MIS SELL — full position close", () => {
    it("releases margin back to cash and credits realized PnL", async () => {
        const user = await makeUser();
        const qty = 10;
        const buyPrice = 500;
        const sellPrice = 550;

        // Open MIS long @ ₹500
        await executeOrder({
            userId: user._id, name: "LTIM", qty, price: buyPrice,
            mode: "BUY", product: "MIS", isSimulation: true,
        });

        const fAfterBuy = await funds(user._id);
        const marginLocked = fAfterBuy.marginBlocked; // 1 000

        // Close MIS long @ ₹550
        setStubPrice(sellPrice);
        await executeOrder({
            userId: user._id, name: "LTIM", qty, price: sellPrice,
            mode: "SELL", product: "MIS", isSimulation: true,
        });
        resetStubPrice();

        const f = await funds(user._id);

        assert.equal(f.marginBlocked, 0, "margin must be fully released on close");

        // realizedPnL = (550 − 500) × 10 = 500
        const expectedPnL = (sellPrice - buyPrice) * qty;
        assert.equal(f.lifetimeRealizedPnL, expectedPnL);

        // cash = 100 000 − 1 000 (margin locked) + 1 000 (released) + 500 (PnL) = 100 500
        assert.equal(r2(f.availableCash), r2(100_000 + expectedPnL));

        const pos = await Positions.findOne({ user: user._id, name: "LTIM" }).lean();
        assert.ok(pos, "position doc should still exist");
        assert.equal(pos.netQty, 0);
        assert.equal(pos.marginBlocked, 0);
    });
});

// ─── 9. Transaction rollback on DB error ─────────────────────────────────────

describe("Transaction rollback on DB error", () => {
    it("leaves cash and holdings unchanged if Orders.create throws", async () => {
        const user = await makeUser();
        const originalCreate = Orders.create.bind(Orders);

        // Make Orders.create fail on the first call inside the transaction
        Orders.create = async function (...args) {
            Orders.create = originalCreate; // restore immediately
            throw Object.assign(
                new Error("Simulated DB write failure"),
                { statusCode: 500 }
            );
        };

        const cashBefore = (await funds(user._id)).availableCash;

        await assert.rejects(
            () => executeOrder({
                userId: user._id, name: "ONGC", qty: 5, price: FIXED_PRICE,
                mode: "BUY", product: "CNC", isSimulation: true,
            }),
            (err) => {
                assert.match(err.message, /Simulated DB write failure/);
                return true;
            }
        );

        // Cash must be rolled back
        const cashAfter = (await funds(user._id)).availableCash;
        assert.equal(cashAfter, cashBefore, "cash must be rolled back on failed transaction");

        // No holding, no order
        const holding = await Holdings.findOne({ user: user._id, name: "ONGC" }).lean();
        assert.equal(holding, null);
        const orderCount = await Orders.countDocuments({ user: user._id });
        assert.equal(orderCount, 0);
    });
});
