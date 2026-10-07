import type { AppSettings, Bill, CategoryBudget, Transaction, UserProfile } from "./types";

export const demoProfile: UserProfile = {
  name: "Ngọc Nga",
  avatar: "🦊",
  currency: "VND",
  balance: 12500000,
  monthlyIncome: 10000000,
  savingsTarget: 2000000,
  nextIncomeDate: "2026-10-30",
  dailyTarget: null,
  goal: "Tiết kiệm mua laptop mới",
  preferredCategories: ["food", "education"],
};

export const demoSettings: AppSettings = { lang: "vi", theme: "light" };

let n = 0;
const t = (
  name: string,
  amount: number,
  category: Transaction["category"],
  date: string,
  type: Transaction["type"] = "expense",
  note = "",
): Transaction => ({ id: `t${++n}`, name, amount, category, date, type, note });

export const demoTransactions: Transaction[] = [
  t("Lương tháng 9", 10000000, "other", "2026-09-30", "income", "Lương công ty"),
  t("Highlands Coffee", 65000, "food", "2026-09-12"),
  t("Shopee", 380000, "shopping", "2026-09-15"),
  t("CGV Cinema", 180000, "entertainment", "2026-09-20"),
  t("Grab", 52000, "transport", "2026-09-22"),
  t("Bún chả Hàng Mành", 70000, "food", "2026-09-25"),
  t("Học phí", 1500000, "education", "2026-10-01", "expense", "Học kỳ 1"),
  t("Highlands Coffee", 75000, "food", "2026-10-01"),
  t("Grab", 48000, "transport", "2026-10-02"),
  t("Circle K", 86000, "food", "2026-10-02"),
  t("Shopee", 420000, "shopping", "2026-10-03", "expense", "Áo khoác"),
  t("Phở Thìn", 60000, "food", "2026-10-03"),
  t("Cinema", 160000, "entertainment", "2026-10-04"),
  t("Pharmacity", 135000, "health", "2026-10-04"),
  t("Be Bike", 32000, "transport", "2026-10-05"),
  t("Cơm tấm", 55000, "food", "2026-10-05"),
  t("Freelance thiết kế", 1200000, "other", "2026-10-05", "income"),
  t("Fahasa", 210000, "education", "2026-10-06", "expense", "Sách kinh tế số"),
  t("GS25", 45000, "food", "2026-10-06"),
  t("Spotify", 59000, "entertainment", "2026-10-06"),
  t("The Coffee House", 69000, "food", "2026-10-07"),
  t("Grab", 64000, "transport", "2026-10-07"),
];

export const demoBills: Bill[] = [
  { id: "b1", name: "Tiền nhà", amount: 2500000, dueDate: "2026-10-15", recurring: true, category: "housing", paid: false },
  { id: "b2", name: "Điện nước", amount: 650000, dueDate: "2026-10-18", recurring: true, category: "housing", paid: false },
  { id: "b3", name: "Netflix", amount: 260000, dueDate: "2026-10-20", recurring: true, category: "entertainment", paid: false },
  { id: "b4", name: "Internet", amount: 300000, dueDate: "2026-10-23", recurring: true, category: "housing", paid: false },
];

export const demoBudgets: CategoryBudget[] = [
  { category: "food", budget: 2500000 },
  { category: "transport", budget: 600000 },
  { category: "shopping", budget: 1000000 },
  { category: "entertainment", budget: 700000 },
  { category: "education", budget: 2000000 },
  { category: "housing", budget: 3500000 },
  { category: "health", budget: 500000 },
  { category: "other", budget: 500000 },
];
