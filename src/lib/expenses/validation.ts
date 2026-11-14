import { z } from "zod";

import { PAYMENT_METHOD_IDS } from "./constants";
import { toDateKey } from "./calc";
import type { ExpenseInput } from "./types";

export const MAX_AMOUNT = 100_000_000;

const expenseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Please enter what you spent on")
    .max(80, "Keep the title under 80 characters"),
  amount: z
    .number({ invalid_type_error: "Enter a valid amount" })
    .refine((n) => Number.isFinite(n), "Enter a valid amount")
    .refine((n) => n > 0, "Amount must be greater than zero")
    .refine((n) => n <= MAX_AMOUNT, "That amount looks too large"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date"),
  category: z.string().min(1, "Choose a category"),
  paymentMethod: z.enum(PAYMENT_METHOD_IDS, { errorMap: () => ({ message: "Choose a payment method" }) }),
  notes: z.string().trim().max(300, "Notes must be under 300 characters"),
});

export interface RawExpenseInput {
  title: string;
  amount: string;
  date: string;
  category: string;
  paymentMethod: string;
  notes: string;
}

export type FieldErrors = Partial<Record<keyof ExpenseInput, string>>;

export type ParseResult = { success: true; data: ExpenseInput } | { success: false; errors: FieldErrors };

/** Validates raw form values. Rejects empty, zero, negative and non-numeric amounts and future dates. */
export function parseExpenseInput(raw: RawExpenseInput, today: Date = new Date()): ParseResult {
  const cleaned = raw.amount.replace(/,/g, "").trim();
  const amount = cleaned === "" || !/^-?\d*\.?\d+$/.test(cleaned) ? Number.NaN : Number(cleaned);
  const result = expenseSchema.safeParse({ ...raw, amount });
  const errors: FieldErrors = {};
  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof ExpenseInput;
      if (!errors[key]) errors[key] = issue.message;
    }
  }
  if (!errors.date && raw.date > toDateKey(today)) errors.date = "Date can't be in the future";
  if (!result.success || Object.keys(errors).length) return { success: false, errors };
  return { success: true, data: { ...result.data, amount: Math.round(result.data.amount * 100) / 100 } };
}

export function validateCategoryName(name: string, existing: string[]): string | null {
  const n = name.trim();
  if (!n) return "Enter a category name";
  if (n.length > 30) return "Keep it under 30 characters";
  if (existing.some((e) => e.toLowerCase() === n.toLowerCase())) return "That category already exists";
  return null;
}

export function parseBudget(raw: string): { ok: true; value: number } | { ok: false; error: string } {
  const cleaned = raw.replace(/,/g, "").trim();
  if (!/^\d*\.?\d+$/.test(cleaned)) return { ok: false, error: "Enter a valid amount" };
  const value = Number(cleaned);
  if (value <= 0) return { ok: false, error: "Budget must be greater than zero" };
  if (value > MAX_AMOUNT) return { ok: false, error: "That budget looks too large" };
  return { ok: true, value: Math.round(value * 100) / 100 };
}
