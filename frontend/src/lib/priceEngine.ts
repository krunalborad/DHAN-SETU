import { STOCK_UNIVERSE } from "./universe";
import { PricePoint } from "../types";

/**
 * PRICE ENGINE — SIMULATED FEED
 * -------------------------------------------------------------------------
 * This module stands in for a real market-data API (Alpha Vantage, Twelve
 * Data, Finnhub, or an NSE/BSE wrapper). It runs a bounded random walk per
 * symbol so the UI has live, believable price movement without needing an
 * API key to demo the product.
 *
 * TO GO LIVE:
 *   Replace `getLatestPrice` / `subscribe` with real HTTP polling or a
 *   WebSocket connection to your provider, and keep the same function
 *   signatures so no consuming component needs to change.
 * -------------------------------------------------------------------------
 */

type Listener = (symbol: string, price: number) => void;

const listeners = new Set<Listener>();
const livePrices = new Map<string, number>();
const dayOpen = new Map<string, number>();
const history = new Map<string, PricePoint[]>();

function seed() {
  const now = Date.now();
  STOCK_UNIVERSE.forEach((s) => {
    livePrices.set(s.symbol, s.basePrice);
    dayOpen.set(s.symbol, s.basePrice);
    const points: PricePoint[] = [];
    // seed 90 days of daily history via a random walk ending at basePrice
    let p = s.basePrice * (0.82 + Math.random() * 0.1);
    for (let i = 90; i >= 0; i--) {
      const drift = (Math.random() - 0.48) * (s.basePrice * 0.012);
      p = Math.max(s.basePrice * 0.5, p + drift);
      points.push({ t: now - i * 86400000, price: Number(p.toFixed(2)) });
    }
    points[points.length - 1].price = s.basePrice;
    history.set(s.symbol, points);
  });
}
seed();

function tick() {
  STOCK_UNIVERSE.forEach((s) => {
    const current = livePrices.get(s.symbol) ?? s.basePrice;
    const volatility = s.basePrice * 0.0015;
    const next = Math.max(0.5, current + (Math.random() - 0.5) * volatility);
    const rounded = Number(next.toFixed(2));
    livePrices.set(s.symbol, rounded);
    listeners.forEach((fn) => fn(s.symbol, rounded));
  });
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startPriceEngine(intervalMs = 2500) {
  if (intervalId) return;
  intervalId = setInterval(tick, intervalMs);
}

export function stopPriceEngine() {
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getLatestPrice(symbol: string): number {
  return livePrices.get(symbol) ?? getStockFallback(symbol);
}

export function getDayChangePct(symbol: string): number {
  const open = dayOpen.get(symbol) ?? getLatestPrice(symbol);
  const latest = getLatestPrice(symbol);
  if (!open) return 0;
  return ((latest - open) / open) * 100;
}

export function getHistory(symbol: string): PricePoint[] {
  return history.get(symbol) ?? [];
}

function getStockFallback(symbol: string) {
  return STOCK_UNIVERSE.find((s) => s.symbol === symbol)?.basePrice ?? 0;
}