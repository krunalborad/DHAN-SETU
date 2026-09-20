import { HealthBreakdown } from "../lib/analytics";

function Bar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? "bg-gain" : value >= 45 ? "bg-brand-soft" : "bg-loss";
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-ink70">{label}</span>
        <span className="tnum text-ink50">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-ink-elevated overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function HealthBreakdownCard({ health }: { health: HealthBreakdown }) {
  return (
    <div className="rounded-lg border border-ink-border bg-ink-surface p-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] tracking-wide text-ink70 uppercase">Health breakdown</p>
      </div>
      <p className="text-xs text-ink70 mb-5">Weighted beta {health.weightedBeta.toFixed(2)}</p>

      <div className="space-y-4">
        <Bar label="Diversification" value={health.diversification} />
        <Bar label="Sector spread" value={health.sectorSpread} />
        <Bar label="Concentration" value={health.concentration} />
        <Bar label="Volatility comfort" value={health.volatilityComfort} />
      </div>

      {health.headline && (
        <p className="mt-5 text-xs text-ink70 leading-relaxed">
          <span className="text-gain">●</span> {health.headline}
        </p>
      )}
    </div>
  );
}
