import type { CategoryTotal } from "@/lib/expenses/calc";
import { formatMoney } from "@/lib/expenses/format";
import { useExpenses } from "@/lib/expenses/store";

import { CategoryIcon } from "./CategoryIcon";

export function CategoryBreakdownList({ items, limit }: { items: CategoryTotal[]; limit?: number }) {
  const { getCategory, settings } = useExpenses();
  const shown = limit ? items.slice(0, limit) : items;
  return (
    <ul className="space-y-3.5">
      {shown.map((it) => {
        const cat = getCategory(it.categoryId);
        return (
          <li key={it.categoryId} className="flex items-center gap-3">
            <CategoryIcon category={cat} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate font-medium text-foreground">{cat.name}</span>
                <span className="shrink-0 font-semibold tabular-nums">{formatMoney(it.total, settings.currency)}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(it.percent, 2)}%`, backgroundColor: cat.color }} />
                </div>
                <span className="w-10 text-right text-[11px] tabular-nums text-muted-foreground">{it.percent.toFixed(0)}%</span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
