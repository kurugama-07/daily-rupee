import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MONTH_NAMES } from "@/lib/expenses/constants";
import { useExpenses } from "@/lib/expenses/store";

export interface YearMonth {
  year: number;
  month: number;
}

export function useYearOptions(): number[] {
  const { expenses } = useExpenses();
  return useMemo(() => {
    const now = new Date().getFullYear();
    const earliest = expenses.reduce((min, e) => Math.min(min, Number(e.date.slice(0, 4)) || now), now - 1);
    const years: number[] = [];
    for (let y = now; y >= Math.min(earliest, now - 1); y--) years.push(y);
    return years;
  }, [expenses]);
}

export function MonthPicker({ value, onChange }: { value: YearMonth; onChange: (v: YearMonth) => void }) {
  const years = useYearOptions();
  const now = new Date();
  const isCurrent = value.year === now.getFullYear() && value.month === now.getMonth();
  const shift = (delta: number) => {
    const d = new Date(value.year, value.month + delta, 1);
    onChange({ year: d.getFullYear(), month: d.getMonth() });
  };
  return (
    <div className="flex items-center gap-1.5">
      <Button variant="outline" size="icon" className="size-11 shrink-0" onClick={() => shift(-1)} aria-label="Previous month">
        <ChevronLeft />
      </Button>
      <Select value={String(value.month)} onValueChange={(v) => onChange({ ...value, month: Number(v) })}>
        <SelectTrigger className="w-[130px]" aria-label="Month">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MONTH_NAMES.map((m, i) => (
            <SelectItem key={m} value={String(i)}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(value.year)} onValueChange={(v) => onChange({ ...value, year: Number(v) })}>
        <SelectTrigger className="w-[96px]" aria-label="Year">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" size="icon" className="size-11 shrink-0" onClick={() => shift(1)} disabled={isCurrent} aria-label="Next month">
        <ChevronRight />
      </Button>
    </div>
  );
}
