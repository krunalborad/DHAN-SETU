import { useState } from "react";
import Modal from "./Modal";
import { usePortfolio } from "../context/PortfolioContext";
import { STOCK_UNIVERSE } from "../lib/universe";

export default function AddHoldingModal({
  onClose,
  initialSymbol,
}: {
  onClose: () => void;
  initialSymbol?: string;
}) {
  const { addHolding } = usePortfolio();
  const [symbol, setSymbol] = useState(initialSymbol ?? STOCK_UNIVERSE[0].symbol);
  const [quantity, setQuantity] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [buyDate, setBuyDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qty = Number(quantity);
    const price = Number(buyPrice);
    if (!qty || qty <= 0) return setError("Enter a valid quantity.");
    if (!price || price <= 0) return setError("Enter a valid buy price.");

    addHolding({ symbol, quantity: qty, buyPrice: price, buyDate: new Date(buyDate).toISOString() });
    onClose();
  }

  return (
    <Modal title="Add a holding" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-ink70 mb-1.5">Stock</label>
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ink70 mb-1.5">Quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-ink border border-ink-border rounded-md px-3 py-2 text-sm text-ink50 tnum"
              placeholder="10"
            />
          </div>
          <div>
            <label className="block text-xs text-ink70 mb-1.5">Buy price (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              className="w-full bg-ink border border-ink-border rounded-md px-3 py-2 text-sm text-ink50 tnum"
              placeholder="2705.50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-ink70 mb-1.5">Buy date</label>
          <input
            type="date"
            value={buyDate}
            onChange={(e) => setBuyDate(e.target.value)}
            className="w-full bg-ink border border-ink-border rounded-md px-3 py-2 text-sm text-ink50 tnum"
          />
        </div>

        {error && <p className="text-xs text-loss">{error}</p>}

        <button
          type="submit"
          className="w-full bg-brand text-ink font-medium text-sm rounded-md py-2.5 hover:bg-brand-soft transition-colors"
        >
          Add holding
        </button>
      </form>
    </Modal>
  );
}
