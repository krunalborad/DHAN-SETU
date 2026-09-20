import { useState } from "react";
import PageHeader from "../components/PageHeader";
import { usePortfolio } from "../context/PortfolioContext";
import { useLivePrices } from "../lib/useLivePrices";
import { getLatestPrice } from "../lib/priceEngine";
import { STOCK_UNIVERSE } from "../lib/universe";
import { formatINR } from "../lib/format";

export default function Alerts() {
  const { alerts, addAlert, removeAlert, toggleAlert } = usePortfolio();
  useLivePrices();

  const [symbol, setSymbol] = useState(STOCK_UNIVERSE[0].symbol);
  const [condition, setCondition] = useState<"above" | "below">("below");
  const [targetPrice, setTargetPrice] = useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(targetPrice);
    if (!price || price <= 0) return;
    addAlert({ symbol, condition, targetPrice: price });
    setTargetPrice("");
  }

  return (
    <div>
      <PageHeader title="Alerts" subtitle="Get notified when a stock crosses your price." />

      <div className="px-6 md:px-10 pb-10 space-y-6">
        <form onSubmit={handleAdd} className="rounded-lg border border-ink-border bg-ink-surface p-6">
          <p className="text-sm font-medium text-ink50 mb-4">Create an alert</p>
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
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as "above" | "below")}
              className="bg-ink border border-ink-border rounded-md px-3 py-2 text-sm text-ink50"
            >
              <option value="below">Drops below</option>
              <option value="above">Rises above</option>
            </select>
            <input
              type="number"
              step="0.01"
              placeholder="Target price (₹)"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="bg-ink border border-ink-border rounded-md px-3 py-2 text-sm text-ink50 tnum"
            />
            <button
              type="submit"
              className="bg-brand text-ink text-sm font-medium rounded-md px-4 py-2 hover:bg-brand-soft transition-colors"
            >
              Create alert
            </button>
          </div>
          <p className="text-[11px] text-ink70 mt-3">
            This demo checks alerts client-side against the simulated feed. In production, wire this
            to a backend cron job that emails/SMS/WhatsApps you via a notification service.
          </p>
        </form>

        {alerts.length === 0 ? (
          <div className="border border-dashed border-ink-border rounded-lg p-12 text-center">
            <p className="text-sm text-ink50">No alerts set.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {alerts.map((a) => {
              const price = getLatestPrice(a.symbol);
              const triggered = a.condition === "below" ? price <= a.targetPrice : price >= a.targetPrice;
              return (
                <li
                  key={a.id}
                  className={`flex items-center justify-between rounded-lg border p-4 ${
                    triggered && a.active ? "border-brand bg-brand/5" : "border-ink-border bg-ink-surface"
                  }`}
                >
                  <div>
                    <p className="text-sm text-ink50">
                      {a.symbol} {a.condition === "below" ? "drops below" : "rises above"}{" "}
                      <span className="tnum">{formatINR(a.targetPrice)}</span>
                    </p>
                    <p className="text-xs text-ink70 mt-0.5">
                      Currently <span className="tnum">{formatINR(price)}</span>
                      {triggered && a.active && <span className="text-brand ml-2">Triggered</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleAlert(a.id)}
                      className="text-xs text-ink70 hover:text-ink50 transition-colors"
                    >
                      {a.active ? "Pause" : "Resume"}
                    </button>
                    <button
                      onClick={() => removeAlert(a.id)}
                      className="text-xs text-ink70 hover:text-loss transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
