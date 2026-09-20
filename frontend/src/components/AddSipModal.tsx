import { useState } from "react";
import Modal from "./Modal";
import { usePortfolio } from "../context/PortfolioContext";
import { STOCK_UNIVERSE } from "../lib/universe";

export default function AddSipModal({ onClose }: { onClose: () => void }) {
  const { addSip } = usePortfolio();
  const [symbol, setSymbol] = useState(STOCK_UNIVERSE[0].symbol);
  const [amount, setAmount] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("5");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    const day = Number(dayOfMonth);
    if (!amt || amt <= 0) return setError("Enter a valid monthly amount.");
    if (!day || day < 1 || day > 28) return setError("Day of month must be between 1 and 28.");

    addSip({
      symbol,
      amount: amt,
      dayOfMonth: day,
      startDate: new Date(startDate).toISOString(),
      active: true,
    });
    onClose();
  }

  return (
    <Modal title="Add SIP" onClose={onClose}>
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
            <label className="block text-xs text-ink70 mb-1.5">Monthly amount (₹)</label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-ink border border-ink-border rounded-md px-3 py-2 text-sm text-ink50 tnum"
              placeholder="1000"
            />
          </div>
          <div>
            <label className="block text-xs text-ink70 mb-1.5">Day of month</label>
            <input
              type="number"
              min="1"
              max="28"
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
              className="w-full bg-ink border border-ink-border rounded-md px-3 py-2 text-sm text-ink50 tnum"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-ink70 mb-1.5">Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-ink border border-ink-border rounded-md px-3 py-2 text-sm text-ink50 tnum"
          />
        </div>

        {error && <p className="text-xs text-loss">{error}</p>}

        <button
          type="submit"
          className="w-full bg-brand text-ink font-medium text-sm rounded-md py-2.5 hover:bg-brand-soft transition-colors"
        >
          Add SIP
        </button>
      </form>
    </Modal>
  );
}