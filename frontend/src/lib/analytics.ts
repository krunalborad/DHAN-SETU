import { Holding, MarketCap, Sector } from "../types";
import { getHistory, getLatestPrice } from "./priceEngine";
import { getStock } from "./universe";

export interface HoldingWithMetrics extends Holding {
  currentPrice: number;
  currentValue: number;
  investedValue: number;
  gainAbs: number;
  gainPct: number;
  sector: Sector;
  marketCap: MarketCap;
  name: string;
}

export function enrichHoldings(holdings: Holding[]): HoldingWithMetrics[] {
  return holdings.map((h) => {
    const stock = getStock(h.symbol);
    const currentPrice = getLatestPrice(h.symbol);
    const currentValue = currentPrice * h.quantity;
    const investedValue = h.buyPrice * h.quantity;
    const gainAbs = currentValue - investedValue;
    const gainPct = investedValue ? (gainAbs / investedValue) * 100 : 0;
    return {
      ...h,
      currentPrice,
      currentValue,
      investedValue,
      gainAbs,
      gainPct,
      sector: stock?.sector ?? "IT",
      marketCap: stock?.marketCap ?? "Large Cap",
      name: stock?.name ?? h.symbol,
    };
  });
}

export function totalPortfolioValue(holdings: HoldingWithMetrics[]) {
  return holdings.reduce((sum, h) => sum + h.currentValue, 0);
}

export function totalInvested(holdings: HoldingWithMetrics[]) {
  return holdings.reduce((sum, h) => sum + h.investedValue, 0);
}

function groupAllocation<T extends string>(
  holdings: HoldingWithMetrics[],
  key: (h: HoldingWithMetrics) => T
) {
  const map = new Map<T, number>();
  holdings.forEach((h) => {
    map.set(key(h), (map.get(key(h)) ?? 0) + h.currentValue);
  });
  const total = totalPortfolioValue(holdings) || 1;
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value, pct: (value / total) * 100 }))
    .sort((a, b) => b.value - a.value);
}

export function sectorAllocation(holdings: HoldingWithMetrics[]) {
  return groupAllocation(holdings, (h) => h.sector).map((r) => ({ sector: r.label, value: r.value, pct: r.pct }));
}

export function marketCapAllocation(holdings: HoldingWithMetrics[]) {
  return groupAllocation(holdings, (h) => h.marketCap).map((r) => ({ label: r.label, value: r.value, pct: r.pct }));
}

export function concentrationList(holdings: HoldingWithMetrics[]) {
  const total = totalPortfolioValue(holdings) || 1;
  return [...holdings]
    .map((h) => ({ symbol: h.symbol, value: h.currentValue, pct: (h.currentValue / total) * 100 }))
    .sort((a, b) => b.pct - a.pct);
}

export interface HealthBreakdown {
  score: number;
  grade: string;
  diversification: number;
  sectorSpread: number;
  concentration: number;
  volatilityComfort: number;
  weightedBeta: number;
  headline: string;
}

const SECTOR_BETA: Record<Sector, number> = {
  Tech: 1.25,
  IT: 0.95,
  Energy: 1.1,
  Financials: 1.05,
  FMCG: 0.7,
  Pharma: 0.8,
  Auto: 1.15,
  Industrials: 1.1,
  Telecom: 0.9,
};

function gradeFor(score: number) {
  if (score >= 85) return "A+";
  if (score >= 75) return "A";
  if (score >= 60) return "B";
  if (score >= 45) return "C";
  return "D";
}

/**
 * Portfolio Health Score (0-100), broken into four sub-scores so the user
 * can see *why* the number is what it is, not just the number itself.
 */
