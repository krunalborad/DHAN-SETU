import { useState } from "react";
import Modal from "./Modal";
import { usePortfolio } from "../context/PortfolioContext";
import { Holding } from "../types";
import { getStock } from "../lib/universe";

export default function EditHoldingModal({
  holding,
  onClose,
}: {
  holding: Holding;
  onClose: () => void;
}) {
  const { updateHolding, removeHolding } = usePortfolio();
  const [quantity, setQuantity] = useState(String(holding.quantity));
  const [buyPrice, setBuyPrice] = useState(String(holding.buyPrice));
  const [buyDate, setBuyDate] = useState(holding.buyDate.slice(0, 10));
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qty = Number(quantity);
    const price = Number(buyPrice);
    if (!qty || qty <= 0) return setError("Enter a valid quantity.");
    if (!price || price <= 0) return setError("Enter a valid buy price.");

    updateHolding(holding.id, { quantity: qty, buyPrice: price, buyDate: new Date(buyDate).toISOString() });
    onClose();
  }

  function handleDelete() {
    if (confirm(`Remove ${holding.symbol} from your holdings?`)) {
      removeHolding(holding.id);
      onClose();
    }
  }

  return (
    <Modal title={`Edit ${holding.symbol}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-ink70">{getStock(holding.symbol)?.name}</p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ink70 mb-1.5">Quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-ink border border-ink-border rounded-md px-3 py-2 text-sm text-ink50 tnum"
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

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleDelete}
            className="flex-1 border border-loss/40 text-loss text-sm rounded-md py-2.5 hover:bg-loss/10 transition-colors"
          >
            Delete
          </button>
          <button
            type="submit"
            className="flex-1 bg-brand text-ink font-medium text-sm rounded-md py-2.5 hover:bg-brand-soft transition-colors"
          >
            Save changes
          </button>
        </div>
      </form>
    </Modal>
  );
}
