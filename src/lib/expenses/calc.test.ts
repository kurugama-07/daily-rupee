import { describe, expect, it } from "vitest";

import { averageDailySpending, budgetStatus, dailyStats, weekRange } from "./calc";
import type { Expense } from "./types";
import { parseBudget, parseExpenseInput } from "./validation";

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
  it("starts on Monday", () => {
    expect(weekRange(today)).toEqual({ start: "2026-11-09", end: "2026-11-15" });
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
