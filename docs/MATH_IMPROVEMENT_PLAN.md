# Financial Math Improvement Plan

**Status:** Proposal only. No application code is changed by this document.  
**Companion:** [MATH_AUDIT.md](./MATH_AUDIT.md)  
**Goal:** One money engine, paise-accurate books, Kite-like identities, tests that fail if invariants break.

---

## Principles

1. **One fill function** for CNC and MIS (signed qty + average cost). UI never recomputes fills.
2. **Integer paise** in storage and posting; rupees only at the API/UI edge.
3. **Cash is a ledger**, not a lonely `Number`. Positions/holdings are projections of fills.
4. **Pick cash model B** (available + blocked) if you keep “Used margin” labels; otherwise relabel and still **cap** MIS by margin.
5. **Charges are postings**, not comments on the marketing site.
6. **Tests assert identities**; a log line is not a test.

---

## Phase 0 — Freeze the contract (1 short design note)

Write a one-page **Accounting Policy** (can live in this folder later as `MATH_POLICY.md`) that states:

| Item | Decision to lock |
| --- | --- |
 | Money unit | Paise `int64` / `BigInt` |
 | Rounding | Half-up to paise on each **cash posting** only |
 | Cost method | Weighted average for display P&L; FIFO lots later for tax (optional phase 6) |
 | CNC short | Forbidden |
 | MIS short | Allowed iff margin available |
 | Margin | Phase 1: 20% of **notional at LTP** (or avg if no LTP); Phase 4: VAR+ELM table |
 | Equity | `available + blocked + cncMV + misUR` |
 | Day P&L CNC | `qty * (ltp - prevClose)` |
 | Day P&L MIS | `sessionRealized + unrealized` with **session reset** at 15:20 / 09:00 policy |
 | Charges | Phase 3 module; until then explicit `fees = 0` flag on statements |

Do not implement until this table is agreed. The audit’s biggest bugs are **conflicting policies**, not missing loops.

---

## Phase 1 — Single fill + money type (foundation)

### 1.1 Extract `applyFill` into a pure module

- Input: `{ netQty, avgPaise, realizedPaise }`, `{ side, qty, pricePaise }`
- Output: new position + `realizedDeltaPaise`
- **No Mongo, no rounding of avg except integer division policy**  
  Recommended: keep `costPaise = abs(netQty) * avg` as integer;  
  `newAvgPaise = floor((oldCost + fillCost) / newQty)` **or** round-half-up — pick one and test.

Use the **same** function for CNC (netQty always ≥ 0) and MIS.

### 1.2 Replace `round2` in the books

- API still returns rupees with 2 decimals.
- Internally: `toPaise(x) = roundHalfUp(x * 100)`, `toRupees(p) = p / 100`.
- Ban `toFixed` on running balances.

### 1.3 Canonical position/holding fields

Keep only:

```text
Holdings:  symbol, qty, costPaise (or avgPaise + qty), ltp optional cache
Positions: symbol, product, netQty, avgPaise, realizedPaiseSession, marginPaise
```

Drop or stop writing `qty`/`avg` duplicates, `buyQty`/`sellQty` as “current net”, and string `net`/`day`.

### 1.4 Tests (must exist before refactors)

Golden vectors (qty, prices in paise):

1. Buy 10 @ 10000, sell 10 @ 11000 → realized 100000 paise, flat, avg 0  
2. Then buy 5 @ 12000 → avg 12000 (no leak)  
3. Long 10 @ 100, sell 15 @ 110 → short 5 @ 110, realized +100  
4. Short 5 @ 110, buy 8 @ 90 → long 3 @ 90  
5. Partial: 20 @ 150, sell 5 @ 180 → avg still 150  
6. **Paise trap:** 3 @ 10.10, + 1 @ 10.20  
7. Flip through flat in one fill  
8. CNC sell > qty → error  
9. `qty=0`, `price=0`, `1.7` shares → error  

Port today’s `test_math_reconciliation.js` into a real runner (`node:test` / Jest) with **assertions** on equity.

