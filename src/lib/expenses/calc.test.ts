import { describe, expect, it } from "vitest";

import {
  averageDailySpending,
  budgetStatus,
  dailyStats,
  daysLeftInWeek,
  weekDailyTotals,
  weekRange,
  weekStartKey,
  walletWeek,
  weeklyBudgetStatus,
  weeklyHistory,
} from "./calc";
import { DEFAULT_SETTINGS } from "./constants";
import type { Expense, Income } from "./types";
import { parseBudget, parseExpenseInput, parseIncomeInput } from "./validation";

const mk = (date: string, amount: number): Expense => ({
  id: `${date}-${amount}`,
  title: "x",
  amount,
  date,
  category: "food",
  paymentMethod: "cash",
  notes: "",
  createdAt: `${date}T08:00:00.000Z`,
  updatedAt: `${date}T08:00:00.000Z`,
});

const today = new Date(2026, 10, 14); // Sat Nov 14 2026

describe("budget warnings", () => {
  it("is ok below 80% of the budget", () => {
    expect(budgetStatus(79_999, 100_000)?.level).toBe("ok");
  });
  it("warns at 80% of the budget", () => {
    expect(budgetStatus(80_000, 100_000)?.level).toBe("warning");
  });
  it("still warns (not exceeded) at exactly 100%", () => {
    expect(budgetStatus(100_000, 100_000)?.level).toBe("warning");
  });
  it("is exceeded once spending goes over the budget", () => {
    const s = budgetStatus(100_001, 100_000);
    expect(s?.level).toBe("exceeded");
    expect(s?.remaining).toBe(-1);
  });
  it("returns nothing when no budget is set", () => {
    expect(budgetStatus(5000, null)).toBeNull();
  });
});

describe("week", () => {
  it("runs Sunday to Saturday", () => {
    expect(weekRange(today)).toEqual({ start: "2026-11-08", end: "2026-11-14" });
  });
  it("starts a new week on Sunday", () => {
    expect(weekRange(new Date(2026, 10, 15))).toEqual({ start: "2026-11-15", end: "2026-11-21" });
  });
});

describe("average daily spending", () => {
  it("divides the current month by days elapsed so far", () => {
    const list = [mk("2026-11-01", 1000), mk("2026-11-14", 1800)];
    expect(averageDailySpending(list, 2026, 10, today)).toBe(200);
  });
  it("divides a past month by all its days", () => {
    expect(averageDailySpending([mk("2026-10-05", 3100)], 2026, 9, today)).toBe(100);
  });
});

describe("daily stats", () => {
  it("finds highest, lowest and no-spend days", () => {
    const list = [mk("2026-11-02", 500), mk("2026-11-02", 300), mk("2026-11-03", 2000)];
    const s = dailyStats(list, 2026, 10, today);
    expect(s.highest?.date).toBe("2026-11-03");
    expect(s.lowest?.total).toBe(800);
    expect(s.noSpendDays).toHaveLength(12);
  });
});

describe("expense validation", () => {
  const base = { title: "Lunch", amount: "850", date: "2026-11-14", category: "food", paymentMethod: "cash", notes: "" };
  it("accepts a normal expense", () => {
    const r = parseExpenseInput(base, today);
    expect(r.success && r.data.amount).toBe(850);
  });
  it("rejects negative amounts", () => {
    expect(parseExpenseInput({ ...base, amount: "-50" }, today).success).toBe(false);
  });
  it("rejects zero and non-numeric amounts", () => {
    expect(parseExpenseInput({ ...base, amount: "0" }, today).success).toBe(false);
    expect(parseExpenseInput({ ...base, amount: "abc" }, today).success).toBe(false);
  });
  it("rejects future dates", () => {
    expect(parseExpenseInput({ ...base, date: "2026-11-15" }, today).success).toBe(false);
  });
  it("rejects a zero budget", () => {
    expect(parseBudget("0").ok).toBe(false);
  });
});

