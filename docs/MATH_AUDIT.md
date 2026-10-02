# Financial Math Audit

**Scope:** Read-only review of trading, funds, P&L, margin, and display math.  
**Code was not changed.**  
**Date:** 2026-10-02

**Verdict:** Core **weighted-average fill logic** for CNC and MIS (including flips and partial closes) is **directionally correct** and is the strongest part of the engine. It is **not** yet a single source of truth, **not** money-safe (IEEE-754 floats + mid-stream rounding), and **does not** match Indian cash-equity brokerage practice for margin, charges, settlement, or day P&L.

---

## 1. Where math lives today

| Layer | File | Role |
| --- | --- | --- |
| Backend money engine | `backend/services/orderService.js` | CNC buy/sell, MIS `applyFill`, cash debit/credit, realized P&L, notional 5x margin |
| Backend rounding | `backend/utils/math.js` | `round2` via `Number.toFixed(2)` |
| Backend funds | `backend/controllers/funds.js` | Deposit / withdraw / display balances |
| Backend RMS | `backend/controllers/positions.js`, `backend/services/rmsScheduler.js` | Square-off at 15:20 IST |
| Backend quotes | `backend/services/marketUtils.js` | LTP, previous close, % change |
| Dashboard SSOT (claimed) | `dashboard/src/utils/portfolioMath.js` | Equity, cumulative P&L, day P&L, formatters |
| Dashboard consumers | `Summary.jsx`, `Funds.jsx`, `Holdings.jsx`, `usePositions.js`, `PositionRow.jsx` | Mix of shared helpers + local formulas |
| Tests | `backend/tests/test_math_reconciliation.js` | `applyFill` cases; reconciliation test does **not assert** |

There is **no** charges engine, **no** integer/paise money type, **no** cash ledger, and **no** shared math package used by both Node and the dashboard.

---

## 2. What is already correct

### 2.1 Weighted average (moving average) cost

CNC add:

```text
newAvg = (oldQty * oldAvg + fillQty * fillPrice) / (oldQty + fillQty)
```

MIS add (long or short) uses the same idea on **absolute** size.

This is the standard **broker display** method used by Zerodha Kite, Groww, Angel, etc. for holdings/positions P&L. It is **not** FIFO tax lots (see §5.4).

### 2.2 Realized P&L on reduce / close / flip

| Case | Formula in `applyFill` | Verdict |
| --- | --- | --- |
| Reduce long | `(exitPrice - avg) * exitQty` | Correct |
| Reduce short | `(avg - coverPrice) * coverQty` | Correct |
| Close to flat | Same, then `avg = 0` | Correct |
| Flip long → short | Realize only on the closed long qty; new short avg = fill price | Correct |
| Flip short → long | Realize only on covered short qty; new long avg = fill price | Correct |

The “average contamination after going flat then reopening” bug is **handled**. Tests 1–3 cover this well.

### 2.3 Signed MIS unrealized (dashboard)

```text
unrealized = (ltp - avg) * netQty
```

Works for long (`netQty > 0`) and short (`netQty < 0`) without branches. This is the industry-standard **signed quantity** identity.

### 2.4 CNC cash vs holdings (delivery, fee-free)

- Buy: debit `qty * price`, increase qty, recompute avg.  
- Sell: require `holding.qty >= sellQty`, credit `qty * price`, realize `(price - avg) * qty`, delete holding if flat.

For a **zero-fee, instant-settlement simulator**, this double-entry is consistent **as long as** cash is IEEE-rounded the same way as P&L (it is not always; see §3.2).

### 2.5 Cumulative P&L identity (dashboard, given current cash model)

`portfolioMath.js` actually computes:

```text
equity         = availableCash + cncMarketValue + misUnrealized
cumulativePnL  = equity - (grossDeposited - grossWithdrawn)
```

Because **MIS does not debit cash or block margin in the wallet**, this identity is the **correct** one for the **current** engine:

```text
P&L created = (cash + mark-to-market of CNC + floating MIS) − net money the user put in
```

CNC unrealized is already inside `cncMarketValue` vs cost; cost is sitting in reduced cash, so you must **not** also add CNC unrealized on top of cash + market value.

---

## 3. Correctness issues (bugs and false invariants)

### 3.1 CRITICAL — Documented equity formula ≠ implemented formula ≠ test formula

