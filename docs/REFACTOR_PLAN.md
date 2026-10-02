# Industry-Standard Code Refactor Plan

**Status:** Design only. No application code is changed by this document.  
**Companions:** [MATH_AUDIT.md](./MATH_AUDIT.md), [MATH_IMPROVEMENT_PLAN.md](./MATH_IMPROVEMENT_PLAN.md)

This plan is a **full-stack refactor** of the repo as it exists today (`backend`, `dashboard`, `frontend`): structure, libraries, duplication, and practices. Money identities stay in the math docs; this file is **how the code should be organized** so those identities cannot fragment again.

---

## 1. Target shape (what “industry standard” means here)

Retail brokers and serious fintech backends share the same layers, even if they use Java/Go instead of Node:

```text
Clients (thin)
  → HTTP API (auth, validate, map DTO)
    → Application services (use-cases: place order, deposit, square-off)
      → Domain (pure: fills, money, margin, session clock)
      → Adapters (Mongo, Yahoo, Redis, clock)
```

**Rules that do not move:**

| Rule | Today | Target |
| --- | --- | --- |
| Fills / P&L / equity | Split across `orderService`, `portfolioMath`, JSX rows | One **domain package**, imported by API **and** tests. UI never invents formulas. |
| Money | `Number` + `toFixed` | Integer **paise** (or `decimal.js`) in domain; rupees only on the wire/UI. |
| Controllers | Mix HTTP + RMS + market | HTTP only. No scheduler inside a controller. |
| Validation | Hand-rolled in middleware | Schema library once (`zod`). Same schema for OpenAPI. |
| Auth | JWT in query string + `localStorage` + env-admin check in **two** React apps | HttpOnly cookie **or** Bearer never in URL; admin **only** from DB `role`. |
| Config | Hardcoded `localhost` ports | Env + Vite `import.meta.env`. |
| Tests | One script that `console.log`s | Runner + assertions + CI. |

Do **not** rewrite CSS, marketing copy, or Yahoo wrappers in the same PR as the ledger. Sequence is in §8.

---

## 2. Recommended repository layout (monorepo)

Keep three apps, add **shared packages**. Yarn/npm/pnpm workspaces are enough; Nx/Turborepo is optional later.

```text
apps/
  api/                 # today’s backend (Express)
  kite/                # today’s dashboard (Vite React)
  www/                 # today’s frontend landing + login
packages/
  domain/              # fills, money, margin, portfolio identities (NO Express, NO React)
  api-contract/        # zod schemas + TS types + OpenAPI
  config/              # symbols, products, IST session constants
  eslint-config/
docs/                  # this folder stays
```

**Why:** `dashboard/src/utils/portfolioMath.js` duplicating `orderService.applyFill` is the core architectural failure. A `packages/domain` that both `api` and tests import is the industry fix (same idea as a JVM `trading-core` JAR).

If a true monorepo is too large for the next sprint: put domain on the **server** and return a `PortfolioSummary` DTO. The dashboard **must not** keep a second engine. That is the minimum viable SSOT.

---

## 3. Where to use libraries (and where not to)

Adopt a library when it replaces **policy you would get wrong** (money, time, validation, auth hashing, logs). Do **not** add a library for a 20-line helper.

### 3.1 Backend (`apps/api`)