describe("weekly budget", () => {
  it("counts down what's left from a 5,000 weekly limit", () => {
    const list = [mk("2026-11-08", 1200), mk("2026-11-11", 800)];
    const spent = weekDailyTotals(list, "2026-11-08").reduce((t, d) => t + d.total, 0);
    const s = budgetStatus(spent, 5000);
    expect(s?.remaining).toBe(3000);
    expect(s?.level).toBe("ok");
  });
  it("ignores spending from other weeks", () => {
    const list = [mk("2026-11-07", 900), mk("2026-11-15", 400), mk("2026-11-10", 500)];
    const days = weekDailyTotals(list, weekStartKey(today));
    expect(days).toHaveLength(7);
    expect(days[0]?.date).toBe("2026-11-08");
    expect(days.reduce((t, d) => t + d.total, 0)).toBe(500);
  });
  it("goes over once the week's spending passes the limit", () => {
    expect(budgetStatus(5200, 5000)?.remaining).toBe(-200);
    expect(budgetStatus(5200, 5000)?.level).toBe("exceeded");
  });
  it("counts days left including today (Sunday 7, Saturday 1)", () => {
    expect(daysLeftInWeek(new Date(2026, 10, 8))).toBe(7);
    expect(daysLeftInWeek(new Date(2026, 10, 14))).toBe(1);
  });
  it("totals recent weeks oldest first", () => {
    const h = weeklyHistory([mk("2026-11-03", 700), mk("2026-11-12", 300)], today, 2);
    expect(h.map((w) => [w.start, w.total])).toEqual([["2026-11-01", 700], ["2026-11-08", 300]]);
  });
});

const inc = (date: string, amount: number): Income => ({
  id: `in-${date}-${amount}`,
  title: "Pocket money",
  amount,
  date,
  notes: "",
  createdAt: `${date}T08:00:00.000Z`,
  updatedAt: `${date}T08:00:00.000Z`,
});

describe("wallet", () => {
  const walletSettings = { ...DEFAULT_SETTINGS, weeklyBudgetEnabled: true, weeklyBudgetSource: "wallet" as const };

  it("deducts the week's spending from money received that week", () => {
    const w = walletWeek([mk("2026-11-09", 1200)], [inc("2026-11-08", 5000)], "2026-11-08", false);
    expect(w.received).toBe(5000);
    expect(w.left).toBe(3800);
  });
  it("uses money received as the weekly limit instead of a fixed amount", () => {
    const s = weeklyBudgetStatus([mk("2026-11-09", 1200)], [inc("2026-11-08", 5000)], { ...walletSettings, weeklyBudget: 9000 }, "2026-11-08");
    expect(s?.budget).toBe(5000);
    expect(s?.remaining).toBe(3800);
  });
  it("carries last week's leftover into this week when carry-over is on", () => {
    const expenses = [mk("2026-11-03", 3000), mk("2026-11-10", 1000)];
    const incomes = [inc("2026-11-01", 5000), inc("2026-11-08", 4000)];
    const w = walletWeek(expenses, incomes, "2026-11-08", true);
    expect(w.carryIn).toBe(2000);
    expect(w.left).toBe(5000);
  });
  it("starts fresh each week when carry-over is off", () => {
    const incomes = [inc("2026-11-01", 5000), inc("2026-11-08", 4000)];
    expect(walletWeek([mk("2026-11-03", 3000)], incomes, "2026-11-08", false).carryIn).toBe(0);
  });
  it("is over budget when spending with no money received", () => {
    const s = weeklyBudgetStatus([mk("2026-11-09", 500)], [], walletSettings, "2026-11-08");
    expect(s?.level).toBe("exceeded");
    expect(s?.remaining).toBe(-500);
  });
  it("carries over leftover by default", () => {
    expect(DEFAULT_SETTINGS.walletCarryOver).toBe(true);
  });
  it("rejects negative or zero money received", () => {
    const base = { title: "Salary", amount: "5000", date: "2026-11-14", notes: "" };
    expect(parseIncomeInput(base, today).success).toBe(true);
    expect(parseIncomeInput({ ...base, amount: "-5" }, today).success).toBe(false);
    expect(parseIncomeInput({ ...base, amount: "0" }, today).success).toBe(false);
  });
});
