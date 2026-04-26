import type { CashFlowFrequency } from "./types";

/** Convert cash-flow line item to approximate monthly run-rate (one-time → 0 for run-rate). */
export function toMonthlyRunRate(amount: number, frequency: CashFlowFrequency): number {
  const a = Math.max(0, Number(amount) || 0);
  switch (frequency) {
    case "monthly":
      return a;
    case "yearly":
      return a / 12;
    case "one-time":
      return 0;
    default:
      return 0;
  }
}

/** One-time total for a single bucket (summed as spike, not annualized). */
export function oneTimeTotal(amount: number, frequency: CashFlowFrequency): number {
  const a = Math.max(0, Number(amount) || 0);
  return frequency === "one-time" ? a : 0;
}
