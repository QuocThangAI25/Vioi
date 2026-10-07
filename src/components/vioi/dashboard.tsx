import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { motion, type MotionStyle } from "framer-motion";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ShieldCheck, AlertTriangle, Flame, Wallet, CreditCard, CalendarClock, PiggyBank, SlidersHorizontal, Activity, LayoutGrid } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useApp } from "@/store/AppStore";
import { cashFlowSeries, categoryStats, type CashRange } from "@/lib/financialCalculations";
import { formatShortDate } from "@/lib/dateUtils";
import type { CategoryBudget } from "@/lib/types";
import { AnimatedNumber, CATEGORY_COLOR, CategoryIcon, ChartSkeleton, CurrencyInput, EASE, Panel, ProgressBar, Ring, Segmented, TextAction, rise, useMounted, usageTone } from "./primitives";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function FinancialHeroCard() {
  const { t, fmt, summary, profile } = useApp();
  const StatusIcon = summary.status === "stable" ? ShieldCheck : summary.status === "attention" ? AlertTriangle : Flame;
  const dot = summary.status === "stable" ? "var(--success)" : summary.status === "attention" ? "var(--signature)" : "var(--warning)";
  const elapsed = Math.max(100 - (summary.daysRemaining / 31) * 100, 4);
  return (
    <motion.div variants={rise} className="bg-hero shadow-glow relative isolate overflow-hidden rounded-[28px] p-6 sm:p-8">
      {/* mesh + blobs + grid */}
      <div className="bg-grid pointer-events-none absolute inset-0 -z-10" />
      <div className="animate-blob pointer-events-none absolute -right-16 -top-24 -z-10 size-72 rounded-full bg-cyan opacity-50 blur-3xl" />
      <div className="animate-blob pointer-events-none absolute -bottom-28 left-1/3 -z-10 size-72 rounded-full bg-purple opacity-40 blur-3xl" style={{ animationDelay: "-4s" }} />
      <div className="pointer-events-none absolute -bottom-10 -right-6 -z-10 size-40 rounded-full bg-signature opacity-25 blur-3xl" />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-hero-foreground/80">{t.safeToSpend}</p>
        <span className="glass-light inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold">
          <StatusIcon className="size-3.5" />
          {t.status[summary.status]}
          <span className="relative flex size-2">
            <span className="absolute inset-0 animate-ping rounded-full opacity-70" style={{ background: dot }} />
            <span className="relative size-2 rounded-full" style={{ background: dot }} />
          </span>
        </span>
      </div>
      <p className="mt-4 text-[40px] font-extrabold leading-none tracking-tight sm:text-[52px]">
        <AnimatedNumber value={summary.safeToSpend} format={(v) => fmt(v)} />
      </p>
      <p className="mt-3 text-sm text-hero-foreground/80">{t.safeUntil(formatShortDate(profile.nextIncomeDate))}</p>

      <div className="mt-7 flex flex-wrap items-end gap-x-8 gap-y-5">
        <div className="glass-light rounded-2xl px-4 py-3">
          <p className="text-[11px] font-semibold text-hero-foreground/75">{t.dailyLimit}</p>
          <p className="text-2xl font-extrabold text-signature">
            <AnimatedNumber value={summary.dailyLimit} format={(v) => fmt(v)} />
            <span className="ml-1 text-sm font-semibold text-hero-foreground/75">{t.perDay}</span>
          </p>
        </div>
        <div className="min-w-44 flex-1">
          <div className="mb-2 flex justify-between text-xs text-hero-foreground/75">
            <span>{t.daysLeft(summary.daysRemaining)}</span>
            <span className="tabular font-bold">{formatShortDate(profile.nextIncomeDate)}</span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-hero-foreground/15">
            <motion.div className="bg-warm relative h-full overflow-hidden rounded-full" initial={{ width: 0 }} animate={{ width: `${elapsed}%` }} transition={{ duration: 1.1, ease: EASE, delay: 0.2 }}>
              <span className="animate-sheen absolute inset-y-0 w-1/3 bg-hero-foreground/50 blur-sm" />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

type Accent = "blue" | "orange" | "coral" | "emerald";
const ACCENT: Record<Accent, { color: string; tint: string }> = {
  blue: { color: "var(--blue)", tint: "var(--tint-blue)" },
  orange: { color: "var(--orange)", tint: "var(--tint-yellow)" },
  coral: { color: "var(--warning)", tint: "var(--tint-coral)" },
  emerald: { color: "var(--success)", tint: "var(--tint-emerald)" },
};

export function MetricCard({ label, value, icon, accent, hint }: { label: string; value: number; icon: ReactNode; accent: Accent; hint?: string }) {
  const { fmt } = useApp();
  const a = ACCENT[accent];
  return (
    <motion.div
      variants={rise}
      className="surface card-hover relative overflow-hidden p-4 sm:p-5"
      style={{ "--card-accent": a.color, background: `linear-gradient(160deg, ${a.tint}, var(--card) 70%)` } as MotionStyle}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full opacity-20 blur-2xl" style={{ background: a.color }} />
      <span className="grid size-10 place-items-center rounded-[13px] text-hero-foreground shadow-soft" style={{ background: `linear-gradient(135deg, color-mix(in oklab, ${a.color} 70%, white), ${a.color})` }}>
        {icon}
      </span>
      <p className="mt-4 text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-lg font-extrabold sm:text-[22px]">
        <AnimatedNumber value={value} format={(v) => fmt(v)} />
      </p>
      {hint && <p className="mt-1 truncate text-xs font-medium" style={{ color: a.color }}>{hint}</p>}
    </motion.div>
  );
}

export function KpiGrid() {
  const { t, summary, profile, bills, fmt } = useApp();
  const unpaid = bills.filter((b) => !b.paid && b.dueDate <= profile.nextIncomeDate).length;
  const spentPct = profile.monthlyIncome ? Math.round((summary.spentThisMonth / profile.monthlyIncome) * 100) : 0;
  const ctx = t.kpi;
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
      <MetricCard label={t.currentBalance} value={summary.balance} icon={<Wallet className="size-[18px]" />} accent="blue" hint={ctx.balance(fmt(summary.incomeThisMonth))} />
      <MetricCard label={t.spentThisMonth} value={summary.spentThisMonth} icon={<CreditCard className="size-[18px]" />} accent="orange" hint={ctx.spent(spentPct)} />
      <MetricCard label={t.upcomingBills} value={summary.billsBeforeIncome} icon={<CalendarClock className="size-[18px]" />} accent="coral" hint={ctx.bills(unpaid)} />
      <MetricCard label={t.savingsTarget} value={profile.savingsTarget} icon={<PiggyBank className="size-[18px]" />} accent="emerald" hint={ctx.savings} />
    </div>
  );
}

const SERIES = [
  { key: "balance", color: "var(--cyan)", grad: "gBal" },
  { key: "income", color: "var(--success)", grad: "gInc" },
  { key: "expense", color: "var(--purple)", grad: "gExp" },
] as const;

export function CashFlowChart() {
  const { t, fmt, transactions, summary, today } = useApp();
  const [range, setRange] = useState<CashRange>("month");
  const data = useMemo(() => cashFlowSeries(transactions, summary.balance, today, range), [transactions, summary.balance, today, range]);
  const mounted = useMounted();
  const names = { balance: t.remaining, income: t.income, expense: t.expense };
  return (
    <Panel
      title={t.cashFlow}
      icon={<Activity className="size-4" />}
      accent="var(--cyan)"
      action={<Segmented id="cash" value={range} onChange={setRange} options={[{ value: "7", label: t.range7 }, { value: "30", label: t.range30 }, { value: "month", label: t.rangeMonth }]} />}
    >
      <div className="mb-3 flex flex-wrap gap-4 text-xs font-semibold text-muted-foreground">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: s.color }} />{names[s.key]}</span>
        ))}
      </div>
      <div className="h-64 w-full min-w-0">
        {mounted ? (
          <motion.div key={range} className="h-full" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ left: 0, right: 4, top: 6 }}>
                <defs>
                  {SERIES.map((s) => (
                    <linearGradient key={s.grad} id={s.grad} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={s.color} stopOpacity={s.key === "balance" ? 0.3 : 0.22} />
                      <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 6" />
                <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} minTickGap={24} />
                <YAxis tickFormatter={(v) => fmt(v, true)} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={52} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--indigo)", strokeOpacity: 0.25, strokeWidth: 1.5 }} />
                {SERIES.map((s) => (
                  <Area key={s.key} isAnimationActive={false} type="monotone" dataKey={s.key} name={names[s.key]} stroke={s.color} strokeWidth={s.key === "balance" ? 3 : 2.25} fill={`url(#${s.grad})`} activeDot={{ r: 5, strokeWidth: 3, stroke: "var(--card)" }} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        ) : (
          <ChartSkeleton />
        )}
      </div>
    </Panel>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ChartTooltip({ active, payload, label }: any) {
  const { fmt } = useApp();
  if (!active || !payload?.length) return null;
  return (
    <div className="glass min-w-40 rounded-2xl border p-3 text-xs shadow-lift">
      {label && <p className="mb-2 font-bold">{/^\d{4}-/.test(label) ? formatShortDate(label) : label}</p>}
      <div className="space-y-1.5">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {payload.map((p: any) => (
          <p key={p.dataKey ?? p.name} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: p.payload?.fill ?? p.color }} />
            <span className="flex-1 text-muted-foreground">{p.name}</span>
            <span className="tabular font-extrabold">{fmt(p.value)}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

export function SpendingCategories({ compact }: { compact?: boolean }) {
  const { t, fmt, transactions, budgets, today } = useApp();
  const [open, setOpen] = useState(false);
  const stats = categoryStats(transactions, budgets, today).sort((a, b) => b.spent - a.spent);
  const shown = compact ? stats.slice(0, 5) : stats;
  return (
    <Panel
      title={t.spendingAnalysis}
      icon={<LayoutGrid className="size-4" />}
      accent="var(--purple)"
      action={<TextAction color="var(--purple)" onClick={() => setOpen(true)}><SlidersHorizontal className="size-3.5" /> {t.editBudgets}</TextAction>}
    >
      <div className={cn("grid gap-2", !compact && "sm:grid-cols-2")}>
        {shown.map((c) => (
          <div key={c.category} className="rounded-2xl p-2.5 transition hover:bg-muted/60">
            <div className="flex items-center gap-3">
              <CategoryIcon category={c.category} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-bold">{t.categories[c.category]}</p>
                  <p className="tabular shrink-0 text-sm font-extrabold">{fmt(c.spent)}</p>
                </div>
                <div className="flex justify-between gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold" style={{ color: CATEGORY_COLOR[c.category] }}>{Math.round(c.pct)}%</span>
                  <span className="tabular truncate">{t.of} {fmt(c.budget)}</span>
                </div>
              </div>
            </div>
            <ProgressBar value={c.usage} tone={usageTone(c.usage) === "default" ? "default" : usageTone(c.usage)} color={CATEGORY_COLOR[c.category]} className="mt-2.5" />
          </div>
        ))}
      </div>
      <BudgetEditor open={open} onOpenChange={setOpen} />
    </Panel>
  );
}

export function BudgetEditor({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t, budgets, setBudgets, profile } = useApp();
  const [draft, setDraft] = useState<CategoryBudget[]>(budgets);
  useEffect(() => {
    if (open) setDraft(budgets);
  }, [open, budgets]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="text-xl font-extrabold">{t.editBudgets}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {draft.map((b, i) => (
            <div key={b.category} className="grid grid-cols-[auto_minmax(0,1fr)_9.5rem] items-center gap-3">
              <CategoryIcon category={b.category} className="size-9" />
              <span className="truncate text-sm font-semibold">{t.categories[b.category]}</span>
              <CurrencyInput value={b.budget} currency={profile.currency} onChange={(v) => setDraft(draft.map((x, j) => (j === i ? { ...x, budget: v } : x)))} />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t.cancel}</Button>
          <Button onClick={() => { setBudgets(draft); toast.success(t.toast.budgetsSaved); onOpenChange(false); }}>{t.save}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function scoreColor(s: number) {
  return s >= 80 ? "var(--success)" : s >= 60 ? "var(--blue)" : s >= 40 ? "var(--signature)" : s >= 20 ? "var(--orange)" : "var(--warning)";
}

export function FinancialHealthScore() {
  const { t, summary } = useApp();
  const s = summary.score;
  const label = s >= 80 ? t.score.great : s >= 60 ? t.score.stable : s >= 40 ? t.score.watch : t.score.weak;
  const color = scoreColor(s);
  return (
    <Panel accent={color}>
      <div className="flex items-center gap-5">
        <Ring value={s} size={124} stroke={12} color={color} gradientId="score-grad">
          <div>
            <p className="text-[38px] font-extrabold leading-none" style={{ color }}><AnimatedNumber value={s} format={(v) => String(Math.round(v))} /></p>
            <p className="mt-1 text-[10px] font-bold text-muted-foreground">/ 100</p>
          </div>
        </Ring>
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold tracking-[0.2em] text-muted-foreground">{t.score.title}</p>
          <p className="mt-1 text-lg font-extrabold leading-tight">{label}</p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t.score.disclaimer}</p>
        </div>
      </div>
    </Panel>
  );
}
