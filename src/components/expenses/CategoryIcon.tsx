import type { Category } from "@/lib/expenses/types";
import { cn } from "@/lib/utils";

/** Emoji per built-in category; custom categories fall back to 💸. */
const EMOJI: Record<string, string> = {
  food: "🍜",
  groceries: "🛒",
  transport: "🛺",
  rent: "🏠",
  utilities: "⚡",
  internet: "📶",
  shopping: "🛍️",
  health: "💊",
  personal: "💅",
  entertainment: "🎬",
  education: "📚",
  household: "🛋️",
  other: "✨",
};

export function categoryEmoji(id: string): string {
  return EMOJI[id] ?? "💸";
}

export function CategoryIcon({
  category,
  size = "md",
  className,
}: {
  category: Category;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl border-[1.5px] border-outline leading-none",
        size === "sm" && "size-7 text-sm",
        size === "md" && "size-10 text-lg",
        size === "lg" && "size-12 text-xl",
        className,
      )}
      style={{ backgroundColor: `color-mix(in oklab, ${category.color} 40%, var(--card))` }}
    >
      {categoryEmoji(category.id)}
    </span>
  );
}