export function healthScore(holdings: HoldingWithMetrics[]): HealthBreakdown {
  if (holdings.length === 0) {
    return {
      score: 0,
      grade: "—",
      diversification: 0,
      sectorSpread: 0,
      concentration: 0,
      volatilityComfort: 0,
      weightedBeta: 0,
      headline: "Add holdings to generate a health score.",
    };
  }

  const total = totalPortfolioValue(holdings) || 1;
  const sectors = sectorAllocation(holdings);

  // Herfindahl-Hirschman Index on sector weights: 0 = perfectly diversified
  const hhi = sectors.reduce((sum, s) => sum + Math.pow(s.pct / 100, 2), 0);
  const diversification = Math.round(Math.max(0, 100 - hhi * 100));

  // Distinct sector count relative to the sectors available in the universe
  const sectorSpread = Math.round(Math.min(100, sectors.length * 16));

  // Largest single-stock weight
  const largestPosition = Math.max(...holdings.map((h) => h.currentValue / total));
  const concentration = Math.round(Math.max(0, 100 - largestPosition * 180));

  // Volatility comfort: penalize heavy weight in high-beta sectors
  const weightedBeta = sectors.reduce(
    (sum, s) => sum + (s.pct / 100) * (SECTOR_BETA[s.sector as Sector] ?? 1),
    0
  );
  const volatilityComfort = Math.round(Math.max(0, Math.min(100, 100 - (weightedBeta - 0.7) * 60)));

  const score = Math.round(
    diversification * 0.3 + sectorSpread * 0.2 + concentration * 0.3 + volatilityComfort * 0.2
  );

  const topSector = sectors[0];
  const headline = topSector
    ? `Largest sector ${topSector.sector} is a ${topSector.pct > 40 ? "concentrated" : "healthy"} ${topSector.pct.toFixed(0)}% of the book.`
    : "";

  return {
    score: Math.max(0, Math.min(100, score)),
    grade: gradeFor(score),
    diversification,
    sectorSpread,
    concentration,
    volatilityComfort,
    weightedBeta: Number(weightedBeta.toFixed(2)),
    headline,
  };
}

/**
 * Builds a portfolio-value-over-time series by summing, for each historical
 * date, the simulated price × quantity of every holding already purchased
 * by that date.
 */
export function portfolioValueSeries(holdings: Holding[]) {
  if (holdings.length === 0) return [] as { date: string; value: number }[];

  const perSymbolHistory = new Map(holdings.map((h) => [h.symbol, getHistory(h.symbol)]));
  const dayCount = Math.max(...Array.from(perSymbolHistory.values()).map((h) => h.length), 0);

  const series: { date: string; value: number }[] = [];
  for (let i = 0; i < dayCount; i++) {
    let value = 0;
    let ts = 0;
    holdings.forEach((h) => {
      const hist = perSymbolHistory.get(h.symbol);
      const point = hist?.[i];
      if (!point) return;
      ts = point.t;
      const purchased = new Date(h.buyDate).getTime() <= point.t;
      if (purchased) value += point.price * h.quantity;
    });
    if (ts) series.push({ date: new Date(ts).toISOString(), value: Number(value.toFixed(2)) });
  }
  return series;
}

export function rebalanceSuggestions(
  holdings: HoldingWithMetrics[],
  targets: Record<Sector, number>
) {
  const total = totalPortfolioValue(holdings) || 1;
  const current = sectorAllocation(holdings);
  const currentMap = new Map(current.map((c) => [c.sector, c.pct]));

  return (Object.keys(targets) as Sector[])
    .map((sector) => {
      const currentPct = currentMap.get(sector) ?? 0;
      const targetPct = targets[sector];
      const deltaPct = targetPct - currentPct;
      const deltaValue = (deltaPct / 100) * total;
      return { sector, currentPct, targetPct, deltaPct, deltaValue };
    })
    .sort((a, b) => Math.abs(b.deltaValue) - Math.abs(a.deltaValue));
}

export function whatIfReturn(investedAmount: number, entryPrice: number, currentPrice: number) {
  const units = entryPrice > 0 ? investedAmount / entryPrice : 0;
  const finalValue = units * currentPrice;
  const gain = finalValue - investedAmount;
  const gainPct = investedAmount ? (gain / investedAmount) * 100 : 0;
  return { finalValue, gain, gainPct };
}