Three different “account equity” definitions exist:

| Source | Formula |
| --- | --- |
| Comment in `portfolioMath.js` | `Cash + Margin blocked + CNC MV + MIS unrealized` |
| Actual `calculateAccountMetrics` | `availableCash + cncMarketValue + misUnrealized` (**no** margin) |
| Test 4 in `test_math_reconciliation.js` | `cash + marginBlocked + cncMV + misUnrealized` |

Test 4 then builds `sumOfPnLs = realized + CNC UR + MIS UR + marginBlocked` and **never `assert`s** equality. The suite can print “ALL TESTS PASSED” while the conservation identity is wrong.

**Which formula is right depends on the cash model:**

| Cash model | Correct equity |
| --- | --- |
| **A. Current code:** cash is never reduced for MIS; `marginBlocked` is a label only | `cash + CNC MV + MIS UR` (do **not** add margin) |
| **B. Industry (Kite-style):** used margin is **moved** from available cash into blocked | `available + blocked + CNC MV + MIS UR` which equals `ledgerCash + CNC MV + MIS UR` |

Today the UI **shows** “MIS Margin Blocked” and “Used margin” as if model B were true, while the wallet is model A. Users can believe capital is reserved when it is not.

### 3.2 CRITICAL — MIS has no cash/margin constraint

`executeMisOrder` only:

1. Mutates the position via `applyFill`
2. Credits `realizedDelta` to cash (can be negative → `$inc` can drive cash below zero)
3. Never checks or debits `marginBlocked`

Consequences:

- Unlimited notional MIS size on a ₹1 lakh wallet.
- Short selling with **zero** capital.
- Realized MIS **losses** can make `availableCash` negative (`creditCash` has no floor).
- RMS square-off uses live LTP (or stale `pos.price`) but still does not check margin first.

`calculateMarginBlocked = round2(|qty| * avg / 5)` is **display-only**. Flat 5x for every symbol is also not how NSE cash MIS works (see §5.2).

### 3.3 HIGH — Money is IEEE-754 `Number`, rounded with `toFixed`

`round2`:

```js
Number(Number(value).toFixed(2))
```

Problems vs brokerage/clearing practice:

- Binary float cannot represent paise exactly (`0.1 + 0.2`).
- `toFixed` **half-even/banker’s** vs **half-up** is engine-dependent; NSE/clearing typically uses **paise integers** and defined rounding.
- CNC uses **rounded notional** `round2(qty * price)` then **rounded avg**. MIS `applyFill` uses **full float** products then rounds avg and realized at the end. Same fill on CNC vs MIS can disagree by a paise.
- Funds add/withdraw do **not** round. `10.999` or `0.1` repeated deposits will drift vs displayed ₹x.xx.
- `lifetimeRealizedPnL` is incremented by already-rounded deltas; a restatement from fills will not match after many trades.

**Industry standard:** store **integer paise** (`BigInt` or decimal library). Round **once** at the cash posting, not on every intermediate avg.

### 3.4 HIGH — “Day P&L” mixes two different definitions

In `calculateAccountMetrics`:

```text
cncDayPnL        = Σ qty * (ltp − previousClose)     // mark vs yesterday
positionsDayPnL  = Σ (misRealizedPnL + misUnrealized) // vs entry, plus locked P&L on the position doc
totalDayPnL      = cncDayPnL + positionsDayPnL
```

Issues:

- CNC day P&L is **true session MTM vs previous close** (good, Kite-like for holdings “Day chg”).
- MIS “day” includes **all realized stored on the position**, which is correct only if the position document is **session-scoped**. Closed MIS from **today** are kept; older flats are deleted in `getAllPositions`. That is a reasonable session reset **if and only if** every reader hits that endpoint (RMS does not delete globally the same way).
- `misRealizedPnL` is **already in cash** and in `funds.lifetimeRealizedPnL`. Adding it into “Day P&L” is fine as a **UI bucket**, but **must not** be added again into equity (it currently is not — good).
- Holdings **row** “Day chg.” uses `stock.day` / `stock.isLoss` from the **quote’s daily %**, while Summary “Day’s Change” uses `qty * (ltp − prevClose)`. Percentage vs rupees, and `isLoss` is **day move**, not vs average cost — so a stock up on the day but below your avg can show green Day and red P&L (that part **is** industry-correct). Stale `day` strings on the Mongo document (`"+0.00%"`) are not source of truth.

