import { DEFAULT_SETTINGS } from "./constants";
import type { AppData, Category, Expense, Income } from "./types";

/**
 * Persistence boundary. The UI only talks to this interface, so swapping
 * localStorage for a database-backed implementation later is a one-file change.
 */
export interface ExpenseRepository {
  load(): AppData | null;
  save(data: AppData): void;
  subscribe(onChange: (data: AppData) => void): () => void;
}

const STORAGE_KEY = "sage-expense-tracker:v1";

function normalize(raw: unknown): AppData | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Partial<AppData>;
  if (!Array.isArray(obj.expenses)) return null;
  const expenses = obj.expenses.filter(
    (e): e is Expense =>
      !!e && typeof e.id === "string" && typeof e.amount === "number" && typeof e.date === "string",
  );
  const incomes = Array.isArray(obj.incomes)
    ? obj.incomes.filter(
        (e): e is Income =>
          !!e && typeof e.id === "string" && typeof e.amount === "number" && typeof e.date === "string",
      )
    : [];
  const customCategories = Array.isArray(obj.customCategories)
    ? obj.customCategories.filter((c): c is Category => !!c && typeof c.id === "string")
    : [];
  return {
    version: 1,
    expenses,
    incomes,
    customCategories,
    settings: { ...DEFAULT_SETTINGS, ...(obj.settings ?? {}) },
  };
}

export const localExpenseRepository: ExpenseRepository = {
  load() {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? normalize(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  },
  save(data) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // storage full or unavailable — ignore, data stays in memory
    }
  },
  subscribe(onChange) {
    if (typeof window === "undefined") return () => {};
    const handler = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const next = normalize(JSON.parse(e.newValue));
        if (next) onChange(next);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  },
};
