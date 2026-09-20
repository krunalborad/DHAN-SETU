import { useMemo } from "react";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import PortfolioValueChart from "../components/PortfolioValueChart";
import AllocationChart from "../components/AllocationChart";
import HealthBreakdownCard from "../components/HealthBreakdownCard";
import { usePortfolio } from "../context/PortfolioContext";
import { useLivePrices } from "../lib/useLivePrices";
import {
  enrichHoldings,
  healthScore,
  portfolioValueSeries,
  sectorAllocation,
  totalInvested,
  totalPortfolioValue,
} from "../lib/analytics";
import { getDayChangePct } from "../lib/priceEngine";
import { formatINR, formatPct } from "../lib/format";

// Threshold (in %) for flagging a holding as "unusual" today.
const UNUSUAL_MOVE_THRESHOLD = 3;

export default function Dashboard() {
  const { holdings } = usePortfolio();
  useLivePrices();

  const enriched = useMemo(() => enrichHoldings(holdings), [holdings]);
  const currentValue = totalPortfolioValue(enriched);
  const invested = totalInvested(enriched);
  const gain = currentValue - invested;
  const gainPct = invested ? (gain / invested) * 100 : 0;

  const todayValueChange = enriched.reduce(
    (sum, h) => sum + h.currentValue * (getDayChangePct(h.symbol) / 100),
    0
  );
  const todayPct = currentValue ? (todayValueChange / (currentValue - todayValueChange || 1)) * 100 : 0;

  const allocation = useMemo(
    () => sectorAllocation(enriched).map((s) => ({ label: s.sector, value: s.value, pct: s.pct })),
    [enriched]
  );
  const series = useMemo(() => portfolioValueSeries(holdings), [holdings]);
  const health = useMemo(() => healthScore(enriched), [enriched]);

  // Top 5 gainers, then bottom 3 losers (largest loss first) — matches design.
  const sortedByChange = useMemo(
    () =>
      [...enriched].sort(
        (a, b) => getDayChangePct(b.symbol) - getDayChangePct(a.symbol)
      ),
    [enriched]
  );
  const movers = useMemo(() => {
    const gainers = sortedByChange.slice(0, 5);
    const losers = sortedByChange.slice(-3).reverse();
    // avoid duplicating holdings when the portfolio has 8 or fewer names
    const seen = new Set(gainers.map((h) => h.id));
    return [...gainers, ...losers.filter((h) => !seen.has(h.id))];
  }, [sortedByChange]);

  // Per-holding anomaly detection for "Unusual activity"
  const unusual = useMemo(() => {
    return enriched
      .map((h) => {
        const change = getDayChangePct(h.symbol);
        const reasons = [];
        if (Math.abs(change) >= UNUSUAL_MOVE_THRESHOLD) {
          reasons.push(`${change >= 0 ? "Up" : "Down"} ${formatPct(Math.abs(change))} today`);
        }
        return reasons.length ? { holding: h, change, reasons } : null;
      })
      .filter(Boolean)
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  }, [enriched]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`${enriched.length} holdings · prices updated`}
      />

      <div className="px-6 md:px-10 pb-10 space-y-6">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Portfolio value" value={formatINR(currentValue)} sub={`Invested ${formatINR(invested)}`} />
          <StatCard
            label="Total gain / loss"
            value={formatINR(gain)}
            sub={formatPct(gainPct)}
            tone={gain >= 0 ? "gain" : "loss"}
          />
          <StatCard
            label="Today"
            value={formatINR(todayValueChange)}
            sub={formatPct(todayPct)}
            tone={todayValueChange >= 0 ? "gain" : "loss"}
          />
          <StatCard label="Health score" value={`${health.score}/100`} sub={`Grade ${health.grade}`} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-lg border border-ink-border bg-ink-surface p-6">
            <p className="text-[11px] tracking-wide text-ink70 uppercase mb-1">Portfolio value</p>
            <p className="text-xs text-ink70 mb-4">Last 120 days</p>
            <PortfolioValueChart data={series} />
          </div>

          <div className="rounded-lg border border-ink-border bg-ink-surface p-6">
            <p className="text-[11px] tracking-wide text-ink70 uppercase mb-4">Sector mix</p>
            <AllocationChart data={allocation} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <HealthBreakdownCard health={health} />

          <div className="rounded-lg border border-ink-border bg-ink-surface p-6">
            <p className="text-[11px] tracking-wide text-ink70 uppercase mb-4">Today's movers</p>
            <ul className="space-y-3">
              {movers.length === 0 && <li className="text-xs text-ink70">No holdings yet.</li>}
              {movers.map((h) => {
                const change = getDayChangePct(h.symbol);
                return (
                  <li key={h.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-ink50">{h.symbol}</p>
                      <p className="text-xs text-ink70">{h.name}</p>
                    </div>
                    <span className={`tnum text-sm ${change >= 0 ? "text-gain" : "text-loss"}`}>
                      {formatPct(change)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-lg border border-ink-border bg-ink-surface p-6">
            <p className="text-[11px] tracking-wide text-ink70 uppercase mb-1">Unusual activity</p>
            <p className="text-xs text-ink70 mb-4">Big moves or volume spikes today</p>
            {unusual.length === 0 ? (
              <p className="text-xs text-ink70">Nothing out of the ordinary right now.</p>
            ) : (
              <ul className="space-y-3">
                {unusual.slice(0, 6).map(({ holding, change, reasons }) => (
                  <li key={holding.id} className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-ink50">{holding.symbol}</span>
                      <span className={`tnum ${change >= 0 ? "text-gain" : "text-loss"}`}>
                        {formatPct(change)}
                      </span>
                    </div>
                    <p className="mt-1 text-ink70">{reasons.join(" · ")}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <p className="text-[11px] text-ink70 pt-2">
          Prices may be delayed. Everything here is informational only and is not financial advice.
        </p>
      </div>
    </div>
  );
}