### 3.5 HIGH — Duplicate qty/avg fields invite stale math

Positions persist **both**:

- Canonical: `netQty`, `avgEntry`, `marginBlocked`, `realizedPnL`
- Legacy: `qty`, `avg`, `buyQty`, `buyAvg`, `sellQty`, `sellAvg`

`syncLegacyPositionFields` **overwrites** buy/sell qty to the **current net**, not lifetime bought/sold. So `buyQty` is **not** “total bought today”; it is “current long size”. Any future formula using `buyQty * buyAvg − sellQty * sellAvg` as P&L would be **wrong** for partials/flips.

Dashboard still falls back `netQty ?? qty` and `avgEntry ?? avg`. One missed write desyncs UI vs engine.

Holdings store `net` and `day` as **strings**. Live UI overwrites them in memory; DB copies stay stale.

### 3.6 MEDIUM — Order inputs are not economically validated

`executeOrder` does `Number(qty)` / `Number(price)` with no:

- `qty` integer > 0 (NSE cash is whole shares)
- `price` > 0, finite
- Tick size **0.05** (and 0.01 for some series — exchange file)
- `mode ∈ {BUY, SELL}`, `product ∈ {CNC, MIS}`
- Circuit limits
- Market hours (except RMS clock)

UI `step="0.05"` is not enforced on the server. Fractional qty and `price: 0` can corrupt averages (`newAvg` NaN/Infinity if qty+price bad).

### 3.7 MEDIUM — Settlement response vs UI

`executeOrder` returns `{ realizedPnL, availableCash, lifetimeRealizedPnL }`.

`BuyActionWindow.jsx` displays `settlement.cashDiff`, which is **never sent**. Users see `₹0` debit/credit even when the wallet moved. That is a **presentation** bug on top of missing a single settlement DTO.

### 3.8 MEDIUM — Lifetime return % is not a performance standard

```text
lifetimeReturnPct = cumulativePnL / grossDeposited * 100
```

- Ignores **timing** of deposits/withdrawals (not TWR, not Modified Dietz).
- Inflating deposits (deposit 10L, withdraw 9.9L, trade small) **crushes** % even if trading P&L is large vs remaining capital.
- `grossDep === 0` → 0% (ok), but `totalDeposited` default 1,00,000 on users who never deposited still looks like capital in.

GIPS / broker consoles: **TWR** for “performance”, **money-weighted** for “your rupees”. Simple ROI vs beginning-of-period equity is the minimum.

### 3.9 MEDIUM — CNC average is rounded every buy

After many odd-lot adds, `avg` drifts vs true `totalCostPaise / qty`. Realized on sell uses the **stored** avg, so the wallet and “economic” P&L diverge. Brokers keep **unrounded cost** (or integer) and round only for display.

### 3.10 LOW — Quote % vs rupee change

`formatPercent(change, previousClose)` uses Yahoo `regularMarketChange` when present. If Yahoo’s change is split-adjusted and previousClose is not (or vice versa), % and `isLoss` can disagree with `price - previousClose`. Prefer **one** definition: `(ltp - prevClose) / prevClose`.

### 3.11 LOW — Chart synthetic OHLC

Empty candles + price array → high/low = `p * 1.001` / `p * 0.999`. That is **not** market data; it can be mistaken for real range.

### 3.12 LOW — RMS fallback price

If LTP fetch fails: `exitPrice = pos.price || pos.avgEntry || pos.avg || 100`. A hardcoded **100** can realize a huge fake P&L. Fail closed (skip / retry) is safer than inventing a price.

### 3.13 LOW — `getISTDate` via `toLocaleString` → `new Date(string)`

Locale parsing is not a reliable IST clock. Square-off at 15:20 and “start of day” deletes can fire on the wrong instant (DST-less IST is stable, but Node locale / host TZ still bites). Use a timezone library or explicit offset + calendar date.

---

## 4. Single source of truth — current state: **No**

### 4.1 Two engines

| Concern | Backend | Dashboard |
| --- | --- | --- |
| Weighted avg | `orderService` | not used for fills |
| Unrealized | not computed server-side | `portfolioMath` |
| Equity / cumulative | not computed | `portfolioMath` |
| Margin | stored on position, not in cash | recomputed fallback `(abs(net)*avg)/5` if field missing |
| Rounding | `round2` | **none** in metrics (comment says keep full float) |
| Formatters | none | `formatK` / `formatCurrency` / `formatPnL` |

