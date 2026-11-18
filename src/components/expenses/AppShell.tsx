import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  LayoutDashboard,
  MoreHorizontal,
  Plus,
  ReceiptText,
  Settings,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { budgetStatus, expensesInMonth, expensesInRange, sumAmounts, weekRange } from "@/lib/expenses/calc";
import { formatMoney } from "@/lib/expenses/format";
import { useExpenses } from "@/lib/expenses/store";
import { ThemeIconButton, ThemeSegmented } from "@/components/expenses/ThemeToggle";
import { cn } from "@/lib/utils";

type NavPath = "/" | "/add" | "/history" | "/daily" | "/weekly" | "/analytics" | "/budget" | "/settings";

const NAV: { to: NavPath; label: string; icon: LucideIcon }[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/add", label: "Add Expense", icon: Plus },
  { to: "/history", label: "Expense History", icon: ReceiptText },
  { to: "/daily", label: "Daily Breakdown", icon: CalendarDays },
  { to: "/weekly", label: "Weekly Spending", icon: CalendarRange },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/budget", label: "Budget", icon: Wallet },
  { to: "/settings", label: "Settings", icon: Settings },
];

function Brand({ inverted }: { inverted?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span
        aria-hidden
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-xl font-display text-sm font-bold",
          inverted ? "bg-sidebar-primary text-sidebar-primary-foreground" : "bg-primary text-primary-foreground",
        )}
      >
        Rs
      </span>
      <span className="leading-tight">
        <span className="block font-display text-xl font-bold tracking-tight">Rupee<span className={inverted ? "text-sidebar-primary" : "text-primary"}>Flow</span></span>
        <span className={cn("block text-[11px]", inverted ? "text-sidebar-foreground/60" : "text-muted-foreground")}>
          Personal spending tracker
        </span>
      </span>
    </Link>
  );
}

function MonthMini() {
  const { expenses, settings, hydrated } = useExpenses();
  const now = new Date();
  if (!hydrated) return null;
  const total = sumAmounts(expensesInMonth(expenses, now.getFullYear(), now.getMonth()));
  const wk = weekRange(now);
  const week = settings.weeklyBudgetEnabled
    ? budgetStatus(sumAmounts(expensesInRange(expenses, wk.start, wk.end)), settings.weeklyBudget)
    : null;
  return (
    <div className="rounded-2xl bg-sidebar-accent p-4">
      <p className="text-xs text-sidebar-foreground/65">Spent this month</p>
      <p className="mt-1 font-display text-xl font-bold tabular-nums text-sidebar-accent-foreground">{formatMoney(total, settings.currency)}</p>
      {week && (
        <p className="mt-1 text-xs text-sidebar-foreground/65">
          {week.remaining >= 0
            ? `${formatMoney(week.remaining, settings.currency)} left this week`
            : `${formatMoney(-week.remaining, settings.currency)} over this week`}
        </p>
      )}
      <Link
        to="/add"
        className="mt-3 flex h-10 items-center justify-center gap-2 rounded-xl bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground transition hover:opacity-90"
      >
        <Plus className="size-4" /> Add expense
      </Link>
    </div>
  );
}

function DesktopSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-sidebar px-5 py-7 text-sidebar-foreground lg:flex">
      <div className="px-2">
        <Brand inverted />
      </div>
      <nav className="mt-10 flex flex-1 flex-col gap-1">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: true }}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeProps={{ className: "!bg-sidebar-primary !text-sidebar-primary-foreground font-semibold" }}
          >
            <item.icon className="size-[18px]" />
            {item.label}
          </Link>
        ))}
      </nav>
      <ThemeSegmented inverted className="mb-3" />
      <MonthMini />
    </aside>
  );
}

function MobileTopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b-2 border-outline bg-background/90 px-4 backdrop-blur-md lg:hidden">
      <Brand />
      <div className="flex items-center gap-1">
      <ThemeIconButton />
      <Link
        to="/settings"
        aria-label="Settings"
        className="inline-flex size-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent"
      >
        <Settings className="size-5" />
      </Link>
      </div>
    </header>
  );
}

const bottomItem =
  "flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold text-muted-foreground transition";

function MobileBottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const left = NAV.filter((n) => n.to === "/" || n.to === "/history");
  const right = NAV.filter((n) => n.to === "/daily");
  const more = NAV.filter((n) => n.to === "/weekly" || n.to === "/analytics" || n.to === "/budget" || n.to === "/settings");
  const navLink = (item: (typeof NAV)[number]) => (
    <Link
      key={item.to}
      to={item.to}
      activeOptions={{ exact: true }}
      className={bottomItem}
      activeProps={{ className: "!text-primary" }}
    >
      <item.icon className="size-5" />
      {item.label === "Expense History" ? "History" : item.label === "Daily Breakdown" ? "Daily" : item.label === "Dashboard" ? "Home" : item.label}
    </Link>
  );
  return (
    <>
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t-2 border-outline bg-card/95 backdrop-blur-md lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 items-end px-2">
          {left.map(navLink)}
          <div className="flex justify-center">
            <Link
              to="/add"
              aria-label="Add expense"
              className="-mt-6 mb-1 inline-flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-float ring-4 ring-background transition active:scale-95"
            >
              <Plus className="size-6" strokeWidth={2.5} />
            </Link>
          </div>
          {right.map(navLink)}
          <button type="button" className={bottomItem} onClick={() => setMoreOpen(true)}>
            <MoreHorizontal className="size-5" />
            More
          </button>
        </div>
      </nav>
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-8">
          <SheetHeader>
            <SheetTitle className="font-display text-xl font-semibold">More</SheetTitle>
          </SheetHeader>
          <div className="mt-2 grid grid-cols-2 gap-3 px-4">
            {more.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMoreOpen(false)}
                className="flex flex-col items-center gap-2 rounded-2xl border border-outline bg-card p-4 text-xs font-semibold text-foreground shadow-pop"
                activeProps={{ className: "border-primary bg-primary-soft" }}
              >
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <item.icon className="size-5" />
                </span>
                {item.label}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-10 w-56 rounded-xl" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { hydrated } = useExpenses();
  return (
    <div className="min-h-screen bg-background">
      <DesktopSidebar />
      <MobileTopBar />
      <main className="lg:pl-72">
        <div className="mx-auto w-full max-w-6xl px-4 pb-32 pt-6 sm:px-6 lg:px-10 lg:pb-14 lg:pt-10">
          {hydrated ? children : <PageSkeleton />}
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
