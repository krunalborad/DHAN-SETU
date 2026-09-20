import { useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import { usePortfolio } from "../context/PortfolioContext";
import { STOCK_UNIVERSE, getStock } from "../lib/universe";
import { enrichHoldings, totalPortfolioValue, totalInvested } from "../lib/analytics";
import { formatDate, formatINR } from "../lib/format";

export default function Dividends() {
  const { dividends, addDividend, removeDividend, holdings } = usePortfolio();
  const [symbol, setSymbol] = useState(STOCK_UNIVERSE[0].symbol);
  const [amount, setAmount] = useState("");
  const [exDate, setExDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [showForm, setShowForm] = useState(false);

  const holdingQty = useMemo(() => {
    const map = new Map<string, number>();
    holdings.forEach((h) => map.set(h.symbol, (map.get(h.symbol) ?? 0) + h.quantity));
    return map;
  }, [holdings]);

  const thisYear = new Date().getFullYear();
  const receivedAllTime = dividends.reduce((sum, d) => sum + (holdingQty.get(d.symbol) ?? 0) * d.amountPerShare, 0);
  const receivedThisYear = dividends
    .filter((d) => new Date(d.exDate).getFullYear() === thisYear)
    .reduce((sum, d) => sum + (holdingQty.get(d.symbol) ?? 0) * d.amountPerShare, 0);

  const enriched = useMemo(() => enrichHoldings(holdings), [holdings]);
  const invested = totalInvested(enriched);

  const expectedIncome = useMemo(
    () =>
      holdings
        .reduce((acc, h) => {
          const stock = getStock(h.symbol);
          if (!stock) return acc;
          const existing = acc.find((r) => r.symbol === h.symbol);
          const value = h.quantity * h.buyPrice;
          const income = (h.quantity * (getStock(h.symbol)?.basePrice ?? 0) * (stock.dividendYield ?? 0)) / 100;
          if (existing) {
            existing.income += income;
          } else {
            acc.push({ symbol: h.symbol, income, yieldPct: stock.dividendYield ?? 0, value });
          }
          return acc;
        }, [] as { symbol: string; income: number; yieldPct: number; value: number }[])
        .sort((a, b) => b.yieldPct - a.yieldPct),
    [holdings]
  );

  const projectedNext12mo = expectedIncome.reduce((sum, r) => sum + r.income, 0);
  const yieldOnCost = invested ? (projectedNext12mo / invested) * 100 : 0;

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    addDividend({ symbol, amountPerShare: amt, exDate: new Date(exDate).toISOString(), paidDate: new Date(exDate).toISOString() });
    setAmount("");
    setShowForm(false);
  }

  const sortedDividends = [...dividends].sort((a, b) => new Date(b.exDate).getTime() - new Date(a.exDate).getTime());

  return (
    <div>
      <PageHeader
        title="Dividends"
        subtitle="What your holdings have paid you, and what they should pay next year."
        actions={
          <button
            onClick={() => setShowForm((v) => !v)}
            className="bg-brand text-ink text-sm font-medium rounded-md px-4 py-2 hover:bg-brand-soft transition-colors"
          >
            Record dividend
          </button>
        }
      />

      <div className="px-6 md:px-10 pb-10 space-y-6">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Received all time" value={formatINR(receivedAllTime)} />
          <StatCard label="Received this year" value={formatINR(receivedThisYear)} />
          <StatCard label="Projected next 12 months" value={formatINR(projectedNext12mo)} />
          <StatCard label="Yield on cost" value={`${yieldOnCost.toFixed(2)}%`} />
        </section>

        {showForm && (
          <form onSubmit={handleAdd} className="rounded-lg border border-ink-border bg-ink-surface p-6">
            <div className="grid sm:grid-cols-4 gap-3">
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="bg-ink border border-ink-border rounded-md px-3 py-2 text-sm text-ink50"
              >
                {STOCK_UNIVERSE.map((s) => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.symbol}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Amount / share (₹)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-ink border border-ink-border rounded-md px-3 py-2 text-sm text-ink50 tnum"
              />
              <input
                type="date"
                value={exDate}
                onChange={(e) => setExDate(e.target.value)}
                className="bg-ink border border-ink-border rounded-md px-3 py-2 text-sm text-ink50 tnum"
              />
              <button
                type="submit"
                className="bg-brand text-ink text-sm font-medium rounded-md px-4 py-2 hover:bg-brand-soft transition-colors"
              >
                Save
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-lg border border-ink-border bg-ink-surface p-6">
            <p className="text-[11px] tracking-wide text-ink70 uppercase mb-4">Payment history</p>
            <ul className="space-y-3">
              {sortedDividends.length === 0 && <li className="text-xs text-ink70">No dividends recorded yet.</li>}
              {sortedDividends.map((d) => (
                <li key={d.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-ink50">{d.symbol}</p>
                    <p className="text-xs text-ink70">
                      {formatDate(d.exDate)} · {holdingQty.get(d.symbol) ?? 0} shares × {formatINR(d.amountPerShare)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="tnum text-sm text-gain">
                      {formatINR((holdingQty.get(d.symbol) ?? 0) * d.amountPerShare)}
                    </span>
                    <button
                      onClick={() => removeDividend(d.id)}
                      className="text-xs text-ink70 hover:text-loss transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-ink-border bg-ink-surface p-6">
            <p className="text-[11px] tracking-wide text-ink70 uppercase mb-1">Expected income by holding</p>
            <p className="text-xs text-ink70 mb-4">Based on each company's current dividend yield</p>
            <ul className="space-y-3">
              {expectedIncome.length === 0 && <li className="text-xs text-ink70">No holdings yet.</li>}
              {expectedIncome.map((r) => (
                <li key={r.symbol} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-ink50">{r.symbol}</p>
                    <p className="text-xs text-ink70">{r.yieldPct.toFixed(2)}% yield</p>
                  </div>
                  <span className="tnum text-sm text-ink50">{formatINR(r.income)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
