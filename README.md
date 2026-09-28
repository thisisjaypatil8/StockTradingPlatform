# 📈 Kite Trading Platform & Financial Simulation Engine

[![Node.js](https://img.shields.io/badge/Node.js-v20+-68a063?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5.2-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-v18.2-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas_ReplicaSet-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Vite](https://img.shields.io/badge/Vite-v5%2Fv8-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

> A production-hardened stock trading engine modeled after Zerodha's Kite ecosystem. Architected with multi-document ACID transactions, atomic conditional wallet ledgers, autonomous server-side RMS intraday liquidation, client-side order idempotency, and defense-in-depth API security.

---

## 📑 Table of Contents
- [System Architecture](#-system-architecture)
- [Repository Structure](#-repository-structure)
- [Financial Ledger & Core Specifications](#-financial-ledger--core-specifications)
- [Security & Reliability Engineering](#-security--reliability-engineering)
- [API Contract & Specifications](#-api-contract--specifications)
- [Local Development & Quickstart](#-local-development--quickstart)
- [Environment Variables](#-environment-variables)
- [License](#-license)

---

## 🏛️ System Architecture

```
[ Client Applications ]
  ├── Kite Trading Terminal (React / Vite @ :3000)
  └── User Onboarding & Auth Portal (React / Vite @ :5173)
           │
           │ HTTP / REST (JWT Bearer + X-Idempotency-Key)
           ▼
┌────────────────────────────────────────────────────────┐
│               EXPRESS 5 API GATEWAY (:5000)            │
├────────────────────────────────────────────────────────┤
│  Security & Request Pipeline:                          │
│  ├── Helmet (HSTS, CSP, X-Frame-Options: SAMEORIGIN)   │
│  ├── Strict CORS Whitelist (:5173, :3000)              │
│  ├── Recursive NoSQL Query Sanitizer (anti-$gt/$where) │
│  └── Sliding-Window Rate Limiter (Auth Shield)         │
└──────────────────────────┬─────────────────────────────┘
                           │
            ┌──────────────┴──────────────┐
            ▼                             ▼
┌───────────────────────────┐ ┌───────────────────────────┐
│ FINANCIAL ENGINE          │ │ MARKET PROXY GATEWAY      │
│ • Idempotency Guard (TTL) │ │ • Yahoo Finance Upstream  │
│ • Market Hours Guard (IST)│ │ • In-Flight Coalescing    │
│ • ACID Session Manager    │ │ • Memory Cache (60s / 5m) │
│ • Atomic Wallet Debit     │ └───────────────────────────┘
│ • Autonomous RMS Daemon   │
└───────────┬───────────────┘
            ▼
┌────────────────────────────────────────────────────────┐
│         MONGODB REPLICA SET (ACID TRANSACTIONS)        │
│  ├── Users (Ledger & Funds)                            │
│  ├── Orders (Audit Trail & Status)                     │
│  ├── Holdings (CNC Delivery Portfolios)                │
│  └── Positions (MIS Intraday Balances)                 │
└────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
.
├── backend/                  # Core REST API, Ledger Engine & RMS Daemons
│   ├── controllers/          # Business controllers (orders, market, auth, positions)
│   ├── middleware.js         # Security, idempotency, market hours, error handlers
│   ├── model/                # Mongoose schemas & indexes
│   ├── routes/               # Express route manifests
│   ├── services/             # Atomic order execution & RMS liquidation scheduler
│   └── utils/                # Operational error classes & async wrappers
├── dashboard/                # Kite Trading Desktop Terminal (Port 3000)
│   ├── src/components/       # Holdings, Positions, Orders, Watchlist, Modals
│   └── vite.config.js        # Strict port binding configuration
└── frontend/                 # Customer Facing Marketing & Signup Hub (Port 5173)
    └── src/landing_page/     # Product tours, Pricing, Auth context, Account opening
```

---

## ⚡ Financial Ledger & Core Specifications

### 1. Multi-Document ACID Transactions
In high-frequency financial applications, partial state persistence causes severe ledger drift. Order execution in `backend/services/orderService.js` runs strictly within a **MongoDB ACID Session Transaction**:
- Order logging, wallet cash deductions, and portfolio balance updates either commit together or roll back completely on unexpected failures.
```javascript
const session = await mongoose.startSession();
try {
  await session.withTransaction(async () => {
    await newOrder.save({ session });
    await debitCash(userId, orderCost, session);
    await syncHoldingOrPosition({ ..., session });
  });
} finally {
  await session.endSession();
}
```

### 2. Concurrency-Safe Atomic Wallet Debits
Eliminates race conditions where concurrent order dispatches overdraft account balances. Deductions are enforced as a single atomic query with conditional bounds:
```javascript
const user = await User.findOneAndUpdate(
  { _id: userId, "funds.availableCash": { $gte: amount } },
  { $inc: { "funds.availableCash": -amount } },
  { returnDocument: "after", session }
);
if (!user) throw new ExpressError(400, "Insufficient funds!");
```

### 3. Product Accounting: Delivery (CNC) vs. Intraday (MIS)
* **Cash-and-Carry (CNC):** Long-term asset settlement into client Demat. Weighted average pricing:
  $$\text{New Average} = \frac{(\text{Existing Qty} \times \text{Existing Avg}) + (\text{Executed Qty} \times \text{Executed Price})}{\text{Existing Qty} + \text{Executed Qty}}$$
* **Margin Intraday Square-Off (MIS):** Same-day leveraged trading:
  - **Short Selling:** Selling shares without prior ownership (`netQty < 0`).
  - **Short Covering:** Repurchasing shorted inventory with real-time settlement:
    $$\text{Realized P\&L} = (\text{Sell Average} - \text{Cover Price}) \times \text{Cover Qty}$$

### 4. Autonomous 03:20 PM RMS Liquidation Daemon
- Brokerage regulations mandate intraday MIS positions cannot carry overnight.
- A background server daemon (`services/rmsScheduler.js`) monitors Indian Standard Time (`Asia/Kolkata`).
- Every weekday at **03:20 PM IST**, the daemon scans open MIS positions (`netQty !== 0`), executes market counter-orders at CMP, and settles realized P&L directly into user cash wallets.

### 5. Timezone-Safe Market Hours Validation
- Production servers operate on UTC timestamps.
- `checkMarketHours` middleware normalizes runtime clocks to `Asia/Kolkata` IST.
- Rejects off-market MIS submissions (outside Mon–Fri 09:15–15:30 IST) with `403 Forbidden`, while permitting After-Market CNC orders and simulated test executions.

### 6. In-Flight Request Coalescing (Market Proxy)
- Prevents upstream API stampedes / thundering-herd issues on cache misses.
- Concurrent requests for identical stock quotes resolve against a single shared Promise via an in-memory `Map<string, Promise>` before storing in a TTL cache (60s quote, 5m history).

---

## 🛡️ Security & Reliability Engineering

### 1. Order Idempotency Guard (`X-Idempotency-Key`)
- Prevents double-spending resulting from network latency, retry loops, or aggressive button clicks.
- Client requests transmit a unique UUID via the `X-Idempotency-Key` header.
- The `idempotencyGuard` middleware checks an in-memory TTL store. Repeated submissions within a 2-minute sliding window return the cached response with zero database or ledger modification.

### 2. Zero-Trust Security Baseline
- **Response Headers (`helmet`):** Wipes server fingerprinting (`X-Powered-By`), enforces strict frame restrictions (`X-Frame-Options: SAMEORIGIN`), and enables strict transport security.
- **NoSQL Injection Defense (`sanitizeData`):** Pre-controller filter recursively stripping MongoDB operators (`$` and `.`) from `req.body`, `req.query`, and `req.params`.
- **Brute-Force Rate Limiting (`express-rate-limit`):** Sliding-window protection capping `/login` and `/signup` requests at **10 requests per 15 minutes per IP**.
- **Origin Isolation:** Rejects unauthorized cross-origin requests, permitting credentials strictly for `:5173` and `:3000`.

### 3. Centralized Error Classification & Boundary
- Operational runtime exceptions (`isOperational = true`) are cleanly delineated from internal programming bugs.
- Normalizes third-party exceptions to standard HTTP status codes:
  - MongoDB `CastError` ➔ `400 Bad Request`
  - MongoDB `E11000` (Duplicate Key) ➔ `409 Conflict`
  - Mongoose `ValidationError` ➔ `400 Bad Request`
  - `JsonWebTokenError` / `TokenExpiredError` ➔ `401 Unauthorized`
- **Environment Isolation:** Emits full V8 stack traces in development mode, while suppressing internal system telemetry in production.

### 4. Process Lifecycle & Graceful Shutdown
- **DB-First Bootstrapping:** Ensures the HTTP listener accepts client traffic only after MongoDB establishes an active connection pool.
- **Signal Trapping (`SIGTERM` / `SIGINT`):** Safely drains active in-flight requests, stops new socket admissions, and closes database connections with a 10-second termination failsafe.

---

## 📊 API Contract & Specifications

| Method | Endpoint | Description | Auth / Security |
|---|---|---|---|
| `POST` | `/signup` | Register new account (enforced `role: "user"`) | Rate-Limited |
| `POST` | `/login` | Authenticate credentials & issue JWT | Rate-Limited |
| `GET` | `/allOrders` | Retrieve chronological user order book | JWT Bearer |
| `POST` | `/newOrder` | Place CNC/MIS order with ACID transaction | JWT + Market Hours + Idempotency |
| `GET` | `/allHoldings` | Retrieve active delivery (CNC) holdings | JWT Bearer (`.lean()`) |
| `GET` | `/allPositions` | Retrieve active intraday (MIS) positions | JWT Bearer (`.lean()`) |
| `POST` | `/allPositions/squareoffAll`| Liquidate all open intraday positions | JWT Bearer |
| `GET` | `/funds` | Retrieve cash balance & collateral summary | JWT Bearer |
| `GET` | `/market/quote/:symbol` | Live stock quote with TTL cache | Public (Cached) |
| `GET` | `/market/history/:symbol`| Historical 5-min candles for interactive charts | Public (Cached) |

---

## 🚀 Local Development & Quickstart

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [MongoDB Atlas](https://www.mongodb.com/) cluster URI or local MongoDB replica set (transactions require replica set mode)

### 1. Clone & Install
```bash
git clone https://github.com/thisisjaypatil8/StockTradingPlatform-.git
cd StockTradingPlatform-

# Install Backend Dependencies
cd backend && npm install

# Install Dashboard Dependencies
cd ../dashboard && npm install

# Install Frontend Dependencies
cd ../frontend && npm install
```

### 2. Environment Configuration
Create a `.env` file in `backend/` using the provided template:
```env
PORT=5000
MONGO_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/zerodha?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here
ADMIN_USERNAME=Admin
ADMIN_EMAIL=admin@zerodha.com
```

### 3. Launch Services
Open three terminal instances:

```bash
# Terminal 1: Backend API Gateway
cd backend
npm run dev
# Running on http://localhost:5000

# Terminal 2: Kite Trading Terminal
cd dashboard
npm run dev
# Running on http://localhost:3000

# Terminal 3: Marketing & Landing Portal
cd frontend
npm run dev
# Running on http://localhost:5173
```

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
