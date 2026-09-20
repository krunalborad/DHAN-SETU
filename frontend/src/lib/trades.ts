import { Trade } from "../types";
import { getStock } from "./universe";
import { LONG_TERM_DAYS, LTCG_EXEMPTION, LTCG_RATE, STCG_RATE } from "./tax";

/**
 * TRADE LEDGER — FIFO MATCHING
 * -------------------------------------------------------------------------
 * The Trades page is a standalone buy/sell log, independent of the
 * Holdings CRUD on the Holdings page. Each SELL is matched against the
 * oldest open BUY lots first (FIFO — the standard method for determining
 * both realized gain and long/short-term holding period, which is why
 * this uses FIFO rather than the weighted-average method: average cost
 * blends purchase dates together and can't cleanly answer "how long was
 * this specific lot held," which the tax classification needs).
 * -------------------------------------------------------------------------
 */

export interface TradeRow extends Trade {
  realized: number | null;
  term: "Long term" | "Short term" | null;
}

interface Lot {
  quantity: number;
  price: number;
  date: string;
}

export function computeTradeLedger(trades: Trade[]): TradeRow[] {
  const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const openLots = new Map<string, Lot[]>();
  const rowById = new Map<string, TradeRow>();

  sorted.forEach((t) => {
    if (t.side === "BUY") {
      const lots = openLots.get(t.symbol) ?? [];
      lots.push({ quantity: t.quantity, price: t.price, date: t.date });
      openLots.set(t.symbol, lots);
      rowById.set(t.id, { ...t, realized: null, term: null });
      return;
    }

    // SELL — consume oldest lots first
    const lots = openLots.get(t.symbol) ?? [];
    let remaining = t.quantity;
    let realized = 0;
    let earliestConsumedDate: string | null = null;

    while (remaining > 1e-6 && lots.length > 0) {
      const lot = lots[0];
      const take = Math.min(lot.quantity, remaining);
      realized += (t.price - lot.price) * take;
      if (!earliestConsumedDate || new Date(lot.date) < new Date(earliestConsumedDate)) {
        earliestConsumedDate = lot.date;
      }
      lot.quantity -= take;
      remaining -= take;
      if (lot.quantity <= 1e-6) lots.shift();
    }
    openLots.set(t.symbol, lots);

    const heldDays = earliestConsumedDate
      ? Math.floor((new Date(t.date).getTime() - new Date(earliestConsumedDate).getTime()) / 86400000)
      : 0;
    const term = heldDays > LONG_TERM_DAYS ? "Long term" : "Short term";

    rowById.set(t.id, { ...t, realized, term });
  });

  // Return in original (newest-first) display order
  return trades
    .map((t) => rowById.get(t.id)!)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function tradeLedgerSummary(rows: TradeRow[]) {
  const sells = rows.filter((r) => r.side === "SELL" && r.realized !== null);
  const realizedTotal = sells.reduce((sum, r) => sum + (r.realized ?? 0), 0);
  const longTermGains = sells
    .filter((r) => r.term === "Long term")
    .reduce((sum, r) => sum + Math.max(0, r.realized ?? 0), 0);
  const shortTermGains = sells
    .filter((r) => r.term === "Short term")
    .reduce((sum, r) => sum + Math.max(0, r.realized ?? 0), 0);

  const taxableLongTerm = Math.max(0, longTermGains - LTCG_EXEMPTION);
  const estimatedTax = taxableLongTerm * LTCG_RATE + shortTermGains * STCG_RATE;

  return { realizedTotal, longTermGains, shortTermGains, estimatedTax };
}

/** Held quantity for a symbol within the trade ledger itself (FIFO remainder). */
export function openQuantity(trades: Trade[], symbol: string): number {
  const sorted = [...trades]
    .filter((t) => t.symbol === symbol)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let qty = 0;
  sorted.forEach((t) => {
    qty += t.side === "BUY" ? t.quantity : -t.quantity;
  });
  return Math.max(0, qty);
}

export function tickerLabel(symbol: string) {
  return getStock(symbol)?.name ?? symbol;
}