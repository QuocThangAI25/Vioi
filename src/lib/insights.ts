import type { Bill, FinancialSummary, Lang, Transaction } from "./types";
import type { CategoryStat } from "./financialCalculations";
import { simulatePurchase, weekSpending } from "./financialCalculations";
import { daysBetween, formatShortDate } from "./dateUtils";
import type { Dict } from "./translations";

type Fmt = (v: number) => string;

export interface Alert {
  id: string;
  tone: "info" | "warning" | "danger" | "success";
  text: string;
}

export function buildAlerts(
  lang: Lang,
  t: Dict,
  bills: Bill[],
  stats: CategoryStat[],
  s: FinancialSummary,
  today: string,
): Alert[] {
  const vi = lang === "vi";
  const out: Alert[] = [];
  bills
    .filter((b) => !b.paid)
    .forEach((b) => {
      const d = daysBetween(today, b.dueDate);
      if (d <= 5)
        out.push({
          id: "bill-" + b.id,
          tone: d < 0 ? "danger" : "warning",
          text:
            d < 0
              ? vi ? `${b.name} đã quá hạn ${-d} ngày.` : `${b.name} is ${-d} days overdue.`
              : vi ? `${b.name} sẽ đến hạn sau ${d} ngày.` : `${b.name} is due in ${d} days.`,
        });
    });
  stats
    .filter((c) => c.budget > 0 && c.usage >= 75)
    .forEach((c) =>
      out.push({
        id: "cat-" + c.category,
        tone: c.usage >= 100 ? "danger" : "warning",
        text: vi
          ? `Chi tiêu ${t.categories[c.category].toLowerCase()} đã đạt ${Math.round(c.usage)}% ngân sách tháng.`
          : `${t.categories[c.category]} spending has reached ${Math.round(c.usage)}% of the monthly budget.`,
      }),
    );
  if (s.avgDailySpend > 0 && s.avgDailySpend > s.dailyLimit) {
    const lastDays = Math.floor(s.safeToSpend / s.avgDailySpend);
    const early = s.daysRemaining - lastDays;
    if (early > 0)
      out.push({
        id: "pace",
        tone: "danger",
        text: vi
          ? `Nếu giữ mức chi hiện tại, bạn có thể vượt ngân sách trước kỳ nhận lương ${early} ngày.`
          : `At your current pace, you may exceed your budget ${early} days before payday.`,
      });
  }
  if (!out.length)
    out.push({
      id: "ok",
      tone: "success",
      text: vi ? "Bạn đang chi tiêu đúng kế hoạch. Tuyệt vời!" : "You're spending right on plan. Nice!",
    });
  return out;
}

export function buildInsights(lang: Lang, t: Dict, stats: CategoryStat[], s: FinancialSummary, fmt: Fmt): string[] {
  const vi = lang === "vi";
  const out: string[] = [];
  const sorted = [...stats].sort((a, b) => b.spent - a.spent);
  const top = sorted[0];
  if (top && top.spent > 0)
    out.push(
      vi
        ? `${t.categories[top.category]} đang chiếm ${Math.round(top.pct)}% tổng chi tiêu tháng này.`
        : `${t.categories[top.category]} makes up ${Math.round(top.pct)}% of this month's spending.`,
    );
  stats
    .filter((c) => c.lastMonth > 0 && c.spent > 0)
    .slice(0, 2)
    .forEach((c) => {
      const diff = Math.round(((c.spent - c.lastMonth) / c.lastMonth) * 100);
      const name = t.categories[c.category];
      out.push(
        vi
          ? `Bạn đã chi ${diff < 0 ? "ít" : "nhiều"} hơn ${Math.abs(diff)}% cho ${name.toLowerCase()} so với tháng trước.`
          : `You spent ${Math.abs(diff)}% ${diff < 0 ? "less" : "more"} on ${name.toLowerCase()} compared with last month.`,
      );
    });
  out.push(
    vi
      ? `Trung bình bạn chi ${fmt(s.avgDailySpend)}/ngày, hạn mức an toàn là ${fmt(s.dailyLimit)}/ngày.`
      : `You spend ${fmt(s.avgDailySpend)}/day on average; your safe limit is ${fmt(s.dailyLimit)}/day.`,
  );
  return out;
}