| Concern | Use | Do not |
| --- | --- | --- |
| HTTP | Keep **Express 5** | Nest only if the team wants DI/modules later; not required |
| Validation | **zod** (or **Valibot**) on every body/query | Hand-written `Number(qty)` in three files |
| Money | **`decimal.js`** *or* integer paise `bigint` in `packages/domain` | `Number.toFixed` on running balances |
| Time / IST | **`luxon`** (`DateTime.now().setZone("Asia/Kolkata")`) until Node **Temporal** is default | `toLocaleString` → `new Date(string)` |
| Auth password | **passport-local-mongoose** can stay *or* switch to **argon2** + JWT | Re-implement hashing |
| JWT API | `jsonwebtoken` **or** **jose**; issue from login only | Decode JWT in the browser to *grant* admin |
| Auth for SPA | Prefer **httpOnly + Secure + SameSite cookies** + CSRF for cookie mode | JWT in `/?token=` (leaks in history, logs, Referer) |
| Idempotency | **Redis** (`SET key NX PX`) in production | In-process `Map` (lost on restart, not shared across instances) |
| Rate limit | Keep **express-rate-limit**; store in Redis in prod | Memory store behind multiple Node processes |
| Mongo | Keep **mongoose**; add **replica set** (you already need it for transactions) | Transactions on a standalone node |
| Logging | **pino** + `pino-http` | `console.log` / emoji as ops logs |
| Errors | Keep one `AppError` (today `ExpressError`) | Mixing `res.status(401).json` and `throw` in the same controller |
| HTTP sanitizing | **mongo-sanitize** or mongoose `sanitizeFilter` | Home-grown `$` strip if you forget `req.query` immutability on Express 5 |
| Jobs | **node-cron** *or* a real worker (**BullMQ** + Redis) for RMS | `setInterval` inside the API process (missed ticks, no lock) |
| Market data | Keep **yahoo-finance2** behind a **port interface** | Call Yahoo from React |
| Tests | **node:test** or **Vitest** | `assert` + print “PASSED” |
| API docs | **zod-to-openapi** or hand OpenAPI | README as the only contract |

**Remove / avoid**

- **`body-parser`** — unused with Express 5 `express.json()`.
- New chart libraries — you already have Chart.js + lightweight-charts; pick **one** per job (candles vs doughnuts).
- **Moment.js** — dead; use Luxon.
- **Lodash** for one `groupBy` — native JS.

### 3.2 Dashboard (`apps/kite`)

| Concern | Use | Do not |
| --- | --- | --- |
| Data fetching | **TanStack Query** (`useQuery` / `useMutation`) | N independent `useEffect` + `fetch` (watchlist, funds, holdings, positions) |
| HTTP | Keep **axios** *or* `fetch` wrapper — **one** client | Hardcoded `http://localhost:5000` |
| Forms (order ticket) | **react-hook-form** + zod resolver | Ad-hoc `useState` for qty/price with string concat risk |
| Routing | Keep **react-router** | |
| UI kit | You already have **MUI** — use it for dialogs instead of `alert`/`confirm`/`prompt` | Mixing MUI icons with raw `window.prompt` for square-off price |
| Charts | **lightweight-charts** for OHLC; Chart.js only if you still want the holdings bar | Synthetic OHLC (`p * 1.001`) presented as market data |
| State | Query cache + small React context for session | Recalculating equity in Summary **and** Funds **and** Holdings |
| Money display | Shared `formatInr` from `packages/domain` or `apps/kite/lib/format` | Inline `toFixed` / `formatK` on **legal** balances |
| Types | **TypeScript** (incremental `allowJs`) | New files in JS if the domain is TS |

### 3.3 Marketing / login (`apps/www`)

| Concern | Use | Notes |
| --- | --- | --- |
| Keep **Vite + React + Bootstrap** | Fine for a brochure site | Do not upgrade React 19 in `www` and leave `kite` on 18 without a reason — **align versions**. |
| Auth | Same API client + cookie/token helper as kite | Extract `packages/auth-client` so login/logout/handoff is not copied. |
| Routing | react-router | Token handoff must **not** be query params (see §6). |

### 3.4 Libraries you should **not** add yet

- NestJS, Prisma, GraphQL, Kafka, gRPC — complexity without a second team or volume.
- Redux Toolkit — TanStack Query covers server state; remaining UI state is tiny.
- Microservices split (orders vs market) — one API + clear modules is the standard at this size.

---

## 4. Duplication map (delete or merge)

### 4.1 Financial (highest cost)

