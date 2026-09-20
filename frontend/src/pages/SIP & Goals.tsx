import { useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import { usePortfolio } from "../context/PortfolioContext";
import { computeGoalProjection, computeSipProgress } from "../lib/sip";

function formatCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function SipGoals() {
  const { sips, addSip, toggleSip, removeSip, goals, addGoal, removeGoal } = usePortfolio();

  const [showSipForm, setShowSipForm] = useState(false);
  const [sipForm, setSipForm] = useState({
    symbol: "",
    amount: "",
    dayOfMonth: "1",
    startDate: todayIso(),
  });

  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalForm, setGoalForm] = useState({
    name: "",
    targetAmount: "",
    targetDate: todayIso(),
    monthlyContribution: "",
    expectedAnnualReturnPct: "12",
  });

  const sipProgress = useMemo(
    () => sips.map((s) => ({ sip: s, progress: computeSipProgress(s) })),
    [sips]
  );

  const goalProjections = useMemo(
    () => goals.map((g) => ({ goal: g, projection: computeGoalProjection(g) })),
    [goals]
  );

  const totalSipInvested = sipProgress.reduce((sum, p) => sum + p.progress.totalInvested, 0);
  const totalSipValue = sipProgress.reduce((sum, p) => sum + p.progress.currentValue, 0);

  function submitSip(e: React.FormEvent) {
    e.preventDefault();
    const symbol = sipForm.symbol.trim().toUpperCase();
    const amount = Number(sipForm.amount);
    const dayOfMonth = Number(sipForm.dayOfMonth);
    if (!symbol || !amount || amount <= 0 || !dayOfMonth || dayOfMonth < 1 || dayOfMonth > 28) return;

    addSip({
      symbol,
      amount,
      dayOfMonth,
      startDate: new Date(sipForm.startDate).toISOString(),
      active: true,
    });
    setSipForm({ symbol: "", amount: "", dayOfMonth: "1", startDate: todayIso() });
    setShowSipForm(false);
  }

  function submitGoal(e: React.FormEvent) {
    e.preventDefault();
    const name = goalForm.name.trim();
    const targetAmount = Number(goalForm.targetAmount);
    const monthlyContribution = Number(goalForm.monthlyContribution);
    const expectedAnnualReturnPct = Number(goalForm.expectedAnnualReturnPct);
    if (!name || !targetAmount || targetAmount <= 0) return;

    addGoal({
      name,
      targetAmount,
      targetDate: new Date(goalForm.targetDate).toISOString(),
      monthlyContribution,
      expectedAnnualReturnPct,
    });
    setGoalForm({
      name: "",
      targetAmount: "",
      targetDate: todayIso(),
      monthlyContribution: "",
      expectedAnnualReturnPct: "12",
    });
    setShowGoalForm(false);
  }

  return (
    <div>
      <PageHeader
        title="SIP & Goals"
        subtitle="Track systematic investments and see whether your goals are on pace."
      />

      <div className="px-6 md:px-10 pb-10 space-y-10">
        {/* SIPs */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink50 uppercase tracking-wide">Active SIPs</h2>
            <button
              onClick={() => setShowSipForm((s) => !s)}
              className="text-sm px-3 py-1.5 rounded-md bg-ink-elevated text-ink50 hover:opacity-90 transition-opacity"
            >
              {showSipForm ? "Cancel" : "Add SIP"}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total invested" value={formatCurrency(totalSipInvested)} />
            <StatCard
              label="Current value"
              value={formatCurrency(totalSipValue)}
              tone={totalSipValue >= totalSipInvested ? "gain" : "loss"}
            />
          </div>

          {showSipForm && (
            <form
              onSubmit={submitSip}
              className="rounded-lg border border-ink-border bg-ink-surface p-5 grid grid-cols-2 md:grid-cols-4 gap-4 items-end"
            >
              <div className="flex flex-col gap-1">
                <label className="text-xs text-ink70">Symbol</label>
                <input
                  value={sipForm.symbol}
                  onChange={(e) => setSipForm((f) => ({ ...f, symbol: e.target.value }))}
                  placeholder="e.g. INFY"
                  className="bg-ink-elevated border border-ink-border rounded-md px-2 py-1.5 text-sm text-ink50"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-ink70">Monthly amount</label>
                <input
                  type="number"
                  min="0"
                  value={sipForm.amount}
                  onChange={(e) => setSipForm((f) => ({ ...f, amount: e.target.value }))}
                  className="bg-ink-elevated border border-ink-border rounded-md px-2 py-1.5 text-sm text-ink50"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-ink70">Day of month</label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={sipForm.dayOfMonth}
                  onChange={(e) => setSipForm((f) => ({ ...f, dayOfMonth: e.target.value }))}
                  className="bg-ink-elevated border border-ink-border rounded-md px-2 py-1.5 text-sm text-ink50"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-ink70">Start date</label>
                <input
                  type="date"
                  value={sipForm.startDate}
                  onChange={(e) => setSipForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="bg-ink-elevated border border-ink-border rounded-md px-2 py-1.5 text-sm text-ink50"
                />
              </div>
              <div className="col-span-full flex justify-end">
                <button
                  type="submit"
                  className="text-sm px-4 py-1.5 rounded-md bg-gain text-black font-medium hover:opacity-90 transition-opacity"
                >
                  Add SIP
                </button>
              </div>
            </form>
          )}

          <div className="rounded-lg border border-ink-border bg-ink-surface overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-border text-left text-ink70 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3">Symbol</th>
                  <th className="px-4 py-3 text-right">Installments</th>
                  <th className="px-4 py-3 text-right">Invested</th>
                  <th className="px-4 py-3 text-right">Current value</th>
                  <th className="px-4 py-3 text-right">Gain %</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {sipProgress.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-ink70">
                      No SIPs set up yet.
                    </td>
                  </tr>
                )}
                {sipProgress.map(({ sip, progress }) => (
                  <tr key={sip.id} className="border-b border-ink-border last:border-0">
                    <td className="px-4 py-3 text-ink50 font-medium">{sip.symbol}</td>
                    <td className="px-4 py-3 text-right tnum text-ink50">{progress.installments}</td>
                    <td className="px-4 py-3 text-right tnum text-ink50">
                      {formatCurrency(progress.totalInvested)}
                    </td>
                    <td className="px-4 py-3 text-right tnum text-ink50">
                      {formatCurrency(progress.currentValue)}
                    </td>
                    <td className={`px-4 py-3 text-right tnum ${progress.gainPct >= 0 ? "text-gain" : "text-loss"}`}>
                      {progress.gainPct.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleSip(sip.id)}
                        className={`text-xs px-2 py-1 rounded-md ${
                          sip.active ? "bg-gain/20 text-gain" : "bg-ink-elevated text-ink70"
                        }`}
                      >
                        {sip.active ? "Active" : "Paused"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => removeSip(sip.id)}
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
        </section>

        {/* Goals */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink50 uppercase tracking-wide">Goals</h2>
            <button
              onClick={() => setShowGoalForm((s) => !s)}
              className="text-sm px-3 py-1.5 rounded-md bg-ink-elevated text-ink50 hover:opacity-90 transition-opacity"
            >
              {showGoalForm ? "Cancel" : "Add Goal"}
            </button>
          </div>

          {showGoalForm && (
            <form
              onSubmit={submitGoal}
              className="rounded-lg border border-ink-border bg-ink-surface p-5 grid grid-cols-2 md:grid-cols-5 gap-4 items-end"
            >
              <div className="flex flex-col gap-1">
                <label className="text-xs text-ink70">Goal name</label>
                <input
                  value={goalForm.name}
                  onChange={(e) => setGoalForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. House down payment"
                  className="bg-ink-elevated border border-ink-border rounded-md px-2 py-1.5 text-sm text-ink50"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-ink70">Target amount</label>
                <input
                  type="number"
                  min="0"
                  value={goalForm.targetAmount}
                  onChange={(e) => setGoalForm((f) => ({ ...f, targetAmount: e.target.value }))}
                  className="bg-ink-elevated border border-ink-border rounded-md px-2 py-1.5 text-sm text-ink50"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-ink70">Target date</label>
                <input
                  type="date"
                  value={goalForm.targetDate}
                  onChange={(e) => setGoalForm((f) => ({ ...f, targetDate: e.target.value }))}
                  className="bg-ink-elevated border border-ink-border rounded-md px-2 py-1.5 text-sm text-ink50"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-ink70">Monthly contribution</label>
                <input
                  type="number"
                  min="0"
                  value={goalForm.monthlyContribution}
                  onChange={(e) => setGoalForm((f) => ({ ...f, monthlyContribution: e.target.value }))}
                  className="bg-ink-elevated border border-ink-border rounded-md px-2 py-1.5 text-sm text-ink50"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-ink70">Expected return % p.a.</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={goalForm.expectedAnnualReturnPct}
                  onChange={(e) =>
                    setGoalForm((f) => ({ ...f, expectedAnnualReturnPct: e.target.value }))
                  }
                  className="bg-ink-elevated border border-ink-border rounded-md px-2 py-1.5 text-sm text-ink50"
                />
              </div>
              <div className="col-span-full flex justify-end">
                <button
                  type="submit"
                  className="text-sm px-4 py-1.5 rounded-md bg-gain text-black font-medium hover:opacity-90 transition-opacity"
                >
                  Add Goal
                </button>
              </div>
            </form>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {goalProjections.length === 0 && <p className="text-sm text-ink70">No goals set up yet.</p>}
            {goalProjections.map(({ goal, projection }) => (
              <div key={goal.id} className="rounded-lg border border-ink-border bg-ink-surface p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink50">{goal.name}</p>
                    <p className="text-xs text-ink70 mt-0.5">
                      Target {formatCurrency(goal.targetAmount)} by{" "}
                      {new Date(goal.targetDate).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <button
                    onClick={() => removeGoal(goal.id)}
                    className="text-xs text-ink70 hover:text-loss transition-colors"
                  >
                    Delete
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] text-ink70 uppercase">Projected value</p>
                    <p className="tnum text-ink50 font-medium">{formatCurrency(projection.projectedValue)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-ink70 uppercase">Months left</p>
                    <p className="tnum text-ink50 font-medium">{projection.monthsRemaining}</p>
                  </div>
                </div>
                <div
                  className={`text-xs px-2 py-1 rounded-md inline-block ${
                    projection.onPace ? "bg-gain/20 text-gain" : "bg-loss/20 text-loss"
                  }`}
                >
                  {projection.onPace
                    ? "On pace"
                    : `Behind — need ${formatCurrency(projection.requiredMonthlyContribution)}/mo`}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}