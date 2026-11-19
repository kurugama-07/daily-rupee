import { createFileRoute } from "@tanstack/react-router";
import { addDays, format, parseISO, subWeeks } from "date-fns";
import { ArrowDownRight, CalendarClock, ChevronLeft, ChevronRight, HandCoins, PiggyBank, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

import { BudgetAlert } from "@/components/expenses/Budget";
import { InOutBarChart } from "@/components/expenses/Charts";
import { EmptyState } from "@/components/expenses/EmptyState";
import { PageHeader, SectionTitle } from "@/components/expenses/PageHeader";
import { StatCard } from "@/components/expenses/StatCard";
import { IncomeForm, IncomeList, WeeklyLimitSettings } from "@/components/expenses/Wallet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  budgetStatus,
  daysLeftInWeek,
  incomesInRange,
  toDateKey,
  walletHistory,
  walletWeek,
  weekStartKey,
} from "@/lib/expenses/calc";
import { formatMoney } from "@/lib/expenses/format";
import { useExpenses } from "@/lib/expenses/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet — RupeeFlow Expense Tracker" },
      { name: "description", content: "Note the money you receive each week and watch your spending come out of it." },
      { property: "og:title", content: "Wallet — RupeeFlow Expense Tracker" },
      { property: "og:description", content: "Note the money you receive each week and watch your spending come out of it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WalletPage,
});

const rangeLabel = (start: string) => {
  const s = parseISO(start);
  const e = addDays(s, 6);
  return `${format(s, "MMM d")} – ${format(e, s.getMonth() === e.getMonth() ? "d" : "MMM d")}`;
};

