import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useExpenses } from "@/lib/expenses/store";
import { parseBudget } from "@/lib/expenses/validation";

export function BudgetSettingsForm() {
  const { settings, updateSettings } = useExpenses();
  const [value, setValue] = useState(settings.monthlyBudget ? String(settings.monthlyBudget) : "");
  const [error, setError] = useState<string | null>(null);

  function save(e: FormEvent) {
    e.preventDefault();
    const res = parseBudget(value);
    if (!res.ok) {
      setError(res.error);
      toast.error(res.error);
      return;
    }
    updateSettings({ monthlyBudget: res.value, budgetEnabled: true });
    setError(null);
    toast.success("Monthly budget saved");
  }

  return (
    <form onSubmit={save} className="space-y-4" noValidate>
      <div className="flex items-center justify-between gap-4 rounded-xl bg-muted p-3.5">
        <div>
          <p className="text-sm font-semibold">Track a monthly budget</p>
          <p className="text-xs text-muted-foreground">Optional — get warnings at 80% and when you go over.</p>
        </div>
        <Switch
          checked={settings.budgetEnabled}
          aria-label="Track a monthly budget"
          onCheckedChange={(on) => {
            if (on && !settings.monthlyBudget) {
              setError("Enter a budget amount first");
              return;
            }
            updateSettings({ budgetEnabled: on });
            toast.success(on ? "Budget tracking turned on" : "Budget tracking turned off");
          }}
        />
      </div>
      <div>
        <Label htmlFor="budget" className="mb-2 block text-sm font-semibold">
          Monthly spending limit
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm font-semibold text-muted-foreground">
              {settings.currency}
            </span>
            <Input
              id="budget"
              inputMode="decimal"
              placeholder="e.g. 100000"
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
