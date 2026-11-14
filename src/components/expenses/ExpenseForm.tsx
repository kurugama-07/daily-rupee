import { useNavigate } from "@tanstack/react-router";
import { format, subDays } from "date-fns";
import { Check, Plus, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toDateKey } from "@/lib/expenses/calc";
import { PAYMENT_METHODS, QUICK_PICKS } from "@/lib/expenses/constants";
import { formatMoney } from "@/lib/expenses/format";
import { useExpenses } from "@/lib/expenses/store";
import type { Expense } from "@/lib/expenses/types";
import { parseExpenseInput, type FieldErrors } from "@/lib/expenses/validation";
import { cn } from "@/lib/utils";

import { CategoryIcon } from "./CategoryIcon";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-medium text-destructive">{message}</p>;
}

export function ExpenseForm({
  initial,
  onSaved,
  autoFocus,
}: {
  initial?: Expense;
  onSaved?: (expense: Expense | null) => void;
  autoFocus?: boolean;
}) {
  const { categories, settings, addExpense, updateExpense, addCategory } = useExpenses();
  const navigate = useNavigate();
  const today = new Date();
  const todayKey = toDateKey(today);
  const yesterdayKey = toDateKey(subDays(today, 1));

  const [title, setTitle] = useState(initial?.title ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [date, setDate] = useState(initial?.date ?? todayKey);
  const [category, setCategory] = useState(initial?.category ?? "");
  const [paymentMethod, setPaymentMethod] = useState<string>(initial?.paymentMethod ?? "cash");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [newCat, setNewCat] = useState<string | null>(null);
  const [newCatError, setNewCatError] = useState<string | null>(null);

  const clearError = (k: keyof FieldErrors) => setErrors((e) => ({ ...e, [k]: undefined }));

  function handleAddCategory() {
    if (newCat === null) return;
    const res = addCategory(newCat);
    if (!res.ok) {
      setNewCatError(res.error);
      return;
    }
    setCategory(res.category.id);
    clearError("category");
    setNewCat(null);
    setNewCatError(null);
    toast.success(`Category “${res.category.name}” added`);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const res = parseExpenseInput({ title, amount, date, category, paymentMethod, notes });
    if (!res.success) {
      setErrors(res.errors);
      toast.error("Please fix the highlighted fields");
      return;
    }
    if (initial) {
      updateExpense(initial.id, res.data);
      toast.success("Expense updated");
      onSaved?.(null);
      return;
    }
    const saved = addExpense(res.data);
    toast.success(`${saved.title} · ${formatMoney(saved.amount, settings.currency)} saved`, {
      action: { label: "View", onClick: () => navigate({ to: "/history" }) },
    });
    setTitle("");
    setAmount("");
    setNotes("");
    setErrors({});
    onSaved?.(saved);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Title */}
      <div>
        <Label htmlFor="exp-title" className="mb-2 block text-sm font-semibold">
          What did you spend on?
        </Label>
        <Input
          id="exp-title"
          autoFocus={autoFocus}
          placeholder="e.g. Lunch, Bus fare, Groceries"
          value={title}
          aria-invalid={!!errors.title}
          maxLength={80}
          autoComplete="off"
          onChange={(e) => {
            setTitle(e.target.value);
            clearError("title");
          }}
        />
        <FieldError message={errors.title} />
        {!initial && (
          <div className="no-scrollbar -mx-1 mt-2.5 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {QUICK_PICKS.map((q) => (
              <button
                key={q.title}
                type="button"
                onClick={() => {
                  setTitle(q.title);
                  setCategory(q.category);
                  clearError("title");
                  clearError("category");
                }}
                className="shrink-0 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
              >
                {q.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Amount + Date */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="exp-amount" className="mb-2 block text-sm font-semibold">
            Amount
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm font-semibold text-muted-foreground">
              {settings.currency}
            </span>
            <Input
              id="exp-amount"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              aria-invalid={!!errors.amount}
              className="h-12 pl-14 text-lg font-semibold tabular-nums"
              onChange={(e) => {
                setAmount(e.target.value.replace(/[^\d.,]/g, ""));
                clearError("amount");
              }}
            />
          </div>
          <FieldError message={errors.amount} />
        </div>
        <div>
          <Label htmlFor="exp-date" className="mb-2 block text-sm font-semibold">
            Date
          </Label>
          <Input
            id="exp-date"
            type="date"
            value={date}
            max={todayKey}
            aria-invalid={!!errors.date}
            className="h-12"
            onChange={(e) => {
              setDate(e.target.value);
              clearError("date");
            }}
          />
          <div className="mt-2 flex gap-1.5">
            {[
              { k: todayKey, l: "Today" },
              { k: yesterdayKey, l: "Yesterday" },
            ].map((d) => (
              <button
                key={d.l}
                type="button"
                onClick={() => setDate(d.k)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition",
                  date === d.k ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent",
                )}
              >
                {d.l}
              </button>
            ))}
            {date !== todayKey && date !== yesterdayKey && date && (
              <span className="px-1 py-1 text-xs text-muted-foreground">{format(new Date(`${date}T00:00:00`), "EEE, MMM d")}</span>
            )}
          </div>
          <FieldError message={errors.date} />
        </div>
      </div>

      {/* Category */}
      <div>
        <p className="mb-2 text-sm font-semibold">Category</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
          {categories.map((c) => {
            const active = category === c.id;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setCategory(c.id);
                  clearError("category");
                }}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 rounded-xl border bg-card px-1.5 py-3 text-center text-[11px] font-medium leading-tight transition sm:text-xs",
                  active
                    ? "border-primary bg-primary-soft text-foreground ring-1 ring-primary"
                    : "text-muted-foreground hover:border-primary/30 hover:text-foreground",
                )}
              >
                <CategoryIcon category={c} size="sm" />
                <span className="line-clamp-2">{c.name}</span>
                {active && (
                  <span className="absolute right-1.5 top-1.5 inline-flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground [&_svg]:size-2.5">
                    <Check strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
          {newCat === null && (
            <button
              type="button"
              onClick={() => setNewCat("")}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-1.5 py-3 text-[11px] font-medium text-muted-foreground transition hover:border-primary/50 hover:text-primary sm:text-xs"
            >
              <span className="inline-flex size-7 items-center justify-center rounded-xl bg-muted [&_svg]:size-3.5">
                <Plus />
              </span>
              New category
            </button>
          )}
        </div>
        {newCat !== null && (
          <div className="mt-3 rounded-xl border bg-muted/50 p-3">
            <div className="flex gap-2">
              <Input
                autoFocus
                placeholder="Category name"
                value={newCat}
                maxLength={30}
                onChange={(e) => {
                  setNewCat(e.target.value);
                  setNewCatError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
              />
              <Button type="button" onClick={handleAddCategory} className="h-11">
                Add
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-11 w-11" onClick={() => setNewCat(null)} aria-label="Cancel">
                <X />
              </Button>
            </div>
            {newCatError && <p className="mt-1.5 text-xs font-medium text-destructive">{newCatError}</p>}
          </div>
        )}
        <FieldError message={errors.category} />
      </div>

      {/* Payment */}
      <div>
        <p className="mb-2 text-sm font-semibold">Payment method</p>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_METHODS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={paymentMethod === p.id}
              onClick={() => setPaymentMethod(p.id)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition",
                paymentMethod === p.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <FieldError message={errors.paymentMethod} />
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="exp-notes" className="mb-2 block text-sm font-semibold">
          Notes <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="exp-notes"
          rows={2}
          maxLength={300}
          placeholder="Anything to remember about this expense"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <FieldError message={errors.notes} />
      </div>

      <Button type="submit" size="xl" className="w-full sm:w-auto sm:min-w-48">
        <Check />
        {initial ? "Save changes" : "Save expense"}
      </Button>
    </form>
  );
}