function WalletPage() {
  const { expenses, incomes, settings } = useExpenses();
  const cur = settings.currency;
  const today = new Date();
  const currentWeek = weekStartKey(today);
  const [weekStart, setWeekStart] = useState(currentWeek);
  const isCurrent = weekStart === currentWeek;
  const carry = settings.walletCarryOver;

  const w = useMemo(() => walletWeek(expenses, incomes, weekStart, carry), [expenses, incomes, weekStart, carry]);
  const received = useMemo(
    () => incomesInRange(incomes, w.start, w.end).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    [incomes, w.start, w.end],
  );
  const history = useMemo(() => walletHistory(expenses, incomes, new Date(), 8, carry), [expenses, incomes, carry]);
  const withIncome = history.filter((h) => h.received > 0);
  const avgReceived = withIncome.length ? Math.round(withIncome.reduce((t, h) => t + h.received, 0) / withIncome.length) : 0;

  const status = budgetStatus(w.spent, w.available, { allowEmpty: true });
  const daysLeft = isCurrent ? daysLeftInWeek(today) : 0;
  const perDay = isCurrent && w.left > 0 ? Math.floor(w.left / daysLeft) : 0;
  const leftPct = w.available > 0 ? Math.max(0, Math.min(100, (w.left / w.available) * 100)) : 0;

  return (
    <>
      <PageHeader
        eyebrow={isCurrent ? "This week" : rangeLabel(weekStart)}
        title="Wallet"
        description="Note the money you receive. Everything you spend that week is taken out of it."
        actions={
          <div className="flex items-center gap-1 rounded-xl border bg-card p-1">
            <Button variant="ghost" size="icon" aria-label="Previous week" onClick={() => setWeekStart(toDateKey(subWeeks(parseISO(weekStart), 1)))}>
              <ChevronLeft />
            </Button>
            <span className="min-w-32 text-center text-sm font-semibold tabular-nums">{rangeLabel(weekStart)}</span>
            <Button variant="ghost" size="icon" aria-label="Next week" disabled={isCurrent} onClick={() => setWeekStart(toDateKey(addDays(parseISO(weekStart), 7)))}>
              <ChevronRight />
            </Button>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="min-w-0 space-y-5 lg:col-span-3">
          <div className="relative overflow-hidden rounded-2xl hero-gradient p-5 text-hero-foreground shadow-float sm:p-6">
            <p className="text-sm font-semibold text-hero-foreground/80">{w.left >= 0 ? "Left in your wallet" : "Spent more than you received"}</p>
            <p className="mt-1 font-display text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl" data-testid="wallet-left">
              {w.left < 0 && "−"}
              {formatMoney(Math.abs(w.left), cur)}
            </p>
            <p className="mt-1 text-sm text-hero-foreground/80">
              Received {formatMoney(w.received, cur)}
              {w.carryIn !== 0 && ` + ${formatMoney(w.carryIn, cur)} carried over`} · Spent {formatMoney(w.spent, cur)}
            </p>
            <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-hero-foreground/20">
              <div className="h-full rounded-full bg-hero-foreground transition-all duration-700" style={{ width: `${leftPct}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-hero-foreground/75">
              <span>{w.available > 0 ? `${Math.round(leftPct)}% left` : "No money added yet"}</span>
              <span>{isCurrent ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left this week` : rangeLabel(weekStart)}</span>
            </div>
          </div>

          {status && status.level !== "ok" && <BudgetAlert status={status} currency={cur} period="week" />}

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <StatCard label="Received" icon={HandCoins} value={formatMoney(w.received, cur)} hint={`${w.incomeCount} payment${w.incomeCount === 1 ? "" : "s"}`} />
            <StatCard label="Spent" icon={ArrowDownRight} value={formatMoney(w.spent, cur)} hint={rangeLabel(weekStart)} />
            {isCurrent ? (
              <StatCard label="Safe to spend / day" icon={CalendarClock} value={formatMoney(perDay, cur)} hint={daysLeft === 1 ? "For the rest of today" : `For the next ${daysLeft} days`} />
            ) : (
              <StatCard label="Carried over" icon={PiggyBank} value={formatMoney(w.carryIn, cur)} hint={carry ? "From earlier weeks" : "Carry-over is off"} />
            )}
            <StatCard label="Avg. received / week" icon={Wallet} value={formatMoney(avgReceived, cur)} hint="Last 8 weeks" />
          </div>

          <Card className="p-5">
            <SectionTitle title="Money received" description={isCurrent ? "This week" : rangeLabel(weekStart)} />
            {received.length ? (
              <IncomeList incomes={received} />
            ) : (
              <EmptyState
                icon={HandCoins}
                title={isCurrent ? "No money added this week yet" : "No money received that week"}
                description="Add what you receive — pocket money, salary, money from family — and your spending is taken out of it."
              />
            )}
          </Card>

          <Card className="p-5">
            <SectionTitle title="Money in vs out" description="Last 8 weeks · tap a week to see it" />
            <div className="mb-2 flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-chart-1" />Received</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-chart-4" />Spent</span>
            </div>
            <InOutBarChart
              data={history.map((h) => ({ key: h.start, label: format(parseISO(h.start), "d/M"), received: h.received, spent: h.spent }))}
              currency={cur}
              height={200}
            />
            <div className="mt-3 divide-y">
              {[...history].reverse().map((h) => (
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
                    <span className="block text-xs text-muted-foreground">
                      Received {formatMoney(h.received, cur)} · Spent {formatMoney(h.spent, cur)}
                    </span>
                  </span>
                  <span className={cn("shrink-0 text-right font-bold tabular-nums", h.left < 0 ? "text-destructive" : "text-primary")}>
                    {h.left < 0 ? `−${formatMoney(-h.left, cur)}` : formatMoney(h.left, cur)}
                    <span className="block text-[11px] font-normal text-muted-foreground">{h.left < 0 ? "over" : "left"}</span>
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="min-w-0 space-y-5 lg:col-span-2">
          <Card className="p-5 sm:p-6">
            <SectionTitle title="Add money received" description="Logged to the week of the date you pick" />
            <IncomeForm key={weekStart} defaultDate={isCurrent ? undefined : weekStart} />
          </Card>
          <Card className="p-5 sm:p-6">
            <SectionTitle title="Weekly limit" description="Choose where your weekly limit comes from" />
            <WeeklyLimitSettings showWalletLink={false} />
          </Card>
        </div>
      </div>
    </>
  );
}
