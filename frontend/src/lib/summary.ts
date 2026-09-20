import { HoldingWithMetrics } from "./analytics";

/**
 * WEEKLY SUMMARY — LOCAL STUB
 * -------------------------------------------------------------------------
 * Generates a plain-English portfolio summary from the current holdings
 * data using simple rules — no external API call, so it works with zero
 * configuration.
 *
 * TO GO LIVE WITH REAL AI:
 *   Send `holdings` + recent price/news data to an LLM (Anthropic/OpenAI)
 *   from your backend and stream the response back here instead. Keep this
 *   function's return type (`string`) the same so the component doesn't
 *   need to change.
 * -------------------------------------------------------------------------
 */
export function generateWeeklySummary(holdings: HoldingWithMetrics[]): string {
  if (holdings.length === 0) {
    return "Add a few holdings to your portfolio and check back here for a weekly performance summary.";
  }

  const sorted = [...holdings].sort((a, b) => b.gainPct - a.gainPct);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const totalGain = holdings.reduce((sum, h) => sum + h.gainAbs, 0);
  const totalInvested = holdings.reduce((sum, h) => sum + h.investedValue, 0);
  const overallPct = totalInvested ? (totalGain / totalInvested) * 100 : 0;

  const direction = overallPct >= 0 ? "up" : "down";
  const parts: string[] = [];

  parts.push(
    `Your portfolio is ${direction} ${Math.abs(overallPct).toFixed(1)}% overall, driven mainly by ${best.symbol} (${best.gainPct >= 0 ? "+" : ""}${best.gainPct.toFixed(1)}%).`
  );

  if (worst.symbol !== best.symbol) {
    parts.push(
      `${worst.symbol} is the weakest position right now at ${worst.gainPct >= 0 ? "+" : ""}${worst.gainPct.toFixed(1)}%.`
    );
  }

  if (holdings.length >= 3) {
    const winners = holdings.filter((h) => h.gainPct > 0).length;
    parts.push(`${winners} of your ${holdings.length} holdings are currently in the green.`);
  }

  return parts.join(" ");
}
