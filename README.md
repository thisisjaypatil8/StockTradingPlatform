# 📈 Zerodha Stock Trading Platform & Financial Simulation Engine

> A production-hardened, full-stack stock trading platform replicating Zerodha's Kite ecosystem. Built with a high-integrity financial ledger, multi-document ACID transactions, an autonomous 03:20 PM Risk Management System (RMS) liquidation daemon, and an in-memory caching gateway for live market data.

---

## 🏛️ System Architecture

```
[ React / Vite Dashboard (Port 3000) ] & [ Landing Page (Port 5173) ]
                     │
                     │  (HTTP / JSON with JWT Bearer Interceptor)
                     ▼
       ┌───────────────────────────────┐
       │     Express.js API Gateway    │  (Port 5000)
       └──────────────┬────────────────┘
                      │
   ┌──────────────────┴──────────────────┐
   ▼                                     ▼
[ Security & Bouncer Pipeline ]       [ Market Data Proxy Gateway ]
  • isLoggedIn (JWT verify)              • In-Memory TTL Cache (60s quote, 4m history)
  • checkMarketHours (IST Guard)         • Yahoo Finance Upstream (Rate-limit shielded)
   │
   ▼
[ Multi-Document ACID Transaction Engine ]
   ├── Orders Collection (Audit Trail & Executed Orders)
   ├── User Wallet Ledger (Atomic Conditional $gte Cash Deductions)
   └── Holdings & Positions (Weighted Averages, Short Covering, P&L)
   │
   ▼
[ Autonomous Server Daemons ]
   └── rmsScheduler.js (Auto 03:20 PM Mon-Fri Intraday Liquidation)
```

---

## ⚡ Core Financial Engineering & Architectural Primitives

### 1. Multi-Document ACID Transactions (`session.withTransaction`)
In real-world financial systems, partial database writes are fatal (e.g. cash is deducted, but a network blip prevents the stock holding from being recorded).
- All order placements (`POST /newOrder`) execute within a **MongoDB ACID Session Transaction**.
- Order creation, cash ledger adjustment, and portfolio updates commit together or roll back completely on any failure:
```javascript
const session = await mongoose.startSession();
try {
  await session.withTransaction(async () => {
    await newOrder.save({ session });
    await User.findOneAndUpdate(..., { session });
    await Holdings.save({ session });
  });
} finally {
  await session.endSession();
}
```

### 2. Concurrency Control & Atomic Conditional Wallet Updates
Eliminates race conditions where two simultaneous orders can overdraft a user's cash balance.
- Instead of vulnerable sequential `findById` -> `if (cash < cost)` -> `update`, deductions execute as a single atomic database query:
```javascript
const updatedUser = await User.findOneAndUpdate(
  { _id: req.user.id, "funds.availableCash": { $gte: orderCost } },
  { $inc: { "funds.availableCash": -orderCost } },
  { returnDocument: "after", session }
);
if (!updatedUser) throw new ExpressError(400, "Insufficient funds!");
```

### 3. CNC vs MIS Modes & Accounting Mathematics
- **Delivery (CNC):** Lifetime asset ownership in Demat. Weighted average holding price formula:
  $$\text{New Avg} = \frac{(\text{Current Qty} \times \text{Current Avg}) + (\text{Order Qty} \times \text{Order Price})}{\text{Current Qty} + \text{Order Qty}}$$
- **Intraday (MIS):** Same-day leverage trading with Long / Short positions.
  - **Short Selling:** Selling shares without prior ownership (`netQty < 0`).
  - **Short Covering:** Buying back shorted shares with realized profit/loss calculated as:
    $$\text{Realized P&L} = (\text{Sell Avg} - \text{Cover Price}) \times \text{Cover Qty}$$

