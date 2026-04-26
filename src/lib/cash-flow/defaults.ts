import type { UserFinancialProfile } from "./types";

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `cf_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createDefaultProfile(): UserFinancialProfile {
  return {
    income_sources: [],
    fixed_expenses: [],
    variable_expenses: [],
    debts: [],
    savings: [],
    investments: [],
  };
}
