import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { CHART_PALETTE, DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from "./constants";
import { createInitialData } from "./sample-data";
import { localExpenseRepository, type ExpenseRepository } from "./storage";
import type { AppData, Category, Expense, ExpenseInput, Income, IncomeInput, Settings } from "./types";
import { validateCategoryName } from "./validation";

interface ExpenseStore {
  hydrated: boolean;
  expenses: Expense[];
  incomes: Income[];
  categories: Category[];
  customCategories: Category[];
  settings: Settings;
  hasSampleData: boolean;
  getCategory: (id: string) => Category;
  addExpense: (input: ExpenseInput) => Expense;
  updateExpense: (id: string, input: ExpenseInput) => void;
  deleteExpense: (id: string) => void;
  addIncome: (input: IncomeInput) => Income;
  updateIncome: (id: string, input: IncomeInput) => void;
  deleteIncome: (id: string) => void;
  removeSampleData: () => void;
  clearAllExpenses: () => void;
  addCategory: (name: string) => { ok: true; category: Category } | { ok: false; error: string };
  deleteCategory: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
}

const StoreContext = createContext<ExpenseStore | null>(null);

const EMPTY: AppData = { version: 1, expenses: [], incomes: [], customCategories: [], settings: DEFAULT_SETTINGS };

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ExpenseProvider({
  children,
  repository = localExpenseRepository,
}: {
  children: ReactNode;
  repository?: ExpenseRepository;
}) {
  const [data, setData] = useState<AppData>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(repository.load() ?? createInitialData(new Date()));
    setHydrated(true);
    return repository.subscribe(setData);
  }, [repository]);

  useEffect(() => {
    if (hydrated) repository.save(data);
  }, [data, hydrated, repository]);

  const categories = useMemo(
    () => [...DEFAULT_CATEGORIES, ...data.customCategories],
    [data.customCategories],
  );

  const getCategory = useCallback(
    (id: string) =>
      categories.find((c) => c.id === id) ?? categories.find((c) => c.id === "other")!,
    [categories],
  );

  const addExpense = useCallback((input: ExpenseInput) => {
    const now = new Date().toISOString();
    const expense: Expense = { ...input, id: newId(), createdAt: now, updatedAt: now };
    setData((d) => ({ ...d, expenses: [expense, ...d.expenses] }));
    return expense;
  }, []);

  const updateExpense = useCallback((id: string, input: ExpenseInput) => {
    setData((d) => ({
      ...d,
      expenses: d.expenses.map((e) =>
        e.id === id ? { ...e, ...input, updatedAt: new Date().toISOString() } : e,
      ),
    }));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setData((d) => ({ ...d, expenses: d.expenses.filter((e) => e.id !== id) }));
  }, []);

  const addIncome = useCallback((input: IncomeInput) => {
    const now = new Date().toISOString();
    const income: Income = { ...input, id: newId(), createdAt: now, updatedAt: now };
    setData((d) => ({ ...d, incomes: [income, ...d.incomes] }));
    return income;
  }, []);

  const updateIncome = useCallback((id: string, input: IncomeInput) => {
    setData((d) => ({
      ...d,
      incomes: d.incomes.map((e) => (e.id === id ? { ...e, ...input, updatedAt: new Date().toISOString() } : e)),
    }));
  }, []);

  const deleteIncome = useCallback((id: string) => {
    setData((d) => ({ ...d, incomes: d.incomes.filter((e) => e.id !== id) }));
  }, []);

  const removeSampleData = useCallback(() => {
    setData((d) => ({
      ...d,
      expenses: d.expenses.filter((e) => !e.isSample),
      incomes: d.incomes.filter((e) => !e.isSample),
    }));
  }, []);

  const clearAllExpenses = useCallback(() => {
    setData((d) => ({ ...d, expenses: [] }));
  }, []);

  const addCategory = useCallback(
    (name: string): { ok: true; category: Category } | { ok: false; error: string } => {
      const error = validateCategoryName(
        name,
        categories.map((c) => c.name),
      );
      if (error) return { ok: false, error };
      const category: Category = {
        id: `custom-${newId()}`,
        name: name.trim(),
        color: CHART_PALETTE[(data.customCategories.length + 3) % CHART_PALETTE.length] ?? "var(--chart-10)",
        builtIn: false,
      };
      setData((d) => ({ ...d, customCategories: [...d.customCategories, category] }));
      return { ok: true, category };
    },
    [categories, data.customCategories.length],
  );

  const deleteCategory = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      customCategories: d.customCategories.filter((c) => c.id !== id),
      expenses: d.expenses.map((e) => (e.category === id ? { ...e, category: "other" } : e)),
    }));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  }, []);

  const value = useMemo<ExpenseStore>(
    () => ({
      hydrated,
      expenses: data.expenses,
      incomes: data.incomes,
      categories,
      customCategories: data.customCategories,
      settings: data.settings,
      hasSampleData: data.expenses.some((e) => e.isSample),
      getCategory,
      addExpense,
      updateExpense,
      deleteExpense,
      addIncome,
      updateIncome,
      deleteIncome,
      removeSampleData,
      clearAllExpenses,
      addCategory,
      deleteCategory,
      updateSettings,
    }),
    [
      hydrated,
      data,
      categories,
      getCategory,
      addExpense,
      updateExpense,
      deleteExpense,
      addIncome,
      updateIncome,
      deleteIncome,
      removeSampleData,
      clearAllExpenses,
      addCategory,
      deleteCategory,
      updateSettings,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useExpenses(): ExpenseStore {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useExpenses must be used inside ExpenseProvider");
  return ctx;
}
