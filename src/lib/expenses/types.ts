/**
 * Core domain types. Kept framework-agnostic so a database / auth layer can
 * replace localStorage later without touching the UI.
 */
export type PaymentMethod = "cash" | "card" | "bank_transfer" | "mobile_wallet" | "other";

export interface Expense {
  id: string;
  title: string;
  amount: number;
  /** Local calendar date, yyyy-MM-dd */
  date: string;
  /** Category id */
  category: string;
  paymentMethod: PaymentMethod;
  notes: string;
  /** True for demo rows seeded on first launch */
  isSample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  /** CSS color, typically a design-token var() */
  color: string;
  builtIn: boolean;
}

export interface Settings {
  currency: string;
  monthlyBudget: number | null;
  budgetEnabled: boolean;
  /** Optional spending limit for each Sunday–Saturday week */
  weeklyBudget: number | null;
  weeklyBudgetEnabled: boolean;
  /** Where the weekly limit comes from: a fixed amount, or money received that week (wallet). */
  weeklyBudgetSource: WeeklyBudgetSource;
  /** Wallet only: carry unspent (or overspent) money into the next week. */
  walletCarryOver: boolean;
}

export type WeeklyBudgetSource = "fixed" | "wallet";

/** Money received (pocket money, salary, from family…), logged in the wallet. */
export interface Income {
  id: string;
  /** Where the money came from, e.g. "Salary" */
  title: string;
  amount: number;
  /** Local calendar date, yyyy-MM-dd */
  date: string;
  notes: string;
  isSample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeInput {
  title: string;
  amount: number;
  date: string;
  notes: string;
}

export interface AppData {
  version: 1;
  expenses: Expense[];
  incomes: Income[];
  customCategories: Category[];
  settings: Settings;
}

export interface ExpenseInput {
  title: string;
  amount: number;
  date: string;
  category: string;
  paymentMethod: PaymentMethod;
  notes: string;
}