**Exit:** Fill math is pure, tested, and the only implementation.

---

## Phase 2 — Wallet, margin, equity SSOT on the server

### 2.1 Cash ledger collection

Each row: `{ userId, ts, type, amountPaise, refOrderId, balanceAfter }`  
Types: `DEPOSIT`, `WITHDRAW`, `CNC_BUY`, `CNC_SELL`, `MIS_MARGIN_BLOCK`, `MIS_MARGIN_RELEASE`, `MIS_REALIZED`, `CHARGES`, `RMS_SQUAREOFF`.

`availableCash` and `marginBlocked` become **cached sums** (or derived on read). Rebuild job: replay ledger vs cache, alert on mismatch.

### 2.2 MIS margin in the same transaction as the fill

On open/increase:

```text
required = marginPolicy(symbol, newAbsQty, price)
delta    = required - oldBlocked
debit available, credit blocked if delta > 0 (fail if available < delta)
```

On reduce/close: release `oldBlocked - newRequired`.  
On realize: `credit/debit available` by `realizedDelta` (losses: fail RMS or force square-off rather than silent negative cash).

**Never** `creditCash` a loss without a floor or liquidation path.

### 2.3 Server `GET /portfolio/summary`

Compute with the same `portfolio.ts` used in tests:

```text
equity, netExternal, cumulativePnL,
cncCost, cncMV, cncUR, cncDay,
misRealizedSession, misUR, marginBlocked, availableCash
```

Dashboard Summary / Funds / Holdings header **only render** this DTO.  
`calculateAccountMetrics` becomes a thin mapper or is deleted from the client.

### 2.4 Fix UI settlement DTO

Return what the buy window already expects (or change the window once):

```text
{
  cashDiffPaise, realizedPnLPaise,
  availableCash, marginBlocked, equity,
  chargesBreakdown
}
```

### 2.5 Invariants to assert in CI

```text
available + blocked = ledgerCash
equity = available + blocked + cncMV + misUR
cumulativePnL = equity - (deposits - withdrawals)
lifetimeRealized = Σ ledger MIS_REALIZED + CNC realized postings
Σ holding qty * avg = cncCost
```

**Exit:** One summary API; MIS cannot exceed cash; equity comment/code/test match.

---

## Phase 3 — Charges and contract-note parity

### 3.1 Configurable rate table (env or DB, dated)

Do not hardcode SEBI rates in JSX. Version the table (`effectiveFrom`).

### 3.2 Per-order breakdown stored on the order

Brokerage, STT, exchange, SEBI, stamp, GST, DP (CNC sell).  
Net cash posting = notional ± charges.

### 3.3 Align landing-page copy with the engine

Marketing already says CNC ₹0 brokerage and MIS ₹20 / 0.03%. Wire that **or** say “simulator, zero charges”.

### 3.4 Tests

One golden **contract note** per product/side (numbers from a real Zerodha note, redacted). Tolerance 0 paise.

**Exit:** Realized P&L matches “profit after charges” if the table says so.

---

## Phase 4 — Risk, ticks, session (industry RMS)

1. **Tick:** reject prices not on 0.05 (or instrument tick file).  
2. **Qty:** integer ≥ 1.  
3. **Circuit:** optional clamp vs `previousClose` bands (dummy 5/10/20% if no file).  
4. **Margin policy v2:** per-symbol `%` map; default 20%.  
5. **MTM:** periodic `requiredMargin(ltp)` vs blocked; if gap > available → auto reduce.  
6. **RMS 15:20:** timezone via `Temporal` or `luxon` Asia/Kolkata; **no** LTP → skip + alert, never price `100`.  
7. **Idempotency-Key:** persist and reject duplicates (header already sent).  
8. **Market hours:** optional reject CNC/MIS outside session except admin sim.

**Exit:** Cannot desync books with a bad tick; square-off is deterministic.

---

## Phase 5 — Day P&L and returns (display standards)

### 5.1 Split metrics in the API (names that match Kite)

