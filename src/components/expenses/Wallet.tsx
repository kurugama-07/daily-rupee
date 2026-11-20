import { Link } from "@tanstack/react-router";
import { HandCoins, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toDateKey } from "@/lib/expenses/calc";
import { INCOME_QUICK_PICKS } from "@/lib/expenses/constants";
import { formatDateLong, formatDateShort, formatMoney } from "@/lib/expenses/format";
import { useExpenses } from "@/lib/expenses/store";
import type { Income, WeeklyBudgetSource } from "@/lib/expenses/types";
import { parseIncomeInput, type IncomeFieldErrors } from "@/lib/expenses/validation";
import { cn } from "@/lib/utils";

import { BudgetSettingsForm } from "./BudgetSettingsForm";
import { SampleBadge } from "./SampleBadge";

function FieldError({ message }: { message?: string | undefined }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-medium text-destructive">{message}</p>;
}

/** Log money received: amount, where it came from, date and optional notes. */
export function IncomeForm({ initial, onSaved, defaultDate }: { initial?: Income; onSaved?: () => void; defaultDate?: string | undefined }) {
  const { settings, addIncome, updateIncome, updateSettings } = useExpenses();
  const todayKey = toDateKey(new Date());
  const [title, setTitle] = useState(initial?.title ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [date, setDate] = useState(initial?.date ?? defaultDate ?? todayKey);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [errors, setErrors] = useState<IncomeFieldErrors>({});
  const clear = (k: keyof IncomeFieldErrors) => setErrors((e) => ({ ...e, [k]: undefined }));

  function submit(e: FormEvent) {
    e.preventDefault();
    const res = parseIncomeInput({ title, amount, date, notes });
    if (!res.success) {
      setErrors(res.errors);
      toast.error("Please fix the highlighted fields");
      return;
    }
    if (initial) {
      updateIncome(initial.id, res.data);
      toast.success("Money received updated");
    } else {
      addIncome(res.data);
      const switching = settings.weeklyBudgetSource !== "wallet" || !settings.weeklyBudgetEnabled;
      // Logging money means the weekly limit should come from the wallet, not a fixed amount.
      if (switching) updateSettings({ weeklyBudgetSource: "wallet", weeklyBudgetEnabled: true });
      toast.success(`${formatMoney(res.data.amount, settings.currency)} added to your wallet`, {
        description: switching ? "Your weekly limit now comes from the money you receive." : undefined,
      });
      setAmount("");
      setNotes("");
    }
    setErrors({});
    onSaved?.();
  }

  const idp = initial ? `inc-${initial.id}` : "inc-new";
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div>
        <Label htmlFor={`${idp}-amount`} className="mb-2 block text-sm font-semibold">
          How much did you receive?
        </Label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm font-semibold text-muted-foreground">
            {settings.currency}
          </span>
          <Input
            id={`${idp}-amount`}
            inputMode="decimal"
            placeholder="e.g. 5000"
            value={amount}
            aria-invalid={!!errors.amount}
            className="h-12 pl-14 text-lg font-semibold tabular-nums"
            onChange={(e) => {
              setAmount(e.target.value.replace(/[^\d.,]/g, ""));
              clear("amount");
            }}
          />
        </div>
        <FieldError message={errors.amount} />
      </div>
      <div>
        <Label htmlFor={`${idp}-title`} className="mb-2 block text-sm font-semibold">
          From where?
        </Label>
        <Input
          id={`${idp}-title`}
          placeholder="e.g. Salary, From family"
          value={title}
          maxLength={60}
          autoComplete="off"
          aria-invalid={!!errors.title}
          onChange={(e) => {
            setTitle(e.target.value);
            clear("title");
          }}
        />
        <FieldError message={errors.title} />
        <div className="no-scrollbar -mx-1 mt-2.5 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {INCOME_QUICK_PICKS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => {
                setTitle(q);
                clear("title");
              }}
              className={cn(
                "shrink-0 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground",
                title === q && "border-primary bg-primary-soft text-primary",
              )}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${idp}-date`} className="mb-2 block text-sm font-semibold">
            Date received
          </Label>
          <Input
            id={`${idp}-date`}
            type="date"
            value={date}
            max={todayKey}
            aria-invalid={!!errors.date}
            onChange={(e) => {
              setDate(e.target.value);
              clear("date");
            }}
          />
          <FieldError message={errors.date} />
        </div>
        <div>
          <Label htmlFor={`${idp}-notes`} className="mb-2 block text-sm font-semibold">
            Notes <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id={`${idp}-notes`}
            rows={1}
            maxLength={300}
            placeholder="Anything to remember"
            value={notes}
            className="min-h-10"
            onChange={(e) => {
              setNotes(e.target.value);
              clear("notes");
            }}
          />
          <FieldError message={errors.notes} />
        </div>
      </div>
      <Button type="submit" size="lg" className="w-full">
        <HandCoins /> {initial ? "Save changes" : "Add to wallet"}
      </Button>
    </form>
  );
}

function IncomeActions({ income }: { income: Income }) {
  const { deleteIncome, settings } = useExpenses();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8 shrink-0 text-muted-foreground" aria-label={`Actions for ${income.title}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onSelect={() => setEditing(true)}>
            <Pencil className="size-4" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setConfirming(true)} className="text-destructive focus:text-destructive">
            <Trash2 className="size-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-semibold">Edit money received</DialogTitle>
            <DialogDescription>Your wallet balance updates right away.</DialogDescription>
          </DialogHeader>
          {editing && <IncomeForm initial={income} onSaved={() => setEditing(false)} />}
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              “{income.title}” · {formatMoney(income.amount, settings.currency)} on {formatDateLong(income.date)} will be removed from your wallet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={() => {
                deleteIncome(income.id);
                toast.success("Entry deleted");
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function IncomeList({ incomes }: { incomes: Income[] }) {
  const { settings } = useExpenses();
  return (
    <div className="divide-y">
      {incomes.map((i) => (
        <div key={i.id} className="flex items-center gap-3 py-3">
          <span aria-hidden className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <HandCoins className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-sm font-semibold text-foreground">{i.title}</p>
              {i.isSample && <SampleBadge />}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {formatDateShort(i.date)}
              {i.notes && ` · ${i.notes}`}
            </p>
          </div>
          <p className="shrink-0 text-sm font-bold tabular-nums text-primary">+{formatMoney(i.amount, settings.currency)}</p>
          <IncomeActions income={i} />
        </div>
      ))}
    </div>
  );
}

const SOURCES: { id: WeeklyBudgetSource; label: string }[] = [
  { id: "wallet", label: "Money I receive" },
  { id: "fixed", label: "Fixed amount" },
];

/** Choose where the weekly limit comes from: the wallet (money received) or a fixed amount. */
export function WeeklyLimitSettings({ showWalletLink = true }: { showWalletLink?: boolean }) {
  const { settings, updateSettings } = useExpenses();
  const source = settings.weeklyBudgetSource;
  return (
    <div className="space-y-4">
      <div role="radiogroup" aria-label="Weekly limit comes from" className="grid grid-cols-2 gap-1 rounded-xl border bg-muted p-1">
        {SOURCES.map((o) => {
          const active = source === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => {
                if (o.id === "wallet") updateSettings({ weeklyBudgetSource: "wallet", weeklyBudgetEnabled: true });
                else updateSettings({ weeklyBudgetSource: "fixed", weeklyBudgetEnabled: !!settings.weeklyBudget });
              }}
              className={cn(
                "rounded-lg px-2 py-2 text-xs font-semibold transition",
                active ? "bg-card text-foreground shadow-pop" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      {source === "fixed" ? (
        <BudgetSettingsForm period="week" />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 rounded-xl bg-muted p-3.5">
            <div>
              <p className="text-sm font-semibold">Spend from my wallet</p>
              <p className="text-xs text-muted-foreground">Your weekly limit is the money you received that week. Each expense is deducted from it.</p>
            </div>
            <Switch
              checked={settings.weeklyBudgetEnabled}
              aria-label="Spend from my wallet"
              onCheckedChange={(on) => {
                updateSettings({ weeklyBudgetEnabled: on });
                toast.success(on ? "Weekly wallet turned on" : "Weekly wallet turned off");
              }}
            />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl bg-muted p-3.5">
            <div>
              <p className="text-sm font-semibold">Carry leftover to next week</p>
              <p className="text-xs text-muted-foreground">Unspent money (or overspending) moves into the next week's wallet.</p>
            </div>
            <Switch
              checked={settings.walletCarryOver}
              aria-label="Carry leftover to next week"
              onCheckedChange={(on) => updateSettings({ walletCarryOver: on })}
            />
          </div>
          {showWalletLink && (
            <Link to="/wallet" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
              <HandCoins /> Add money received
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
