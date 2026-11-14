import { AlertTriangle, CircleAlert } from "lucide-react";

import type { BudgetStatus } from "@/lib/expenses/calc";
import { formatMoney } from "@/lib/expenses/format";
import { cn } from "@/lib/utils";

export function BudgetBar({ status, className }: { status: BudgetStatus; className?: string }) {
  const pct = Math.min(status.percent, 100);
  return (
    <div className={cn("h-3 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-all duration-700",
          status.level === "exceeded" ? "bg-destructive" : status.level === "warning" ? "bg-warning" : "bg-primary",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function BudgetAlert({ status, currency }: { status: BudgetStatus; currency: string }) {
  if (status.level === "ok") return null;
  const exceeded = status.level === "exceeded";
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-xl p-3.5 text-sm",
        exceeded ? "bg-destructive-soft text-destructive" : "bg-warning-soft text-warning-foreground",
      )}
    >
      {exceeded ? <CircleAlert className="mt-0.5 size-4 shrink-0" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0" />}
      <div>
        <p className="font-semibold">{exceeded ? "Budget exceeded" : "You've used over 80% of your budget"}</p>
        <p className="mt-0.5 opacity-90">
          {exceeded
            ? `You're ${formatMoney(Math.abs(status.remaining), currency)} over your monthly limit.`
            : `Only ${formatMoney(status.remaining, currency)} left for this month — spend carefully.`}
        </p>
      </div>
    </div>
  );
}

export function BudgetSummary({ status, currency }: { status: BudgetStatus; currency: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">Spent of {formatMoney(status.budget, currency)}</p>
          <p className="text-lg font-bold tabular-nums">{formatMoney(status.spent, currency)}</p>
        </div>
        <p
          className={cn(
            "text-2xl font-bold tabular-nums",
            status.level === "exceeded" ? "text-destructive" : status.level === "warning" ? "text-warning-foreground" : "text-primary",
          )}
        >
          {status.percent.toFixed(0)}%
        </p>
      </div>
      <BudgetBar status={status} />
      <p className="text-xs text-muted-foreground">
        {status.remaining >= 0
          ? `${formatMoney(status.remaining, currency)} remaining`
          : `${formatMoney(Math.abs(status.remaining), currency)} over budget`}
      </p>
    </div>
  );
}
