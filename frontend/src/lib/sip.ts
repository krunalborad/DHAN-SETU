import { Goal, Sip } from "../types";
import { getHistory, getLatestPrice } from "./priceEngine";

/**
 * SIP PROGRESS
 * -------------------------------------------------------------------------
 * Simulates each monthly instalment that would have executed between a
 * SIP's start date and today, buying at that day's simulated price (falls
 * back to the current live price if the date is outside the seeded price
 * history window). Produces real units accumulated and a real average
 * cost, the same way a brokerage SIP statement would.
 * -------------------------------------------------------------------------
 */
export interface SipProgress {
  installments: number;
  unitsAccumulated: number;
  totalInvested: number;
  avgCost: number;
  currentValue: number;
  gainPct: number;
}

function priceOnOrNear(symbol: string, date: Date): number {
  const history = getHistory(symbol);
  if (history.length === 0) return getLatestPrice(symbol);
  const target = date.getTime();
  let closest = history[0];
  let closestDiff = Math.abs(history[0].t - target);
  for (const point of history) {
    const diff = Math.abs(point.t - target);
    if (diff < closestDiff) {
      closest = point;
      closestDiff = diff;
    }
  }
  return closest.price;
}

export function computeSipProgress(sip: Sip): SipProgress {
  const start = new Date(sip.startDate);
  const now = new Date();

  const installmentDates: Date[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), sip.dayOfMonth);
  if (cursor < start) cursor.setMonth(cursor.getMonth() + 1);

  while (cursor <= now) {
    installmentDates.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  let unitsAccumulated = 0;
  let totalInvested = 0;
  installmentDates.forEach((d) => {
    const price = priceOnOrNear(sip.symbol, d);
    if (price > 0) {
      unitsAccumulated += sip.amount / price;
      totalInvested += sip.amount;
    }
  });

  const avgCost = unitsAccumulated > 0 ? totalInvested / unitsAccumulated : 0;
  const currentValue = unitsAccumulated * getLatestPrice(sip.symbol);
  const gainPct = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0;

  return {
    installments: installmentDates.length,
    unitsAccumulated,
    totalInvested,
    avgCost,
    currentValue,
    gainPct,
  };
}

/**
 * GOAL PROJECTION
 * -------------------------------------------------------------------------
 * Standard future-value-of-an-annuity projection: compounds a fixed
 * monthly contribution at the goal's expected annual return, month by
 * month, until the target date. Compares the projected value against the
 * target amount to say "on pace" or "behind pace," with the shortfall.
 * -------------------------------------------------------------------------
 */
export interface GoalProjection {
  monthsRemaining: number;
  projectedValue: number;
  onPace: boolean;
  shortfall: number;
  requiredMonthlyContribution: number;
}

export function computeGoalProjection(goal: Goal): GoalProjection {
  const now = new Date();
  const target = new Date(goal.targetDate);
  const monthsRemaining = Math.max(
    0,
    (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth())
  );

  const monthlyRate = goal.expectedAnnualReturnPct / 100 / 12;

  // Future value of a monthly annuity: FV = P × (((1+r)^n − 1) / r)
  const projectedValue =
    monthlyRate > 0
      ? goal.monthlyContribution * ((Math.pow(1 + monthlyRate, monthsRemaining) - 1) / monthlyRate)
      : goal.monthlyContribution * monthsRemaining;

  const onPace = projectedValue >= goal.targetAmount;
  const shortfall = Math.max(0, goal.targetAmount - projectedValue);

  // Solve P for FV = target, given the same n and r, to show what monthly
  // contribution *would* hit the goal on time.
  const requiredMonthlyContribution =
    monthsRemaining === 0
      ? goal.targetAmount
      : monthlyRate > 0
        ? (goal.targetAmount * monthlyRate) / (Math.pow(1 + monthlyRate, monthsRemaining) - 1)
        : goal.targetAmount / monthsRemaining;

  return { monthsRemaining, projectedValue, onPace, shortfall, requiredMonthlyContribution };
}