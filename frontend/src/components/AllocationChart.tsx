import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatINR } from "../lib/format";

const PALETTE = ["#27D9A3", "#4CC2E8", "#E0A85F", "#F0596B", "#B98AE0", "#6BE8C4", "#8B96A5", "#5FC7D6"];

interface Datum {
  label: string;
  value: number;
  pct: number;
}

export default function AllocationChart({ data }: { data: Datum[] }) {
  if (data.length === 0) {
    return <div className="h-40 flex items-center justify-center text-sm text-ink70">No holdings yet.</div>;
  }

  return (
    <div className="flex items-center gap-6">
      <div className="w-32 h-32 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={38}
              outerRadius={58}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((entry, i) => (
                <Cell key={entry.label} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "#1A2029", border: "1px solid #242C38", borderRadius: 8, fontSize: 12 }}
              formatter={(v: number) => [formatINR(v), "Value"]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex-1 space-y-1.5">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-ink50">
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
              {d.label}
            </span>
            <span className="tnum text-ink70 text-xs">{d.pct.toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}