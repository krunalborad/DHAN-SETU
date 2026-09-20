import { useState } from "react";
import Modal from "./Modal";
import { usePortfolio } from "../context/PortfolioContext";

export default function AddGoalModal({ onClose }: { onClose: () => void }) {
  const { addGoal } = usePortfolio();
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 5);
    return d.toISOString().slice(0, 10);
  });
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("12");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const target = Number(targetAmount);
    const monthly = Number(monthlyContribution);
    const returnPct = Number(expectedReturn);
    if (!name.trim()) return setError("Give the goal a name.");
    if (!target || target <= 0) return setError("Enter a valid target amount.");
    if (!monthly || monthly <= 0) return setError("Enter a valid monthly contribution.");
    if (!returnPct || returnPct <= 0) return setError("Enter a valid expected annual return.");

    addGoal({
      name: name.trim(),
      targetAmount: target,
      targetDate: new Date(targetDate).toISOString(),
      monthlyContribution: monthly,
      expectedAnnualReturnPct: returnPct,
    });
    onClose();
  }

  return (
    <Modal title="Add goal" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-ink70 mb-1.5">Goal name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Retirement, house down payment, etc."
            className="w-full bg-ink border border-ink-border rounded-md px-3 py-2 text-sm text-ink50"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ink70 mb-1.5">Target amount (₹)</label>
            <input
              type="number"
              min="1"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full bg-ink border border-ink-border rounded-md px-3 py-2 text-sm text-ink50 tnum"
              placeholder="2500000"
            />
          </div>
          <div>
            <label className="block text-xs text-ink70 mb-1.5">Target date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full bg-ink border border-ink-border rounded-md px-3 py-2 text-sm text-ink50 tnum"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ink70 mb-1.5">Monthly contribution (₹)</label>
            <input
              type="number"
              min="1"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(e.target.value)}
              className="w-full bg-ink border border-ink-border rounded-md px-3 py-2 text-sm text-ink50 tnum"
              placeholder="5000"
            />
          </div>
          <div>
            <label className="block text-xs text-ink70 mb-1.5">Expected return (% / yr)</label>
            <input
              type="number"
              step="0.1"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(e.target.value)}
              className="w-full bg-ink border border-ink-border rounded-md px-3 py-2 text-sm text-ink50 tnum"
            />
          </div>
        </div>

        {error && <p className="text-xs text-loss">{error}</p>}

        <button
          type="submit"
          className="w-full bg-brand text-ink font-medium text-sm rounded-md py-2.5 hover:bg-brand-soft transition-colors"
        >
          Add goal
        </button>
      </form>
    </Modal>
  );
}