import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";

import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { ExpenseList } from "@/components/expenses/ExpenseItem";
import { PageHeader, SectionTitle } from "@/components/expenses/PageHeader";
import { Card } from "@/components/ui/card";
import { expensesOnDate, sumAmounts, toDateKey } from "@/lib/expenses/calc";
import { formatMoney } from "@/lib/expenses/format";
import { useExpenses } from "@/lib/expenses/store";

export const Route = createFileRoute("/add")({
  head: () => ({
    meta: [
      { title: "Add Expense — RupeeFlow Expense Tracker" },
      { name: "description", content: "Record an expense in seconds: name, amount, category and payment method." },
      { property: "og:title", content: "Add Expense — RupeeFlow Expense Tracker" },
      { property: "og:description", content: "Record an expense in seconds: name, amount, category and payment method." },
    ],
  }),
  component: AddExpensePage,
});

function AddExpensePage() {
  const { expenses, settings } = useExpenses();
  const todayList = useMemo(() => expensesOnDate(expenses, toDateKey(new Date())), [expenses]);
  return (
    <>
      <PageHeader eyebrow="New entry" title="Add expense" description="Name, amount, category — that's all you need." />
      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="p-5 sm:p-7 lg:col-span-3">
          <ExpenseForm autoFocus />
        </Card>
        <Card className="h-fit p-5 lg:col-span-2">
          <SectionTitle
            title="Today so far"
            description={`${todayList.length} expense${todayList.length === 1 ? "" : "s"} · ${formatMoney(sumAmounts(todayList), settings.currency)}`}
            action={
              <Link to="/daily" className="text-xs font-semibold text-primary hover:underline">
                Daily view
              </Link>
            }
          />
          {todayList.length ? (
            <ExpenseList expenses={todayList} showDate={false} />
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">Nothing recorded today yet.</p>
          )}
        </Card>
      </div>
    </>
  );
}
