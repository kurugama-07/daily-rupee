import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useExpenses } from "@/lib/expenses/store";
import { parseBudget } from "@/lib/expenses/validation";

import type { BudgetPeriod } from "./Budget";

const COPY: Record<BudgetPeriod, { toggle: string; hint: string; label: string; placeholder: string; saved: string }> = {
  month: {
    toggle: "Track a monthly budget",
    hint: "Optional — get warnings at 80% and when you go over.",
    label: "Monthly spending limit",
    placeholder: "e.g. 100000",
    saved: "Monthly budget saved",
  },
  week: {
    toggle: "Track a weekly budget",
    hint: "Resets every Monday. Warns at 80% and when you go over.",
    label: "Weekly spending limit",
    placeholder: "e.g. 5000",
    saved: "Weekly budget saved",
  },
};

export function BudgetSettingsForm({ period = "month" }: { period?: BudgetPeriod }) {
  const { settings, updateSettings } = useExpenses();
  const weekly = period === "week";
  const amount = weekly ? settings.weeklyBudget : settings.monthlyBudget;
  const enabled = weekly ? settings.weeklyBudgetEnabled : settings.budgetEnabled;
  const copy = COPY[period];
  const id = `budget-${period}`;
  const [value, setValue] = useState(amount ? String(amount) : "");
  const [error, setError] = useState<string | null>(null);

  function save(e: FormEvent) {
    e.preventDefault();
    const res = parseBudget(value);
    if (!res.ok) {
      setError(res.error);
      toast.error(res.error);
      return;
    }
    updateSettings(
      weekly ? { weeklyBudget: res.value, weeklyBudgetEnabled: true } : { monthlyBudget: res.value, budgetEnabled: true },
    );
    setError(null);
    toast.success(copy.saved);
  }

  return (
    <form onSubmit={save} className="space-y-4" noValidate>
      <div className="flex items-center justify-between gap-4 rounded-xl bg-muted p-3.5">
        <div>
          <p className="text-sm font-semibold">{copy.toggle}</p>
          <p className="text-xs text-muted-foreground">{copy.hint}</p>
        </div>
        <Switch
          checked={enabled}
          aria-label={copy.toggle}
          onCheckedChange={(on) => {
            if (on && !amount) {
              setError("Enter a budget amount first");
              return;
            }
            updateSettings(weekly ? { weeklyBudgetEnabled: on } : { budgetEnabled: on });
            toast.success(on ? "Budget tracking turned on" : "Budget tracking turned off");
          }}
        />
      </div>
      <div>
        <Label htmlFor={id} className="mb-2 block text-sm font-semibold">
          {copy.label}
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm font-semibold text-muted-foreground">
              {settings.currency}
            </span>
            <Input
              id={id}
              inputMode="decimal"
              placeholder={copy.placeholder}
              value={value}
              aria-invalid={!!error}
              className="pl-14 font-semibold tabular-nums"
              onChange={(e) => {
                setValue(e.target.value.replace(/[^\d.,]/g, ""));
                setError(null);
              }}
            />
          </div>
          <Button type="submit" className="h-11">Save</Button>
        </div>
        {error && <p className="mt-1.5 text-xs font-medium text-destructive">{error}</p>}
      </div>
    </form>
  );
}
