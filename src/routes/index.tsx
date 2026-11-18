import { createFileRoute, Link } from "@tanstack/react-router";
import { subMonths } from "date-fns";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarRange,
  Hash,
  Plus,
  ReceiptText,
  Sun,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useMemo } from "react";

import { BudgetAlert, BudgetSummary } from "@/components/expenses/Budget";
import { CategoryBreakdownList } from "@/components/expenses/CategoryBreakdownList";
import { CategoryDonut, CumulativeChart, DailyBarChart } from "@/components/expenses/Charts";
import { EmptyState } from "@/components/expenses/EmptyState";
import { ExpenseList } from "@/components/expenses/ExpenseItem";
import { PageHeader, SectionTitle } from "@/components/expenses/PageHeader";
import { SampleDataBanner } from "@/components/expenses/SampleDataBanner";
import { StatCard } from "@/components/expenses/StatCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  averageDailySpending,
  budgetStatus,
  categoryBreakdown,
  cumulativeComparison,
  dailyTotals,
  expensesInMonth,
  expensesInRange,
  percentChange,
  sumAmounts,
  toDateKey,
  weekRange,
} from "@/lib/expenses/calc";
import { MONTH_NAMES } from "@/lib/expenses/constants";
import { formatDateWithWeekday, formatMoney, formatPercent } from "@/lib/expenses/format";
import { useExpenses } from "@/lib/expenses/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — RupeeFlow Expense Tracker" },
      { name: "description", content: "Today, this week and this month's spending at a glance, with charts and recent expenses." },
      { property: "og:title", content: "Dashboard — RupeeFlow Expense Tracker" },
      { property: "og:description", content: "Today, this week and this month's spending at a glance, with charts and recent expenses." },
    ],
  }),
  component: DashboardPage,
});

