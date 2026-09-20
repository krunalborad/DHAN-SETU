import { useMemo, useState } from "react";
import { HoldingWithMetrics, rebalanceSuggestions, sectorAllocation } from "../lib/analytics";
import { Sector } from "../types";
import { formatINR } from "../lib/format";

const ALL_SECTORS: Sector[] = [
  "Tech",
  "IT",
  "Energy",
  "Financials",
  "FMCG",
  "Pharma",
  "Auto",
  "Industrials",
  "Telecom",
];

export default function RebalanceTool({ holdings }: { holdings: HoldingWithMetrics[] }) {
  const current = useMemo(() => sectorAllocation(holdings), [holdings]);
  const presentSectors = current.map((c) => c.sector);

  const [targets, setTargets] = useState<Record<Sector, number>>(() => {
    const base: Record<string, number> = {};
    const evenSplit = presentSectors.length ? 100 / presentSectors.length : 0;
    ALL_SECTORS.forEach((s) => (base[s] = presentSectors.includes(s) ? Number(evenSplit.toFixed(1)) : 0));
    return base as Record<Sector, number>;
  });

  const [saved, setSaved] = useState(false);
  const suggestions = useMemo(() => rebalanceSuggestions(holdings, targets), [holdings, targets]);
  const targetTotal = presentSectors.reduce((sum, s) => sum + (targets[s] ?? 0), 0);

  if (holdings.length === 0) {
    return (
      <div className="rounded-lg border border-ink-border bg-ink-surface p-6">
        <p className="text-[11px] tracking-wide text-ink70 uppercase mb-1">Rebalancing</p>
        <p className="text-xs text-ink70">Add holdings to get rebalancing suggestions.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-ink-border bg-ink-surface p-6">
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="text-[11px] tracking-wide text-ink70 uppercase mb-1">Rebalancing</p>
          <p className="text-xs text-ink70">
            Set a target weight per sector — targets should add up to 100%. Currently{" "}
            <span className={Math.round(targetTotal) === 100 ? "text-gain" : "text-loss"}>
              {targetTotal.toFixed(0)}%
            </span>
            .
          </p>
        </div>
        <button
          onClick={() => setSaved(true)}
          className="bg-brand text-ink text-xs font-medium rounded-md px-4 py-2 hover:bg-brand-soft transition-colors shrink-0"
        >
          {saved ? "Saved" : "Save targets"}
        </button>
      </div>

      <div className="space-y-3 my-6">
        {presentSectors.map((sector) => (
          <div key={sector} className="flex items-center gap-3">
            <span className="w-24 text-xs text-ink70 shrink-0">{sector}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={targets[sector] ?? 0}
              onChange={(e) => {
                setSaved(false);
                setTargets((prev) => ({ ...prev, [sector]: Number(e.target.value) }));
              }}
              className="flex-1 accent-brand"
            />
            <span className="tnum text-xs text-ink50 w-10 text-right">{(targets[sector] ?? 0).toFixed(0)}%</span>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto -mx-6 border-t border-ink-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] tracking-wide text-ink70 uppercase">
              <th className="px-6 py-3 font-medium">Sector</th>
              <th className="px-6 py-3 font-medium">Current</th>
              <th className="px-6 py-3 font-medium">Target</th>
              <th className="px-6 py-3 font-medium">Drift</th>
              <th className="px-6 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map((s) => (
              <tr key={s.sector} className="border-t border-ink-border">
                <td className="px-6 py-3 text-ink50">{s.sector}</td>
                <td className="px-6 py-3 tnum text-ink70">{s.currentPct.toFixed(1)}%</td>
                <td className="px-6 py-3 tnum text-ink70">{s.targetPct.toFixed(1)}%</td>
                <td className={`px-6 py-3 tnum ${s.deltaPct >= 0 ? "text-gain" : "text-loss"}`}>
                  {s.deltaPct >= 0 ? "+" : ""}
                  {s.deltaPct.toFixed(1)}%
                </td>
                <td className="px-6 py-3 text-right">
                  {Math.abs(s.deltaValue) < 1 ? (
                    <span className="text-xs text-ink70">On target</span>
                  ) : (
                    <span className={`tnum text-xs ${s.deltaValue > 0 ? "text-gain" : "text-loss"}`}>
                      {s.deltaValue > 0 ? "Add " : "Trim "}
                      {formatINR(Math.abs(s.deltaValue))}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
