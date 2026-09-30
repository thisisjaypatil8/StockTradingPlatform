# 📐 Stock Trading Platform — Canonical Financial Math & Architecture Reference

> *Every number on screen traces back to one of these verified mathematical identities. Zero magic, zero financial misnomers, zero floating-point precision loss.*

---

## Table of Contents

1. [The Grand Unified Accounting Identity](#1-the-grand-unified-accounting-identity)
2. [Lifetime Performance & Return Methodology](#2-lifetime-performance--return-methodology)
3. [The 6-State MIS Settlement Matrix](#3-the-6-state-mis-settlement-matrix)
4. [CNC Holdings & Realized P&L Ledger](#4-cnc-holdings--realized-pl-ledger)
5. [Unified Day P&L Engine](#5-unified-day-pl-engine)
6. [Equity, Margin & Wallet Mechanics](#6-equity-margin--wallet-mechanics)
7. [Precision & Performance Laws](#7-precision--performance-laws)
8. [Double-Entry Reconciliation Audit](#8-double-entry-reconciliation-audit)

---

## 1. The Grand Unified Accounting Identity

In double-entry financial accounting, capital does not materialize from nothing or disappear into thin air. Every rupee is conserved across external inflows, cash reserves, open positions, and accrued profits.

### 1.1 The Five Canonical Quantities

```
=============================================================================================
                              THE 5 CANONICAL QUANTITIES
=============================================================================================
  1. External Capital Inflow (Net) :  F_t = Gross Deposits (D_t) - Gross Withdrawals (W_t)
  2. Account Equity (Net Liq Value):  E_t = Cash (C_t) + Margin Blocked (M_t) 
                                           + CNC Market Value (V_t) + MIS Unrealized (U_t)
  3. Cumulative P&L (Total Profit) :  P_t = E_t - F_t  (Account Equity - Net External Capital)
  4. CNC Cost Basis (Invested Cap) :  B_t = Σ (qty_i × avg_i)  [Fully-paid equity, NOT margin]
  5. The Double-Entry Invariant    :  P_t ≡ Realized_Lifetime + Unrealized_Total - Charges
=============================================================================================
```

$$\boxed{E_t = C_t + M_t + V_t + U_t}$$

$$\boxed{F_t = D_t - W_t}$$

$$\boxed{P_t = E_t - F_t}$$

### 1.2 Conservation Proof Table

| Transaction / Event | Cash ($C_t$) | Margin Blocked ($M_t$) | Holdings ($V_t$) | Deposits ($D_t$) | Withdrawals ($W_t$) | Equity ($E_t$) | Cumulative P&L ($P_t$) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Initial Deposit ₹100,000** | +100k | — | — | +100k | — | 100k | **₹0.00** |
| **Buy ₹40k CNC Stock** | -40k | — | +40k | — | — | 100k | **₹0.00** |
| **Stock Appreciates to ₹48k** | — | — | +8k | — | — | 108k | **+₹8,000** |
| **Sell CNC Stock at ₹48k** | +48k | — | -48k | — | — | 108k | **+₹8,000** |
| **Withdraw ₹30k Profit** | -30k | — | — | — | +30k | 78k | **+₹8,000** |
| **Open MIS Intraday (5x)** | — | +2k | — | — | — | 78k | **+₹8,000** |
| **MIS Gains ₹1,500 (Floating)** | — | +2k | — | — | — | 79.5k | **+₹9,500** |

> **Accounting Rule:** External deposits and withdrawals are capital transactions, NEVER profit events. They move $E_t$ and $F_t$ equally, leaving Cumulative P&L ($P_t$) completely unaltered.

---

## 2. Lifetime Performance & Return Methodology

**Implementation File:** [`portfolioMath.js`](file:///c:/Users/Jay_Patil/Desktop/ProofOfWork/Rida/Apps/StockTradingPlatform/dashboard/src/utils/portfolioMath.js) & [`Summary.jsx`](file:///c:/Users/Jay_Patil/Desktop/ProofOfWork/Rida/Apps/StockTradingPlatform/dashboard/src/components/features/summary/Summary.jsx)

### 2.1 The Denominator Collapse Bug (Why Simple ROI Fails)

The naive formula previously used in consumer apps is:

$$\text{ROI}_{\text{naive}} = \frac{P_t}{D_t - W_t} \times 100\% \quad \text{❌ (BROKEN)}$$

When withdrawals occur, this formula breaks catastrophically:
1. **Division by Zero:** Deposit ₹100k, make ₹20k profit, withdraw ₹100k. Denominator becomes $100\text{k} - 100\text{k} = 0 \implies \text{ROI} = +\infty\%$.
2. **Negative Inversion:** Deposit ₹100k, make ₹20k profit, withdraw ₹110k. Denominator becomes $-10\text{k} \implies \text{ROI} = \frac{20\text{k}}{-10\text{k}} = -200\%$. The investor made ₹20,000 profit and took cash home, but the UI displays a catastrophic **-200% loss**.

### 2.2 The Crash-Proof Return Formula

To guarantee mathematical stability across all withdrawal and deposit patterns, the return denominator is bound to gross committed capital:

$$\boxed{\text{Lifetime Return \%} = \frac{\text{Cumulative P\&L}}{\max(D_t, 1)} \times 100\%}$$

```javascript
// dashboard/src/utils/portfolioMath.js
const grossDep = Number(grossDeposited) || 0;
const grossWith = Number(grossWithdrawn) || 0;
const netExternalCapital = grossDep - grossWith;

const equity = availableCash + totalMarginBlocked + cncMarketValue + misUnrealizedPnL;
const cumulativePnL = equity - netExternalCapital;

// 100% immune to division by zero and sign inversion:
const lifetimeReturnPct = grossDep > 0 ? (cumulativePnL / grossDep) * 100 : 0;
```

---

## 3. The 6-State MIS Settlement Matrix

**Implementation File:** [`orderService.js`](file:///c:/Users/Jay_Patil/Desktop/ProofOfWork/Rida/Apps/StockTradingPlatform/backend/services/orderService.js#L95-L180)

### 3.1 The Average Contamination Bug

If a trading system calculates running averages across all buys and sells during the day:
1. Buy 10 @ ₹100 $\rightarrow$ Sell 10 @ ₹110 (Flat, realized profit ₹100 credited to wallet).
2. Buy 5 @ ₹120.
3. If running averages are used: $\text{avg} = \frac{10 \times 100 + 5 \times 120}{15} = 106.67$.
4. Unrealized P&L is evaluated as $(LTP - 106.67) \times 5$, creating ghost profits and counting the old ₹100 trade twice (once in cash, and once in unrealized basis).

### 3.2 The Exact 6-Case State Transition Table

The execution engine uses an explicit state machine where position reduction **never** changes the entry basis, and position flips **reset** the basis to the execution price:

| Incoming Order | Position State | Execution Math | State Transition |
|---|---|---|---|
| **BUY** | **Long** ($q \ge 0$) | $\text{avg} \leftarrow \frac{(q \cdot \text{avg}) + (q_{\text{ord}} \cdot p)}{q + q_{\text{ord}}}$ | $q \leftarrow q + q_{\text{ord}}$ <br> $\text{Realized} \mathrel{+}= 0$ |
| **BUY** | **Short (Reduce)** ($q < 0, q_{\text{ord}} \le \|q\|$) | $\text{Realized} \mathrel{+}= (\text{avg} - p) \cdot q_{\text{ord}}$ | $q \leftarrow q + q_{\text{ord}}$ <br> $\text{avg unchanged (or 0 if } q=0)$ |
| **BUY** | **Short (Flip)** ($q < 0, q_{\text{ord}} > \|q\|$) | $\text{Realized} \mathrel{+}= (\text{avg} - p) \cdot \|q\|$ | $q \leftarrow q_{\text{ord}} - \|q\|$ <br> $\text{avg} \leftarrow p$ (basis reset) |
| **SELL** | **Long (Reduce)** ($q > 0, q_{\text{ord}} \le q$) | $\text{Realized} \mathrel{+}= (p - \text{avg}) \cdot q_{\text{ord}}$ | $q \leftarrow q - q_{\text{ord}}$ <br> $\text{avg unchanged (or 0 if } q=0)$ |
| **SELL** | **Long (Flip)** ($q > 0, q_{\text{ord}} > q$) | $\text{Realized} \mathrel{+}= (p - \text{avg}) \cdot q$ | $q \leftarrow -(q_{\text{ord}} - q)$ <br> $\text{avg} \leftarrow p$ (basis reset) |
| **SELL** | **Short** ($q \le 0$) | $\text{avg} \leftarrow \frac{(\|q\| \cdot \text{avg}) + (q_{\text{ord}} \cdot p)}{\|q\| + q_{\text{ord}}}$ | $q \leftarrow q - q_{\text{ord}}$ <br> $\text{Realized} \mathrel{+}= 0$ |

### 3.3 Branch-Free Signed Unrealized Formula

Because `netQty` is signed ($+q$ for Long, $-q$ for Short), unrealized P&L is branch-free:

$$\boxed{\text{Unrealized}_{\text{MIS}} = (\text{LTP} - \text{avgEntry}) \times \text{netQty}}$$

- **Long:** $(110 - 100) \times (+10) = +₹100$
- **Short:** $(110 - 100) \times (-10) = -₹100$ (LTP rose, short lost money)
- **Short:** $(90 - 100) \times (-10) = +₹100$ (LTP dropped, short made money)

---

## 4. CNC Holdings & Realized P&L Ledger

**Implementation File:** [`orderService.js`](file:///c:/Users/Jay_Patil/Desktop/ProofOfWork/Rida/Apps/StockTradingPlatform/backend/services/orderService.js#L36-L92)

### 4.1 CNC Execution Mechanics

1. **CNC BUY:**
   $$\text{Cash Deducted} = \text{orderQty} \times \text{orderPrice}$$
   $$\text{holding.avg}_{\text{new}} = \frac{(\text{holding.qty} \times \text{holding.avg}) + (\text{orderQty} \times \text{orderPrice})}{\text{holding.qty} + \text{orderQty}}$$
2. **CNC SELL:**
   $$\text{Cash Credited} = \text{orderQty} \times \text{orderPrice}$$
   $$\boxed{\text{Realized P\&L}_{\text{CNC}} = (\text{orderPrice} - \text{holding.avg}) \times \text{orderQty}}$$
   $$\text{funds.lifetimeRealizedPnL} \leftarrow \text{funds.lifetimeRealizedPnL} + \text{Realized P\&L}_{\text{CNC}}$$

> Previously, CNC sales credited cash proceeds but omitted realized P&L from the ledger. Now, every sell records the exact booked profit into the user's audit ledger.

---

## 5. Unified Day P&L Engine

**Implementation File:** [`portfolioMath.js`](file:///c:/Users/Jay_Patil/Desktop/ProofOfWork/Rida/Apps/StockTradingPlatform/dashboard/src/utils/portfolioMath.js#L68)

Day P&L must aggregate all four sources of intraday price movement:

$$\boxed{\text{Unified Day P\&L} = \text{Realized}_{\text{CNC}} + \text{Realized}_{\text{MIS}} + \sum \text{Unrealized}_{\text{MIS}} + \sum_{i=1}^{n} \left(\text{holding.qty}_i \times (\text{LTP}_i - \text{PrevClose}_i)\right)}$$

| Component | Source | Definition |
|---|---|---|
| $\text{Realized}_{\text{CNC}}$ | CNC Sells Today | Profit booked on long-term shares sold today |
| $\text{Realized}_{\text{MIS}}$ | Intraday Closes Today | Profit booked on squared-off MIS legs |
| $\text{Unrealized}_{\text{MIS}}$ | Open Intraday Positions | Floating P&L against entry basis $(LTP - avgEntry) \times netQty$ |
| $\text{Holding Day Move}$ | Active CNC Portfolio | Price change today against yesterday's close $(LTP - PrevClose) \times qty$ |

---

## 6. Equity, Margin & Wallet Mechanics

### 6.1 Margin Used vs Cost Basis
- **CNC Holdings are settled equity:** Calling $\sum(qty \times avg)$ "Margin Used" is a financial misnomer. In institutional terminology, this is **CNC Cost Basis** ($B_t$).
- **MIS Intraday blocks leverage margin:** At 5x leverage (20% margin):
  $$\boxed{\text{MIS Margin Blocked} = \sum \frac{|\text{netQty}_k| \times \text{avgEntry}_k}{5}}$$

### 6.2 Zero Double-Counting Guarantee in RMS Square-Off
In [`backend/controllers/positions.js`](file:///c:/Users/Jay_Patil/Desktop/ProofOfWork/Rida/Apps/StockTradingPlatform/backend/controllers/positions.js), the 03:20 PM RMS liquidation engine does **not** manipulate cash directly. It routes closing fills through `orderService.executeOrder`. 

This guarantees:
1. Exact same 6-state matrix is evaluated.
2. Cash is credited exactly once via `creditCash`.
3. Audit order record is stored in MongoDB.
4. Lifetime realized P&L is updated atomically.

---

## 7. Precision & Performance Laws

### 7.1 The Precision Law (Zero Intermediate `.toFixed()`)
JavaScript IEEE-754 floating point precision must not be rounded inside intermediate mathematical operations. 
- **Internal Engine:** Pure Numbers (`float64`).
- **Presentation Layer:** `.toFixed(2)` or `Intl.NumberFormat("en-IN")` applied **strictly and exclusively** inside JSX templates.

### 7.2 The N+1 Network Resolution Law
Instead of firing 25 isolated HTTP requests in parallel for 25 portfolio tickers:
- **Backend:** `GET /market/quotes?symbols=TCS,INFY,RELIANCE` fetches and resolves all symbols in a single round-trip.
- **Frontend:** Consumed in a single snapshot by both [`PortfolioContext.jsx`](file:///c:/Users/Jay_Patil/Desktop/ProofOfWork/Rida/Apps/StockTradingPlatform/dashboard/src/context/PortfolioContext.jsx) and [`usePositions.js`](file:///c:/Users/Jay_Patil/Desktop/ProofOfWork/Rida/Apps/StockTradingPlatform/dashboard/src/components/features/positions/usePositions.js).

---

## 8. Double-Entry Reconciliation Audit

To verify that zero mathematical leakage exists in the system, the platform satisfies the **Conservation Invariant**:

$$\boxed{\text{Cumulative P\&L} \equiv \sum \text{Realized}_{\text{Lifetime}} + \sum \text{Unrealized}_{\text{Holdings}} + \sum \text{Unrealized}_{\text{MIS}} - \text{Charges}}$$

### Automated Test Suite
Run the automated test suite at any time from the backend root:

```bash
node tests/test_math_reconciliation.js
```

### Fee Policy Declaration
> **Fee-Free Simulation Policy:** The platform currently operates as a **100% Zero-Brokerage, Fee-Free Educational Trading Simulator** ($\text{Charges} = 0$). All exchange transaction fees, STT, SEBI turnover charges, and GST are currently waived.
