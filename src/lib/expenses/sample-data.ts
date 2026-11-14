import { subDays } from "date-fns";

import { toDateKey } from "./calc";
import type { AppData, Expense, PaymentMethod } from "./types";

/** Deterministic demo data relative to "today", flagged isSample so it can be removed in one click. */
export function generateSampleExpenses(today: Date): Expense[] {
  let seed = 20261114;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const pick = (min: number, max: number, step = 10) =>
    Math.round((min + rand() * (max - min)) / step) * step;

  const out: Expense[] = [];
  let n = 0;
  const add = (
    d: Date,
    title: string,
    amount: number,
    category: string,
    paymentMethod: PaymentMethod,
    notes = "",
  ) => {
    n += 1;
    const ts = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 7 + (n % 13), n % 60).toISOString();
    out.push({
      id: `sample-${n}`,
      title,
      amount,
      date: toDateKey(d),
      category,
      paymentMethod,
      notes,
      isSample: true,
      createdAt: ts,
      updatedAt: ts,
    });
  };

  const billDays = [1, 5, 10, 12];
  for (let i = 45; i >= 0; i--) {
    const d = subDays(today, i);
    const dom = d.getDate();
    const dow = d.getDay();
    if (i % 9 === 4 && !billDays.includes(dom)) continue; // a few no-spend days

    if (dom === 1) add(d, "Monthly rent", 35000, "rent", "bank_transfer", "Annex rent");
    if (dom === 5) add(d, "Mobile & home broadband", 2490, "internet", "card");
    if (dom === 10) add(d, "Electricity bill", pick(2800, 3800), "utilities", "mobile_wallet");
    if (dom === 12) add(d, "Water bill", pick(600, 900), "utilities", "mobile_wallet");

    if (rand() < 0.65) add(d, "Breakfast", pick(250, 550), "food", "cash");
    if (rand() < 0.85) add(d, "Lunch", pick(550, 1100), "food", "cash");
    if (rand() < 0.75) {
      const tuk = rand() < 0.45;
      add(d, tuk ? "Tuk-tuk ride" : "Bus fare", tuk ? pick(300, 650) : pick(80, 200), "transport", tuk ? "mobile_wallet" : "cash");
    }
    if (i % 4 === 1) add(d, "Groceries", pick(1800, 4800), "groceries", "card");
    if (dow === 6 && rand() < 0.6) add(d, "Movie night", pick(1200, 2200), "entertainment", "card");
    if (i === 8) add(d, "Pharmacy", pick(900, 1800), "health", "cash");
    if (i === 20) add(d, "Haircut", 1200, "personal", "cash");
    if (i === 15 || i === 38) add(d, "Kitchen essentials", pick(1500, 3500), "household", "card");
    if (i === 27) add(d, "New T-shirt", pick(2500, 4500), "shopping", "card");
    if (i === 3) add(d, "Online course", pick(3000, 5000), "education", "card");
  }
  return out;
}

export function createInitialData(today: Date): AppData {
  return {
    version: 1,
    expenses: generateSampleExpenses(today),
    customCategories: [],
    settings: { currency: "LKR", monthlyBudget: 120000, budgetEnabled: true },
  };
}
