import {
  Bus,
  CircleEllipsis,
  Clapperboard,
  GraduationCap,
  HeartPulse,
  Home,
  ShoppingBag,
  ShoppingBasket,
  Sofa,
  Sparkles,
  Tag,
  UtensilsCrossed,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type { Category } from "@/lib/expenses/types";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  food: UtensilsCrossed,
  groceries: ShoppingBasket,
  transport: Bus,
  rent: Home,
  utilities: Zap,
  internet: Wifi,
  shopping: ShoppingBag,
  health: HeartPulse,
  personal: Sparkles,
  entertainment: Clapperboard,
  education: GraduationCap,
  household: Sofa,
  other: CircleEllipsis,
};

export function categoryIcon(id: string): LucideIcon {
  return ICONS[id] ?? Tag;
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
  const Icon = categoryIcon(category.id);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl",
        size === "sm" && "size-7 [&_svg]:size-3.5",
        size === "md" && "size-10 [&_svg]:size-[18px]",
        size === "lg" && "size-12 [&_svg]:size-5",
        className,
      )}
      style={{
        backgroundColor: `color-mix(in oklab, ${category.color} 15%, transparent)`,
        color: category.color,
      }}
    >
      <Icon strokeWidth={2} />
    </span>
  );
}
