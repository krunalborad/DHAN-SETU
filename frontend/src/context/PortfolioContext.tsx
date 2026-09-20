import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DividendEntry, Goal, Holding, PriceAlert, Sip, Trade, WatchlistItem } from "../types";
import { loadState, saveState } from "../lib/storage";
import { startPriceEngine } from "../lib/priceEngine";
import { openQuantity } from "../lib/trades";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

interface PortfolioContextValue {
  holdings: Holding[];
  watchlist: WatchlistItem[];
  alerts: PriceAlert[];
  dividends: DividendEntry[];
  trades: Trade[];
  sips: Sip[];
  goals: Goal[];
  addHolding: (h: Omit<Holding, "id">) => void;
  addHoldings: (hs: Omit<Holding, "id">[]) => void;
  updateHolding: (id: string, patch: Partial<Omit<Holding, "id">>) => void;
  removeHolding: (id: string) => void;
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (id: string) => void;
  addAlert: (a: Omit<PriceAlert, "id" | "createdAt" | "active">) => void;
  removeAlert: (id: string) => void;
  toggleAlert: (id: string) => void;
  addDividend: (d: Omit<DividendEntry, "id">) => void;
  removeDividend: (id: string) => void;
  addTrade: (t: Omit<Trade, "id">) => { ok: boolean; error?: string };
  removeTrade: (id: string) => void;
  addSip: (s: Omit<Sip, "id">) => void;
  toggleSip: (id: string) => void;
  removeSip: (id: string) => void;
  addGoal: (g: Omit<Goal, "id" | "createdAt">) => void;
  removeGoal: (id: string) => void;
  resetDemoData: () => void;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

const DEFAULT_HOLDINGS: Holding[] = [
  { id: uid(), symbol: "RELIANCE", quantity: 40, buyPrice: 2380.5, buyDate: "2025-07-24T00:00:00.000Z" },
  { id: uid(), symbol: "TCS", quantity: 25, buyPrice: 3210.0, buyDate: "2025-09-16T00:00:00.000Z" },
  { id: uid(), symbol: "INFY", quantity: 60, buyPrice: 1420.75, buyDate: "2025-11-21T00:00:00.000Z" },
  { id: uid(), symbol: "HDFCBANK", quantity: 45, buyPrice: 1560.2, buyDate: "2026-01-06T00:00:00.000Z" },
  { id: uid(), symbol: "ITC", quantity: 150, buyPrice: 398.4, buyDate: "2026-02-08T00:00:00.000Z" },
  { id: uid(), symbol: "TATAMOTORS", quantity: 80, buyPrice: 620.1, buyDate: "2026-03-21T00:00:00.000Z" },
  { id: uid(), symbol: "SUNPHARMA", quantity: 30, buyPrice: 1180.0, buyDate: "2026-04-11T00:00:00.000Z" },
  { id: uid(), symbol: "ZOMATO", quantity: 300, buyPrice: 168.3, buyDate: "2026-05-19T00:00:00.000Z" },
  { id: uid(), symbol: "POLYCAB", quantity: 8, buyPrice: 4850.0, buyDate: "2026-06-19T00:00:00.000Z" },
  { id: uid(), symbol: "AAPL", quantity: 10, buyPrice: 15770.7, buyDate: "2025-11-01T00:00:00.000Z" },
];

const DEFAULT_WATCHLIST: WatchlistItem[] = [
  { id: uid(), symbol: "WIPRO", addedAt: new Date().toISOString() },
  { id: uid(), symbol: "BHARTIARTL", addedAt: new Date().toISOString() },
];

const DEFAULT_DIVIDENDS: DividendEntry[] = [
  { id: uid(), symbol: "HDFCBANK", amountPerShare: 19.5, exDate: "2026-10-22T00:00:00.000Z", paidDate: "2026-10-22T00:00:00.000Z" },
  { id: uid(), symbol: "RELIANCE", amountPerShare: 10, exDate: "2026-10-12T00:00:00.000Z", paidDate: "2026-10-12T00:00:00.000Z" },
  { id: uid(), symbol: "INFY", amountPerShare: 20, exDate: "2026-09-12T00:00:00.000Z", paidDate: "2026-09-12T00:00:00.000Z" },
  { id: uid(), symbol: "TCS", amountPerShare: 27, exDate: "2026-08-23T00:00:00.000Z", paidDate: "2026-08-23T00:00:00.000Z" },
  { id: uid(), symbol: "ITC", amountPerShare: 6.25, exDate: "2026-08-03T00:00:00.000Z", paidDate: "2026-08-03T00:00:00.000Z" },
];

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [holdings, setHoldings] = useState<Holding[]>(() => loadState("holdings", DEFAULT_HOLDINGS));
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => loadState("watchlist", DEFAULT_WATCHLIST));
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => loadState("alerts", []));
  const [dividends, setDividends] = useState<DividendEntry[]>(() => loadState("dividends", DEFAULT_DIVIDENDS));
  const [trades, setTrades] = useState<Trade[]>(() => loadState("trades", []));
  const [sips, setSips] = useState<Sip[]>(() => loadState("sips", []));
  const [goals, setGoals] = useState<Goal[]>(() => loadState("goals", []));

  useEffect(() => {
    startPriceEngine();
  }, []);

  useEffect(() => saveState("holdings", holdings), [holdings]);
  useEffect(() => saveState("watchlist", watchlist), [watchlist]);
  useEffect(() => saveState("alerts", alerts), [alerts]);
  useEffect(() => saveState("dividends", dividends), [dividends]);
  useEffect(() => saveState("trades", trades), [trades]);
  useEffect(() => saveState("sips", sips), [sips]);
  useEffect(() => saveState("goals", goals), [goals]);

  const value = useMemo<PortfolioContextValue>(
    () => ({
      holdings,
      watchlist,
      alerts,
      dividends,
      trades,
      sips,
      goals,
      addHolding: (h) => setHoldings((prev) => [...prev, { ...h, id: uid() }]),
      addHoldings: (hs) => setHoldings((prev) => [...prev, ...hs.map((h) => ({ ...h, id: uid() }))]),
      updateHolding: (id, patch) =>
        setHoldings((prev) => prev.map((h) => (h.id === id ? { ...h, ...patch } : h))),
      removeHolding: (id) => setHoldings((prev) => prev.filter((h) => h.id !== id)),
      addToWatchlist: (symbol) =>
        setWatchlist((prev) =>
          prev.some((w) => w.symbol === symbol)
            ? prev
            : [...prev, { id: uid(), symbol, addedAt: new Date().toISOString() }]
        ),
      removeFromWatchlist: (id) => setWatchlist((prev) => prev.filter((w) => w.id !== id)),
      addAlert: (a) =>
        setAlerts((prev) => [
          ...prev,
          { ...a, id: uid(), active: true, createdAt: new Date().toISOString() },
        ]),
      removeAlert: (id) => setAlerts((prev) => prev.filter((a) => a.id !== id)),
      toggleAlert: (id) =>
        setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))),
      addDividend: (d) => setDividends((prev) => [...prev, { ...d, id: uid() }]),
      removeDividend: (id) => setDividends((prev) => prev.filter((d) => d.id !== id)),

      addTrade: (t) => {
        if (t.side === "SELL") {
          const available = openQuantity(trades, t.symbol);
          if (t.quantity > available + 1e-6) {
            return {
              ok: false,
              error: `Only ${available} open unit${available === 1 ? "" : "s"} of ${t.symbol} in the trade ledger.`,
            };
          }
        }
        setTrades((prev) => [...prev, { ...t, id: uid() }]);
        return { ok: true };
      },
      removeTrade: (id) => setTrades((prev) => prev.filter((t) => t.id !== id)),

      addSip: (s) => setSips((prev) => [...prev, { ...s, id: uid() }]),
      toggleSip: (id) =>
        setSips((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))),
      removeSip: (id) => setSips((prev) => prev.filter((s) => s.id !== id)),

      addGoal: (g) => setGoals((prev) => [...prev, { ...g, id: uid(), createdAt: new Date().toISOString() }]),
      removeGoal: (id) => setGoals((prev) => prev.filter((g) => g.id !== id)),

      resetDemoData: () => {
        setHoldings(DEFAULT_HOLDINGS.map((h) => ({ ...h, id: uid() })));
        setWatchlist(DEFAULT_WATCHLIST.map((w) => ({ ...w, id: uid() })));
        setAlerts([]);
        setDividends(DEFAULT_DIVIDENDS.map((d) => ({ ...d, id: uid() })));
        setTrades([]);
        setSips([]);
        setGoals([]);
      },
    }),
    [holdings, watchlist, alerts, dividends, trades, sips, goals]
  );

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolio must be used within a PortfolioProvider");
  return ctx;
}