Authoritative **positions/holdings/cash** live in Mongo. Authoritative **equity and day P&L** live in the **browser**. Two users, two tabs, or a future mobile client will diverge.

### 4.2 Local formulas still duplicated

- `Holdings.jsx` rows: `curValue = price * qty`, `pnl = curValue - avg * qty` instead of a row helper from `portfolioMath`.
- `BuyActionWindow`: `stockQuantity * stockPrice` (string qty can concat if not careful; currently `Number` on submit only).
- `PortfolioContext` net %: `((livePrice - avg) / avg) * 100` then `toFixed` — same as holdings “Net chg” but not imported from a shared `%` helper.
- `PositionRow` displays `stock.avg` not `avgEntry` — usually synced, not guaranteed.

### 4.3 `lifetimeRealizedPnL` vs `cumulativePnL`

| Metric | Includes |
| --- | --- |
| `funds.lifetimeRealizedPnL` | CNC sell realized + MIS realized deltas only |
| `cumulativePnL` | Realized (via cash) **+** CNC UR **+** MIS UR |

The Funds page shows lifetime **realized** next to capital; Summary shows **total** P&L. Labels are easy to confuse. There is no reconciliation job:  
`lifetimeRealizedPnL === sum(order realizations)` is not checked.

### 4.4 No posting ledger

Cash is a single mutable number. You cannot prove:

```text
Σ deposits − Σ withdrawals − Σ CNC buys + Σ CNC sells + Σ MIS realized = availableCash
```

from a journal. Industry RMS/back-office is **event-sourced** (or at least an immutable `CashLedger` collection).

---

## 5. Industry standards (India cash equity / Kite-like)

This product markets NSE/BSE, T+1, MIS vs CNC, 5x, UPI. Comparison to **SEBI / NSE / typical discount broker** practice:

| Topic | Typical standard | This app |
| --- | --- | --- |
| CNC funds | Block on order; pay-in; **T+1** settlement; holdings after pay-in | Instant cash + holdings; T+1 is **copy only** |
| MIS margin | Stock-wise **VAR + ELM** (often ~15–40%), peak margin snapshots, haircut | Flat **20%** (`/5`), not deducted |
| Short CNC | Generally **not** allowed (need BTST/MTF/SLBM) | Correctly blocked |
| Short MIS | Allowed with margin | Allowed **without** margin |
| Brokerage (marketing site) | CNC ₹0; MIS min(₹20, 0.03%) | **Not applied** in engine |
| Statutory | STT, exchange + SEBI charges, stamp duty, GST on brokerage | **Absent** |
| DP charges | On CNC sell (CDSL/NSDL) | Absent |
| Tick / lot | Exchange tick; equity = 1 share | Not validated |
| Circuit | Price bands | Absent |
| Square-off | ~15:20 cash MIS | Clock exists; price fallback unsafe |
| P&L display | Avg cost; day vs prev close | Mixed; see §3.4 |
| Tax lots | FIFO for ITR / STCG 15% / LTCG 12.5% with 1.25L exemption (rules change) | Weighted avg only; no holding period |
| Money type | Integer paise / decimal | `Number` |
| Corporate actions | Avg and qty adjusted | Absent |
| MTM / margin call | Intraday MTM can square off | No MTM check, only time-based RMS |
| Idempotent orders | Client order id | Header exists; **not used** in `executeOrder` |

**Charges identity (illustrative, NSE equity — rates change; treat as a module, not hardcoded forever):**

```text
turnover           = qty * price
brokerage_mis      = min(20, 0.0003 * turnover)     # per executed order, typical advertised
brokerage_cnc      = 0
stt_cnc_buy        = 0.001 * turnover               # 0.1% on delivery buy (confirm live table)
stt_cnc_sell       = 0.001 * turnover
stt_intraday_sell  = 0.00025 * turnover             # on sell side only for intraday
exchange           = exchange_rate * turnover
sebi               = 10/crore * turnover
stamp              = state_stamp_rate * turnover    # buy side
gst                = 0.18 * (brokerage + exchange + sebi)
net_debit_buy      = turnover + charges
net_credit_sell    = turnover - charges
```

