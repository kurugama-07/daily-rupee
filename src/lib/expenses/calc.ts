import { addDays, endOfWeek, format, getDaysInMonth, parseISO, startOfWeek, subMonths, subWeeks } from "date-fns";

import { BUDGET_WARNING_PERCENT } from "./constants";
import type { Expense } from "./types";

/** Pure calculation helpers. Every dashboard figure is derived from these. */

export const round2 = (n: number) => Math.round(n * 100) / 100;

export const toDateKey = (d: Date) => format(d, "yyyy-MM-dd");

/** month is 0-based */
export const monthKey = (year: number, month: number) =>
  `${year}-${String(month + 1).padStart(2, "0")}`;

export function sumAmounts(list: readonly Expense[]): number {
  return round2(list.reduce((t, e) => t + e.amount, 0));
}

export function expensesInMonth(list: readonly Expense[], year: number, month: number) {
  const prefix = `${monthKey(year, month)}-`;
  return list.filter((e) => e.date.startsWith(prefix));
}

export function expensesInRange(list: readonly Expense[], start: string, end: string) {
  return list.filter((e) => e.date >= start && e.date <= end);
}

export function expensesOnDate(list: readonly Expense[], dateKey: string) {
  return list
    .filter((e) => e.date === dateKey)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Weeks run Sunday to Saturday (0 = Sunday). Change here only. */
export const WEEK_STARTS_ON = 0 as const;

/** Weeks start on Sunday. */
export function weekRange(today: Date) {
  return {
    start: toDateKey(startOfWeek(today, { weekStartsOn: WEEK_STARTS_ON })),
    end: toDateKey(endOfWeek(today, { weekStartsOn: WEEK_STARTS_ON })),
  };
}

/** Sunday of the week containing the given date, as yyyy-MM-dd. */
export function weekStartKey(d: Date): string {
  return toDateKey(startOfWeek(d, { weekStartsOn: WEEK_STARTS_ON }));
}

/** Days left in the current week, counting today (Sunday = 7, Saturday = 1). */
export function daysLeftInWeek(today: Date): number {
  return 7 - ((today.getDay() - WEEK_STARTS_ON + 7) % 7);
}

/** Seven day totals, Sunday to Saturday, for the week starting at weekStart. */
export function weekDailyTotals(list: readonly Expense[], weekStart: string): DayTotal[] {
  const start = parseISO(weekStart);
  return Array.from({ length: 7 }, (_, i) => {
    const date = toDateKey(addDays(start, i));
    const items = list.filter((e) => e.date === date);
    return { date, day: i + 1, total: sumAmounts(items), count: items.length };
  });
}

export interface WeekTotal {
  start: string;
  end: string;
  total: number;
  count: number;
}

/** Totals for the last `count` weeks ending with the week containing `today`, oldest first. */
export function weeklyHistory(list: readonly Expense[], today: Date, count: number): WeekTotal[] {
  const current = startOfWeek(today, { weekStartsOn: WEEK_STARTS_ON });
  return Array.from({ length: count }, (_, idx) => {
    const s = subWeeks(current, count - 1 - idx);
    const start = toDateKey(s);
    const end = toDateKey(addDays(s, 6));
    const items = expensesInRange(list, start, end);
    return { start, end, total: sumAmounts(items), count: items.length };
  });
}

/** Days of the month that have already happened (full month for past months, 0 for future). */
export function daysElapsedInMonth(year: number, month: number, today: Date): number {
  const ty = today.getFullYear();
  const tm = today.getMonth();
  if (year < ty || (year === ty && month < tm)) return getDaysInMonth(new Date(year, month, 1));
  if (year === ty && month === tm) return today.getDate();
  return 0;
}

/** Month total divided by the days elapsed in that month. */
export function averageDailySpending(
  list: readonly Expense[],
  year: number,
  month: number,
  today: Date,
): number {
  const days = daysElapsedInMonth(year, month, today);
  if (!days) return 0;
  return round2(sumAmounts(expensesInMonth(list, year, month)) / days);
}

export interface DayTotal {
  date: string;
  day: number;
  total: number;
  count: number;
}

export function dailyTotals(list: readonly Expense[], year: number, month: number): DayTotal[] {
  const n = getDaysInMonth(new Date(year, month, 1));
  const map = new Map<string, { total: number; count: number }>();
  for (const e of expensesInMonth(list, year, month)) {
    const cur = map.get(e.date) ?? { total: 0, count: 0 };
    cur.total += e.amount;
    cur.count += 1;
    map.set(e.date, cur);
  }
  const mk = monthKey(year, month);
  return Array.from({ length: n }, (_, i) => {
    const date = `${mk}-${String(i + 1).padStart(2, "0")}`;
    const v = map.get(date);
    return { date, day: i + 1, total: round2(v?.total ?? 0), count: v?.count ?? 0 };
  });
}

export function dailyStats(list: readonly Expense[], year: number, month: number, today: Date) {
  const elapsed = daysElapsedInMonth(year, month, today);
  const days = dailyTotals(list, year, month).slice(0, elapsed);
  const active = days.filter((d) => d.total > 0);
  const highest = active.reduce<DayTotal | null>((b, d) => (!b || d.total > b.total ? d : b), null);
  const lowest = active.reduce<DayTotal | null>((b, d) => (!b || d.total < b.total ? d : b), null);
  return {
    elapsed,
    highest,
    lowest,
    activeDays: active.length,
    average: averageDailySpending(list, year, month, today),
    noSpendDays: days.filter((d) => d.total === 0).map((d) => d.date),
  };
}

export interface CategoryTotal {
  categoryId: string;
  total: number;
  count: number;
  percent: number;
}

export function categoryBreakdown(list: readonly Expense[]): CategoryTotal[] {
  const map = new Map<string, { total: number; count: number }>();
  for (const e of list) {
    const cur = map.get(e.category) ?? { total: 0, count: 0 };
    cur.total += e.amount;
    cur.count += 1;
    map.set(e.category, cur);
  }
  const grand = sumAmounts(list);
  return [...map.entries()]
    .map(([categoryId, v]) => ({
      categoryId,
      total: round2(v.total),
      count: v.count,
      percent: grand ? round2((v.total / grand) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export interface DateGroup {
  date: string;
  items: Expense[];
  total: number;
}

export function groupByDate(list: readonly Expense[]): DateGroup[] {
  const map = new Map<string, Expense[]>();
  for (const e of list) {
    const arr = map.get(e.date) ?? [];
    arr.push(e);
    map.set(e.date, arr);
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, items]) => ({
      date,
      items: items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      total: sumAmounts(items),
    }));
}

export interface MonthTotal {
  key: string;
  year: number;
  month: number;
  label: string;
  total: number;
  count: number;
}

export function monthlyHistory(
  list: readonly Expense[],
  endYear: number,
  endMonth: number,
  count: number,
): MonthTotal[] {
  const end = new Date(endYear, endMonth, 1);
  return Array.from({ length: count }, (_, idx) => {
    const d = subMonths(end, count - 1 - idx);
    const items = expensesInMonth(list, d.getFullYear(), d.getMonth());
    return {
      key: monthKey(d.getFullYear(), d.getMonth()),
      year: d.getFullYear(),
      month: d.getMonth(),
      label: format(d, "MMM yy"),
      total: sumAmounts(items),
      count: items.length,
    };
  });
}

/** Running totals for the month vs the previous month, day by day. */
export function cumulativeComparison(
  list: readonly Expense[],
  year: number,
  month: number,
  today: Date,
) {
  const cur = dailyTotals(list, year, month);
  const prevDate = subMonths(new Date(year, month, 1), 1);
  const prev = dailyTotals(list, prevDate.getFullYear(), prevDate.getMonth());
  const elapsed = daysElapsedInMonth(year, month, today);
  const len = Math.max(cur.length, prev.length);
  let c = 0;
  let p = 0;
  let previousToDate = 0;
  const series: { day: number; current: number | null; previous: number | null }[] = [];
  for (let i = 0; i < len; i++) {
    if (i < cur.length) c += cur[i]?.total ?? 0;
    if (i < prev.length) p += prev[i]?.total ?? 0;
    if (i < elapsed && i < prev.length) previousToDate = p;
    series.push({
      day: i + 1,
      current: i < elapsed && i < cur.length ? round2(c) : null,
      previous: i < prev.length ? round2(p) : null,
    });
  }
  return { series, previousToDate: round2(previousToDate) };
}

export function percentChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return round2(((current - previous) / previous) * 100);
}

export type BudgetLevel = "ok" | "warning" | "exceeded";

export interface BudgetStatus {
  budget: number;
  spent: number;
  remaining: number;
  percent: number;
  level: BudgetLevel;
}

/** Warning from 80% of the budget; "exceeded" once spending goes over it. */
export function budgetStatus(spent: number, budget: number | null | undefined): BudgetStatus | null {
  if (!budget || budget <= 0) return null;
  const percent = (spent / budget) * 100;
  const level: BudgetLevel =
    spent > budget ? "exceeded" : percent >= BUDGET_WARNING_PERCENT ? "warning" : "ok";
  return { budget, spent: round2(spent), remaining: round2(budget - spent), percent: round2(percent), level };
}

export interface ExpenseFilters {
  search: string;
  category: string; // "all" or id
  payment: string; // "all" or method
  month: string; // "" or yyyy-MM
  from: string; // "" or yyyy-MM-dd
  to: string;
  sort: "newest" | "oldest";
}

export const EMPTY_FILTERS: ExpenseFilters = {
  search: "",
  category: "all",
  payment: "all",
  month: "",
  from: "",
  to: "",
  sort: "newest",
};

export function filterExpenses(list: readonly Expense[], f: ExpenseFilters): Expense[] {
  const q = f.search.trim().toLowerCase();
  const out = list.filter((e) => {
    if (q && !e.title.toLowerCase().includes(q)) return false;
    if (f.category !== "all" && e.category !== f.category) return false;
    if (f.payment !== "all" && e.paymentMethod !== f.payment) return false;
    if (f.month && !e.date.startsWith(`${f.month}-`)) return false;
    if (f.from && e.date < f.from) return false;
    if (f.to && e.date > f.to) return false;
    return true;
  });
  const dir = f.sort === "oldest" ? 1 : -1;
  return out.sort(
    (a, b) => dir * (a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)),
  );
}

export function toCSV(
  list: readonly Expense[],
  categoryName: (id: string) => string,
  paymentName: (id: string) => string,
  currency: string,
): string {
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const rows = [["Date", "Title", "Category", "Amount", "Currency", "Payment method", "Notes"]];
  for (const e of [...list].sort((a, b) => a.date.localeCompare(b.date))) {
    rows.push([
      e.date,
      e.title,
      categoryName(e.category),
      e.amount.toFixed(2),
      currency,
      paymentName(e.paymentMethod),
      e.notes ?? "",
    ]);
  }
  return rows.map((r) => r.map(esc).join(",")).join("\n");
}
