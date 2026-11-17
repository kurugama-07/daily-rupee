import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, CalendarOff, CalendarSearch, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/expenses/EmptyState";
import { ExpenseList } from "@/components/expenses/ExpenseItem";
import { MonthPicker, type YearMonth } from "@/components/expenses/MonthPicker";
import { PageHeader, SectionTitle } from "@/components/expenses/PageHeader";
import { StatCard } from "@/components/expenses/StatCard";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { dailyStats, expensesInMonth, expensesOnDate, groupByDate, sumAmounts, toDateKey } from "@/lib/expenses/calc";
import { MONTH_NAMES } from "@/lib/expenses/constants";
import { formatDateLong, formatDateShort, formatMoney, formatWeekdayShort } from "@/lib/expenses/format";
import { useExpenses } from "@/lib/expenses/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/daily")({
  head: () => ({
    meta: [
      { title: "Daily Breakdown — RupeeFlow Expense Tracker" },
      { name: "description", content: "See exactly what you spent each day, with daily totals and your highest and lowest days." },
      { property: "og:title", content: "Daily Breakdown — RupeeFlow Expense Tracker" },
      { property: "og:description", content: "See exactly what you spent each day, with daily totals and your highest and lowest days." },
    ],
  }),
  component: DailyPage,
});

function DailyPage() {
  const { expenses, settings } = useExpenses();
  const cur = settings.currency;
  const now = new Date();
  const todayKey = toDateKey(now);
  const [ym, setYm] = useState<YearMonth>({ year: now.getFullYear(), month: now.getMonth() });
  const [selected, setSelected] = useState(todayKey);

  const stats = useMemo(() => dailyStats(expenses, ym.year, ym.month, new Date()), [expenses, ym]);
  const groups = useMemo(() => groupByDate(expensesInMonth(expenses, ym.year, ym.month)), [expenses, ym]);
  const dayList = useMemo(() => expensesOnDate(expenses, selected), [expenses, selected]);

  const pickDate = (key: string) => {
    if (!key) return;
    setSelected(key);
    const [y = now.getFullYear(), m = now.getMonth() + 1] = key.split("-").map(Number);
    setYm({ year: y, month: m - 1 });
  };

  return (
    <>
      <PageHeader
        eyebrow="Day by day"
        title="Daily breakdown"
        description="Every day's spending, grouped and totalled."
        actions={<MonthPicker value={ym} onChange={setYm} />}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Highest day"
          icon={ArrowUp}
          value={stats.highest ? formatMoney(stats.highest.total, cur) : "—"}
          hint={stats.highest ? formatDateShort(stats.highest.date) : "No spending yet"}
        />
        <StatCard
          label="Lowest day"
          icon={ArrowDown}
          value={stats.lowest ? formatMoney(stats.lowest.total, cur) : "—"}
          hint={stats.lowest ? formatDateShort(stats.lowest.date) : "No spending yet"}
        />
        <StatCard label="Average per day" icon={TrendingUp} value={formatMoney(Math.round(stats.average), cur)} hint={`Across ${stats.elapsed} days`} />
        <StatCard
          label="No-spend days"
          icon={CalendarOff}
          value={stats.noSpendDays.length}
          hint={`of ${stats.elapsed} days in ${MONTH_NAMES[ym.month]}`}
        />
      </div>

      {stats.noSpendDays.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="mr-1 text-muted-foreground">Days with nothing recorded:</span>
          {stats.noSpendDays.map((d) => (
            <button
              key={d}
              onClick={() => pickDate(d)}
              className="rounded-full border bg-card px-2.5 py-1 font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
            >
              {formatDateShort(d)}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-5">
        <Card className="h-fit p-5 lg:sticky lg:top-8 lg:col-span-2">
          <SectionTitle title="Look up a day" description="Pick any date to see what you spent" />
          <Input type="date" value={selected} max={todayKey} onChange={(e) => pickDate(e.target.value)} aria-label="Select date" />
          <div className="mt-5 rounded-2xl hero-gradient p-5 text-hero-foreground shadow-float">
            <p className="text-xs text-hero-foreground/75">{formatDateLong(selected)}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{formatMoney(sumAmounts(dayList), cur)}</p>
            <p className="text-xs text-hero-foreground/75">
              {dayList.length} expense{dayList.length === 1 ? "" : "s"}
            </p>
          </div>
          {dayList.length ? (
            <div className="mt-2">
              <ExpenseList expenses={dayList} showDate={false} />
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">No expenses recorded on this day.</p>
          )}
        </Card>

        <div className="space-y-3 lg:col-span-3">
          {groups.length === 0 ? (
            <Card>
              <EmptyState icon={CalendarSearch} title={`No expenses in ${MONTH_NAMES[ym.month]} ${ym.year}`} description="Pick another month or add an expense." />
            </Card>
          ) : (
            groups.map((g) => (
              <Card key={g.date} className={cn("p-5 transition", g.date === selected && "ring-2 ring-primary/40")}>
                <button className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setSelected(g.date)}>
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 flex-col items-center justify-center rounded-xl bg-primary-soft text-primary">
                      <span className="text-[10px] font-bold uppercase">{formatWeekdayShort(g.date)}</span>
                      <span className="text-lg font-bold leading-none">{Number(g.date.slice(8))}</span>
                    </div>
                    <div>
                      <p className="font-semibold">{formatDateLong(g.date)}</p>
                      <p className="text-xs text-muted-foreground">
                        {g.items.length} expense{g.items.length === 1 ? "" : "s"}
                        {g.date === todayKey && " · Today"}
                      </p>
                    </div>
                  </div>
                </button>
                <div className="mt-2">
                  <ExpenseList expenses={g.items} showDate={false} />
                </div>
                <div className="mt-1 flex items-center justify-between border-t pt-3">
                  <span className="text-sm font-semibold text-muted-foreground">Total</span>
                  <span className="text-base font-bold tabular-nums">{formatMoney(g.total, cur)}</span>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </>
  );
}
