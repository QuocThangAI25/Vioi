import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, ArrowUpRight } from "lucide-react";
import { useApp } from "@/store/AppStore";
import { CashFlowChart, FinancialHealthScore, FinancialHeroCard, KpiGrid, SpendingCategories } from "@/components/vioi/dashboard";
import { BillsSection } from "@/components/vioi/Bills";
import { TransactionList } from "@/components/vioi/TransactionList";
import { TransactionModal } from "@/components/vioi/TransactionModal";
import { Panel, Rise } from "@/components/vioi/primitives";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ReceiptText } from "lucide-react";
import { AlertCard } from "@/components/vioi/layout";
import { buildAlerts } from "@/lib/insights";
import { categoryStats } from "@/lib/financialCalculations";
import type { Transaction } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tổng quan — VÍOI" },
      { name: "description", content: "Biết ngay bạn có thể chi an toàn bao nhiêu mỗi ngày cho đến kỳ lương tiếp theo." },
      { property: "og:title", content: "VÍOI — Ví tui ơi, tiền tui đâu?" },
      { property: "og:description", content: "Your safe-to-spend money, daily limit and cash flow at a glance." },
    ],
  }),
  component: Overview,
});

function Overview() {
  const { t, profile, summary, transactions, bills, budgets, settings, today } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const hour = new Date().getHours();
  const greet = hour < 12 ? t.greeting.morning : hour < 18 ? t.greeting.afternoon : t.greeting.evening;
  const first = profile.name.split(" ").pop();
  const recent = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  const alerts = buildAlerts(settings.lang, t, bills, categoryStats(transactions, budgets, today), summary, today).slice(0, 3);

  return (
    <div className="space-y-5 lg:space-y-6">
      <Rise className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[28px] font-extrabold leading-tight sm:text-[32px]">{greet}, {first} 👋</h1>
          <p className="mt-1 text-muted-foreground">{t.wallet[summary.status]}</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus /> {t.addTx}
        </Button>
      </Rise>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <FinancialHeroCard />
        <div className="flex flex-col gap-3">
          <FinancialHealthScore />
          <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="space-y-2">
            {alerts.map((a) => <AlertCard key={a.id} tone={a.tone} text={a.text} />)}
          </motion.div>
        </div>
      </div>

      <KpiGrid />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <CashFlowChart />
        <BillsSection limit={4} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          title={t.recentTx}
          icon={<ReceiptText className="size-4" />}
          accent="var(--blue)"
          action={<Link to="/spending" className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-blue transition hover:bg-tint-blue">{t.viewAll}<ArrowUpRight className="size-3.5" /></Link>}
        >
          <TransactionList items={recent} onAdd={() => { setEditing(null); setOpen(true); }} onEdit={(tx) => { setEditing(tx); setOpen(true); }} />
        </Panel>
        <SpendingCategories compact />
      </div>

      <TransactionModal open={open} onOpenChange={setOpen} initial={editing} />
    </div>
  );
}
