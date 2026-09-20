import { useMemo } from "react";
import PageHeader from "../components/PageHeader";
import AllocationChart from "../components/AllocationChart";
import WhatIfSimulator from "../components/WhatIfSimulator";
import RebalanceTool from "../components/RebalanceTool";
import { usePortfolio } from "../context/PortfolioContext";
import { useLivePrices } from "../lib/useLivePrices";
import {
  concentrationList,
  enrichHoldings,
  healthScore,
  marketCapAllocation,
  sectorAllocation,
} from "../lib/analytics";

export default function Analytics() {
  const { holdings } = usePortfolio();
  useLivePrices();
  const enriched = useMemo(() => enrichHoldings(holdings), [holdings]);
  const health = useMemo(() => healthScore(enriched), [enriched]);
  const bySector = useMemo(
    () => sectorAllocation(enriched).map((s) => ({ label: s.sector, value: s.value, pct: s.pct })),
    [enriched]
  );
  const byMarketCap = useMemo(() => marketCapAllocation(enriched), [enriched]);
  const concentration = useMemo(() => concentrationList(enriched), [enriched]);

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Diversification, concentration and rebalancing." />

      <div className="px-6 md:px-10 pb-10 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-lg border border-ink-border bg-ink-surface p-6">
            <p className="text-[11px] tracking-wide text-ink70 uppercase mb-4">By sector</p>
            <AllocationChart data={bySector} />
          </div>

          <div className="rounded-lg border border-ink-border bg-ink-surface p-6">
            <p className="text-[11px] tracking-wide text-ink70 uppercase mb-4">By market cap</p>
            <AllocationChart data={byMarketCap} />
          </div>

          <div className="rounded-lg border border-ink-border bg-ink-surface p-6">
            <p className="text-[11px] tracking-wide text-ink70 uppercase mb-1">Concentration</p>
            <p className="text-xs text-ink70 mb-4">
              Health {health.score}/100 · grade {health.grade}
            </p>
            <ul className="space-y-2.5">
              {concentration.length === 0 && <li className="text-xs text-ink70">No holdings yet.</li>}
              {concentration.map((c) => (
                <li key={c.symbol}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-ink50">{c.symbol}</span>
                    <span className="tnum text-xs text-ink70">{c.pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-ink-elevated overflow-hidden">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, c.pct)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <RebalanceTool holdings={enriched} />
        <WhatIfSimulator />
      </div>
    </div>
  );
}
