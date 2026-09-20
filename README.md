# DHAN SETU — Stock Portfolio Tracker

A professional stock portfolio tracker: top-nav dashboard, holdings with
inline edit/delete, watchlist, sector + market-cap analytics with a
rebalancing tool, dividend income tracking, an Indian equity capital-gains
tax estimator, AI-style insights, price alerts, and a community leaderboard.

This project ships in two parts:

- **`/frontend`** — a fully working React + TypeScript app. Runs standalone
  with **zero configuration**, using a simulated live price feed and
  browser `localStorage` for persistence. This is what you'll actually
  click around in.
- **`/backend`** — an Express + MongoDB API (auth, holdings, watchlist,
  alerts, dividends) ready to wire up for real multi-device persistence
  and login.

---

## Quick start (frontend only — recommended first run)

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). No environment
variables, API keys, or database needed — it works immediately with demo
data and a simulated live price feed.

### Build for production

```bash
cd frontend
npm run build
npm run preview   # serves the production build locally to sanity-check it
```

---

## Pages

| Page | What it shows |
|---|---|
| **Dashboard** | Portfolio value, gain/loss, today's move, health score, value-over-time chart, sector mix donut, health breakdown, today's movers, unusual-activity flag |
| **Holdings** | Full position table (qty, buy price, LTP, invested, value, P&L, today's move) with inline **Add / Edit / Delete**, plus multi-broker CSV import |
| **Watchlist** | Stocks you're tracking but don't own, with a one-click "Add to holdings" |
| **Analytics** | Allocation by sector and by market cap, a concentration list, and a rebalancing tool (set target sector weights → see current/target/drift/action), plus a what-if backtest simulator |
| **Dividends** | Received all-time / this year, projected next 12 months, yield on cost, payment history, and expected income by holding sorted by yield |
| **Tax** | LTCG/STCG classification per holding, estimated tax if sold today, loss-harvesting candidates, and positions nearly crossing into long-term |
| **AI Insights** | A plain-English weekly summary and a per-holding bullish/neutral/bearish signal (both rule-based today — see below for how to make them real) |
| **Alerts** | Price alerts (above/below a threshold), checked client-side against the simulated feed |
| **Community** | An anonymized leaderboard comparing your return % against demo peers by risk bucket |

---

## What's simulated vs. real

| Feature | Current state | To make it real |
|---|---|---|
| Stock prices | Simulated random-walk feed, seeded with realistic base prices (`frontend/src/lib/priceEngine.ts`) | Swap in Alpha Vantage, Twelve Data, Finnhub, or an NSE/BSE wrapper. Keep the same function signatures (`getLatestPrice`, `subscribe`, `getHistory`) so no component needs to change. |
| AI Insights (summary + per-stock signal) | Locally generated from price movement, no API call (`frontend/src/lib/summary.ts`, signal logic in `pages/AiInsights.tsx`) | Send holdings + recent news to an LLM (Anthropic/OpenAI) from your backend and stream the response back. |
| Tax estimates | Real LTCG/STCG rules and math (`frontend/src/lib/tax.ts`), but **informational only** | This is genuinely correct logic for the current Indian equity rules (12.5% LTCG above ₹1.25L exemption, 20% STCG) — the "not real" part is just that it doesn't know your other income, prior realized gains this year, or pre-2018 grandfathering. Always keep the adviser disclaimer. |
| Price alerts | Checked client-side against the simulated feed; no notifications sent | Add a `node-cron` job on the backend (already a dependency) that checks active alerts against real prices and sends email via Nodemailer / SMS via Twilio. |
| Community leaderboard | Fixed demo peers, computed locally | Needs a real backend endpoint aggregating opted-in users' return % — never raw holdings. |
| Data persistence | Browser `localStorage` (per-device only) | Wire the frontend's `PortfolioContext` to call the included backend API instead of `localStorage` — the data shapes already match. |
| Auth | None — "Sign out" just resets the demo data | The backend already has JWT register/login (`/api/auth/register`, `/api/auth/login`) ready to connect. |

---

## Backend setup (optional — for real persistence & auth)

```bash
cd backend
cp .env.example .env
# edit .env: set MONGODB_URI (e.g. a free MongoDB Atlas cluster) and JWT_SECRET
npm install
npm run dev
```

The API starts on `http://localhost:5000` by default. Health check:
`GET /api/health` → `{ "status": "ok" }`.

### API overview

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create an account |
| POST | `/api/auth/login` | — | Log in, returns a JWT |
| GET | `/api/auth/me` | ✅ | Current user |
| GET / POST | `/api/holdings` | ✅ | List / add a holding |
| POST | `/api/holdings/bulk` | ✅ | Bulk-insert holdings (CSV import) |
| DELETE | `/api/holdings/:id` | ✅ | Remove a holding |
| GET / POST | `/api/watchlist` | ✅ | List / add a watchlist symbol |
| DELETE | `/api/watchlist/:id` | ✅ | Remove a watchlist symbol |
| GET / POST | `/api/alerts` | ✅ | List / create a price alert |
| PATCH / DELETE | `/api/alerts/:id` | ✅ | Update (pause/resume) / remove an alert |
| GET / POST | `/api/dividends` | ✅ | List / log a dividend |
| DELETE | `/api/dividends/:id` | ✅ | Remove a dividend entry |

Protected routes expect `Authorization: Bearer <token>`.

### Connecting the frontend to the backend

Right now `frontend/src/context/PortfolioContext.tsx` reads/writes through
`frontend/src/lib/storage.ts` (localStorage). To use the real backend
instead:

1. Create `frontend/src/lib/api.ts` with `fetch` calls to the routes above
   (base URL from an env var, e.g. `VITE_API_URL`).
2. Swap the `loadState`/`saveState` calls in `PortfolioContext.tsx` for
   calls into `api.ts`.
3. Add a login screen that calls `/api/auth/login` and stores the returned
   JWT, then attaches it as an `Authorization` header on every request.

The data shapes in `frontend/src/types.ts` already match the Mongoose
schemas in `backend/src/models`, so this is a mechanical swap rather than a
redesign.

---

## Tech stack

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router,
Recharts.

**Backend:** Node.js, Express, MongoDB (Mongoose), JWT auth (bcryptjs +
jsonwebtoken), node-cron (ready for scheduled alert checks).

**Design:** Deep-ink dark theme with a green accent (`#27D9A3`) and
tabular monospace figures for financial data, top navigation bar — see
`frontend/tailwind.config.js` for the full token set.

---

## Project structure

```
stock-portfolio-tracker/
├── frontend/
│   ├── src/
│   │   ├── components/     UI components (charts, modals, cards, nav)
│   │   ├── context/        Global portfolio state (localStorage-backed)
│   │   ├── lib/             Business logic: pricing, analytics, tax, CSV, format
│   │   ├── pages/           Route-level pages (Dashboard, Holdings, Tax, etc.)
│   │   ├── types.ts         Shared TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
└── backend/
    ├── src/
    │   ├── config/db.js       MongoDB connection
    │   ├── middleware/        Auth + error handling
    │   ├── models/            Mongoose schemas
    │   ├── routes/            Express routers
    │   ├── app.js
    │   └── server.js
    └── package.json
```

---

## Notes on accuracy

- **Tax math is real logic, not a mockup.** `frontend/src/lib/tax.ts`
  implements the actual weighted long/short-term classification (>365 days
  held) and the current LTCG (12.5% above ₹1,25,000 exemption) / STCG (20%)
  rates. It's a genuine calculator against whatever holdings are in the
  app — just not a substitute for a tax adviser, since it doesn't know
  your other income or prior realized gains this year.
- **Health score, sector/market-cap allocation, and rebalancing** are all
  computed from your actual holdings data (`frontend/src/lib/analytics.ts`)
  — not hardcoded to match the screenshots, so the numbers will change
  correctly as you add, edit, or remove holdings.
- **AI Insights and dividend yields** are the two things built on
  simplifying assumptions: sentiment/signal is a simple rule (today's move
  + overall return, not real news), and dividend yields are static per
  stock in `universe.ts` rather than pulled from a live source.

## Live Deploy Link

## https://dhan-setu-alpha.vercel.app
