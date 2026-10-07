import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AppSettings, Bill, CategoryBudget, Transaction, UserProfile } from "@/lib/types";
import { demoBills, demoBudgets, demoProfile, demoSettings, demoTransactions } from "@/lib/demoData";
import { computeSummary } from "@/lib/financialCalculations";
import { translations, type Dict } from "@/lib/translations";
import { formatCurrency } from "@/lib/currencyFormatter";
import { todayISO } from "@/lib/dateUtils";

interface State {
  profile: UserProfile;
  settings: AppSettings;
  transactions: Transaction[];
  bills: Bill[];
  budgets: CategoryBudget[];
}

const STORAGE_KEY = "vioi-state-v1";
const initial = (): State => ({
  profile: demoProfile,
  settings: demoSettings,
  transactions: demoTransactions,
  bills: demoBills,
  budgets: demoBudgets,
});

const uid = () => Math.random().toString(36).slice(2, 10);
const delta = (t: Pick<Transaction, "type" | "amount">) => (t.type === "income" ? t.amount : -t.amount);

function useStoreValue() {
  const [state, setState] = useState<State>(initial);
  const [hydrated, setHydrated] = useState(false);
  const [today, setToday] = useState("2026-10-07");

  useEffect(() => {
    setToday(todayISO());
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...initial(), ...JSON.parse(raw) });
    } catch {
      /* ignore corrupted storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", state.settings.theme === "dark");
    document.documentElement.lang = state.settings.lang;
  }, [state.settings.theme, state.settings.lang]);

  const addTransaction = useCallback((tx: Omit<Transaction, "id">) => {
    setState((s) => ({
      ...s,
      transactions: [{ ...tx, id: uid() }, ...s.transactions],
      profile: { ...s.profile, balance: s.profile.balance + delta(tx) },
    }));
  }, []);

  const updateTransaction = useCallback((tx: Transaction) => {
    setState((s) => {
      const old = s.transactions.find((x) => x.id === tx.id);
      if (!old) return s;
      return {
        ...s,
        transactions: s.transactions.map((x) => (x.id === tx.id ? tx : x)),
        profile: { ...s.profile, balance: s.profile.balance - delta(old) + delta(tx) },
      };
    });
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setState((s) => {
      const old = s.transactions.find((x) => x.id === id);
      if (!old) return s;
      return {
        ...s,
        transactions: s.transactions.filter((x) => x.id !== id),
        bills: old.billId ? s.bills.map((b) => (b.id === old.billId ? { ...b, paid: false } : b)) : s.bills,
        profile: { ...s.profile, balance: s.profile.balance - delta(old) },
      };
    });
  }, []);

  const saveBill = useCallback((bill: Omit<Bill, "id"> & { id?: string }) => {
    setState((s) => ({
      ...s,
      bills: bill.id
        ? s.bills.map((b) => (b.id === bill.id ? ({ ...b, ...bill } as Bill) : b))
        : [...s.bills, { ...bill, id: uid() } as Bill],
    }));
  }, []);

  const deleteBill = useCallback((id: string) => {
    setState((s) => ({ ...s, bills: s.bills.filter((b) => b.id !== id) }));
  }, []);

  const toggleBillPaid = useCallback((id: string, date: string) => {
    setState((s) => {
      const bill = s.bills.find((b) => b.id === id);
      if (!bill) return s;
      if (!bill.paid) {
        const tx: Transaction = {
          id: uid(),
          name: bill.name,
          amount: bill.amount,
          category: bill.category,
          date,
          type: "expense",
          note: "",
          billId: bill.id,
        };
        return {
          ...s,
          bills: s.bills.map((b) => (b.id === id ? { ...b, paid: true } : b)),
          transactions: [tx, ...s.transactions],
          profile: { ...s.profile, balance: s.profile.balance - bill.amount },
        };
      }
      const linked = s.transactions.find((t) => t.billId === id);
      return {
        ...s,
        bills: s.bills.map((b) => (b.id === id ? { ...b, paid: false } : b)),
        transactions: s.transactions.filter((t) => t.billId !== id),
        profile: { ...s.profile, balance: s.profile.balance + (linked?.amount ?? 0) },
      };
    });
  }, []);

  const updateProfile = useCallback((p: Partial<UserProfile>) => {
    setState((s) => ({ ...s, profile: { ...s.profile, ...p } }));
  }, []);
  const updateSettings = useCallback((p: Partial<AppSettings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...p } }));
  }, []);
  const setBudgets = useCallback((budgets: CategoryBudget[]) => setState((s) => ({ ...s, budgets })), []);
  const resetDemo = useCallback(() => setState((s) => ({ ...initial(), settings: s.settings })), []);

  const summary = useMemo(
    () => computeSummary(state.profile, state.transactions, state.bills, today),
    [state.profile, state.transactions, state.bills, today],
  );
  const t: Dict = translations[state.settings.lang];
  const fmt = useCallback(
    (v: number, compact?: boolean) => formatCurrency(v, state.profile.currency, { compact }),
    [state.profile.currency],
  );

  return {
    ...state,
    hydrated,
    today,
    summary,
    t,
    fmt,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    saveBill,
    deleteBill,
    toggleBillPaid,
    updateProfile,
    updateSettings,
    setBudgets,
    resetDemo,
  };
}

export type Store = ReturnType<typeof useStoreValue>;
const Ctx = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside AppStoreProvider");
  return v;
}
