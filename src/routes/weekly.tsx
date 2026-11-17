import { createFileRoute } from "@tanstack/react-router";
import { addDays, format, parseISO, subWeeks } from "date-fns";
import { ArrowDownRight, ArrowUpRight, CalendarClock, ChevronLeft, ChevronRight, Hash, ReceiptText, TrendingUp, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

import { BudgetAlert } from "@/components/expenses/Budget";
import { BudgetSettingsForm } from "@/components/expenses/BudgetSettingsForm";
import { DailyBarChart, MonthlyBarChart } from "@/components/expenses/Charts";
import { EmptyState } from "@/components/expenses/EmptyState";
import { ExpenseList } from "@/components/expenses/ExpenseItem";
import { PageHeader, SectionTitle } from "@/components/expenses/PageHeader";
import { StatCard } from "@/components/expenses/StatCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  budgetStatus,
  daysLeftInWeek,
  expensesInRange,
  groupByDate,
  percentChange,
  round2,
  sumAmounts,
  toDateKey,
  weekDailyTotals,
  weekStartKey,
  weeklyHistory,
} from "@/lib/expenses/calc";
import { formatDateLong, formatMoney, formatPercent } from "@/lib/expenses/format";
import { useExpenses } from "@/lib/expenses/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/weekly")({
  head: () => ({
    meta: [
      { title: "Weekly Spending — RupeeFlow Expense Tracker" },
      { name: "description", content: "See what you spent each week, set a weekly limit and watch what's left count down." },
      { property: "og:title", content: "Weekly Spending — RupeeFlow Expense Tracker" },
      { property: "og:description", content: "See what you spent each week, set a weekly limit and watch what's left count down." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WeeklyPage,
});

const rangeLabel = (start: string) => {
  const s = parseISO(start);
  const e = addDays(s, 6);
  return `${format(s, "MMM d")} – ${format(e, s.getMonth() === e.getMonth() ? "d" : "MMM d")}`;
};

function WeeklyPage() {
  const { expenses, settings } = useExpenses();
  const cur = settings.currency;
  const today = new Date();
  const todayKey = toDateKey(today);
  const currentWeek = weekStartKey(today);
  const [weekStart, setWeekStart] = useState(currentWeek);
  const isCurrent = weekStart === currentWeek;

  const w = useMemo(() => {
    const start = parseISO(weekStart);
    const end = toDateKey(addDays(start, 6));
    const list = expensesInRange(expenses, weekStart, end);
    const prevStart = toDateKey(subWeeks(start, 1));
    const prevList = expensesInRange(expenses, prevStart, toDateKey(addDays(parseISO(prevStart), 6)));
    const total = sumAmounts(list);
    const prevTotal = sumAmounts(prevList);
    const days = weekDailyTotals(expenses, weekStart);
    const elapsed = weekStart < currentWeek ? 7 : weekStart === currentWeek ? 8 - daysLeftInWeek(new Date()) : 0;
    return {
      end,
      list,
      total,
      prevTotal,
      change: percentChange(total, prevTotal),
      days,
      elapsed,
      groups: groupByDate(list),
      status: settings.weeklyBudgetEnabled ? budgetStatus(total, settings.weeklyBudget) : null,
    };
  }, [expenses, weekStart, currentWeek, settings.weeklyBudget, settings.weeklyBudgetEnabled]);

  const history = useMemo(() => weeklyHistory(expenses, new Date(), 8), [expenses]);

  const s = w.status;
  const daysLeft = isCurrent ? daysLeftInWeek(today) : 0;
  const perDay = s && isCurrent && s.remaining > 0 ? Math.floor(s.remaining / daysLeft) : 0;
  const up = (w.change ?? 0) > 0;

  // Running balance: how much of the weekly limit is left after each day.
  let running = s?.budget ?? 0;
  const dayRows = w.days.map((d, i) => {
    running = round2(running - d.total);
    return { ...d, left: running, future: i >= w.elapsed };
  });

  return (
    <>
      <PageHeader
        eyebrow={isCurrent ? "This week" : rangeLabel(weekStart)}
        title="Weekly spending"
        description="Sunday to Saturday. Set a limit and watch it count down 📉"
        actions={
          <div className="flex items-center gap-1 rounded-xl border bg-card p-1">
            <Button variant="ghost" size="icon" aria-label="Previous week" onClick={() => setWeekStart(toDateKey(subWeeks(parseISO(weekStart), 1)))}>
              <ChevronLeft />
            </Button>
            <span className="min-w-32 text-center text-sm font-semibold tabular-nums">{rangeLabel(weekStart)}</span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Next week"
              disabled={isCurrent}
              onClick={() => setWeekStart(toDateKey(addDays(parseISO(weekStart), 7)))}
            >
              <ChevronRight />
            </Button>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <div className="relative overflow-hidden rounded-2xl hero-gradient p-5 text-hero-foreground shadow-float sm:p-6 sm:-rotate-[0.6deg]">
            {s ? (
              <>
                <p className="text-sm font-semibold text-hero-foreground/80">
                  {s.remaining >= 0 ? "Left to spend" : "Over your weekly limit"}
                </p>
                <p className="mt-1 font-display text-5xl font-medium tabular-nums">{formatMoney(Math.abs(s.remaining), cur)}</p>
                <p className="mt-1 text-sm text-hero-foreground/80">
                  Spent {formatMoney(s.spent, cur)} of {formatMoney(s.budget, cur)}
                </p>
                <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-hero-foreground/20">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", s.level === "exceeded" ? "bg-destructive" : "bg-hero-foreground")}
                    style={{ width: `${Math.max(0, 100 - Math.min(s.percent, 100))}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-hero-foreground/75">
                  <span>{s.percent.toFixed(0)}% used</span>
                  <span>{isCurrent ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left this week` : rangeLabel(weekStart)}</span>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-hero-foreground/80">Spent {isCurrent ? "this week" : "that week"}</p>
                <p className="mt-1 font-display text-5xl font-medium tabular-nums">{formatMoney(w.total, cur)}</p>
                <p className="mt-1 text-sm text-hero-foreground/80">Set a weekly limit on the right to see how much you have left.</p>
              </>
            )}
          </div>

          {s && s.level !== "ok" && <BudgetAlert status={s} currency={cur} period="week" />}

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <StatCard label="Spent" icon={Wallet} value={formatMoney(w.total, cur)} hint={rangeLabel(weekStart)} />
            {s && isCurrent ? (
              <StatCard label="Safe to spend / day" icon={CalendarClock} value={formatMoney(perDay, cur)} hint={daysLeft === 1 ? "For the rest of today" : `For the next ${daysLeft} days`} />
            ) : (
              <StatCard
                label="Avg. per day"
                icon={TrendingUp}
                value={formatMoney(w.elapsed ? Math.round(w.total / w.elapsed) : 0, cur)}
                hint={`Over ${w.elapsed} day${w.elapsed === 1 ? "" : "s"}`}
              />
            )}
            <StatCard label="Transactions" icon={Hash} value={w.list.length} hint="This week" />
            <StatCard
              label="vs previous week"
              icon={up ? ArrowUpRight : ArrowDownRight}
              value={<span className={cn(w.change !== null && (up ? "text-destructive" : "text-primary"))}>{formatPercent(w.change, true)}</span>}
              hint={`Last week: ${formatMoney(w.prevTotal, cur)}`}
            />
          </div>

          <Card className="p-5">
            <SectionTitle title="Day by day" description={s ? "What you spent each day and what was left after it" : "What you spent each day"} />
            <DailyBarChart
              data={w.days.map((d) => ({ label: format(parseISO(d.date), "EEE"), total: d.total, date: d.date }))}
              currency={cur}
              highlight={todayKey}
              height={180}
            />
            <div className="mt-3 divide-y">
              {dayRows.map((d) => (
                <div key={d.date} className={cn("flex items-center justify-between gap-3 py-2.5 text-sm", d.future && "opacity-50")}>
                  <div className="flex items-center gap-3">
                    <span className="w-9 text-xs font-bold uppercase text-muted-foreground">{format(parseISO(d.date), "EEE")}</span>
                    <span className="text-muted-foreground">
                      {format(parseISO(d.date), "MMM d")}
                      {d.date === todayKey && <span className="ml-1.5 font-semibold text-primary">Today</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <span className="font-semibold tabular-nums">{d.future ? "—" : formatMoney(d.total, cur)}</span>
                    {s && (
                      <span className={cn("w-28 text-xs tabular-nums", d.left < 0 ? "text-destructive" : "text-muted-foreground")}>
                        {d.future ? "" : `${formatMoney(d.left, cur)} left`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {w.groups.length === 0 ? (
            <Card>
              <EmptyState icon={ReceiptText} title="Nothing spent this week (yet) 🫶" description="Anything you add for these days will pop up here." />
            </Card>
          ) : (
            w.groups.map((g) => (
              <Card key={g.date} className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{formatDateLong(g.date)}</p>
                  <p className="text-sm font-bold tabular-nums">{formatMoney(g.total, cur)}</p>
                </div>
                <div className="mt-1">
                  <ExpenseList expenses={g.items} showDate={false} />
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-5 lg:col-span-2">
          <Card className="p-5 sm:p-6">
            <SectionTitle title="Weekly limit" />
            <BudgetSettingsForm period="week" />
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionTitle title="Recent weeks" description="Tap a week to see it" />
            <MonthlyBarChart
              data={history.map((h) => ({ key: h.start, label: format(parseISO(h.start), "d/M"), total: h.total }))}
              currency={cur}
              activeKey={weekStart}
              height={180}
            />
            <div className="mt-3 divide-y">
              {[...history].reverse().map((h) => {
                const over = s && h.total > s.budget;
                return (
                  <button
                    key={h.start}
                    type="button"
                    onClick={() => setWeekStart(h.start)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-left text-sm transition hover:bg-muted",
                      h.start === weekStart && "bg-primary-soft",
                    )}
                  >
                    <span>
                      <span className="font-medium">{h.start === currentWeek ? "This week" : rangeLabel(h.start)}</span>
                      <span className="block text-xs text-muted-foreground">{h.count} expense{h.count === 1 ? "" : "s"}</span>
                    </span>
                    <span className="text-right">
                      <span className="font-bold tabular-nums">{formatMoney(h.total, cur)}</span>
                      {s && (
                        <span className={cn("block text-xs", over ? "text-destructive" : "text-primary")}>
                          {over ? `${formatMoney(h.total - s.budget, cur)} over` : `${formatMoney(s.budget - h.total, cur)} under`}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
