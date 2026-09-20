import { useState } from "react";
import PageHeader from "../components/PageHeader";
import AddHoldingModal from "../components/AddHoldingModal";
import { usePortfolio } from "../context/PortfolioContext";
import { useLivePrices } from "../lib/useLivePrices";
import { getDayChangePct, getLatestPrice } from "../lib/priceEngine";
import { getStock, STOCK_UNIVERSE } from "../lib/universe";
import { formatINR, formatPct } from "../lib/format";

export default function Watchlist() {
  const { watchlist, addToWatchlist, removeFromWatchlist } = usePortfolio();
  useLivePrices();
  const [symbol, setSymbol] = useState(STOCK_UNIVERSE[0].symbol);
  const [buySymbol, setBuySymbol] = useState<string | null>(null);

  const available = STOCK_UNIVERSE.filter((s) => !watchlist.some((w) => w.symbol === s.symbol));

  return (
    <div>
      <PageHeader
        title="Watchlist"
        subtitle="Stocks you're tracking but don't own yet."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="bg-ink-elevated border border-ink-border rounded-md px-3 py-2 text-sm text-ink50"
            >
              {available.map((s) => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol} — {s.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => symbol && addToWatchlist(symbol)}
              disabled={available.length === 0}
              className="bg-brand text-ink text-sm font-medium rounded-md px-4 py-2 hover:bg-brand-soft transition-colors disabled:opacity-40"
            >
              Add
            </button>
          </div>
        }
      />

      <div className="px-6 md:px-10 pb-10">
        {watchlist.length === 0 ? (
          <div className="border border-dashed border-ink-border rounded-lg p-12 text-center">
            <p className="text-sm text-ink50">Your watchlist is empty.</p>
            <p className="text-xs text-ink70 mt-1">Track stocks here before you decide to buy.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {watchlist.map((w) => {
              const stock = getStock(w.symbol);
              const price = getLatestPrice(w.symbol);
              const change = getDayChangePct(w.symbol);
              return (
                <div key={w.id} className="rounded-lg border border-ink-border bg-ink-surface p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-ink50">{w.symbol}</p>
                      <p className="text-xs text-ink70">{stock?.name}</p>
                    </div>
                    <button
                      onClick={() => removeFromWatchlist(w.id)}
                      className="text-xs text-ink70 hover:text-loss transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <p className="tnum text-xl font-semibold text-ink50">{formatINR(price)}</p>
                    <span className={`tnum text-sm ${change >= 0 ? "text-gain" : "text-loss"}`}>
                      {formatPct(change)}
                    </span>
                  </div>
                  <button
                    onClick={() => setBuySymbol(w.symbol)}
                    className="mt-4 w-full border border-brand/40 text-brand text-sm font-medium rounded-md py-2 hover:bg-brand/10 transition-colors"
                  >
                    Add to holdings
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {buySymbol && (
        <AddHoldingModalPreset symbol={buySymbol} onClose={() => setBuySymbol(null)} />
      )}
    </div>
  );
}

// Thin wrapper so AddHoldingModal can be pre-seeded with a symbol from the watchlist card.
function AddHoldingModalPreset({ symbol, onClose }: { symbol: string; onClose: () => void }) {
  return <AddHoldingModal onClose={onClose} initialSymbol={symbol} />;
}
