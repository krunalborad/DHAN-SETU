import { useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import { usePortfolio } from "../context/PortfolioContext";
import { useLivePrices } from "../lib/useLivePrices";
import {
  enrichHoldings,
  healthScore,
  sectorAllocation,
  totalInvested,
  totalPortfolioValue,
  HealthBreakdown,
  HoldingWithMetrics,
} from "../lib/analytics";
import { getDayChangePct, getHistory } from "../lib/priceEngine";
import { formatINR, formatPct } from "../lib/format";

const UNUSUAL_MOVE_THRESHOLD = 3;
const HISTORICAL_DIGEST_DAYS_AGO = 2;

type TabId = "digest" | "sentiment" | "unusual";

const TABS: { id: TabId; label: string }[] = [
  { id: "digest", label: "Weekly digest" },
  { id: "sentiment", label: "Sentiment" },
  { id: "unusual", label: "Explain unusual moves" },
];

type Sentiment = "bullish" | "bearish" | "neutral";

type SectorEntry = ReturnType<typeof sectorAllocation>[number];

interface PortfolioAggregate {
  date: Date;
  rows: HoldingWithMetrics[];
  currentValue: number;
  invested: number;
  gainPct: number;
  todayPct: number;
  health: HealthBreakdown;
  topSector: SectorEntry | undefined;
  gainers: HoldingWithMetrics[];
  laggards: HoldingWithMetrics[];
  largest: HoldingWithMetrics | null;
  largestPct: number;
}

interface UnusualRow {
  holding: HoldingWithMetrics;
  change: number;
}

interface SentimentRow {
  holding: HoldingWithMetrics;
  change: number;
  label: Sentiment;
  blurb: string;
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

function sentimentFor(h: HoldingWithMetrics, dayChange: number): Sentiment {
  if (dayChange > 1.5 || h.gainPct > 15) return "bullish";
  if (dayChange < -1.5 || h.gainPct < -10) return "bearish";
  return "neutral";
}

function sentimentBlurb(h: HoldingWithMetrics, dayChange: number, label: Sentiment): string {
  const move = Math.abs(dayChange).toFixed(2);
  if (label === "bullish") {
    return `Strong bullish momentum today with a ${move}% advance, adding to the holding's ${h.gainPct.toFixed(1)}% overall return.`;
  }
  if (label === "bearish") {
    return dayChange < 0
      ? `Selling pressure pushed the stock down ${move}% today, ${h.gainPct < 0 ? `deepening its ${Math.abs(h.gainPct).toFixed(1)}% drawdown` : `despite a ${h.gainPct.toFixed(1)}% overall return`}.`
      : `Today's move was mild, but the position remains under pressure with a ${Math.abs(h.gainPct).toFixed(1)}% overall loss.`;
  }
  return `Price action was largely flat today (${dayChange >= 0 ? "+" : ""}${dayChange.toFixed(2)}%), in line with typical trading.`;
}

function badgeClass(label: Sentiment): string {
  if (label === "bullish") return "bg-gain/15 text-gain";
  if (label === "bearish") return "bg-loss/15 text-loss";
  return "bg-ink-border text-ink70";
}

function buildDigestParagraphs(agg: PortfolioAggregate): string[] {
  if (!agg || agg.rows.length === 0) {
    return ["Add holdings to generate your weekly digest."];
  }
  const { currentValue, invested, gainPct, todayPct, health, topSector, gainers, laggards, largest, largestPct } = agg;

  const p1 = `Your portfolio is currently valued at ${formatINR(currentValue)} against a total invested amount of ${formatINR(
    invested
  )}, reflecting an overall return of ${gainPct.toFixed(2)}% and a ${
    todayPct >= 0 ? "gain" : "loss"
  } of ${Math.abs(todayPct).toFixed(2)}% that day. The portfolio carried a health score of ${
    health.score
  } out of 100${topSector ? `, with ${topSector.sector} standing as the largest sector exposure.` : "."}`;

  const gainersText =
    gainers.length > 0
      ? `Gains were driven by strong performances in ${gainers
          .map((h) => `${h.name}, up ${h.gainPct.toFixed(1)}% at ${formatINR(h.currentValue)}`)
          .join(", alongside ")}.`
      : "";
  const laggardsText =
    laggards.length > 0
      ? ` Conversely, overall returns faced drag from major laggards, led by ${laggards
          .map((h) => `${h.name} (down ${Math.abs(h.gainPct).toFixed(1)}%)`)
          .join(", ")}.`
      : "";
  const p2 = `${gainersText}${laggardsText}`.trim();

  const p3 =
    largest && largestPct > 20
      ? `A key risk to monitor is heavy single-stock concentration, as ${largest.name} alone accounted for ${formatINR(
          largest.currentValue
        )}—over ${largestPct.toFixed(0)}% of the total portfolio value. Informational only, not financial advice.`
      : "Informational only, not financial advice.";

  return [p1, p2, p3].filter(Boolean);
}

function computeHistoricalAggregate(enrichedNow: HoldingWithMetrics[], daysAgo: number): PortfolioAggregate {
  const rows = enrichedNow.map((h) => {
    const hist = getHistory(h.symbol) || [];
    if (hist.length === 0) return { ...h, dayChangeAtDate: 0 };
    const idx = Math.max(0, hist.length - 1 - daysAgo);
    const prevIdx = Math.max(0, idx - 1);
    const price = hist[idx]?.price ?? h.currentPrice;
    const prevPrice = hist[prevIdx]?.price ?? price;
    const currentValue = price * h.quantity;
    const gainPct = h.investedValue ? ((currentValue - h.investedValue) / h.investedValue) * 100 : 0;
    const dayChangeAtDate = prevPrice ? ((price - prevPrice) / prevPrice) * 100 : 0;
    return { ...h, currentPrice: price, currentValue, gainPct, dayChangeAtDate };
  });

  const currentValue = rows.reduce((s, h) => s + h.currentValue, 0);
  const invested = rows.reduce((s, h) => s + h.investedValue, 0);
  const gainPct = invested ? ((currentValue - invested) / invested) * 100 : 0;
  const dayValueChange = rows.reduce((s, h) => s + h.currentValue * (h.dayChangeAtDate / 100), 0);
  const todayPct = currentValue ? (dayValueChange / (currentValue - dayValueChange || 1)) * 100 : 0;

  const sectors = sectorAllocation(rows);
  const topSector = sectors[0];
  const health = healthScore(rows);

  const sortedByReturn = [...rows].sort((a, b) => b.gainPct - a.gainPct);
  const gainers = sortedByReturn.filter((h) => h.gainPct > 0).slice(0, 3);
  const laggards = [...sortedByReturn].reverse().filter((h) => h.gainPct < 0).slice(0, 4);
  const largest = rows.length ? [...rows].sort((a, b) => b.currentValue - a.currentValue)[0] : null;
  const largestPct = largest && currentValue ? (largest.currentValue / currentValue) * 100 : 0;

  const date = new Date();
  date.setDate(date.getDate() - daysAgo);

  return { date, rows, currentValue, invested, gainPct, todayPct, health, topSector, gainers, laggards, largest, largestPct };
}

export default function AiInsights() {
  const { holdings } = usePortfolio();
  useLivePrices();
  const [activeTab, setActiveTab] = useState<TabId>("digest");

  const enriched = useMemo(() => enrichHoldings(holdings), [holdings]);
  const currentValue = totalPortfolioValue(enriched);
  const invested = totalInvested(enriched);
  const gainPct = invested ? ((currentValue - invested) / invested) * 100 : 0;

  const todayValueChange = enriched.reduce(
    (sum, h) => sum + h.currentValue * (getDayChangePct(h.symbol) / 100),
    0
  );
  const todayPct = currentValue
    ? (todayValueChange / (currentValue - todayValueChange || 1)) * 100
    : 0;

  const health = useMemo(() => healthScore(enriched), [enriched]);
  const sectors = useMemo(() => sectorAllocation(enriched), [enriched]);
  const topSector = sectors[0];

  const sortedByReturn = useMemo(() => [...enriched].sort((a, b) => b.gainPct - a.gainPct), [enriched]);
  const gainers = sortedByReturn.filter((h) => h.gainPct > 0).slice(0, 3);
  const laggards = [...sortedByReturn].reverse().filter((h) => h.gainPct < 0).slice(0, 4);
  const largest = enriched.length ? [...enriched].sort((a, b) => b.currentValue - a.currentValue)[0] : null;
  const largestPct = largest && currentValue ? (largest.currentValue / currentValue) * 100 : 0;

  const todayAggregate: PortfolioAggregate = useMemo(
    () => ({
      date: new Date(),
      rows: enriched,
      currentValue,
      invested,
      gainPct,
      todayPct,
      health,
      topSector,
      gainers,
      laggards,
      largest,
      largestPct,
    }),
    [enriched, currentValue, invested, gainPct, todayPct, health, topSector, gainers, laggards, largest, largestPct]
  );
  const pastAggregate = useMemo(
    () => computeHistoricalAggregate(enriched, HISTORICAL_DIGEST_DAYS_AGO),
    [enriched]
  );
  const digestEntries: PortfolioAggregate[] = [todayAggregate, pastAggregate];

  const unusual = useMemo(() => {
    return enriched
      .map((h) => {
        const change = getDayChangePct(h.symbol);
        if (Math.abs(change) < UNUSUAL_MOVE_THRESHOLD) return null;
        return { holding: h, change };
      })
      .filter((item): item is UnusualRow => item !== null)
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  }, [enriched]);

  const sentimentRows: SentimentRow[] = useMemo(
    () =>
      enriched.map((h) => {
        const change = getDayChangePct(h.symbol);
        const label = sentimentFor(h, change);
        return { holding: h, change, label, blurb: sentimentBlurb(h, change, label) };
      }),
    [enriched]
  );

  const SentimentCard = ({ row, compact }: { row: SentimentRow; compact?: boolean }) => (
    <div className={compact ? "" : "rounded-lg border border-ink-border bg-ink-surface p-4"}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-medium text-ink50">{row.holding.symbol}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize font-medium ${badgeClass(row.label)}`}>
          {row.label}
        </span>
      </div>
      <p className="text-xs text-ink70 leading-relaxed">{row.blurb}</p>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="AI Insights"
        subtitle="Generated from your own holdings and price movement. Informational only, never advice."
        actions={
          <div className="flex items-center gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                  activeTab === tab.id
                    ? "bg-gain text-black border-gain font-medium"
                    : "border-ink-border text-ink70 hover:text-ink50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="px-6 md:px-10 pb-10 space-y-6">
        {activeTab === "digest" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-lg border border-ink-border bg-ink-surface p-6 space-y-8">
              {digestEntries.map((entry, i) => (
                <div key={i}>
                  <p className="text-[11px] tracking-wide text-ink70 uppercase mb-1">
                    {i === 0 ? "Weekly digest" : ""}
                  </p>
                  <p className="text-xs text-ink70 mb-4">{formatDate(entry.date)}</p>
                  <div className="space-y-4">
                    {buildDigestParagraphs(entry).map((para, j) => (
                      <p key={j} className="text-sm text-ink50 leading-relaxed">
                        {para}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-ink-border bg-ink-surface p-6">
              <p className="text-[11px] tracking-wide text-ink70 uppercase mb-1">Sentiment</p>
              <p className="text-xs text-ink70 mb-4">From recent price action</p>
              {sentimentRows.length === 0 ? (
                <p className="text-sm text-ink70">Nothing generated yet.</p>
              ) : (
                <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                  {sentimentRows.map((row) => (
                    <SentimentCard key={row.holding.id} row={row} compact />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "sentiment" && (
          <div>
            <p className="text-[11px] tracking-wide text-ink70 uppercase mb-1">Sentiment</p>
            <p className="text-xs text-ink70 mb-4">From recent price action</p>
            {sentimentRows.length === 0 ? (
              <p className="text-sm text-ink70">No holdings yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {sentimentRows.map((row) => (
                  <SentimentCard key={row.holding.id} row={row} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "unusual" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-lg border border-ink-border bg-ink-surface p-6">
              <p className="text-[11px] tracking-wide text-ink70 uppercase mb-4">Unusual activity today</p>
              {unusual.length === 0 ? (
                <p className="text-sm text-ink70">Nothing out of the ordinary right now.</p>
              ) : (
                <ul className="space-y-3">
                  {unusual.slice(0, 6).map(({ holding, change }) => (
                    <li key={holding.id} className="flex items-center justify-between text-sm">
                      <span className="text-ink50">{holding.symbol}</span>
                      <span className={`tnum ${change >= 0 ? "text-gain" : "text-loss"}`}>
                        {formatPct(change)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-lg border border-ink-border bg-ink-surface p-6">
              <p className="text-[11px] tracking-wide text-ink70 uppercase mb-1">Likely causes</p>
              <p className="text-xs text-ink70 mb-4">Unconfirmed, generated from the numbers above</p>
              {unusual.length === 0 ? (
                <p className="text-sm text-ink70">No explanations generated yet.</p>
              ) : (
                <ul className="space-y-3">
                  {unusual.slice(0, 6).map(({ holding, change }) => (
                    <li key={holding.id} className="text-sm">
                      <span className="text-ink50 font-medium">{holding.symbol}</span>
                      <p className="text-xs text-ink70 mt-1">
                        {change > 0
                          ? `Moved up ${Math.abs(change).toFixed(2)}% today — beyond its typical daily range, likely a short-term reaction rather than a fundamental shift.`
                          : `Dropped ${Math.abs(change).toFixed(2)}% today — a sharper move than usual, worth checking for news before assuming it's noise.`}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
