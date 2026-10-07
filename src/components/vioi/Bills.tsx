import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Repeat, CalendarClock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useApp } from "@/store/AppStore";
import { CATEGORIES, type Bill } from "@/lib/types";
import { daysBetween, formatShortDate } from "@/lib/dateUtils";
import { CategoryIcon, CurrencyInput, Panel, TextAction, fieldClass } from "./primitives";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function BillCard({ bill, onEdit }: { bill: Bill; onEdit: () => void }) {
  const { t, fmt, today, profile, toggleBillPaid, deleteBill } = useApp();
  const d = daysBetween(today, bill.dueDate);
  const afterIncome = bill.dueDate > profile.nextIncomeDate;
  return (
    <motion.div layout className={cn("group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border bg-card p-3 transition hover:-translate-y-0.5 hover:border-warning/30 hover:shadow-soft", bill.paid && "opacity-60")}>
      <CategoryIcon category={bill.category} />
      <div className="min-w-0">
        <p className={cn("flex items-center gap-1.5 truncate text-sm font-bold", bill.paid && "line-through")}>
          <span className="truncate">{bill.name}</span>
          {bill.recurring && <Repeat className="size-3 shrink-0 text-muted-foreground" />}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {formatShortDate(bill.dueDate)} ·{" "}
          <span className={cn(!bill.paid && d <= 3 && "font-bold text-warning")}>
            {bill.paid ? t.bills.paid : afterIncome ? t.bills.afterIncome : t.bills.inDays(d)}
          </span>
        </p>
      </div>
      <div className="flex items-center gap-1">
        <span className="tabular text-sm font-extrabold">{fmt(bill.amount)}</span>
        <motion.button
          whileTap={{ scale: 0.85 }}
          aria-label={t.bills.markPaid}
          onClick={() => {
            toggleBillPaid(bill.id, today);
            toast.success(bill.paid ? t.toast.billSaved : t.toast.billPaid);
          }}
          className={cn("ml-1 grid size-8 place-items-center rounded-[10px] border-2 transition-colors", bill.paid ? "border-success bg-success text-hero-foreground" : "hover:border-success hover:text-success")}
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={false} animate={{ pathLength: bill.paid ? 1 : 0.0001, opacity: bill.paid ? 1 : 0.35 }} transition={{ duration: 0.35, ease: "easeOut" }} />
          </svg>
        </motion.button>
        <div className="flex sm:hidden sm:group-hover:flex">
          <button aria-label={t.edit} onClick={onEdit} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-tint-blue hover:text-blue"><Pencil className="size-3.5" /></button>
          <button aria-label={t.delete} onClick={() => { deleteBill(bill.id); toast(t.toast.billDeleted); }} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-tint-coral hover:text-warning"><Trash2 className="size-3.5" /></button>
        </div>
      </div>
    </motion.div>
  );
}

function BillModal({ open, onOpenChange, initial }: { open: boolean; onOpenChange: (o: boolean) => void; initial: Bill | null }) {
  const { t, profile, today, saveBill } = useApp();
  const blank = { name: "", amount: 0, dueDate: today, recurring: true, category: "housing" as const, paid: false };
  const [d, setD] = useState<Omit<Bill, "id"> & { id?: string }>(blank);
  useEffect(() => {
    if (open) setD(initial ?? blank);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="font-display">{d.id ? t.bills.edit : t.bills.add}</DialogTitle></DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!d.name.trim() || d.amount <= 0) return;
            saveBill(d);
            toast.success(t.toast.billSaved);
            onOpenChange(false);
          }}
        >
          <label className="block space-y-1.5"><span className="text-xs font-semibold text-muted-foreground">{t.name}</span>
            <input className={fieldClass} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} required /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5"><span className="text-xs font-semibold text-muted-foreground">{t.amount}</span>
              <CurrencyInput value={d.amount} onChange={(v) => setD({ ...d, amount: v })} currency={profile.currency} /></label>
            <label className="block space-y-1.5"><span className="text-xs font-semibold text-muted-foreground">{t.bills.due}</span>
              <input type="date" className={fieldClass} value={d.dueDate} onChange={(e) => setD({ ...d, dueDate: e.target.value })} required /></label>
          </div>
          <label className="block space-y-1.5"><span className="text-xs font-semibold text-muted-foreground">{t.category}</span>
            <select className={fieldClass} value={d.category} onChange={(e) => setD({ ...d, category: e.target.value as Bill["category"] })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{t.categories[c]}</option>)}
            </select></label>
          <label className="flex items-center justify-between rounded-xl bg-muted p-3 text-sm font-medium">
            {t.bills.recurring}
            <Switch checked={d.recurring} onCheckedChange={(v) => setD({ ...d, recurring: v })} />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t.cancel}</Button>
            <Button type="submit">{t.save}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function BillsSection({ limit }: { limit?: number }) {
  const { t, bills } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Bill | null>(null);
  const sorted = [...bills].sort((a, b) => Number(a.paid) - Number(b.paid) || a.dueDate.localeCompare(b.dueDate));
  const shown = limit ? sorted.slice(0, limit) : sorted;
  return (
    <Panel
      title={t.bills.title}
      icon={<CalendarClock className="size-4" />}
      accent="var(--warning)"
      action={<TextAction color="var(--warning)" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="size-3.5" /> {t.bills.add}</TextAction>}
    >
      <div className="space-y-2">
        {shown.length ? shown.map((b) => <BillCard key={b.id} bill={b} onEdit={() => { setEditing(b); setOpen(true); }} />) : (
          <p className="py-6 text-center text-sm text-muted-foreground">{t.bills.empty}</p>
        )}
      </div>
      <BillModal open={open} onOpenChange={setOpen} initial={editing} />
    </Panel>
  );
}
