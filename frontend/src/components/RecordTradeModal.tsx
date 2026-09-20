import { useState } from "react";
import Modal from "./Modal";
import { usePortfolio } from "../context/PortfolioContext";
import { STOCK_UNIVERSE } from "../lib/universe";

export default function RecordTradeModal({ onClose }: { onClose: () => void }) {
  const { addTrade } = usePortfolio();
  const [symbol, setSymbol] = useState(STOCK_UNIVERSE[0].symbol);
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qty = Number(quantity);
    const p = Number(price);
    if (!qty || qty <= 0) return setError("Enter a valid quantity.");
    if (!p || p <= 0) return setError("Enter a valid price.");

    const result = addTrade({ symbol, side, quantity: qty, price: p, date: new Date(date).toISOString() });
    if (!result.ok) return setError(result.error ?? "Could not record this trade.");
    onClose();
  }

  return (
    <Modal title="Record trade" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-ink70 mb-1.5">Ticker</label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full bg-ink border border-ink-border rounded-md px-3 py-2 text-sm text-ink50"
          >
            {STOCK_UNIVERSE.map((s) => (
              <option key={s.symbol} value={s.symbol}>
                {s.symbol} — {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-ink70 mb-1.5">Side</label>
          <div className="flex gap-2">
            {(["BUY", "SELL"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSide(s)}
                className={`flex-1 text-xs rounded-md py-2 border transition-colors ${
                  side === s
                    ? s === "BUY"
                      ? "border-gain text-gain bg-gain/10"
                      : "border-loss text-loss bg-loss/10"
                    : "border-ink-border text-ink70 hover:text-ink50"
                }`}
              >
                {s === "BUY" ? "Buy" : "Sell"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ink70 mb-1.5">Quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-ink border border-ink-border rounded-md px-3 py-2 text-sm text-ink50 tnum"
              placeholder="100"
            />
          </div>
          <div>
            <label className="block text-xs text-ink70 mb-1.5">Price (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-ink border border-ink-border rounded-md px-3 py-2 text-sm text-ink50 tnum"
              placeholder="350.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-ink70 mb-1.5">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-ink border border-ink-border rounded-md px-3 py-2 text-sm text-ink50 tnum"
          />
        </div>

        {error && <p className="text-xs text-loss">{error}</p>}

        <button
          type="submit"
          className="w-full bg-brand text-ink font-medium text-sm rounded-md py-2.5 hover:bg-brand-soft transition-colors"
        >
          Record trade
        </button>
      </form>
    </Modal>
  );
}