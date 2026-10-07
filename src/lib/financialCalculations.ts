import type {
  Bill,
  CategoryBudget,
  CategoryId,
  FinancialSummary,
  HealthStatus,
  ImpactLevel,
  PurchaseSimulation,
  Transaction,
  UserProfile,
} from "./types";
import { CATEGORIES } from "./types";
import { addDays, daysBetween, prevMonthKey, sameMonth } from "./dateUtils";

export function billsBeforeIncome(bills: Bill[], nextIncomeDate: string) {
  return bills.filter((b) => !b.paid && b.dueDate <= nextIncomeDate).reduce((s, b) => s + b.amount, 0);
}

export function calcSafeToSpend(balance: number, bills: number, savings: number) {
  return Math.max(balance - bills - savings, 0);
}

export function calcDaysRemaining(today: string, nextIncomeDate: string) {
  return Math.max(daysBetween(today, nextIncomeDate), 1); // at least 1 day → today
}

export function calcDailyLimit(safe: number, days: number) {
  return days > 0 ? safe / days : safe;
}

export function sumBy(txs: Transaction[], type: Transaction["type"], pred: (t: Transaction) => boolean = () => true) {
  return txs.filter((t) => t.type === type && pred(t)).reduce((s, t) => s + t.amount, 0);
}

export function avgDailySpend(txs: Transaction[], today: string, window = 30) {
  const from = addDays(today, -window + 1);
  return sumBy(txs, "expense", (t) => t.date >= from && t.date <= today) / window;
}

export function healthStatus(dailyLimit: number, avgDaily: number, dailyTarget: number | null): HealthStatus {
  const ref = dailyTarget && dailyTarget > 0 ? dailyTarget : avgDaily;
  if (ref <= 0) return "stable";
  const ratio = dailyLimit / ref;
  if (ratio >= 1) return "stable";
  if (ratio >= 0.7) return "attention";
  return "risk";
}

export function vioiScore(p: {
  balance: number;
  bills: number;
  savings: number;
  safe: number;
  dailyLimit: number;
  avgDaily: number;
  spentMonth: number;
  income: number;
}) {
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  const billsCoverage = p.bills <= 0 ? 1 : clamp(p.balance / (p.bills * 2));
  const savingsOk = p.savings <= 0 ? 0.6 : clamp((p.balance - p.bills) / p.savings / 1.5);
  const spendRate = p.income <= 0 ? 0.5 : clamp(1 - p.spentMonth / p.income);
  const allowance = p.avgDaily <= 0 ? 1 : clamp(p.dailyLimit / (p.avgDaily * 1.3));
  const buffer = clamp(p.safe / Math.max(p.income * 0.5, 1));
  return Math.round(100 * (billsCoverage * 0.2 + savingsOk * 0.2 + spendRate * 0.2 + allowance * 0.25 + buffer * 0.15));
}

export function computeSummary(
  profile: UserProfile,
  txs: Transaction[],
  bills: Bill[],
  today: string,
): FinancialSummary {
  const bb = billsBeforeIncome(bills, profile.nextIncomeDate);
  const safe = calcSafeToSpend(profile.balance, bb, profile.savingsTarget);
  const days = calcDaysRemaining(today, profile.nextIncomeDate);
  const daily = calcDailyLimit(safe, days);
  const spent = sumBy(txs, "expense", (t) => sameMonth(t.date, today));
  const income = sumBy(txs, "income", (t) => sameMonth(t.date, today));
  const avg = avgDailySpend(txs, today);
  return {
    balance: profile.balance,
    billsBeforeIncome: bb,
    safeToSpend: safe,
    daysRemaining: days,
    dailyLimit: daily,
    spentThisMonth: spent,
    incomeThisMonth: income,
    avgDailySpend: avg,
    status: healthStatus(daily, avg, profile.dailyTarget),
    score: vioiScore({
      balance: profile.balance,
      bills: bb,
      savings: profile.savingsTarget,
      safe,
      dailyLimit: daily,
      avgDaily: avg,
      spentMonth: spent,
      income: profile.monthlyIncome,
    }),
  };
}