| Duplicated idea | Locations | Single owner |
| --- | --- | --- |
| Weighted average / `applyFill` | `backend/services/orderService.js` | `packages/domain/fills` |
| Unrealized `(ltp-avg)*qty` | `portfolioMath.js`, `Holdings.jsx` rows | `packages/domain/portfolio` |
| Margin `abs(qty)*avg/5` | `orderService.calculateMarginBlocked`, `portfolioMath` fallback | `packages/domain/margin` |
| `round2` | `backend/utils/math.js` vs client `toFixed` | `packages/domain/money` |
| Equity / cumulative P&L | `portfolioMath` + comments + broken test | Domain + `GET /v1/portfolio` |
| INR format | `formatCurrency` / `formatPnL` / `formatK` / inline `toLocaleString` | One `formatInr` |
| Net % vs avg | `PortfolioContext` | Domain `pctChange` |

**Practice:** if a formula appears in JSX, it is already a bug.

### 4.2 Auth and admin

| Duplicated idea | Locations | Single owner |
| --- | --- | --- |
| “Is this the env admin?” | `backend/controllers/auth.js` `checkIsAdminIdentifier`, `dashboard/src/App.jsx` `verifyIsAdmin` | **Server only.** Client trusts `user.role` from `/me`. |
| JWT issue payload | signup + login copy-paste | `authService.signAccessToken(user)` |
| Token in `localStorage` | `AuthContext.jsx`, `App.jsx`, `api.js` | `auth-client` |
| Redirect to `:5173/signup` | dashboard `api.js` + `App.jsx` | Env `VITE_WWW_URL` |

### 4.3 Market and quotes

| Duplicated idea | Locations | Single owner |
| --- | --- | --- |
| Batch vs single quote | `WatchListItem` N+1 GET vs `fetchBatchQuotes` | Always batch; one `useQuotes(symbols)` |
| LTP attach to holdings/positions | `PortfolioContext`, `usePositions` | `useLivePrices(symbols)` then merge |
| `%` and `isLoss` | `marketUtils.formatQuote` vs client | Server quote DTO is canonical |

### 4.4 HTTP / Express

| Duplicated idea | Locations | Single owner |
| --- | --- | --- |
| `wrapAsync` | per-route | Express 5 async errors **or** one wrapper — not both styles |
| `isLoggedIn` vs public | routes | Default authenticated router; `/health` `/v1/auth` `/v1/market` public |
| RMS in controller | `positions.js` exports `executeGlobalAutoSquareOff` | `rmsService` + scheduler; controller only calls service |
| Market imported from controller | `positions.js` → `controllers/market.getCurrentStockPrice` | `marketService` only |

### 4.5 UI

| Duplicated idea | Locations | Single owner |
| --- | --- | --- |
| Loading “Loading X…” | Holdings, Positions, Funds, Summary | `<PageSpinner />` |
| Profit/loss CSS class | every table | `pnlClass(n)` |
| `alert` after orders | `BuyActionWindow`, `usePositions` | Toast component |
| CSS | CSS modules **and** `BuyActionWindow.css` **and** inline styles | Modules + CSS variables; no new inline layout |
| Static `dashboard/src/data/data.js` holdings | demo vs live Mongo | Demo flag **or** delete; do not mix into live tables |

### 4.6 Schema / model

Mongoose **Schema in `schemas/` + Model in `model/`** is already a split — keep it, but:

- One **canonical field set** (see math plan): drop `qty`+`netQty`, `avg`+`avgEntry`, `buyQty` as “current net”.
- DTOs (`OrderResponse`) ≠ Mongo documents. Map in the service.

---

## 5. Backend coding practices (API module design)

### 5.1 Layer per feature

Example: orders

```text
routes/v1/orders.routes.js     # path + middleware chain
controllers/orders.controller.js  # req/res only
services/order.service.js      # transaction orchestration
domain (package)               # applyFill, money
repos/holdings.repo.js         # mongoose queries
```

**Controllers must not:** start Mongo sessions, call Yahoo, run RMS, or compute avg.

**Services must not:** read `req` or set `res`.

### 5.2 Versioned REST

Today: `/allHoldings`, `/newOrder`, `/` mixed.

Target:

