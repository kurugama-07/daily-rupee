import { createFileRoute } from "@tanstack/react-router";
import { Download, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { BudgetSettingsForm } from "@/components/expenses/BudgetSettingsForm";
import { CategoryIcon } from "@/components/expenses/CategoryIcon";
import { PageHeader, SectionTitle } from "@/components/expenses/PageHeader";
import { RemoveSampleButton } from "@/components/expenses/SampleDataBanner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toCSV, toDateKey } from "@/lib/expenses/calc";
import { CURRENCIES, paymentLabel } from "@/lib/expenses/constants";
import { useExpenses } from "@/lib/expenses/store";
import type { Category } from "@/lib/expenses/types";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Sage Expense Tracker" },
      { name: "description", content: "Currency, budget, categories, CSV export and data management." },
      { property: "og:title", content: "Settings — Sage Expense Tracker" },
      { property: "og:description", content: "Currency, budget, categories, CSV export and data management." },
    ],
  }),
  component: SettingsPage,
});

function DeleteCategoryButton({ category }: { category: Category }) {
  const { deleteCategory, expenses } = useExpenses();
  const used = expenses.filter((e) => e.category === category.id).length;
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" aria-label={`Delete ${category.name}`}>
          <Trash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{category.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            {used ? `${used} expense${used === 1 ? "" : "s"} in this category will be moved to “Other”.` : "This category isn't used by any expense."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive" })}
            onClick={() => {
              deleteCategory(category.id);
              toast.success("Category deleted");
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function SettingsPage() {
  const { settings, updateSettings, categories, addCategory, expenses, getCategory, clearAllExpenses, hasSampleData } = useExpenses();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    const res = addCategory(name);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setName("");
    setError(null);
    toast.success(`Category “${res.category.name}” added`);
  }

  function exportCsv() {
    if (!expenses.length) {
      toast.error("There are no expenses to export yet");
      return;
    }
    const csv = toCSV(expenses, (id) => getCategory(id).name, paymentLabel, settings.currency);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${toDateKey(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${expenses.length} expenses`);
  }

  return (
    <>
      <PageHeader eyebrow="Preferences" title="Settings" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <SectionTitle title="Currency" description="Shown next to every amount" />
            <Select
              value={settings.currency}
              onValueChange={(v) => {
                updateSettings({ currency: v });
                toast.success(`Currency set to ${v}`);
              }}
            >
              <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>{c === "LKR" ? "LKR — Sri Lankan Rupee" : c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionTitle title="Monthly budget" />
            <BudgetSettingsForm />
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionTitle title="Weekly budget" />
            <BudgetSettingsForm period="week" />
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionTitle title="Your data" description="Saved on this device in your browser" />
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted p-3.5">
                <div>
                  <p className="text-sm font-semibold">Export to CSV</p>
                  <p className="text-xs text-muted-foreground">Open in Excel or Google Sheets</p>
                </div>
                <Button variant="outline" size="sm" onClick={exportCsv}>
                  <Download /> Export
                </Button>
              </div>
              {hasSampleData && (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-muted p-3.5">
                  <div>
                    <p className="text-sm font-semibold">Sample expenses</p>
                    <p className="text-xs text-muted-foreground">Keep only what you've added yourself</p>
                  </div>
                  <RemoveSampleButton />
                </div>
              )}
              <div className="flex items-center justify-between gap-3 rounded-xl bg-destructive-soft p-3.5">
                <div>
                  <p className="text-sm font-semibold text-destructive">Clear all expenses</p>
                  <p className="text-xs text-destructive/80">Deletes every expense permanently</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={!expenses.length}>Clear all</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete all {expenses.length} expenses?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This can't be undone. Your categories and settings will be kept. Consider exporting a CSV first.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className={buttonVariants({ variant: "destructive" })}
                        onClick={() => {
                          clearAllExpenses();
                          toast.success("All expenses cleared");
                        }}
                      >
                        Yes, delete everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>
        </div>

        <Card className="h-fit p-5 sm:p-6">
          <SectionTitle title="Expense categories" description="Built-in categories can't be removed" />
          <div className="flex gap-2">
            <Input
              placeholder="New category name"
              value={name}
              maxLength={30}
              aria-invalid={!!error}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Button className="h-11" onClick={handleAdd}>
              <Plus /> Add
            </Button>
          </div>
          {error && <p className="mt-1.5 text-xs font-medium text-destructive">{error}</p>}
          <ul className="mt-4 divide-y">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2.5">
                <CategoryIcon category={c} size="sm" />
                <span className="flex-1 text-sm font-medium">{c.name}</span>
                {c.builtIn ? (
                  <span className="text-[11px] text-muted-foreground">Built-in</span>
                ) : (
                  <DeleteCategoryButton category={c} />
                )}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
