import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, AlertTriangle, ScanSearch, Info, ShoppingBag, Loader2 } from "lucide-react";
import { useApp } from "@/store/AppStore";
import { simulatePurchase } from "@/lib/financialCalculations";
import type { ImpactLevel, PurchaseSimulation } from "@/lib/types";
import { AnimatedNumber, CurrencyInput, EASE, Panel, Ring, fieldClass, rise } from "./primitives";
import { toast } from "sonner";

export const IMPACT_COLOR: Record<ImpactLevel, string> = {
  low: "var(--success)",
  medium: "var(--signature)",
  high: "var(--orange)",
  veryHigh: "var(--warning)",
};

export function ImpactGauge({ sim }: { sim: PurchaseSimulation }) {
  const { t } = useApp();
  const c = IMPACT_COLOR[sim.impact];
  return (
    <div className="flex flex-col items-center">
      <Ring value={sim.consumedPct} size={188} stroke={16} color={c} gradientId="impact-grad">
        <div>
          <p className="text-[40px] font-extrabold leading-none" style={{ color: c }}>
            <AnimatedNumber value={sim.consumedPct} format={(v) => `${Math.round(v)}%`} />
          </p>
          <p className="mx-auto mt-1 max-w-24 text-[11px] font-medium leading-tight text-muted-foreground">{t.purchase.consumed}</p>
        </div>
      </Ring>
      <motion.span
        key={sim.impact}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mt-4 rounded-full px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider"
        style={{ background: `color-mix(in oklab, ${c} 18%, transparent)`, color: `color-mix(in oklab, ${c} 80%, var(--foreground))` }}
      >
        {t.purchase.impact[sim.impact]}
      </motion.span>
    </div>
  );
}

export function PurchaseSimulator() {
  const { t, fmt, summary, profile } = useApp();
  const [name, setName] = useState("AirPods Pro");
  const [price, setPrice] = useState(5990000);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState<{ name: string; price: number; n: number } | null>(null);
  const sim = checked ? simulatePurchase(checked.name, checked.price, summary) : null;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <Panel className="relative h-fit overflow-hidden" accent="var(--orange)">
        <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-signature opacity-30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 size-40 rounded-full bg-pink opacity-15 blur-3xl" />
        <form
          className="relative space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (price <= 0 || loading) return;
            setLoading(true);
            setTimeout(() => {
              setChecked((c) => ({ name: name || "—", price, n: (c?.n ?? 0) + 1 }));
              setLoading(false);
              toast.success(t.toast.purchaseChecked);
            }, 450);
          }}
        >
          <span className="bg-warm grid size-12 place-items-center rounded-2xl shadow-soft"><ShoppingBag className="size-6" /></span>
          <label className="block space-y-2">
            <span className="text-sm font-bold">{t.purchase.want}</span>
            <input className={fieldClass + " h-14 text-base font-semibold"} value={name} onChange={(e) => setName(e.target.value)} placeholder={t.purchase.product} />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-bold">{t.purchase.price}</span>
            <CurrencyInput large value={price} onChange={setPrice} currency={profile.currency} />
          </label>
          <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="btn-warm flex h-14 w-full items-center justify-center gap-2 rounded-[14px] text-base font-extrabold transition disabled:opacity-80">
            {loading ? <Loader2 className="size-5 animate-spin" /> : <ScanSearch className="size-5" />}
            {loading ? t.checking : t.purchase.check}
          </motion.button>
          <p className="flex items-start gap-2 text-xs text-muted-foreground"><Info className="mt-0.5 size-3.5 shrink-0" />{t.purchase.note}</p>
        </form>
      </Panel>

      <AnimatePresence mode="wait">
        {sim && checked ? (
          <motion.div key={checked.n} className="space-y-5" initial="hidden" animate="show" exit={{ opacity: 0, y: -8 }} variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}>
            <motion.div variants={rise} className="surface relative overflow-hidden p-6" style={{ background: `linear-gradient(160deg, color-mix(in oklab, ${IMPACT_COLOR[sim.impact]} 10%, var(--card)), var(--card) 65%)` }}>
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <ImpactGauge sim={sim} />
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <p className="text-sm font-semibold text-muted-foreground">{sim.name}</p>
                  <p className="text-[32px] font-extrabold leading-tight"><AnimatedNumber value={sim.price} format={(v) => fmt(v)} /></p>
                  <p className="mt-3 text-[15px] leading-relaxed">{t.purchase.advice[sim.impact]}</p>
                  {sim.exceeds && (
                    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="mt-4 flex items-start gap-2 rounded-2xl border border-warning/25 bg-tint-coral p-3 text-left text-sm font-semibold text-warning">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {t.purchase.warning}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
            <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-4">
              <Compare label={t.purchase.before} safe={sim.safeBefore} daily={sim.dailyBefore} balance={sim.balanceBefore} color="var(--blue)" />
              <motion.div variants={rise} className="grid place-items-center">
                <span className="bg-vioi grid size-10 rotate-90 place-items-center rounded-full text-hero-foreground shadow-glow sm:rotate-0"><ArrowRight className="size-4" /></span>
              </motion.div>
              <Compare label={t.purchase.after} safe={sim.safeAfter} daily={sim.dailyAfter} balance={sim.balanceAfter} color={IMPACT_COLOR[sim.impact]} />
            </div>
          </motion.div>
        ) : (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: EASE }} className="surface grid min-h-80 place-items-center p-6 text-center">
            <div>
              <span className="bg-orb animate-orb mx-auto block size-20 rounded-full shadow-glow-ai" />
              <p className="mx-auto mt-5 max-w-xs text-[15px] text-muted-foreground">{t.purchase.empty}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Compare({ label, safe, daily, balance, color }: { label: string; safe: number; daily: number; balance: number; color: string }) {
  const { t, fmt } = useApp();
  return (
    <motion.div
      variants={rise}
      className="relative overflow-hidden rounded-[22px] border p-5"
      style={{ background: `linear-gradient(150deg, color-mix(in oklab, ${color} 16%, var(--card)), var(--card) 80%)`, borderColor: `color-mix(in oklab, ${color} 30%, transparent)` }}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full opacity-30 blur-2xl" style={{ background: color }} />
      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em]" style={{ color: `color-mix(in oklab, ${color} 75%, var(--foreground))` }}>{label}</p>
      <p className="mt-3 text-xs text-muted-foreground">{t.safeToSpend}</p>
      <p className="truncate text-2xl font-extrabold"><AnimatedNumber value={safe} format={(v) => fmt(v)} /></p>
      <p className="tabular mt-1 truncate text-sm font-bold" style={{ color: `color-mix(in oklab, ${color} 80%, var(--foreground))` }}>
        <AnimatedNumber value={daily} format={(v) => fmt(v)} />{t.perDay}
      </p>
      <p className="mt-3 truncate text-xs text-muted-foreground">{t.purchase.balance}: <span className="tabular font-bold text-foreground">{fmt(balance)}</span></p>
    </motion.div>
  );
}
