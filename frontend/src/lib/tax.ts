import { HoldingWithMetrics } from "./analytics";

/**
 * TAX ESTIMATOR — INDIAN EQUITY CAPITAL GAINS (informational only)
 * -------------------------------------------------------------------------
 * Rules modeled (as of the 2024 Union Budget changes, effective for
 * transfers on/after 23 Jul 2024):
 *   - Long-term (held > 365 days): 12.5% on gains above a ₹1,25,000
 *     per-year exemption, no indexation.
 *   - Short-term (held ≤ 365 days): flat 20%.
 * This is a simplification for demo purposes — it doesn't account for
 * grandfathering rules for pre-2018 purchases, other income slabs, or
 * gains already realized elsewhere in the tax year. Always a clear
 * "confirm with a tax adviser" disclaimer belongs next to this output.
 * -------------------------------------------------------------------------
 */

export const LTCG_EXEMPTION = 125000;
export const LTCG_RATE = 0.125;
export const STCG_RATE = 0.2;
export const LONG_TERM_DAYS = 365;

export interface TaxRow {
  symbol: string;
  name: string;
  term: "Long term" | "Short term";
  heldDays: number;
  gain: number;
  gainPct: number;
  estTaxIfSold: number;
  daysToLongTerm: number;
}

export function heldDays(buyDate: string) {
  const ms = Date.now() - new Date(buyDate).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}

export function buildTaxTable(holdings: HoldingWithMetrics[]): TaxRow[] {
  return holdings
    .map((h) => {
      const days = heldDays(h.buyDate);
      const isLongTerm = days > LONG_TERM_DAYS;
      return {
        symbol: h.symbol,
        name: h.name,
        term: (isLongTerm ? "Long term" : "Short term") as TaxRow["term"],
        heldDays: days,
        gain: h.gainAbs,
        gainPct: h.gainPct,
        // per-row estimate assumes the LTCG exemption is applied at the
        // portfolio level (see summarizeTax), so this is pre-exemption gain × rate
        estTaxIfSold: h.gainAbs > 0 ? h.gainAbs * (isLongTerm ? LTCG_RATE : STCG_RATE) : 0,
        daysToLongTerm: Math.max(0, LONG_TERM_DAYS - days),
      };
    })
    .sort((a, b) => b.heldDays - a.heldDays);
}

export function summarizeTax(rows: TaxRow[]) {
  const longTermGains = rows.filter((r) => r.term === "Long term").reduce((s, r) => s + Math.max(0, r.gain), 0);
  const shortTermGains = rows.filter((r) => r.term === "Short term").reduce((s, r) => s + Math.max(0, r.gain), 0);

  const taxableLongTerm = Math.max(0, longTermGains - LTCG_EXEMPTION);
  const ltcgTax = taxableLongTerm * LTCG_RATE;
  const stcgTax = shortTermGains * STCG_RATE;

  return {
    longTermGains,
    shortTermGains,
    ltcgTax,
    stcgTax,
    totalTax: ltcgTax + stcgTax,
  };
}

export function lossHarvestingCandidates(rows: TaxRow[]) {
  return rows.filter((r) => r.gain < 0).sort((a, b) => a.gain - b.gain);
}

export function nearlyLongTerm(rows: TaxRow[], withinDays = 30) {
  return rows.filter((r) => r.term === "Short term" && r.daysToLongTerm <= withinDays);
}