export interface CategoryStat {
  category: CategoryId;
  spent: number;
  budget: number;
  pct: number; // of total spending
  usage: number; // of budget
  lastMonth: number;
}

export function categoryStats(txs: Transaction[], budgets: CategoryBudget[], today: string): CategoryStat[] {
  const prev = prevMonthKey(today);
  const month = txs.filter((t) => t.type === "expense" && sameMonth(t.date, today));
  const total = month.reduce((s, t) => s + t.amount, 0);
  return CATEGORIES.map((c) => {
    const spent = month.filter((t) => t.category === c).reduce((s, t) => s + t.amount, 0);
    const budget = budgets.find((b) => b.category === c)?.budget ?? 0;
    const lastMonth = sumBy(txs, "expense", (t) => t.category === c && t.date.startsWith(prev));
    return {
      category: c,
      spent,
      budget,
      pct: total ? (spent / total) * 100 : 0,
      usage: budget ? (spent / budget) * 100 : 0,
      lastMonth,
    };
  });
}

export type CashRange = "7" | "30" | "month";

export function cashFlowSeries(txs: Transaction[], balance: number, today: string, range: CashRange) {
  const start = range === "7" ? addDays(today, -6) : range === "30" ? addDays(today, -29) : today.slice(0, 8) + "01";
  const days = daysBetween(start, today) + 1;
  // reconstruct balance at end of each day by walking backwards from today
  const after = txs.filter((t) => t.date > today);
  let running = balance + sumBy(after, "expense") - sumBy(after, "income");
  const points: { date: string; income: number; expense: number; balance: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(start, i);
    const income = sumBy(txs, "income", (t) => t.date === d);
    const expense = sumBy(txs, "expense", (t) => t.date === d);
    points.unshift({ date: d, income, expense, balance: running });
    running = running - income + expense;
  }
  return points;
}

export function monthlyTrend(txs: Transaction[], today: string, months = 6) {
  const out: { month: string; income: number; expense: number }[] = [];
  let key = today.slice(0, 7);
  const keys: string[] = [key];
  for (let i = 1; i < months; i++) {
    key = prevMonthKey(key + "-01");
    keys.unshift(key);
  }
  for (const k of keys) {
    out.push({
      month: k.slice(5) + "/" + k.slice(2, 4),
      income: sumBy(txs, "income", (t) => t.date.startsWith(k)),
      expense: sumBy(txs, "expense", (t) => t.date.startsWith(k)),
    });
  }
  return out;
}

export function impactLevel(price: number, safe: number): ImpactLevel {
  if (safe <= 0) return "veryHigh";
  const r = price / safe;
  if (r <= 0.1) return "low";
  if (r <= 0.3) return "medium";
  if (r <= 0.6) return "high";
  return "veryHigh";
}

export function simulatePurchase(name: string, price: number, s: FinancialSummary): PurchaseSimulation {
  const safeAfter = Math.max(s.safeToSpend - price, 0);
  return {
    name,
    price,
    balanceBefore: s.balance,
    balanceAfter: s.balance - price,
    safeBefore: s.safeToSpend,
    safeAfter,
    dailyBefore: s.dailyLimit,
    dailyAfter: calcDailyLimit(safeAfter, s.daysRemaining),
    consumedPct: s.safeToSpend > 0 ? Math.min((price / s.safeToSpend) * 100, 999) : 100,
    impact: impactLevel(price, s.safeToSpend),
    exceeds: price > s.safeToSpend,
  };
}

export function weekSpending(txs: Transaction[], today: string) {
  const from = addDays(today, -6);
  const week = txs.filter((t) => t.type === "expense" && t.date >= from && t.date <= today);
  const byCat = new Map<CategoryId, number>();
  week.forEach((t) => byCat.set(t.category, (byCat.get(t.category) ?? 0) + t.amount));
  return { total: week.reduce((s, t) => s + t.amount, 0), byCat, count: week.length };
}
