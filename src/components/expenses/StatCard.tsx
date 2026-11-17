import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "primary";
  className?: string;
}) {
  const primary = tone === "primary";
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-4 transition-transform hover:-translate-y-0.5 sm:p-5",
        primary ? "hero-gradient text-hero-foreground shadow-float" : "border-2 border-outline bg-card shadow-card",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={cn("text-xs font-semibold sm:text-sm", primary ? "text-hero-foreground/80" : "text-muted-foreground")}>
          {label}
        </p>
        {Icon && (
          <span
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-lg [&_svg]:size-4",
              primary ? "border-2 border-outline bg-card text-foreground" : "border-2 border-outline bg-lime text-lime-foreground",
            )}
          >
            <Icon />
          </span>
        )}
      </div>
      <p className="mt-3 truncate font-display text-xl font-extrabold tabular-nums tracking-tight sm:text-2xl">{value}</p>
      {hint && (
        <div className={cn("mt-1 text-xs", primary ? "text-hero-foreground/75" : "text-muted-foreground")}>
          {hint}
        </div>
      )}
    </div>
  );
}
