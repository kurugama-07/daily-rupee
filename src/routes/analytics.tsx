import { createFileRoute } from "@tanstack/react-router";
import { getDaysInMonth, subMonths } from "date-fns";
import { ArrowDownRight, ArrowUpRight, CalendarCheck, Crown, PieChart, TrendingUp, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

import { CategoryBreakdownList } from "@/components/expenses/CategoryBreakdownList";
import { CategoryDonut, DailyBarChart, MonthlyBarChart } from "@/components/expenses/Charts";
import { EmptyState } from "@/components/expenses/EmptyState";
import { MonthPicker, type YearMonth } from "@/components/expenses/MonthPicker";
import { PageHeader, SectionTitle } from "@/components/expenses/PageHeader";
import { StatCard } from "@/components/expenses/StatCard";
import { Card } from "@/components/ui/card";
import {
  categoryBreakdown,
  dailyStats,
  dailyTotals,
  daysElapsedInMonth,
  expensesInMonth,
  monthKey,
  monthlyHistory,
  percentChange,
  sumAmounts,
} from "@/lib/expenses/calc";
import { MONTH_NAMES } from "@/lib/expenses/constants";
import { formatDateShort, formatMoney, formatPercent } from "@/lib/expenses/format";
import { useExpenses } from "@/lib/expenses/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Monthly Analytics — RupeeFlow Expense Tracker" },
      { name: "description", content: "Monthly totals, category breakdowns, daily trends and month-to-month comparisons." },
      { property: "og:title", content: "Monthly Analytics — RupeeFlow Expense Tracker" },
      { property: "og:description", content: "Monthly totals, category breakdowns, daily trends and month-to-month comparisons." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { expenses, settings, getCategory } = useExpenses();
  const cur = settings.currency;
  const now = new Date();
  const [ym, setYm] = useState<YearMonth>({ year: now.getFullYear(), month: now.getMonth() });

  const a = useMemo(() => {
    const today = new Date();
    const list = expensesInMonth(expenses, ym.year, ym.month);
    const total = sumAmounts(list);
    const prev = subMonths(new Date(ym.year, ym.month, 1), 1);
    const prevTotal = sumAmounts(expensesInMonth(expenses, prev.getFullYear(), prev.getMonth()));
    const stats = dailyStats(expenses, ym.year, ym.month, today);
    const breakdown = categoryBreakdown(list);
    const elapsed = daysElapsedInMonth(ym.year, ym.month, today);
    const dim = getDaysInMonth(new Date(ym.year, ym.month, 1));
    const history = monthlyHistory(expenses, ym.year, ym.month, 12);
    const withData = history.filter((h) => h.total > 0);
    return {
      total,
      prevTotal,
      change: percentChange(total, prevTotal),
      stats,
      breakdown,
      isCurrent: elapsed > 0 && elapsed < dim,
      projected: elapsed ? Math.round((total / elapsed) * dim) : 0,
      daily: dailyTotals(expenses, ym.year, ym.month)
        .slice(0, elapsed || undefined)
        .map((d) => ({ label: String(d.day), total: d.total, date: d.date })),
      history,
      typicalMonth: withData.length ? Math.round(withData.reduce((t, h) => t + h.total, 0) / withData.length) : 0,
      count: list.length,
    };
  }, [expenses, ym]);

  const top = a.breakdown[0];
  const up = (a.change ?? 0) > 0;
  const comparisonRows = a.history.slice(-6).reverse();

  return (
    <>
      <PageHeader
        eyebrow="Spending patterns"
        title="Analytics"
        description={`${MONTH_NAMES[ym.month]} ${ym.year}`}
        actions={<MonthPicker value={ym} onChange={setYm} />}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          className="col-span-2 xl:col-span-1"
          tone="primary"
          label="Total spent"
          icon={Wallet}
          value={formatMoney(a.total, cur)}
          hint={
            a.change === null ? (
              `${a.count} transactions`
            ) : (
              <span className="inline-flex items-center gap-1">
                {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                {formatPercent(Math.abs(a.change))} vs previous month
              </span>
            )
          }
        />
        <StatCard
          label="Average per day"
          icon={TrendingUp}
          value={formatMoney(Math.round(a.stats.average), cur)}
          hint={a.isCurrent ? `Projected month: ${formatMoney(a.projected, cur)}` : `${a.stats.elapsed} days`}
        />
        <StatCard
          label="Highest day"
          icon={CalendarCheck}
          value={a.stats.highest ? formatMoney(a.stats.highest.total, cur) : "—"}
          hint={a.stats.highest ? formatDateShort(a.stats.highest.date) : "No data"}
        />
        <StatCard
          label="Top category"
          icon={Crown}
          value={top ? getCategory(top.categoryId).name : "—"}
          hint={top ? `${formatMoney(top.total, cur)} · ${top.percent.toFixed(0)}%` : "No data"}
        />
      </div>

      {a.typicalMonth > 0 && (
        <div className="mt-4 rounded-2xl border bg-card p-4 text-sm shadow-card sm:p-5">
          <p className="text-muted-foreground">
            Based on your recorded months, you typically spend about{" "}
            <span className="font-bold text-foreground">{formatMoney(a.typicalMonth, cur)}</span> per month
            {a.isCurrent && (
              <>
                {" "}— at your current pace this month will end near{" "}
                <span className="font-bold text-foreground">{formatMoney(a.projected, cur)}</span>
              </>
            )}
            .
          </p>
        </div>
      )}

      <Card className="mt-4 p-5">
        <SectionTitle title="Daily spending trend" description={`Each day of ${MONTH_NAMES[ym.month]}`} />
        {a.daily.length ? (
          <DailyBarChart
            data={a.daily}
            currency={cur}
            highlight={a.stats.highest?.date}
            height={260}
            labelFormat={(l) => `${MONTH_NAMES[ym.month]} ${l}`}
          />
        ) : (
          <EmptyState icon={TrendingUp} title="This month hasn't started yet" />
        )}
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle title="Category breakdown" description="Where your money went" />
          {a.breakdown.length ? (
            <div className="space-y-6">
              <CategoryDonut
                total={a.total}
                currency={cur}
                height={220}
                data={a.breakdown.map((b) => ({ name: getCategory(b.categoryId).name, value: b.total, color: getCategory(b.categoryId).color }))}
              />
              <CategoryBreakdownList items={a.breakdown} />
            </div>
          ) : (
            <EmptyState icon={PieChart} title="No expenses this month" />
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <SectionTitle title="Monthly spending history" description="Last 12 months" />
            <MonthlyBarChart data={a.history} currency={cur} activeKey={monthKey(ym.year, ym.month)} />
          </Card>
          <Card className="p-5">
            <SectionTitle title="Compared with previous months" />
            <ul className="divide-y">
              {comparisonRows.map((row, i) => {
                const before = comparisonRows[i + 1];
                const ch = before ? percentChange(row.total, before.total) : null;
                const active = row.key === monthKey(ym.year, ym.month);
                return (
                  <li key={row.key} className="flex items-center justify-between gap-3 py-2.5">
                    <button
                      className={cn("text-left text-sm", active ? "font-bold text-primary" : "text-foreground hover:text-primary")}
                      onClick={() => setYm({ year: row.year, month: row.month })}
                    >
                      {MONTH_NAMES[row.month]} {row.year}
                    </button>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "w-14 text-right text-xs font-semibold tabular-nums",
                          ch === null ? "text-muted-foreground" : ch > 0 ? "text-destructive" : "text-primary",
                        )}
                      >
                        {formatPercent(ch, true)}
                      </span>
                      <span className="w-28 text-right text-sm font-bold tabular-nums">{formatMoney(row.total, cur)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
