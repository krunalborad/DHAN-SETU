import { useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import AddHoldingModal from "../components/AddHoldingModal";
import EditHoldingModal from "../components/EditHoldingModal";
import CsvImportModal from "../components/CsvImportModal";
import { usePortfolio } from "../context/PortfolioContext";
import { useLivePrices } from "../lib/useLivePrices";
import { enrichHoldings, totalPortfolioValue } from "../lib/analytics";
import { getDayChangePct } from "../lib/priceEngine";
import { formatINR, formatPct } from "../lib/format";
import { Holding } from "../types";

export default function Holdings() {
  const { holdings, removeHolding } = usePortfolio();
  useLivePrices();
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editing, setEditing] = useState<Holding | null>(null);

  const enriched = useMemo(() => enrichHoldings(holdings), [holdings]);
  const currentValue = totalPortfolioValue(enriched);

  return (
    <div>
      <PageHeader
        title="Holdings"
        subtitle={`${enriched.length} positions · ${formatINR(currentValue)} current value`}
        actions={
          <>
            <button
              onClick={() => setShowImport(true)}
              className="border border-ink-border text-ink50 text-sm rounded-md px-4 py-2 hover:bg-ink-elevated transition-colors"
            >
              Import CSV
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="bg-brand text-ink text-sm font-medium rounded-md px-4 py-2 hover:bg-brand-soft transition-colors"
            >
              Add holding
            </button>
          </>
        }
      />

      <div className="px-6 md:px-10 pb-10">
        {enriched.length === 0 ? (
          <div className="border border-dashed border-ink-border rounded-lg p-12 text-center">
            <p className="text-sm text-ink50">No holdings yet.</p>
            <p className="text-xs text-ink70 mt-1">Add one manually or import a broker statement.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-ink-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] tracking-wide text-ink70 uppercase border-b border-ink-border bg-ink-surface">
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium">Buy</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Invested</th>
                  <th className="px-4 py-3 font-medium">Value</th>
                  <th className="px-4 py-3 font-medium">P&amp;L</th>
                  <th className="px-4 py-3 font-medium">Today</th>
                  <th className="px-4 py-3 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody>
                {enriched.map((h) => {
                  const change = getDayChangePct(h.symbol);
                  return (
                    <tr key={h.id} className="border-b border-ink-border last:border-0 hover:bg-ink-surface/60">
                      <td className="px-4 py-3">
                        <p className="text-ink50">{h.symbol}</p>
                        <p className="text-xs text-ink70">
                          {h.name} · {h.sector}
                        </p>
                      </td>
                      <td className="px-4 py-3 tnum text-ink70">{h.quantity}</td>
                      <td className="px-4 py-3 tnum text-ink70">{formatINR(h.buyPrice)}</td>
                      <td className="px-4 py-3 tnum text-ink50">{formatINR(h.currentPrice)}</td>
                      <td className="px-4 py-3 tnum text-ink70">{formatINR(h.investedValue)}</td>
                      <td className="px-4 py-3 tnum text-ink50">{formatINR(h.currentValue)}</td>
                      <td className={`px-4 py-3 tnum ${h.gainAbs >= 0 ? "text-gain" : "text-loss"}`}>
                        {formatINR(h.gainAbs)}
                        <span className="block text-xs">{formatPct(h.gainPct)}</span>
                      </td>
                      <td className={`px-4 py-3 tnum text-xs ${change >= 0 ? "text-gain" : "text-loss"}`}>
                        {formatPct(change)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3 justify-end">
                          <button
                            onClick={() => setEditing(h)}
                            className="text-xs text-ink70 hover:text-ink50 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Remove ${h.symbol} from your holdings?`)) removeHolding(h.id);
                            }}
                            className="text-xs text-ink70 hover:text-loss transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && <AddHoldingModal onClose={() => setShowAdd(false)} />}
      {showImport && <CsvImportModal onClose={() => setShowImport(false)} />}
      {editing && <EditHoldingModal holding={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}