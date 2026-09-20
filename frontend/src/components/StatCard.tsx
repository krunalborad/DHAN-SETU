import { useCountUp } from "../lib/useCountUp";

interface Props {
  label: string;
  value: string;
  sub?: string;
  tone?: "gain" | "loss" | "neutral";
}

export default function StatCard({ label, value, sub, tone = "neutral" }: Props) {
  const animatedValue = useCountUp(value);
  const color = tone === "gain" ? "text-gain glow-text-gain" : tone === "loss" ? "text-loss glow-text-loss" : "text-ink50";

  return (
    <div className="glass-card hover-lift p-4 animate-fade-up">
      <p className="text-[11px] tracking-wide text-ink70 uppercase mb-2">{label}</p>
      <p className={`tnum text-xl font-semibold ${color}`}>{animatedValue}</p>
      {sub && <p className="text-xs text-ink70 mt-1">{sub}</p>}
    </div>
  );
}