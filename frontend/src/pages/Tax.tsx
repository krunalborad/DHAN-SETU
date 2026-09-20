import { useMemo } from "react";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import { usePortfolio } from "../context/PortfolioContext";
import { useLivePrices } from "../lib/useLivePrices";
import { enrichHoldings } from "../lib/analytics";
import { buildTaxTable, lossHarvestingCandidates, nearlyLongTerm, summarizeTax } from "../lib/tax";
import { formatINR, formatPct } from "../lib/format";

export default function Tax() {
  const { holdings } = usePortfolio();
  useLivePrices();
  const enriched = useMemo(() => enrichHoldings(holdings), [holdings]);
  const rows = useMemo(() => buildTaxTable(enriched), [enriched]);
  const summary = useMemo(() => summarizeTax(rows), [rows]);
  const harvestCandidates = useMemo(() => lossHarvestingCandidates(rows), [rows]);
  const nearlyLong = useMemo(() => nearlyLongTerm(rows), [rows]);

  return (
    <div>
      <PageHeader
        title="Tax"
        subtitle="Estimates only, based on today's prices. Confirm with your tax adviser before acting."
      />

      <div className="px-6 md:px-10 pb-10 space-y-6">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Long-term gains"
            value={formatINR(summary.longTermGains)}
            sub="Held over 12 months"
            tone={summary.longTermGains >= 0 ? "gain" : "loss"}
          />
          <StatCard
            label="Short-term gains"
            value={formatINR(summary.shortTermGains)}
            sub="Held under 12 months"
            tone={summary.shortTermGains >= 0 ? "gain" : "loss"}
          />
          <StatCard label="LTCG tax @12.5%" value={formatINR(summary.ltcgTax)} sub="After ₹1,25,000 exemption" />
          <StatCard label="STCG tax @20%" value={formatINR(summary.stcgTax)} sub={`Total estimate ${formatINR(summary.totalTax)}`} />
        </section>

        <div className="rounded-lg border border-ink-border overflow-hidden">
          <div className="px-6 py-4 border-b border-ink-border bg-ink-surface">
            <p className="text-[11px] tracking-wide text-ink70 uppercase">Holding-by-holding</p>
            <p className="text-xs text-ink70 mt-0.5">Unrealized gain or loss if sold today</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] tracking-wide text-ink70 uppercase border-b border-ink-border">
                  <th className="px-6 py-3 font-medium">Stock</th>
                  <th className="px-6 py-3 font-medium">Term</th>
                  <th className="px-6 py-3 font-medium">Held</th>
                  <th className="px-6 py-3 font-medium">Gain / loss</th>
                  <th className="px-6 py-3 font-medium">Return</th>
                  <th className="px-6 py-3 font-medium">Est. tax if sold</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-xs text-ink70">
                      No holdings yet.
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr key={r.symbol} className="border-b border-ink-border last:border-0">
                    <td className="px-6 py-3">
                      <p className="text-ink50">{r.symbol}</p>
                      <p className="text-xs text-ink70">{r.name}</p>
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded border ${
                          r.term === "Long term"
                            ? "text-gain border-gain/40 bg-gain/10"
                            : "text-ink70 border-ink-border"
                        }`}
                      >
                        {r.term}
                      </span>
                    </td>
                    <td className="px-6 py-3 tnum text-ink70">{r.heldDays}d</td>
                    <td className={`px-6 py-3 tnum ${r.gain >= 0 ? "text-gain" : "text-loss"}`}>
                      {formatINR(r.gain)}
                    </td>
                    <td className={`px-6 py-3 tnum ${r.gainPct >= 0 ? "text-gain" : "text-loss"}`}>
                      {formatPct(r.gainPct)}
                    </td>
                    <td className="px-6 py-3 tnum text-ink50">
                      {r.estTaxIfSold > 0 ? formatINR(r.estTaxIfSold) : "₹0"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-lg border border-ink-border bg-ink-surface p-6">
            <p className="text-[11px] tracking-wide text-ink70 uppercase mb-1">Loss harvesting candidates</p>
            <p className="text-xs text-ink70 mb-4">Losses can offset gains in the same year</p>
            <ul className="space-y-2.5">
              {harvestCandidates.length === 0 && (
                <li className="text-xs text-ink70">No unrealized losses right now.</li>
              )}
              {harvestCandidates.map((r) => (
                <li key={r.symbol} className="flex items-center justify-between text-sm">
                  <span className="text-ink50">{r.symbol}</span>
                  <span className="tnum text-loss">{formatINR(r.gain)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-ink-border bg-ink-surface p-6">
            <p className="text-[11px] tracking-wide text-ink70 uppercase mb-1">Nearly long term</p>
            <p className="text-xs text-ink70 mb-4">Waiting past 12 months lowers the rate from 20% to 12.5%</p>
            <ul className="space-y-2.5">
              {nearlyLong.length === 0 && <li className="text-xs text-ink70">Nothing crossing over soon.</li>}
              {nearlyLong.map((r) => (
                <li key={r.symbol} className="flex items-center justify-between text-sm">
                  <span className="text-ink50">{r.symbol}</span>
                  <span className="tnum text-ink70">
                    {r.daysToLongTerm === 0 ? "Today" : `${r.daysToLongTerm} days to go`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}