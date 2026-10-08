# Kite Trading Platform

A stock trading app inspired by Zerodha's Kite. Users can sign up, place buy/sell orders, track holdings and intraday positions, and see live stock prices. Built with Node.js, Express, React and MongoDB.

[![Node.js](https://img.shields.io/badge/Node.js-v18+-68a063?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-v18-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Replica_Set-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Security](#security)
- [API Endpoints](#api-endpoints)
- [Getting Started](#getting-started)
- [License](#license)

---

## Features

- Signup and login with JWT
- Place delivery (CNC) and intraday (MIS) orders
- Holdings, positions, orders and funds pages
- Live stock quotes and 5-minute charts (data from Yahoo Finance)
- Automatic square-off of intraday positions at 3:20 PM IST
- Safe order handling: no double orders, no negative balance

---

## Architecture

```
Frontend (React, port 5173)  ──┐
Dashboard (React, port 3000) ──┼──►  Express API (port 5000)  ──►  MongoDB
                               ┘            │
                                            └──►  Yahoo Finance (stock data)
```

- **Frontend**: landing page, signup and login.
- **Dashboard**: the trading terminal (watchlist, orders, holdings, positions).
- **Backend**: REST API, order logic and the square-off scheduler.
- **MongoDB**: stores users, orders, holdings and positions. It must run as a replica set because transactions need it.

---

## Project Structure

```
.
├── backend/
│   ├── controllers/     # orders, market, auth, positions
│   ├── middleware.js    # security, idempotency, market hours, error handling
│   ├── model/           # Mongoose schemas
│   ├── routes/          # Express routes
│   ├── services/        # order logic and square-off scheduler
│   └── utils/           # error class and async wrapper
├── dashboard/           # Trading terminal (port 3000)
└── frontend/            # Landing page and signup (port 5173)
```

---

## How It Works

### 1. Orders use MongoDB transactions
When an order is placed, three things happen: the order is saved, cash is deducted, and the holding or position is updated. All three run in one transaction. If any step fails, everything is rolled back.

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

### 2. Safe wallet deduction
Cash is deducted in a single database query that also checks the balance. So two orders sent at the same time cannot take the balance below zero.

```javascript
const user = await User.findOneAndUpdate(
  { _id: userId, "funds.availableCash": { $gte: amount } },
  { $inc: { "funds.availableCash": -amount } },
  { returnDocument: "after", session }
);
if (!user) throw new ExpressError(400, "Insufficient funds!");
```

### 3. CNC and MIS orders
- **CNC (delivery):** shares are held long term. When you buy more, the average price is recalculated:

  `New Average = (Old Qty × Old Avg + New Qty × New Price) / (Old Qty + New Qty)`

- **MIS (intraday):** positions must be closed the same day.
  - **Short selling:** selling shares you don't own (`netQty < 0`).
  - **Covering a short:** buying back those shares. Profit is:

    `Realized P&L = (Sell Average − Cover Price) × Cover Qty`

### 4. Auto square-off at 3:20 PM
A scheduler (`services/rmsScheduler.js`) runs on Indian time (`Asia/Kolkata`). Every weekday at 3:20 PM it finds open MIS positions (`netQty !== 0`), closes them at the current market price, and adds the profit or loss to the user's cash.

### 5. Market hours check
The server may run in UTC, so the `checkMarketHours` middleware converts the time to IST. MIS orders outside Mon–Fri, 9:15 AM to 3:30 PM IST are rejected with `403 Forbidden`. CNC orders are allowed after market hours.

### 6. Combined requests for stock quotes
If many users ask for the same stock at once, only one request goes to Yahoo Finance and all of them share the result. Results are cached for 60 seconds (quotes) and 5 minutes (history).

---

## Security

### 1. Idempotency key (no double orders)
Each order request sends a unique ID in the `X-Idempotency-Key` header. If the same ID is sent again within 2 minutes (for example, from a double click or a retry), the server returns the saved response and does not place a second order.

### 2. Other protections
- **Helmet:** secure HTTP headers, hides `X-Powered-By`, blocks framing from other sites.
- **NoSQL injection filter (`sanitizeData`):** removes `$` and `.` keys from `req.body`, `req.query` and `req.params`.
- **Rate limit:** `/login` and `/signup` allow 10 requests per 15 minutes per IP.
- **CORS:** only `:5173` and `:3000` are allowed.

### 3. Error handling
Expected errors are separated from real bugs (`isOperational = true`). Common errors are mapped to HTTP codes:

| Error | Status |
|---|---|
| MongoDB `CastError` | 400 |
| Mongoose `ValidationError` | 400 |
| MongoDB duplicate key (`E11000`) | 409 |
| `JsonWebTokenError` / `TokenExpiredError` | 401 |

In development the full stack trace is shown. In production it is hidden.

### 4. Startup and shutdown
- The server starts accepting requests only after MongoDB is connected.
- On `SIGTERM` or `SIGINT`, it finishes active requests, stops accepting new ones, and closes the database connection. If this takes more than 10 seconds, it force-exits.

---

## API Endpoints

| Method | Endpoint | What it does | Protection |
|---|---|---|---|
| POST | `/signup` | Create an account (role is always `user`) | Rate limit |
| POST | `/login` | Log in and get a JWT | Rate limit |
| GET | `/allOrders` | List the user's orders | JWT |
| POST | `/newOrder` | Place a CNC or MIS order | JWT, market hours, idempotency key |
| GET | `/allHoldings` | List delivery holdings | JWT |
| GET | `/allPositions` | List intraday positions | JWT |
| POST | `/allPositions/squareoffAll` | Close all open intraday positions | JWT |
| GET | `/funds` | Cash balance and collateral | JWT |
| GET | `/market/quote/:symbol` | Live quote (cached) | Public |
| GET | `/market/history/:symbol` | 5-minute candles for charts (cached) | Public |

---

## Getting Started

### Requirements
- [Node.js](https://nodejs.org/) v18 or higher
- A MongoDB Atlas cluster, or a local MongoDB replica set (transactions don't work without a replica set)

### 1. Clone and install
```bash
git clone https://github.com/thisisjaypatil8/StockTradingPlatform-.git
cd StockTradingPlatform-

cd backend && npm install
cd ../dashboard && npm install
cd ../frontend && npm install
```

### 2. Set up environment variables
Create a `.env` file inside `backend/`:
```env
PORT=5000
MONGO_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/zerodha?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here
ADMIN_USERNAME=Admin
ADMIN_EMAIL=admin@zerodha.com
```

### 3. Run the apps
Use three terminals:

```bash
# Terminal 1: Backend (http://localhost:5000)
cd backend
npm run dev

# Terminal 2: Dashboard (http://localhost:3000)
cd dashboard
npm run dev

# Terminal 3: Frontend (http://localhost:5173)
cd frontend
npm run dev
```

---

## License
This project is licensed under the [MIT License](LICENSE).