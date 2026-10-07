import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useApp } from "@/store/AppStore";
import { CATEGORIES } from "@/lib/types";
import { CurrencyInput, PageHeader, Panel, fieldClass } from "@/components/vioi/primitives";
import { BudgetEditor } from "@/components/vioi/dashboard";
import { LanguageSwitcher, ThemeToggle } from "@/components/vioi/layout";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Cá nhân — VÍOI" },
      { name: "description", content: "Tùy chỉnh thông tin cá nhân, thu nhập, mục tiêu tiết kiệm và ngân sách." },
      { property: "og:title", content: "Profile — VÍOI" },
      { property: "og:description", content: "Personalise your income, savings goal, currency and budgets." },
    ],
  }),
  component: ProfilePage,
});

const AVATARS = ["🦊", "🐼", "🐱", "🐯", "🦄", "🐸", "🐧", "🌸"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function ProfilePage() {
  const { t, profile, updateProfile, resetDemo, budgets, fmt } = useApp();
  const [budgetOpen, setBudgetOpen] = useState(false);
  // debounce-free toast: confirm on blur of any field
  const saved = () => toast.success(t.profile.saved, { id: "profile-saved" });

  return (
    <div className="space-y-5">
      <PageHeader title={t.profile.title} subtitle={t.profile.subtitle} />
      <div className="bg-hero shadow-glow relative flex items-center gap-4 overflow-hidden rounded-[28px] p-6">
        <div className="bg-grid pointer-events-none absolute inset-0" />
        <span className="bg-warm relative grid size-16 place-items-center rounded-full text-4xl shadow-soft">{profile.avatar}</span>
        <div className="relative min-w-0">
          <p className="truncate text-2xl font-extrabold">{profile.name}</p>
          <p className="truncate text-sm opacity-75">{profile.goal}</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={t.profile.personal} accent="var(--blue)">
          <div className="space-y-4" onBlur={saved}>
            <Field label={t.name}>
              <input className={fieldClass} value={profile.name} onChange={(e) => updateProfile({ name: e.target.value })} />
            </Field>
            <div>
              <span className="text-xs font-semibold text-muted-foreground">{t.profile.avatar}</span>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {AVATARS.map((a) => (
                  <button key={a} onClick={() => { updateProfile({ avatar: a }); saved(); }} className={cn("grid size-11 place-items-center rounded-xl border text-2xl transition", profile.avatar === a ? "border-ring bg-accent" : "hover:bg-muted")}>{a}</button>
                ))}
              </div>
            </div>
            <Field label={t.profile.goal}>
              <input className={fieldClass} value={profile.goal} onChange={(e) => updateProfile({ goal: e.target.value })} />
            </Field>
            <div>
              <span className="text-xs font-semibold text-muted-foreground">{t.profile.preferred}</span>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {CATEGORIES.map((c) => {
                  const on = profile.preferredCategories.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() => { updateProfile({ preferredCategories: on ? profile.preferredCategories.filter((x) => x !== c) : [...profile.preferredCategories, c] }); saved(); }}
                      className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold transition", on ? "btn-vioi border-transparent" : "hover:bg-muted")}
                    >
                      {t.categories[c]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Panel>

        <Panel title={t.profile.financial} accent="var(--success)">
          <div className="grid gap-4 sm:grid-cols-2" onBlur={saved}>
            <Field label={t.currentBalance}>
              <CurrencyInput value={profile.balance} currency={profile.currency} onChange={(v) => updateProfile({ balance: v })} />
            </Field>
            <Field label={t.profile.monthlyIncome}>
              <CurrencyInput value={profile.monthlyIncome} currency={profile.currency} onChange={(v) => updateProfile({ monthlyIncome: v })} />
            </Field>
            <Field label={t.savingsTarget}>
              <CurrencyInput value={profile.savingsTarget} currency={profile.currency} onChange={(v) => updateProfile({ savingsTarget: v })} />
            </Field>
            <Field label={t.nextIncomeDate}>
              <input type="date" className={fieldClass} value={profile.nextIncomeDate} onChange={(e) => e.target.value && updateProfile({ nextIncomeDate: e.target.value })} />
            </Field>
            <Field label={t.profile.dailyTarget}>
              <CurrencyInput value={profile.dailyTarget ?? 0} currency={profile.currency} onChange={(v) => updateProfile({ dailyTarget: v || null })} />
            </Field>
            <Field label={t.profile.currency}>
              <select className={fieldClass} value={profile.currency} onChange={(e) => { updateProfile({ currency: e.target.value as "VND" | "USD" }); saved(); }}>
                <option value="VND">VND (₫)</option>
                <option value="USD">USD ($)</option>
              </select>
            </Field>
          </div>
        </Panel>

        <Panel title={t.profile.preferences} accent="var(--purple)">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl bg-muted/60 p-3"><span className="text-sm font-medium">{t.language}</span><LanguageSwitcher /></div>
            <div className="flex items-center justify-between rounded-2xl bg-muted/60 p-3"><span className="text-sm font-medium">{t.theme}</span><ThemeToggle /></div>
            <button onClick={() => { resetDemo(); toast(t.toast.reset); }} className="flex w-full items-center justify-center gap-2 rounded-2xl border p-3 text-sm font-semibold text-muted-foreground transition hover:border-warning hover:text-warning">
              <RotateCcw className="size-4" /> {t.profile.reset}
            </button>
          </div>
        </Panel>

        <Panel
          title={t.budget}
          accent="var(--orange)"
          action={<button onClick={() => setBudgetOpen(true)} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-orange hover:bg-tint-yellow"><SlidersHorizontal className="size-3.5" />{t.editBudgets}</button>}
        >
          <ul className="grid grid-cols-2 gap-2">
            {budgets.map((b) => (
              <li key={b.category} className="rounded-2xl bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground">{t.categories[b.category]}</p>
                <p className="tabular truncate text-sm font-bold">{fmt(b.budget)}</p>
              </li>
            ))}
          </ul>
          <BudgetEditor open={budgetOpen} onOpenChange={setBudgetOpen} />
        </Panel>
      </div>
    </div>
  );
}
