import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useApp } from "@/store/AppStore";
import { CATEGORIES, type Transaction } from "@/lib/types";
import { CurrencyInput, fieldClass, CategoryIcon } from "./primitives";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Draft = Omit<Transaction, "id"> & { id?: string };

export function TransactionModal({ open, onOpenChange, initial }: { open: boolean; onOpenChange: (o: boolean) => void; initial?: Transaction | null }) {
  const { t, profile, today, addTransaction, updateTransaction } = useApp();
  const blank: Draft = { name: "", amount: 0, category: "food", date: today, type: "expense", note: "" };
  const [d, setD] = useState<Draft>(blank);
  useEffect(() => {
    if (open) setD(initial ? { ...initial } : blank);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!d.name.trim() || d.amount <= 0) return;
    if (d.id) {
      updateTransaction(d as Transaction);
      toast.success(t.toast.txUpdated);
    } else {
      addTransaction(d);
      toast.success(t.toast.txAdded);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{d.id ? t.editTx : t.addTx}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            {(["expense", "income"] as const).map((ty) => (
              <button
                type="button"
                key={ty}
                onClick={() => setD({ ...d, type: ty })}
                className={cn(
                  "rounded-lg py-2 text-sm font-semibold transition",
                  d.type === ty ? (ty === "income" ? "bg-success text-hero-foreground shadow-soft" : "btn-vioi") : "text-muted-foreground",
                )}
              >
                {ty === "income" ? t.income : t.expense}
              </button>
            ))}
          </div>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">{t.amount}</span>
            <CurrencyInput large value={d.amount} onChange={(v) => setD({ ...d, amount: v })} currency={profile.currency} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">{t.name}</span>
            <input className={fieldClass} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} placeholder="Highlands Coffee" required />
          </label>
          <div>
            <span className="text-xs font-semibold text-muted-foreground">{t.category}</span>
            <div className="mt-1.5 grid grid-cols-4 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setD({ ...d, category: c })}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border p-2 text-[11px] font-medium transition",
                    d.category === c ? "border-ring bg-accent" : "border-transparent hover:bg-muted",
                  )}
                >
                  <CategoryIcon category={c} className="size-8" />
                  <span className="truncate">{t.categories[c]}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">{t.date}</span>
              <input type="date" className={fieldClass} value={d.date} onChange={(e) => setD({ ...d, date: e.target.value })} required />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">{t.note}</span>
              <input className={fieldClass} value={d.note} onChange={(e) => setD({ ...d, note: e.target.value })} />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t.cancel}</Button>
            <Button type="submit">{t.save}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