function greeting(h: number) {
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function DashboardPage() {
  const { expenses, settings, getCategory } = useExpenses();
  const cur = settings.currency;

  const s = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const todayKey = toDateKey(today);
    const prev = subMonths(today, 1);
    const monthList = expensesInMonth(expenses, y, m);
    const prevList = expensesInMonth(expenses, prev.getFullYear(), prev.getMonth());
    const week = weekRange(today);
    const monthTotal = sumAmounts(monthList);
    const prevTotal = sumAmounts(prevList);
    const cumulative = cumulativeComparison(expenses, y, m, today);
    const breakdown = categoryBreakdown(monthList);
    const weekTotal = sumAmounts(expensesInRange(expenses, week.start, week.end));
    return {
      today,
      todayKey,
      monthName: MONTH_NAMES[m],
      prevMonthName: MONTH_NAMES[prev.getMonth()],
      todayTotal: sumAmounts(expenses.filter((e) => e.date === todayKey)),
      todayCount: expenses.filter((e) => e.date === todayKey).length,
      weekTotal,
      weekBudget: settings.weeklyBudgetEnabled ? budgetStatus(weekTotal, settings.weeklyBudget) : null,
      monthTotal,
      prevTotal,
      avgDaily: averageDailySpending(expenses, y, m, today),
      count: monthList.length,
      cumulative,
      changeToDate: percentChange(monthTotal, cumulative.previousToDate),
      daily: dailyTotals(expenses, y, m)
        .slice(0, today.getDate())
        .map((d) => ({ label: String(d.day), total: d.total, date: d.date })),
      breakdown,
      recent: [...expenses]
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
        .slice(0, 6),
      budget: settings.budgetEnabled ? budgetStatus(monthTotal, settings.monthlyBudget) : null,
    };
  }, [expenses, settings.budgetEnabled, settings.monthlyBudget, settings.weeklyBudgetEnabled, settings.weeklyBudget]);

  const up = (s.changeToDate ?? 0) > 0;
  const maxCompare = Math.max(s.monthTotal, s.prevTotal, 1);

  return (
    <>
      <PageHeader
        eyebrow={formatDateWithWeekday(s.todayKey)}
        title={greeting(s.today.getHours())}
        description="Here's how your spending is tracking."
        actions={
          <Button asChild size="lg" className="hidden sm:inline-flex">
            <Link to="/add">
              <Plus /> Add expense
            </Link>
          </Button>
        }
      />
      <SampleDataBanner />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard
          className="col-span-2 md:col-span-1"
          tone="primary"
          label="This month"
          icon={Wallet}
          value={formatMoney(s.monthTotal, cur)}
          hint={
            s.changeToDate === null ? (
              `${s.monthName} so far`
            ) : (
              <span className="inline-flex items-center gap-1">
                {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                {formatPercent(Math.abs(s.changeToDate))} {up ? "more" : "less"} than last month
              </span>
            )
          }
        />
        <StatCard label="Today" icon={Sun} value={formatMoney(s.todayTotal, cur)} hint={`${s.todayCount} expense${s.todayCount === 1 ? "" : "s"}`} />
        <Link to="/weekly" className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <StatCard
            className="h-full transition hover:border-primary/40"
            label="This week"
            icon={CalendarRange}
            value={formatMoney(s.weekTotal, cur)}
            hint={
              s.weekBudget ? (
                <span className={cn(s.weekBudget.remaining < 0 && "font-semibold text-destructive")}>
                  {s.weekBudget.remaining >= 0
                    ? `${formatMoney(s.weekBudget.remaining, cur)} left of ${formatMoney(s.weekBudget.budget, cur)}`
                    : `${formatMoney(-s.weekBudget.remaining, cur)} over limit`}
                </span>
              ) : (
                "Since Sunday"
              )
            }
          />
        </Link>
        <StatCard label="Avg. per day" icon={TrendingUp} value={formatMoney(Math.round(s.avgDaily), cur)} hint={`Over ${s.today.getDate()} days`} />
        <StatCard label="Transactions" icon={Hash} value={s.count} hint={`In ${s.monthName}`} />
      </div>

      <div className="mt-4 grid gap-4 sm:mt-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <SectionTitle
            title="Monthly overview"
            description={`Running total for ${s.monthName} vs ${s.prevMonthName}`}
            action={
              <div className="hidden items-center gap-3 text-[11px] text-muted-foreground sm:flex">
                <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-chart-1" />This month</span>
                <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded border-t-2 border-dashed border-muted-foreground/50" />Last month</span>
              </div>
            }
          />
          <CumulativeChart data={s.cumulative.series} currency={cur} />
        </Card>

        <Card className="p-5">
          <SectionTitle title="This month vs last" description="Total spending comparison" />
          <div className="space-y-4">
            {[
              { label: s.monthName, value: s.monthTotal, cls: "bg-primary" },
              { label: s.prevMonthName, value: s.prevTotal, cls: "bg-chart-6" },
            ].map((r) => (
              <div key={r.label}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className="font-bold tabular-nums">{formatMoney(r.value, cur)}</span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full", r.cls)} style={{ width: `${(r.value / maxCompare) * 100}%` }} />
                </div>
              </div>
            ))}
            <div className="rounded-xl bg-muted p-3.5 text-sm">
              <p className="text-muted-foreground">Compared with the same point last month</p>
              <p className={cn("mt-1 font-semibold", s.changeToDate !== null && up ? "text-destructive" : "text-primary")}>
                {s.changeToDate === null
                  ? "Not enough data from last month yet"
                  : `${formatPercent(s.changeToDate, true)} (${formatMoney(s.cumulative.previousToDate, cur)} by this day)`}
              </p>
            </div>
            {s.weekBudget && (
              <div className="border-t pt-4">
                <p className="mb-3 text-sm font-semibold">Weekly budget</p>
                <BudgetSummary status={s.weekBudget} currency={cur} />
                {s.weekBudget.level !== "ok" && (
                  <div className="mt-3">
                    <BudgetAlert status={s.weekBudget} currency={cur} period="week" />
                  </div>
                )}
              </div>
            )}
            {s.budget && (
              <div className="border-t pt-4">
                <p className="mb-3 text-sm font-semibold">Monthly budget</p>
                <BudgetSummary status={s.budget} currency={cur} />
                {s.budget.level !== "ok" && (
                  <div className="mt-3">
                    <BudgetAlert status={s.budget} currency={cur} />
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 sm:mt-5 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <SectionTitle title="Daily spending" description={`Each day of ${s.monthName}`} />
          <DailyBarChart data={s.daily} currency={cur} highlight={s.todayKey} labelFormat={(l) => `${s.monthName} ${l}`} />
        </Card>
        <Card className="p-5 lg:col-span-2">
          <SectionTitle
            title="By category"
            description={s.monthName}
            action={
              <Link to="/analytics" className="text-xs font-semibold text-primary hover:underline">
                Details
              </Link>
            }
          />
          {s.breakdown.length ? (
            <div className="grid items-center gap-5 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
              <CategoryDonut
                total={s.monthTotal}
                currency={cur}
                height={190}
                data={s.breakdown.map((b) => ({ name: getCategory(b.categoryId).name, value: b.total, color: getCategory(b.categoryId).color }))}
              />
              <CategoryBreakdownList items={s.breakdown} limit={4} />
            </div>
          ) : (
            <EmptyState icon={Wallet} title="Nothing spent this month yet" />
          )}
        </Card>
      </div>

      <Card className="mt-4 p-5 sm:mt-5">
        <SectionTitle
          title="Recent transactions"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/history">
                View all <ArrowRight />
              </Link>
            </Button>
          }
        />
        {s.recent.length ? (
          <ExpenseList expenses={s.recent} />
        ) : (
          <EmptyState
            icon={ReceiptText}
            title="No expenses yet"
            description="Add your first expense and your dashboard will fill in automatically."
            action={
              <Button asChild>
                <Link to="/add">
                  <Plus /> Add expense
                </Link>
              </Button>
            }
          />
        )}
      </Card>
    </>
  );
}