Until this module exists, **realized P&L is overstated** vs a real contract note.

---

## 6. Efficiency

| Item | Assessment |
| --- | --- |
| `calculateAccountMetrics` single pass | Fine for retail-size books (O(n) holdings + positions) |
| Batch quotes for holdings/positions | Good vs N+1 |
| Watchlist **per-row** quote fetch | Inefficient; should reuse batch helper |
| `round2` / `toFixed` in hot path | Cheap; **correctness** cost dominates |
| RMS sequential `for` + live quote per position | Simple; pool like market batch for many users |
| Metrics recomputed in Summary **and** Funds **and** Holdings | Cheap but three trees; one context value would be enough |
| `formatK` dividing by 1000 | Display only; does not affect books |

Efficiency is **not** the main risk. **Consistency and money precision** are.

---

## 7. Test gaps

Existing tests: reopen-after-flat, flips, partial reduce. Missing:

- [ ] Paise rounding vs cash (`10 * 33.33`)
- [ ] CNC + MIS **same** fill, cash and avg must match policy
- [ ] MIS margin debit/credit and **insufficient margin**
- [ ] MIS loss driving cash **negative**
- [ ] Equity identity **asserted** under the chosen cash model
- [ ] `cumulativePnL === CNC UR + MIS UR + lifetimeRealized` (fee-free, no deposits mid-flight)
- [ ] Deposit/withdraw then trade (Modified Dietz / TWR fixtures)
- [ ] Square-off qty, side, and P&L vs `applyFill`
- [ ] Qty `1.5`, price `0`, NaN
- [ ] Charges golden file vs a sample contract note
- [ ] Dashboard `portfolioMath` unit tests (currently **none**)
- [ ] Reconciliation job against a ledger

---

## 8. Severity summary

| ID | Issue | Severity |
| --- | --- | --- |
| M1 | Equity formula comment / code / test disagree | Critical (integrity) |
| M2 | MIS margin not in the wallet; unlimited leverage | Critical (risk) |
| M3 | Float + `toFixed` money | High |
| M4 | Day P&L definition split CNC vs MIS | High |
| M5 | Dual fields + client-side equity SSOT | High |
| M6 | No charges / T+1 / VAR+ELM | High vs “industry std” |
| M7 | Unvalidated qty/price/tick | Medium |
| M8 | `cashDiff` missing; RMS price `100` | Medium |
| M9 | Return % not TWR | Medium |
| M10 | Avg rounded every fill | Medium |
| M11 | Watchlist N+1; IST locale clock | Low |

---

## 9. What “good” looks like (target identities)

Pick **one** cash model and freeze it.

### Model B (recommended if you want Kite-like labels)

```text
ledgerCash        = availableCash + marginBlocked
equity            = ledgerCash + cncMarketValue + misUnrealized
                  = availableCash + marginBlocked + cncMarketValue + misUnrealized
netExternal       = grossDeposited - grossWithdrawn
cumulativePnL     = equity - netExternal
cncUnrealized     = cncMarketValue - cncCostBasis
misUnrealized     = Σ (ltp - avgEntry) * netQty
```

Invariants:

```text
availableCash + marginBlocked = ledgerCash
marginBlocked                 = Σ haircut(symbol, |netQty| * ltp or avg)   # policy
availableCash                 ≥ 0
CNC: Σ qty                    ≥ 0
On fill: ΔledgerCash + ΔcncCost + Δmargin − Δrealized = 0   # with charges as own postings
```

### Fee-free simulator (honest subset of today)

Keep Model A **only if** you stop showing “used margin” as cash that left the wallet, and you **still** reject MIS when `notional/leverage > availableCash`.

---

## 10. Suggested SSOT layout (do not implement in this audit)

```text
packages/trading-math/   (or backend/domain/math + dashboard import via copy/codegen)
  money.ts          // paise BigInt, roundHalfUp
  fills.ts          // applyFill, weightedAvg  ← only implementation
  cnc.ts
  mis.ts            // margin policy
  charges.ts        // STT, brokerage, GST, stamp
  portfolio.ts      // equity, day PnL, returns
  format.ts         // INR, %, k
```

Backend `orderService` **imports** fills; dashboard **only formats** server-computed snapshots (or uses the same functions on a DTO). Mongo stores **canonical fields only**.
