import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, ReceiptText, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";

import { CategoryIcon } from "@/components/expenses/CategoryIcon";
import { EmptyState } from "@/components/expenses/EmptyState";
import { ExpenseActions } from "@/components/expenses/ExpenseActions";
import { ExpenseList } from "@/components/expenses/ExpenseItem";
import { PageHeader } from "@/components/expenses/PageHeader";
import { SampleBadge } from "@/components/expenses/SampleBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EMPTY_FILTERS, filterExpenses, sumAmounts, type ExpenseFilters } from "@/lib/expenses/calc";
import { PAYMENT_METHODS, paymentLabel } from "@/lib/expenses/constants";
import { formatDateLong, formatMoney } from "@/lib/expenses/format";
import { useExpenses } from "@/lib/expenses/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Expense History — RupeeFlow Expense Tracker" },
      { name: "description", content: "Search, filter, edit and delete every expense you've recorded." },
      { property: "og:title", content: "Expense History — RupeeFlow Expense Tracker" },
      { property: "og:description", content: "Search, filter, edit and delete every expense you've recorded." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { expenses, categories, getCategory, settings } = useExpenses();
  const [f, setF] = useState<ExpenseFilters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const set = <K extends keyof ExpenseFilters>(k: K, v: ExpenseFilters[K]) => setF((p) => ({ ...p, [k]: v }));

  const list = useMemo(() => filterExpenses(expenses, f), [expenses, f]);
  const total = sumAmounts(list);
  const activeCount =
    (f.category !== "all" ? 1 : 0) + (f.payment !== "all" ? 1 : 0) + (f.month ? 1 : 0) + (f.from ? 1 : 0) + (f.to ? 1 : 0);
  const anyFilter = activeCount > 0 || f.search.trim() !== "";

  return (
    <>
      <PageHeader
        eyebrow="All records"
        title="Expense history"
        description={`${expenses.length} expenses recorded in total`}
        actions={
          <Button asChild className="hidden sm:inline-flex">
            <Link to="/add">
              <Plus /> Add expense
            </Link>
          </Button>
        }
      />

      <Card className="p-4 sm:p-5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name…" value={f.search} onChange={(e) => set("search", e.target.value)} className="pl-10" />
          </div>
          <Button variant={showFilters ? "secondary" : "outline"} className="h-11 lg:hidden" onClick={() => setShowFilters((v) => !v)}>
            <SlidersHorizontal />
            <span className="hidden sm:inline">Filters</span>
            {activeCount > 0 && (
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">{activeCount}</span>
            )}
          </Button>
        </div>

        <div className={cn("mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6", !showFilters && "hidden lg:grid")}>
          <div className="lg:col-span-1">
            <Label className="mb-1.5 block text-xs text-muted-foreground">Category</Label>
            <Select value={f.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Payment</Label>
            <Select value={f.payment} onValueChange={(v) => set("payment", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All methods</SelectItem>
                {PAYMENT_METHODS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="f-month" className="mb-1.5 block text-xs text-muted-foreground">Month</Label>
            <Input id="f-month" type="month" value={f.month} onChange={(e) => set("month", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="f-from" className="mb-1.5 block text-xs text-muted-foreground">From</Label>
            <Input id="f-from" type="date" value={f.from} max={f.to || undefined} onChange={(e) => set("from", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="f-to" className="mb-1.5 block text-xs text-muted-foreground">To</Label>
            <Input id="f-to" type="date" value={f.to} min={f.from || undefined} onChange={(e) => set("to", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Sort</Label>
            <Select value={f.sort} onValueChange={(v) => set("sort", v as ExpenseFilters["sort"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-primary-soft px-4 py-3.5 sm:px-5">
        <p className="text-sm text-secondary-foreground">
          <span className="font-semibold">{list.length}</span> {list.length === 1 ? "expense" : "expenses"}
          {anyFilter ? " match your filters" : ""}
        </p>
        <div className="flex items-center gap-3">
          {anyFilter && (
            <Button variant="ghost" size="sm" onClick={() => setF(EMPTY_FILTERS)}>
              <X /> Clear
            </Button>
          )}
          <p className="text-lg font-bold tabular-nums text-foreground">{formatMoney(total, settings.currency)}</p>
        </div>
      </div>

      <Card className="mt-4 overflow-hidden">
        {list.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title={expenses.length ? "No expenses match these filters" : "No expenses yet"}
            description={expenses.length ? "Try a different search or clear the filters." : "Your recorded expenses will show up here."}
            action={
              expenses.length ? (
                <Button variant="outline" onClick={() => setF(EMPTY_FILTERS)}>Clear filters</Button>
              ) : (
                <Button asChild><Link to="/add"><Plus /> Add expense</Link></Button>
              )
            }
          />
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-5">Expense</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((e) => {
                    const cat = getCategory(e.category);
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="pl-5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{e.title}</span>
                            {e.isSample && <SampleBadge />}
                          </div>
                          {e.notes && <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">{e.notes}</p>}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-2">
                            <CategoryIcon category={cat} size="sm" />
                            <span className="text-sm">{cat.name}</span>
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDateLong(e.date)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{paymentLabel(e.paymentMethod)}</TableCell>
                        <TableCell className="text-right font-bold tabular-nums">{formatMoney(e.amount, settings.currency)}</TableCell>
                        <TableCell className="pr-3">
                          <ExpenseActions expense={e} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="px-4 md:hidden">
              <ExpenseList expenses={list} />
            </div>
          </>
        )}
      </Card>
    </>
  );
}
