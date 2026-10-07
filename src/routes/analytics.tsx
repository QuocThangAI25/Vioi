import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from "recharts";
import { Lightbulb } from "lucide-react";
import { useApp } from "@/store/AppStore";
import { categoryStats, monthlyTrend } from "@/lib/financialCalculations";
import { buildInsights } from "@/lib/insights";
import { CATEGORY_COLOR, CategoryIcon, ChartSkeleton, PageHeader, Panel, ProgressBar, usageTone } from "@/components/vioi/primitives";
import { ChartTooltip, FinancialHealthScore, KpiGrid } from "@/components/vioi/dashboard";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Phân tích — VÍOI" },
      { name: "description", content: "Biểu đồ chi tiêu, thu nhập và mức dùng ngân sách của bạn." },
      { property: "og:title", content: "Analytics — VÍOI" },
      { property: "og:description", content: "Spending by category, monthly trends and budget usage." },
    ],
  }),
  component: AnalyticsPage,
});

const INSIGHT_COLORS = ["var(--gradient-vioi)", "var(--gradient-ai)", "var(--gradient-warm)", "linear-gradient(135deg,#34d399,#10b981)"];

function AnalyticsPage() {
  const { t, fmt, transactions, budgets, today, summary, settings } = useApp();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const stats = categoryStats(transactions, budgets, today);
  const donut = stats.filter((s) => s.spent > 0).map((s) => ({ name: t.categories[s.category], value: s.spent, fill: CATEGORY_COLOR[s.category] }));
  const trend = monthlyTrend(transactions, today, 6);
  const insights = buildInsights(settings.lang, t, stats, summary, (v) => fmt(v));
  const axis = { fontSize: 11, fill: "var(--muted-foreground)" };

  return (
    <div className="space-y-5">
      <PageHeader title={t.analytics.title} subtitle={t.analytics.subtitle} />
      <KpiGrid />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title={t.analytics.byCategory} accent="var(--purple)">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="relative size-52 shrink-0">
              {!mounted ? <ChartSkeleton /> : (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={donut} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={3} stroke="none">
                      {donut.map((d) => <Cell key={d.name} fill={d.fill} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <div><p className="text-[11px] text-muted-foreground">{t.spentThisMonth}</p><p className="font-display font-bold">{fmt(summary.spentThisMonth, true)}</p></div>
              </div>
            </div>
            <ul className="w-full space-y-2">
              {stats.filter((s) => s.spent > 0).sort((a, b) => b.spent - a.spent).map((s) => (
                <li key={s.category} className="flex items-center gap-2 text-sm">
                  <span className="size-2.5 rounded-full" style={{ background: CATEGORY_COLOR[s.category] }} />
                  <span className="flex-1 truncate">{t.categories[s.category]}</span>
                  <span className="tabular font-semibold">{Math.round(s.pct)}%</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
        <Panel title={t.analytics.incomeVsExpense} accent="var(--success)">
          <div className="h-60">
            {!mounted ? <ChartSkeleton /> : (
              <ResponsiveContainer>
                <BarChart data={trend} barGap={4}>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 6" />
                  <XAxis dataKey="month" tick={axis} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => fmt(v, true)} tick={axis} axisLine={false} tickLine={false} width={52} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
                  <defs>
                    <linearGradient id="bInc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#34d399" /><stop offset="100%" stopColor="var(--success)" /></linearGradient>
                    <linearGradient id="bExp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--purple)" /><stop offset="100%" stopColor="var(--indigo)" /></linearGradient>
                  </defs>
                  <Bar dataKey="income" name={t.income} fill="url(#bInc)" radius={[10, 10, 4, 4]} maxBarSize={28} />
                  <Bar dataKey="expense" name={t.expense} fill="url(#bExp)" radius={[10, 10, 4, 4]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel title={t.analytics.trend} accent="var(--blue)">
          <div className="h-56">
            {!mounted ? <ChartSkeleton /> : (
              <ResponsiveContainer>
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="gTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--blue)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--cyan)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 6" />
                  <XAxis dataKey="month" tick={axis} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => fmt(v, true)} tick={axis} axisLine={false} tickLine={false} width={52} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="expense" name={t.expense} stroke="var(--blue)" strokeWidth={3} fill="url(#gTrend)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>
        <div className="space-y-3">
          <p className="px-1 text-sm font-semibold text-muted-foreground">{t.analytics.health}</p>
          <FinancialHealthScore />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={t.analytics.budgetUsage} accent="var(--cyan)">
          <div className="space-y-3">
            {stats.map((s) => (
              <div key={s.category} className="flex items-center gap-3">
                <CategoryIcon category={s.category} className="size-8" />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex justify-between text-xs"><span className="font-semibold">{t.categories[s.category]}</span><span className="tabular text-muted-foreground">{Math.round(s.usage)}%</span></div>
                  <ProgressBar value={s.usage} tone={usageTone(s.usage)} color={CATEGORY_COLOR[s.category]} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title={t.analytics.insights} accent="var(--pink)">
          <ul className="space-y-3">
            {insights.map((i, idx) => (
              <li key={i} className="flex gap-3 rounded-2xl border bg-muted/40 p-4 text-sm leading-relaxed transition hover:-translate-y-0.5 hover:shadow-soft">
                <span className="grid size-8 shrink-0 place-items-center rounded-xl text-hero-foreground" style={{ background: INSIGHT_COLORS[idx % INSIGHT_COLORS.length] }}><Lightbulb className="size-4" /></span>
                {i}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
