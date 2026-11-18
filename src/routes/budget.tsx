import { createFileRoute, Link } from "@tanstack/react-router";
import { getDaysInMonth } from "date-fns";
import { CalendarClock, PiggyBank, Target, TrendingUp, Wallet } from "lucide-react";
import { useMemo } from "react";

import { BudgetAlert, BudgetBar, BudgetSummary } from "@/components/expenses/Budget";
import { BudgetSettingsForm } from "@/components/expenses/BudgetSettingsForm";
import { EmptyState } from "@/components/expenses/EmptyState";
import { PageHeader, SectionTitle } from "@/components/expenses/PageHeader";
import { StatCard } from "@/components/expenses/StatCard";
import { Card } from "@/components/ui/card";
import { averageDailySpending, budgetStatus, expensesInMonth, expensesInRange, sumAmounts, weekRange } from "@/lib/expenses/calc";
import { MONTH_NAMES } from "@/lib/expenses/constants";
import { formatMoney } from "@/lib/expenses/format";
import { useExpenses } from "@/lib/expenses/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/budget")({
  head: () => ({
    meta: [
      { title: "Monthly Budget — RupeeFlow Expense Tracker" },
      { name: "description", content: "Set an optional monthly spending limit and see how much you have left." },
      { property: "og:title", content: "Monthly Budget — RupeeFlow Expense Tracker" },
      { property: "og:description", content: "Set an optional monthly spending limit and see how much you have left." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BudgetPage,
});

function BudgetPage() {
  const { expenses, settings } = useExpenses();
  const cur = settings.currency;

  const b = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const spent = sumAmounts(expensesInMonth(expenses, y, m));
    const dim = getDaysInMonth(today);
    const daysLeft = dim - today.getDate() + 1;
    const avg = averageDailySpending(expenses, y, m, today);
    return {
      monthName: MONTH_NAMES[m],
      spent,
      daysLeft,
      projected: Math.round(avg * dim),
      status: budgetStatus(spent, settings.monthlyBudget),
      week: budgetStatus(sumAmounts(expensesInRange(expenses, weekRange(today).start, weekRange(today).end)), settings.weeklyBudget),
    };
  }, [expenses, settings.monthlyBudget, settings.weeklyBudget]);
  const wk = settings.weeklyBudgetEnabled ? b.week : null;

  const s = settings.budgetEnabled ? b.status : null;
  const perDay = s && s.remaining > 0 ? Math.floor(s.remaining / b.daysLeft) : 0;

  return (
    <>
      <PageHeader eyebrow={b.monthName} title="Budget" description="An optional monthly limit to keep your spending on track." />

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          {s ? (
            <>
              <Card className="p-5 sm:p-6">
                <SectionTitle title={`${b.monthName} budget`} description={`${b.daysLeft} day${b.daysLeft === 1 ? "" : "s"} left this month`} />
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Used</p>
                    <p
                      className={cn(
                        "font-display text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl",
                        s.level === "exceeded" ? "text-destructive" : s.level === "warning" ? "text-warning-foreground" : "text-primary",
                      )}
                    >
                      {s.percent.toFixed(0)}%
                    </p>
                  </div>
                  <p className="pb-2 text-right text-sm text-muted-foreground">
                    {formatMoney(s.spent, cur)}
                    <br />
                    of {formatMoney(s.budget, cur)}
                  </p>
                </div>
                <BudgetBar status={s} className="mt-4 h-4" />
                <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                  <span>0%</span>
                  <span>80%</span>
                  <span>100%</span>
                </div>
                {s.level !== "ok" && (
                  <div className="mt-4">
                    <BudgetAlert status={s} currency={cur} />
                  </div>
                )}
              </Card>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <StatCard label="Monthly budget" icon={Target} value={formatMoney(s.budget, cur)} />
                <StatCard label="Amount spent" icon={Wallet} value={formatMoney(s.spent, cur)} />
                <StatCard
                  label="Remaining"
                  icon={PiggyBank}
                  value={<span className={cn(s.remaining < 0 && "text-destructive")}>{formatMoney(s.remaining, cur)}</span>}
                  hint={s.remaining < 0 ? "Over budget" : "Left to spend"}
                />
                <StatCard
                  label="Safe to spend / day"
                  icon={CalendarClock}
                  value={formatMoney(perDay, cur)}
                  hint={`For the next ${b.daysLeft} days`}
                />
              </div>
              <Card className="flex items-start gap-3 p-5">
                <TrendingUp className="mt-0.5 size-5 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">
                  At your current pace you'll spend about <span className="font-bold text-foreground">{formatMoney(b.projected, cur)}</span> by the
                  end of {b.monthName}
                  {b.projected > s.budget
                    ? ` — ${formatMoney(b.projected - s.budget, cur)} more than your budget.`
                    : ` — within your budget.`}
                </p>
              </Card>
            </>
          ) : (
            <Card>
              <EmptyState
                icon={Target}
                title="Budget tracking is off"
                description="Set a monthly limit to see how much you have left and get a warning before you overspend."
              />
            </Card>
          )}
        </div>

        <div className="space-y-5 lg:col-span-2">
          <Card className="p-5 sm:p-6">
            <SectionTitle title="Monthly budget" />
            <BudgetSettingsForm />
          </Card>
          <Card className="p-5 sm:p-6">
            <SectionTitle
              title="Weekly budget"
              action={
                <Link to="/weekly" className="text-xs font-semibold text-primary hover:underline">
                  See this week
                </Link>
              }
            />
            {wk && (
              <div className="mb-5">
                <BudgetSummary status={wk} currency={cur} />
                {wk.level !== "ok" && (
                  <div className="mt-3">
                    <BudgetAlert status={wk} currency={cur} period="week" />
                  </div>
                )}
              </div>
            )}
            <BudgetSettingsForm period="week" />
          </Card>
        </div>
      </div>
    </>
  );
}
