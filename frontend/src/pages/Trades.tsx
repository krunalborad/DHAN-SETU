import { useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import { usePortfolio } from "../context/PortfolioContext";
import { computeTradeLedger, tradeLedgerSummary, tickerLabel } from "../lib/trades";
import { Trade } from "../types";

function formatCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function Trades() {
  const { trades, addTrade, removeTrade } = usePortfolio();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    symbol: "",
    side: "BUY" as Trade["side"],
    quantity: "",
    price: "",
    date: todayIso(),
  });

  const ledger = useMemo(() => computeTradeLedger(trades), [trades]);
  const summary = useMemo(() => tradeLedgerSummary(ledger), [ledger]);

  function resetForm() {
    setForm({ symbol: "", side: "BUY", quantity: "", price: "", date: todayIso() });
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const symbol = form.symbol.trim().toUpperCase();
    const quantity = Number(form.quantity);
    const price = Number(form.price);

    if (!symbol) return setError("Enter a stock symbol.");
    if (!quantity || quantity <= 0) return setError("Enter a valid quantity.");
    if (!price || price <= 0) return setError("Enter a valid price.");

    const result = addTrade({
      symbol,
      side: form.side,
      quantity,
      price,
      date: new Date(form.date).toISOString(),
    });

    if (!result.ok) {
      setError(result.error ?? "Could not record trade.");
      return;
    }

    resetForm();
    setShowForm(false);
  }

  return (
    <div>
      <PageHeader
        title="Trades"
        subtitle="Your buy/sell ledger, matched FIFO for realized gains and tax term."
        actions={
          <button
            onClick={() => {
              setShowForm((s) => !s);
              setError(null);
            }}
            className="text-sm px-3 py-1.5 rounded-md bg-ink-elevated text-ink50 hover:opacity-90 transition-opacity"
          >
            {showForm ? "Cancel" : "Record Trade"}
          </button>
        }
      />

      <div className="px-6 md:px-10 pb-10 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Realized P&L"
            value={formatCurrency(summary.realizedTotal)}
            tone={summary.realizedTotal >= 0 ? "gain" : "loss"}
          />
          <StatCard label="Long-term gains" value={formatCurrency(summary.longTermGains)} />
          <StatCard label="Short-term gains" value={formatCurrency(summary.shortTermGains)} />
          <StatCard label="Estimated tax" value={formatCurrency(summary.estimatedTax)} tone="loss" />
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-ink-border bg-ink-surface p-5 grid grid-cols-2 md:grid-cols-5 gap-4 items-end"
          >
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink70">Symbol</label>
              <input
                value={form.symbol}
                onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))}
                placeholder="e.g. RELIANCE"
                className="bg-ink-elevated border border-ink-border rounded-md px-2 py-1.5 text-sm text-ink50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink70">Side</label>
              <select
                value={form.side}
                onChange={(e) => setForm((f) => ({ ...f, side: e.target.value as Trade["side"] }))}
                className="bg-ink-elevated border border-ink-border rounded-md px-2 py-1.5 text-sm text-ink50"
              >
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink70">Quantity</label>
              <input
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                className="bg-ink-elevated border border-ink-border rounded-md px-2 py-1.5 text-sm text-ink50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink70">Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="bg-ink-elevated border border-ink-border rounded-md px-2 py-1.5 text-sm text-ink50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink70">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="bg-ink-elevated border border-ink-border rounded-md px-2 py-1.5 text-sm text-ink50"
              />
            </div>
            {error && <p className="col-span-full text-xs text-loss">{error}</p>}
            <div className="col-span-full flex justify-end">
              <button
                type="submit"
                className="text-sm px-4 py-1.5 rounded-md bg-gain text-black font-medium hover:opacity-90 transition-opacity"
              >
                Add Trade
              </button>
            </div>
          </form>
        )}

        <div className="rounded-lg border border-ink-border bg-ink-surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-border text-left text-ink70 text-xs uppercase tracking-wide">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Symbol</th>
                <th className="px-4 py-3">Side</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Realized</th>
                <th className="px-4 py-3">Term</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {ledger.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-ink70">
                    No trades recorded yet.
                  </td>
                </tr>
              )}
              {ledger.map((row) => (
                <tr key={row.id} className="border-b border-ink-border last:border-0">
                  <td className="px-4 py-3 text-ink70">{new Date(row.date).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3 text-ink50 font-medium">
                    {row.symbol}
                    <span className="block text-xs text-ink70">{tickerLabel(row.symbol)}</span>
                  </td>
                  <td className={`px-4 py-3 ${row.side === "BUY" ? "text-gain" : "text-loss"}`}>{row.side}</td>
                  <td className="px-4 py-3 text-right tnum text-ink50">{row.quantity}</td>
                  <td className="px-4 py-3 text-right tnum text-ink50">{formatCurrency(row.price)}</td>
                  <td className="px-4 py-3 text-right tnum">
                    {row.realized !== null ? (
                      <span className={row.realized >= 0 ? "text-gain" : "text-loss"}>
                        {formatCurrency(row.realized)}
                      </span>
                    ) : (
                      <span className="text-ink70">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink70">{row.term ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => removeTrade(row.id)}
                      className="text-xs text-ink70 hover:text-loss transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}