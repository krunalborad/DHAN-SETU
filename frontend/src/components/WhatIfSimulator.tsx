import { useState } from "react";
import { STOCK_UNIVERSE } from "../lib/universe";
import { getHistory, getLatestPrice } from "../lib/priceEngine";
import { whatIfReturn } from "../lib/analytics";
import { formatINR, formatPct } from "../lib/format";

export default function WhatIfSimulator() {
  const [amount, setAmount] = useState("10000");
  const [symbolA, setSymbolA] = useState(STOCK_UNIVERSE[0].symbol);
  const [symbolB, setSymbolB] = useState(STOCK_UNIVERSE[1].symbol);
  const [daysAgo, setDaysAgo] = useState(90);

  const amt = Number(amount) || 0;

  function priceNDaysAgo(symbol: string, days: number) {
    const hist = getHistory(symbol);
    if (hist.length === 0) return getLatestPrice(symbol);
    const idx = Math.max(0, hist.length - 1 - days);
    return hist[idx]?.price ?? getLatestPrice(symbol);
  }

  const resultA = whatIfReturn(amt, priceNDaysAgo(symbolA, daysAgo), getLatestPrice(symbolA));
  const resultB = whatIfReturn(amt, priceNDaysAgo(symbolB, daysAgo), getLatestPrice(symbolB));

  return (
    <div className="rounded-lg border border-ink-border bg-ink-surface p-6">
      <p className="text-sm font-medium text-ink50 mb-1">What-if simulator</p>
      <p className="text-xs text-ink70 mb-5">
        Compare how the same capital would have performed in two different stocks.
      </p>

      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        <div>
          <label className="block text-xs text-ink70 mb-1.5">Amount (₹)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-ink border border-ink-border rounded-md px-3 py-2 text-sm text-ink50 tnum"
          />
        </div>
        <div>
          <label className="block text-xs text-ink70 mb-1.5">Stock A</label>
          <select
            value={symbolA}
            onChange={(e) => setSymbolA(e.target.value)}
            className="w-full bg-ink border border-ink-border rounded-md px-3 py-2 text-sm text-ink50"
          >
            {STOCK_UNIVERSE.map((s) => (
              <option key={s.symbol} value={s.symbol}>
                {s.symbol}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink70 mb-1.5">Stock B</label>
          <select
            value={symbolB}
            onChange={(e) => setSymbolB(e.target.value)}
            className="w-full bg-ink border border-ink-border rounded-md px-3 py-2 text-sm text-ink50"
          >
            {STOCK_UNIVERSE.map((s) => (
              <option key={s.symbol} value={s.symbol}>
                {s.symbol}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-xs text-ink70 mb-1.5">
          Entry point: {daysAgo} days ago
        </label>
        <input
          type="range"
          min={7}
          max={90}
          value={daysAgo}
          onChange={(e) => setDaysAgo(Number(e.target.value))}
          className="w-full accent-brand"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { symbol: symbolA, result: resultA },
          { symbol: symbolB, result: resultB },
        ].map(({ symbol, result }) => (
          <div key={symbol} className="rounded-md border border-ink-border p-4">
            <p className="text-sm text-ink50 mb-2">{symbol}</p>
            <p className="tnum text-lg font-semibold text-ink50">{formatINR(result.finalValue)}</p>
            <p className={`tnum text-xs mt-1 ${result.gain >= 0 ? "text-gain" : "text-loss"}`}>
              {formatINR(result.gain)} ({formatPct(result.gainPct)})
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
