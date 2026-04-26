import type { UserFinancialProfile } from "./types";
import { createDefaultProfile } from "./defaults";

/** Bumped so new installs get an empty workbook; v1 demo data is not auto-migrated. */
const STORAGE_KEY = "zinvest-cash-flow-profile-v2";

function safeParse(raw: string | null): UserFinancialProfile | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as UserFinancialProfile;
    if (!v || typeof v !== "object") return null;
    if (!Array.isArray(v.income_sources)) return null;
    if (!Array.isArray(v.fixed_expenses)) return null;
    if (!Array.isArray(v.variable_expenses)) return null;
    if (!Array.isArray(v.debts)) return null;
    if (!Array.isArray(v.savings)) return null;
    if (!Array.isArray(v.investments)) return null;
    return v;
  } catch {
    return null;
  }
}

export function loadProfile(): UserFinancialProfile {
  if (typeof window === "undefined") return createDefaultProfile();
  const parsed = safeParse(localStorage.getItem(STORAGE_KEY));
  return parsed ?? createDefaultProfile();
}

export function saveProfile(profile: UserFinancialProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    /* quota / private mode */
  }
}

export function subscribeProfile(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}
