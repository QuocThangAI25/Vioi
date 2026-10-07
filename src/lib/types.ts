export type CategoryId =
  | "food"
  | "transport"
  | "shopping"
  | "entertainment"
  | "education"
  | "housing"
  | "health"
  | "other";

export const CATEGORIES: CategoryId[] = [
  "food",
  "transport",
  "shopping",
  "entertainment",
  "education",
  "housing",
  "health",
  "other",
];

export type Lang = "vi" | "en";
export type Theme = "light" | "dark";
export type Currency = "VND" | "USD";

export interface UserProfile {
  name: string;
  avatar: string; // emoji
  currency: Currency;
  balance: number; // stored in VND
  monthlyIncome: number;
  savingsTarget: number;
  nextIncomeDate: string; // yyyy-mm-dd
  dailyTarget: number | null;
  goal: string;
  preferredCategories: CategoryId[];
}

export interface AppSettings {
  lang: Lang;
  theme: Theme;
}

export interface Transaction {
  id: string;
  name: string;
  amount: number; // positive, VND
  category: CategoryId;
  date: string; // yyyy-mm-dd
  type: "income" | "expense";
  note: string;
  billId?: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  recurring: boolean;
  category: CategoryId;
  paid: boolean;
}

export interface CategoryBudget {
  category: CategoryId;
  budget: number;
}

export type HealthStatus = "stable" | "attention" | "risk";

export interface FinancialSummary {
  balance: number;
  billsBeforeIncome: number;
  safeToSpend: number;
  daysRemaining: number;
  dailyLimit: number;
  spentThisMonth: number;
  incomeThisMonth: number;
  avgDailySpend: number;
  status: HealthStatus;
  score: number;
}

export type ImpactLevel = "low" | "medium" | "high" | "veryHigh";

export interface PurchaseSimulation {
  name: string;
  price: number;
  balanceBefore: number;
  balanceAfter: number;
  safeBefore: number;
  safeAfter: number;
  dailyBefore: number;
  dailyAfter: number;
  consumedPct: number;
  impact: ImpactLevel;
  exceeds: boolean;
}