```text
GET  /health
POST /v1/auth/login
POST /v1/auth/logout
GET  /v1/me
GET  /v1/market/quotes?symbols=
GET  /v1/holdings
GET  /v1/positions
GET  /v1/orders
POST /v1/orders
GET  /v1/funds
POST /v1/funds/deposits
POST /v1/funds/withdrawals
GET  /v1/portfolio          # SSOT metrics
POST /v1/positions/square-off
POST /v1/positions/square-off-all
```

Breaking change: add `/v1` first, keep aliases one release, then delete.

### 5.3 Validation once

Replace `validateOrderInput` + funds `Number(amount)` with:

```text
packages/api-contract/order.ts   → OrderCreateSchema
packages/api-contract/funds.ts
```

Middleware: `validate(OrderCreateSchema)`.  
Tick size and market hours are **domain/session**, not zod (zod checks shape; domain checks business).

### 5.4 Errors

- Operational errors: `throw new AppError(code, httpStatus, publicMessage)`.
- Never `res.status` inside `login` **and** `throw` elsewhere — pick throw + central handler.
- Client contract: `{ error: { code, message } }` always. Today Funds/Orders/Auth shapes differ (`error` vs `message`).

### 5.5 Transactions and idempotency

- Keep `session.withTransaction` for place-order.
- Idempotency: Redis key = `userId + header`, store **status + body**; required for `POST /v1/orders` (today optional header is a footgun).
- Client: **UUID per click**, not `Date.now() + Math.random()`.

### 5.6 Config

```text
PORT, MONGO_URL, JWT_SECRET, REDIS_URL,
CORS_ORIGINS, ADMIN via DB not env match on the client,
YAHOO timeouts, RMS_CRON
```

Fail fast if `JWT_SECRET` or `MONGO_URL` missing (`index.js` currently trusts them).

### 5.7 Logging and observability

- `pino` with `requestId` (from `X-Request-Id` or uuid).
- Log **orderId, userId, symbol, product** — never password, never full JWT.
- RMS: log skipped symbols when LTP missing (never fill at `100`).

### 5.8 Security practices (code-level)

- Stop putting JWT in the dashboard URL.
- `helmet` CSP tuned for the two origins.
- CORS from env, not only localhost.
- `express-rate-limit` on **login and order** routes, not only auth.
- Relocate `sanitizeData` after `express.json`; if Express 5 `req.query` is a getter, use a supported sanitizer.
- `signup` currently constructs `role: "user"` then still has `assignRole` unused — delete dead code; **never** take `role` from the body.

### 5.9 Controllers must not own daemons

Move `executeGlobalAutoSquareOff` out of `controllers/positions.js`.  
Scheduler takes a **Redis lock** (`rms:squareoff:YYYY-MM-DD`) so two API replicas do not double-liquidate.

---

## 6. Frontend coding practices

### 6.1 One session model

```text
www login → Set-Cookie or postMessage/opener handshake → kite
GET /v1/me → { user, role }
```

Delete `atob(jwt.split('.')[1])` admin logic in `App.jsx`.  
Align **React and router major versions** across `www` and `kite`.

### 6.2 Data layer

```text
kite/src/api/client.ts          # axios + env baseURL
kite/src/api/hooks/useHoldings.ts
kite/src/api/hooks/usePositions.ts
kite/src/api/hooks/useFunds.ts
kite/src/api/hooks/usePortfolio.ts   # summary DTO
kite/src/api/hooks/useQuotes.ts      # batched
```

`PortfolioContext` becomes unnecessary if Query has `["portfolio"]` and mutations `invalidateQueries`.

### 6.3 Feature folders (you are close)

Keep:

```text
components/features/{holdings,positions,funds,orders,watchlist,summary}
components/shared/{modals,charts,ui}
```

Move **hooks next to features** (`usePositions.js` is good).  
Shared math **leaves** `utils/portfolioMath.js` except formatters.

### 6.4 UI practices

