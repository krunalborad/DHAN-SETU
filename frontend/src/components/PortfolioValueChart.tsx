import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatINR } from "../lib/format";

interface Props {
  data: { date: string; value: number }[];
}

export default function PortfolioValueChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-sm text-ink70">
        Add holdings to see your value trend.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={288}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="valueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#27D9A3" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#27D9A3" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tickFormatter={(v) => new Date(v).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
          tick={{ fill: "#8B96A5", fontSize: 11 }}
          axisLine={{ stroke: "#242C38" }}
          tickLine={false}
          minTickGap={40}
        />
        <YAxis
          tickFormatter={(v) => formatINR(v, { compact: true })}
          tick={{ fill: "#8B96A5", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={64}
        />
        <Tooltip
          contentStyle={{
            background: "#1A2029",
            border: "1px solid #242C38",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "#8B96A5" }}
          formatter={(v: number) => [formatINR(v), "Value"]}
          labelFormatter={(v) => new Date(v).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#27D9A3"
          strokeWidth={2}
          fill="url(#valueFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
