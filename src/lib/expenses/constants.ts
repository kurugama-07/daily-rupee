import type { Category, PaymentMethod, Settings } from "./types";

export const CHART_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
  "var(--chart-9)",
  "var(--chart-10)",
] as const;

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "food", name: "Food & Dining", color: "var(--chart-1)", builtIn: true },
  { id: "groceries", name: "Groceries", color: "var(--chart-2)", builtIn: true },
  { id: "transport", name: "Transportation", color: "var(--chart-5)", builtIn: true },
  { id: "rent", name: "Rent", color: "var(--chart-9)", builtIn: true },
  { id: "utilities", name: "Electricity & Water", color: "var(--chart-3)", builtIn: true },
  { id: "internet", name: "Internet & Mobile", color: "var(--chart-7)", builtIn: true },
  { id: "shopping", name: "Shopping", color: "var(--chart-4)", builtIn: true },
  { id: "health", name: "Healthcare", color: "var(--chart-8)", builtIn: true },
  { id: "personal", name: "Personal Care", color: "var(--chart-6)", builtIn: true },
  { id: "entertainment", name: "Entertainment", color: "var(--chart-4)", builtIn: true },
  { id: "education", name: "Education", color: "var(--chart-5)", builtIn: true },
  { id: "household", name: "Household Items", color: "var(--chart-2)", builtIn: true },
  { id: "other", name: "Other", color: "var(--chart-10)", builtIn: true },
];

export const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: "cash", label: "Cash" },
  { id: "card", label: "Card" },
  { id: "bank_transfer", label: "Bank transfer" },
  { id: "mobile_wallet", label: "Mobile wallet" },
  { id: "other", label: "Other" },
];

export const PAYMENT_METHOD_IDS = PAYMENT_METHODS.map((p) => p.id) as [
  PaymentMethod,
  ...PaymentMethod[],
];

export function paymentLabel(id: string): string {
  return PAYMENT_METHODS.find((p) => p.id === id)?.label ?? "Other";
}

export const CURRENCIES = ["LKR", "USD", "EUR", "GBP", "INR", "AUD"] as const;

export const DEFAULT_SETTINGS: Settings = {
  currency: "LKR",
  monthlyBudget: null,
  budgetEnabled: false,
  weeklyBudget: null,
  weeklyBudgetEnabled: false,
  weeklyBudgetSource: "fixed",
  walletCarryOver: true,
};

/** One-tap sources for money received. */
export const INCOME_QUICK_PICKS = ["Pocket money", "Salary", "From family", "Part-time work", "Freelance", "Gift"] as const;

export const QUICK_PICKS: { title: string; category: string }[] = [
  { title: "Breakfast", category: "food" },
  { title: "Lunch", category: "food" },
  { title: "Dinner", category: "food" },
  { title: "Tea & snacks", category: "food" },
  { title: "Bus fare", category: "transport" },
  { title: "Tuk-tuk ride", category: "transport" },
  { title: "Groceries", category: "groceries" },
  { title: "Mobile reload", category: "internet" },
];

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const BUDGET_WARNING_PERCENT = 80;
