import { Pencil, Trash2, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/store/AppStore";
import type { Transaction } from "@/lib/types";
import { formatShortDate } from "@/lib/dateUtils";
import { CategoryIcon, EASE } from "./primitives";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function EmptyTransactions({ onAdd }: { onAdd?: (() => void) | undefined }) {
  const { t } = useApp();
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <span className="bg-orb animate-orb grid size-16 place-items-center rounded-full text-2xl shadow-glow-ai">👀</span>
      <p className="mt-4 text-lg font-extrabold">{t.noTx}</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{t.noTxHint}</p>
      {onAdd && <Button className="mt-5" onClick={onAdd}><Plus /> {t.addTx}</Button>}
    </div>
  );
}

export function TransactionList({ items, onEdit, onAdd, editable = true }: { items: Transaction[]; onEdit?: (t: Transaction) => void; onAdd?: () => void; editable?: boolean }) {
  const { t, fmt, deleteTransaction } = useApp();
  if (!items.length) return <EmptyTransactions onAdd={onAdd} />;
  return (
    <ul>
      <AnimatePresence initial={false}>
        {items.map((tx) => (
          <motion.li
            key={tx.id}
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0, x: 24 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-2 py-2.5 transition hover:bg-muted/60">
              <CategoryIcon category={tx.category} />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{tx.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatShortDate(tx.date)} · {t.categories[tx.category]}
                  {tx.note && ` · ${tx.note}`}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <span className={cn("tabular rounded-lg px-2 py-0.5 text-sm font-extrabold", tx.type === "income" ? "bg-tint-emerald text-success" : "text-foreground")}>
                  {tx.type === "income" ? "+" : "−"}
                  {fmt(tx.amount)}
                </span>
                {editable && (
                  <div className="ml-1 flex transition sm:w-0 sm:overflow-hidden sm:opacity-0 sm:group-hover:w-auto sm:group-hover:opacity-100">
                    <button aria-label={t.edit} onClick={() => onEdit?.(tx)} className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-tint-blue hover:text-blue">
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      aria-label={t.delete}
                      onClick={() => { deleteTransaction(tx.id); toast(t.toast.txDeleted); }}
                      className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-tint-coral hover:text-warning"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