### 4. Autonomous 03:20 PM RMS Auto Square-Off Daemon
- Under SEBI/brokerage regulations, intraday MIS positions cannot be carried overnight.
- A background server daemon (`services/rmsScheduler.js`) monitors Indian Standard Time (`Asia/Kolkata`).
- Every weekday at exactly **03:20 PM IST**, the daemon automatically sweeps all open MIS positions (`netQty !== 0`), executes counter-orders at CMP, and settles the net realized P&L directly into the user's cash wallet.

### 5. Timezone-Safe Market Hours Guard Middleware
- Servers in production (AWS / Render) run on UTC time.
- `checkMarketHours` normalizes server timestamps to `Asia/Kolkata` IST.
- Rejects off-market (outside Mon–Fri 09:15–15:30 IST) MIS orders with `403 Forbidden`, while permitting After-Market CNC orders and Admin simulator overrides.

### 6. Reverse Proxy Caching Gateway
- Caches live Yahoo Finance stock quotes in an in-memory TTL map (`quoteCache` with 60s TTL, `historyCache` with 4m TTL).
- Reduces upstream network latency by ~90% and shields against external rate-limiting (`429 Too Many Requests`).

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend UI** | React 18, Vite, React Router v6, Axios with Request/Response Interceptors |
| **Backend API** | Node.js (v20+ LTS), Express.js (v4/v5 line) |
| **Database** | MongoDB Atlas (Multi-Document Replica Set), Mongoose ODM |
| **Authentication** | JSON Web Tokens (JWT), Passport.js, Bcrypt password hashing |
| **Market Data** | Yahoo Finance Chart/Quote API Proxy with In-Memory TTL Cache |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas cluster URI or local MongoDB replica set

### 1. Clone the repository
```bash
git clone https://github.com/your-username/StockTradingPlatform.git
cd StockTradingPlatform
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in `backend/`:
```env
PORT=5000
MONGO_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/zerodha?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key
ADMIN_USERNAME=Admin
ADMIN_EMAIL=admin@zerodha.com
```
Start backend:
```bash
npm run dev # or nodemon index.js
```

### 3. Dashboard Setup
```bash
cd ../dashboard
npm install
npm run dev
```
Dashboard runs on: `http://localhost:3000`

### 4. Frontend Landing Page Setup
```bash
cd ../frontend
npm install
npm run dev
```
Landing page runs on: `http://localhost:5173`

---

## 📊 Key API Endpoints

| Method | Endpoint | Description | Protection |
|---|---|---|---|
| `POST` | `/signup` | Register new user account with hashed password | Public |
| `POST` | `/login` | Authenticate credentials & issue JWT token | Public |
| `GET` | `/allOrders` | Retrieve user order book history | JWT Bearer |
| `POST` | `/newOrder` | Place CNC/MIS trade with ACID transaction & RMS guard | JWT Bearer + Market Hours |
| `GET` | `/allHoldings` | Retrieve active delivery (CNC) holdings | JWT Bearer |
| `GET` | `/allPositions` | Retrieve active intraday (MIS) positions | JWT Bearer |
| `POST` | `/allPositions/squareoffAll` | Emergency 1-click liquidation of all open MIS positions | JWT Bearer |
| `GET` | `/funds` | Retrieve cash wallet balance & collateral | JWT Bearer |
| `GET` | `/market/quote/:symbol` | Live stock CMP with in-memory TTL caching | Public / Client |
| `GET` | `/market/history/:symbol` | Historical 5-min chart candles for interactive modal | Public / Client |

---

## 📜 Placement Interview Talking Points (SDE-1)
- **ACID Transaction Guarantees:** *"I engineered order placement using MongoDB multi-document transactions so that order creation, balance deduction, and holding creation succeed or fail atomically as a single business operation."*
- **Race Condition Prevention:** *"To prevent concurrent double-spending, I implemented conditional atomic `$gte` decrements on the wallet balance directly at the database layer rather than checking in application memory."*
- **Autonomous Risk Management:** *"I implemented a server-side background daemon running on Indian Standard Time that automatically liquidates all open intraday positions at 03:20 PM and settles realized P&L directly into the cash ledger."*