export function aiRespond(
  question: string,
  ctx: {
    lang: Lang;
    t: Dict;
    stats: CategoryStat[];
    summary: FinancialSummary;
    txs: Transaction[];
    today: string;
    nextIncome: string;
    fmt: Fmt;
  },
): string {
  const { lang, t, stats, summary: s, fmt } = ctx;
  const vi = lang === "vi";
  const q = question.toLowerCase();
  const sorted = [...stats].sort((a, b) => b.spent - a.spent);
  const top = sorted[0];

  if (/airpod|mua|buy|afford/.test(q)) {
    const sim = simulatePurchase("AirPods Pro", 5990000, s);
    return vi
      ? `Nếu mua AirPods Pro (${fmt(5990000)}), số tiền có thể chi an toàn sẽ giảm từ ${fmt(sim.safeBefore)} xuống ${fmt(sim.safeAfter)}. Hạn mức mỗi ngày còn ${fmt(sim.dailyAfter)} thay vì ${fmt(sim.dailyBefore)} trong ${s.daysRemaining} ngày tới. Mức ảnh hưởng: ${t.purchase.impact[sim.impact].toLowerCase()}.${sim.exceeds ? " Khoản này vượt ngân sách an toàn — bạn có thể cân nhắc mua sau ngày " + formatShortDate(ctx.nextIncome) + "." : ""}`
      : `Buying AirPods Pro (${fmt(5990000)}) would drop your safe-to-spend from ${fmt(sim.safeBefore)} to ${fmt(sim.safeAfter)}. Your daily allowance becomes ${fmt(sim.dailyAfter)} instead of ${fmt(sim.dailyBefore)} for the next ${s.daysRemaining} days. Impact: ${t.purchase.impact[sim.impact].toLowerCase()}.${sim.exceeds ? " It exceeds your safe budget — consider waiting until " + formatShortDate(ctx.nextIncome) + "." : ""}`;
  }
  if (/tiết kiệm|save|1 triệu|million/.test(q)) {
    const cuts = sorted.filter((c) => c.spent > 0 && !["housing", "education"].includes(c.category)).slice(0, 3);
    const perDay = 1000000 / Math.max(s.daysRemaining, 1);
    const lines = cuts
      .map((c) => `• ${t.categories[c.category]}: ${vi ? "giảm" : "cut"} ${fmt(Math.round(c.spent * 0.25))}`)
      .join("\n");
    return vi
      ? `Để tiết kiệm thêm 1.000.000 ₫ trước kỳ lương, bạn cần giảm khoảng ${fmt(perDay)}/ngày. Gợi ý từ dữ liệu của bạn:\n${lines}\nNgoài ra, hãy chuyển 1 triệu vào mục tiêu tiết kiệm ngay hôm nay để tránh "lỡ tay".`
      : `To save an extra 1,000,000 ₫ before payday, cut about ${fmt(perDay)}/day. Suggestions from your data:\n${lines}\nTip: move the 1M into savings today so it's out of reach.`;
  }
  if (/tuần|week/.test(q)) {
    const w = weekSpending(ctx.txs, ctx.today);
    const food = w.byCat.get("food") ?? 0;
    const target = s.dailyLimit;
    const avgW = w.total / 7;
    const cut = Math.max(Math.round(avgW - target), 0);
    return vi
      ? `Tuần này bạn đã chi ${fmt(w.total)} qua ${w.count} giao dịch, trong đó ăn uống là ${fmt(food)}. Trung bình ${fmt(avgW)}/ngày. ${cut > 0 ? `Để giữ hạn mức ${fmt(target)}/ngày đến cuối kỳ, bạn nên giảm khoảng ${fmt(cut)} mỗi ngày.` : `Bạn đang dưới hạn mức ${fmt(target)}/ngày — rất tốt!`}`
      : `This week you spent ${fmt(w.total)} across ${w.count} transactions, ${fmt(food)} of it on food. That's ${fmt(avgW)}/day on average. ${cut > 0 ? `To keep your ${fmt(target)}/day limit until payday, cut about ${fmt(cut)} per day.` : `You're under your ${fmt(target)}/day limit — great job!`}`;
  }
  if (/nhiều nhất|most|đâu|where|category|danh mục/.test(q) && top) {
    const second = sorted[1];
    return vi
      ? `Tháng này bạn chi nhiều nhất cho ${t.categories[top.category].toLowerCase()}: ${fmt(top.spent)} (${Math.round(top.pct)}% tổng chi tiêu)${second && second.spent ? `, tiếp theo là ${t.categories[second.category].toLowerCase()} với ${fmt(second.spent)}` : ""}. ${top.budget ? `Bạn đã dùng ${Math.round(top.usage)}% ngân sách danh mục này.` : ""}`
      : `This month you spent the most on ${t.categories[top.category].toLowerCase()}: ${fmt(top.spent)} (${Math.round(top.pct)}% of total)${second && second.spent ? `, followed by ${t.categories[second.category].toLowerCase()} at ${fmt(second.spent)}` : ""}. ${top.budget ? `You've used ${Math.round(top.usage)}% of that budget.` : ""}`;
  }
  return vi
    ? `Hiện tại số dư của bạn là ${fmt(s.balance)}, có thể chi an toàn ${fmt(s.safeToSpend)} — tương đương ${fmt(s.dailyLimit)}/ngày trong ${s.daysRemaining} ngày tới. Trạng thái: ${t.status[s.status].toLowerCase()}. Bạn có thể hỏi mình về chi tiêu theo tuần, cách tiết kiệm hoặc một món đồ định mua.`
    : `Your balance is ${fmt(s.balance)}, with ${fmt(s.safeToSpend)} safe to spend — about ${fmt(s.dailyLimit)}/day for the next ${s.daysRemaining} days. Status: ${t.status[s.status].toLowerCase()}. Ask me about weekly spending, saving tips, or something you want to buy.`;
}