| Field | Definition |
| --- | --- |
 | `holdingsPnl` | vs avg cost |
 | `holdingsDayPnl` | vs previous close |
 | `positionsUnrealized` | `(ltp-avg)*net` |
 | `positionsRealizedToday` | session bucket, reset after RMS |
 | `totalDayPnl` | holdingsDay + positionsRealizedToday + positionsUnrealized |

Stop summing CNC-vs-prevClose with MIS-vs-entry under one label without documenting it. Prefer the table above **on the UI**.

### 5.2 Returns

- **Simple:** `cumulativePnL / max(netExternal, 1)` for small accounts.  
- **Better:** Modified Dietz for the month.  
- **Best:** TWR on each cash-flow day.

Show `lifetimeRealized` as a **sub-line**, not as a synonym of cumulative.

### 5.3 Formatters

Keep `formatCurrency` / `formatPnL` in the dashboard only.  
Rules: `₹` + `en-IN` + 2 dp; sign **once** (`+₹1.00` or `₹+1.00`, not both).  
`formatK` is optional; do not use it on legal balances (Funds cash).

**Exit:** Summary, Funds, Holdings, Positions show the same rupee amounts as `/portfolio/summary`.

---

## Phase 6 — Optional tax and corporate actions

- FIFO **lots** on CNC for STCG/LTCG (separate from display avg).  
- Bonus/split: multiply qty, divide avg, same cost.  
- Dividends: cash ledger `DIVIDEND` (does not change avg).  

Skip until Phases 1–5 are green.

---

## Phase 7 — Client cleanup (after server SSOT)

1. Delete duplicate row math in `Holdings.jsx` or call one `holdingRowMetrics(stock)` from the shared module **generated from the same source**.  
2. Batch watchlist quotes (`fetchBatchQuotes`).  
3. Remove `settlement.cashDiff` guesses; bind to DTO.  
4. Holdings graph: plot **value (qty*ltp)** or **P&L**, not raw LTP mixed as “Stock Price” if the title is portfolio.  
5. Do not persist `isLoss` / `day` strings in Mongo.

---

## Implementation order (when you choose to code)

```text
Phase 0 policy  →  Phase 1 pure fills + paise + tests
                →  Phase 2 ledger + margin + summary API
                →  Phase 5 labels (can overlap 2)
                →  Phase 3 charges
                →  Phase 4 RMS/ticks
                →  Phase 7 delete client duplicates
                →  Phase 6 tax lots
```

Do **not** start with charges or TWR while equity and margin still disagree.

---

## Suggested file map (future)

| File | Responsibility |
| --- | --- |
 | `backend/domain/money.js` | paise, roundHalfUp |
 | `backend/domain/fills.js` | applyFill only |
 | `backend/domain/margin.js` | required margin |
 | `backend/domain/charges.js` | rate table |
 | `backend/domain/portfolio.js` | equity identities |
 | `backend/services/orderService.js` | orchestration + ledger |
 | `backend/services/portfolioService.js` | summary DTO |
 | `dashboard/src/utils/formatMoney.js` | display only |
 | `backend/tests/fills.test.js` | vectors |
 | `backend/tests/invariants.test.js` | ledger vs equity |

Shared package is nicer long-term; a Node module imported by tests is enough first.

---

## Definition of done

- [ ] One fill implementation; dashboard cannot change avg/qty  
- [ ] Equity formula is identical in comment, code, test, and UI  
- [ ] MIS blocked margin is real cash movement **or** UI no longer says it is  
- [ ] Cash never goes negative without an explicit RMS event  
- [ ] Paise tests for ugly prices  
- [ ] `/portfolio/summary` matches Holdings + Positions + Funds within 1 paise  
- [ ] Charges either applied or explicitly zero on the statement  
- [ ] RMS never invents last price `100`  
- [ ] Idempotent orders  

---

## Out of scope for math (do not mix into this plan)

Auth, Yahoo rate limits, chart library, CSS, UPI actual payouts, KYC. Those do not fix P&L.
