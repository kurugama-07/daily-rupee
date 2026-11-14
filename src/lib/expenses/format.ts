import { format, parseISO } from "date-fns";

export function formatMoney(amount: number, currency = "LKR"): string {
  const hasCents = Math.round(amount * 100) % 100 !== 0;
  const n = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `${amount < 0 ? "-" : ""}${currency} ${n}`;
}

export function formatCompact(amount: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    amount,
  );
}

export const formatDateLong = (key: string) => format(parseISO(key), "MMMM d, yyyy");
export const formatDateShort = (key: string) => format(parseISO(key), "MMM d");
export const formatDateWithWeekday = (key: string) => format(parseISO(key), "EEEE, MMMM d");
export const formatWeekdayShort = (key: string) => format(parseISO(key), "EEE");

export function formatPercent(value: number | null, withSign = false): string {
  if (value === null || !Number.isFinite(value)) return "—";
  const sign = withSign && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(Math.abs(value) < 10 ? 1 : 0)}%`;
}
