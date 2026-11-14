import { paymentLabel } from "@/lib/expenses/constants";
import { formatDateShort, formatMoney } from "@/lib/expenses/format";
import { useExpenses } from "@/lib/expenses/store";
import type { Expense } from "@/lib/expenses/types";

import { CategoryIcon } from "./CategoryIcon";
import { ExpenseActions } from "./ExpenseActions";
import { SampleBadge } from "./SampleBadge";

export function ExpenseItem({ expense, showDate = true }: { expense: Expense; showDate?: boolean }) {
  const { getCategory, settings } = useExpenses();
  const cat = getCategory(expense.category);
  return (
    <div className="flex items-center gap-3 py-3">
      <CategoryIcon category={cat} />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{expense.title}</p>
          {expense.isSample && <SampleBadge />}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {cat.name} · {paymentLabel(expense.paymentMethod)}
          {showDate && ` · ${formatDateShort(expense.date)}`}
        </p>
      </div>
      <p className="shrink-0 text-sm font-bold tabular-nums text-foreground">{formatMoney(expense.amount, settings.currency)}</p>
      <ExpenseActions expense={expense} />
    </div>
  );
}

export function ExpenseList({ expenses, showDate = true }: { expenses: Expense[]; showDate?: boolean }) {
  return (
    <div className="divide-y">
      {expenses.map((e) => (
        <ExpenseItem key={e.id} expense={e} showDate={showDate} />
      ))}
    </div>
  );
}