- No `window.location.reload()` after an order (`BuyActionWindow`).
- No `window.prompt` for prices — order ticket modal.
- Accessible buttons, not clickable `<span>` pills without `button`.
- CSS variables for profit `#4caf50` / loss `#df4949` (repeated in TopBar inline).

### 6.5 Env

```text
VITE_API_URL=http://localhost:5000
VITE_WWW_URL=http://localhost:5173
```

Never commit secrets. Admin username in Vite env is **not** authorization.

---

## 7. Testing, quality gates, DX

| Layer | What to run | Tool |
| --- | --- | --- |
| Domain | Fill vectors, paise, equity identity | Vitest in `packages/domain` |
| API | Order + funds with Mongo memory or testcontainers | Supertest |
| UI | Holdings table renders DTO | Vitest + Testing Library (already in dashboard `package.json` but unused) |
| Lint | ESLint + unused-imports | Shared `eslint-config` |
| Types | `tsc --noEmit` | TS on domain + api first |
| Format | Prettier | one root config |
| Git | husky + lint-staged optional | |
| CI | install, test, lint, build all apps | GitHub Actions |

Replace `backend/package.json` `"test": "echo Error"` with a real command.  
Replace `test_math_reconciliation.js` “PASSED” without `assert` on equity (see math audit).

**Definition of a unit:** no I/O. `applyFill` is a unit. `executeOrder` is an integration test.

---

## 8. Phased refactor (do not Big-Bang)

Align with [MATH_IMPROVEMENT_PLAN.md](./MATH_IMPROVEMENT_PLAN.md). Code structure phases:

| Phase | Scope | Done when |
| --- | --- | --- |
| **R0** | Policy + folder names + `/v1` aliases | Routes documented |
| **R1** | Extract `packages/domain` (or `backend/domain`) from `applyFill` + money; tests | UI still old, engine one file |
| **R2** | Thin controllers; RMS + market only via services | No controller→controller imports |
| **R3** | `GET /v1/portfolio`; dashboard consumes DTO; delete metric duplication in JSX | Summary = Funds = Holdings header |
| **R4** | zod contract, pino, env CORS, remove body-parser, Redis idempotency | |
| **R5** | TanStack Query, batch quotes, drop reload/alert | |
| **R6** | Auth cookie or fragment handoff; delete client admin env check | |
| **R7** | TypeScript migration file-by-file (`allowJs`) | New files are TS |
| **R8** | Charges, margin cash, ledger (math plan Phases 2–3) | |

Never mix R5 CSS polish with R1 money extraction in one commit.

---

## 9. Coding standards checklist (for every new PR)

- [ ] Formula lives in domain, with a test, or it does not ship  
- [ ] Amounts: paise internally; `en-IN` only in formatters  
- [ ] No new `console.log` in request path; use logger  
- [ ] No `localhost` in source; env only  
- [ ] No duplicate Mongo fields for the same quantity  
- [ ] Mutations invalidate query keys, no full page reload  
- [ ] Errors: `AppError` + one JSON shape  
- [ ] POST money routes: idempotency key required  
- [ ] Controllers < ~40 lines; no transactions there  
- [ ] Public marketing site does not import trading domain (bundle size)

---

## 10. What to keep (do not refactor away)

These are already the right instincts:

- Mongo **transactions** for place-order  
- Atomic cash `$inc` with `availableCash >= amount`  
- `wrapAsync` + central `errorHandler`  
- Helmet, CORS allowlist, auth rate limit  
- Order input middleware (qty integer, BUY/SELL, CNC/MIS)  
- Market quote cache + in-flight coalescing + concurrency pool  
- Feature folders on the dashboard  
- `fetchBatchQuotes` (extend it to watchlist)  
- Graceful shutdown on SIGTERM  

The refactor **narrows** those into modules and **stops** a second copy from growing in React.

---

## 11. Out of scope

Pixel-perfect Zerodha CSS, real UPI, KYC, exchange colocation, replacing Yahoo with Bloomberg. Those are product, not this refactor.

Money correctness remains gated on the math docs; this file is the **engineering** vehicle to implement them without duplicating the engine again.
