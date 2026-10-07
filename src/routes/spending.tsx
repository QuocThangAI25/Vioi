import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/store/AppStore";
import { PageHeader, Panel, Segmented, fieldClass } from "@/components/vioi/primitives";
import { TransactionList } from "@/components/vioi/TransactionList";
import { TransactionModal } from "@/components/vioi/TransactionModal";
import { BillsSection } from "@/components/vioi/Bills";
import { SpendingCategories } from "@/components/vioi/dashboard";
import { CATEGORIES, type CategoryId, type Transaction } from "@/lib/types";

export const Route = createFileRoute("/spending")({
  head: () => ({
    meta: [
      { title: "Chi tiêu — VÍOI" },
      { name: "description", content: "Quản lý giao dịch, hóa đơn và ngân sách theo danh mục." },
      { property: "og:title", content: "Spending — VÍOI" },
      { property: "og:description", content: "Track transactions, upcoming bills and category budgets." },
    ],
  }),
  component: SpendingPage,
});

function SpendingPage() {
  const { t, transactions } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [type, setType] = useState<"all" | "income" | "expense">("all");
  const [cat, setCat] = useState<CategoryId | "all">("all");
  const [q, setQ] = useState("");
  const items = useMemo(
    () =>
      [...transactions]
        .filter((x) => (type === "all" || x.type === type) && (cat === "all" || x.category === cat) && x.name.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, type, cat, q],
  );

  return (
    <>
      <PageHeader
        title={t.nav.spending}
        action={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus /> {t.addTx}
          </Button>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel title={t.recentTx} icon={<ReceiptText className="size-4" />} accent="var(--blue)">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input className={fieldClass + " pl-10"} placeholder={t.search} value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <select className={fieldClass + " sm:w-44"} value={cat} onChange={(e) => setCat(e.target.value as CategoryId | "all")}>
              <option value="all">{t.all}</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{t.categories[c]}</option>)}
            </select>
          </div>
          <Segmented id="txtype" value={type} onChange={setType} options={[{ value: "all", label: t.all }, { value: "expense", label: t.expense }, { value: "income", label: t.income }]} />
          <div className="mt-2">
            <TransactionList items={items} onAdd={() => { setEditing(null); setOpen(true); }} onEdit={(tx) => { setEditing(tx); setOpen(true); }} />
          </div>
        </Panel>
        <div className="space-y-5">
          <BillsSection />
          <SpendingCategories compact />
        </div>
      </div>
      <TransactionModal open={open} onOpenChange={setOpen} initial={editing} />
    </>
  );
}
