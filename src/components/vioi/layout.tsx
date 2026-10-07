import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Bell, LayoutDashboard, ReceiptText, ScanSearch, Sparkles, PieChart, UserRound, Moon, Sun, Settings } from "lucide-react";
import { useApp } from "@/store/AppStore";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { buildAlerts } from "@/lib/insights";
import { categoryStats } from "@/lib/financialCalculations";
import { EASE } from "./primitives";

const pageVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE, staggerChildren: 0.05 } },
};
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", key: "overview", icon: LayoutDashboard },
  { to: "/spending", key: "spending", icon: ReceiptText },
  { to: "/purchase-check", key: "purchase", icon: ScanSearch },
  { to: "/ai", key: "ai", icon: Sparkles },
  { to: "/analytics", key: "analytics", icon: PieChart },
  { to: "/profile", key: "profile", icon: UserRound },
] as const;

export function Logo({ light }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="bg-vioi relative grid size-9 place-items-center rounded-xl text-lg font-extrabold text-hero-foreground shadow-glow">
        V
        <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-signature ring-2 ring-sidebar" />
      </span>
      <span className={cn("text-xl font-extrabold tracking-tight", light ? "text-hero-foreground" : "text-foreground")}>
        V<span className="text-signature">Í</span>OI
      </span>
    </div>
  );
}

export function LanguageSwitcher({ dark }: { dark?: boolean }) {
  const { settings, updateSettings } = useApp();
  const id = dark ? "lang-dark" : "lang";
  return (
    <div className={cn("relative inline-flex rounded-[12px] p-1", dark ? "bg-hero-foreground/8" : "bg-muted")}>
      {(["vi", "en"] as const).map((l) => {
        const active = settings.lang === l;
        return (
          <button
            key={l}
            onClick={() => updateSettings({ lang: l })}
            className={cn(
              "relative rounded-[9px] px-2.5 py-1 text-xs font-extrabold transition-colors",
              active ? (dark ? "text-signature-foreground" : "text-hero-foreground") : dark ? "text-sidebar-foreground/60 hover:text-hero-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId={id}
                className={cn("absolute inset-0 rounded-[9px]", dark ? "bg-signature" : "bg-vioi shadow-soft")}
                transition={{ type: "spring", stiffness: 500, damping: 36 }}
              />
            )}
            <span className="relative">{l.toUpperCase()}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ThemeToggle({ dark: onDark }: { dark?: boolean }) {
  const { settings, updateSettings, t } = useApp();
  const dark = settings.theme === "dark";
  return (
    <button
      onClick={() => updateSettings({ theme: dark ? "light" : "dark" })}
      aria-label={t.theme}
      className={cn(
        "grid size-10 place-items-center overflow-hidden rounded-[12px] transition active:scale-95",
        onDark ? "bg-hero-foreground/8 text-sidebar-foreground hover:text-signature" : "border bg-card text-foreground hover:-translate-y-0.5 hover:shadow-soft",
      )}
    >
      <motion.span key={settings.theme} initial={{ rotate: -90, opacity: 0, scale: 0.6 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
        {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
      </motion.span>
    </button>
  );
}

function useActive() {
  return useRouterState({ select: (s) => s.location.pathname });
}

export function Sidebar() {
  const { t, profile } = useApp();
  const path = useActive();
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-hidden bg-sidebar p-5 text-sidebar-foreground lg:flex">
      <div className="bg-indigo pointer-events-none absolute -left-20 -top-20 size-56 rounded-full opacity-25 blur-3xl" />
      <div className="relative">
        <Logo light />
        <p className="mt-2 text-xs text-sidebar-foreground/55">{t.tagline}</p>
      </div>
      <nav className="relative mt-8 flex flex-col gap-1">
        {NAV.map(({ to, key, icon: Icon }) => {
          const active = path === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "relative flex items-center gap-3 rounded-[13px] px-3 py-2.5 text-sm font-semibold transition-colors",
                active ? "text-hero-foreground" : "text-[#94a3b8] hover:bg-sidebar-accent hover:text-hero-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-[13px] border border-hero-foreground/10"
                  style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.55), rgba(59,130,246,0.3))" }}
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                />
              )}
              <Icon className={cn("relative size-[18px]", active && (key === "ai" ? "text-pink" : "text-signature"))} />
              <span className="relative">{t.nav[key]}</span>
              {key === "ai" && <span className="bg-ai relative ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-extrabold">AI</span>}
            </Link>
          );
        })}
      </nav>
      <div className="relative mt-auto space-y-3">
        <div className="flex items-center justify-between rounded-2xl bg-hero-foreground/5 p-2.5 pl-3">
          <span className="text-xs text-sidebar-foreground/60">{t.language}</span>
          <LanguageSwitcher dark />
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-hero-foreground/5 p-2">
          <span className="bg-warm grid size-10 shrink-0 place-items-center rounded-full text-xl">{profile.avatar}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-hero-foreground">{profile.name}</p>
            <p className="truncate text-[11px] text-sidebar-foreground/55">{profile.goal}</p>
          </div>
          <Link to="/profile" aria-label={t.settings} className="grid size-8 shrink-0 place-items-center rounded-lg text-sidebar-foreground/70 transition hover:rotate-45 hover:text-signature">
            <Settings className="size-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const { t } = useApp();
  const path = useActive();
  const items = NAV.filter((n) => n.key !== "analytics");
  return (
    <nav className="glass fixed inset-x-3 bottom-3 z-40 flex items-end justify-between rounded-[26px] border p-1.5 shadow-lift lg:hidden">
      {items.map(({ to, key, icon: Icon }) => {
        const active = path === to;
        if (key === "purchase")
          return (
            <Link key={to} to={to} className="flex flex-1 flex-col items-center gap-0.5 text-[10px] font-bold">
              <span className={cn("btn-warm -mt-6 grid size-14 place-items-center rounded-2xl border-4 border-background transition active:scale-95", active && "ring-2 ring-orange")}>
                <Icon className="size-6" />
              </span>
              <span className={cn("max-w-full truncate px-1", active ? "text-foreground" : "text-muted-foreground")}>{t.nav[key]}</span>
            </Link>
          );
        return (
          <Link key={to} to={to} className={cn("relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 text-[10px] font-bold transition-colors", active ? "text-hero-foreground" : "text-muted-foreground")}>
            {active && <motion.span layoutId="dock-active" className={cn("absolute inset-0 rounded-2xl", key === "ai" ? "bg-ai" : "bg-vioi")} transition={{ type: "spring", stiffness: 450, damping: 36 }} />}
            <Icon className="relative size-5" />
            <span className="relative max-w-full truncate px-1">{t.nav[key]}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function NotificationCenter() {
  const { t, settings, bills, transactions, budgets, summary, today } = useApp();
  const alerts = buildAlerts(settings.lang, t, bills, categoryStats(transactions, budgets, today), summary, today);
  const count = alerts.filter((a) => a.tone !== "success").length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button aria-label={t.notifications} className="group relative grid size-10 place-items-center rounded-[12px] border bg-card transition hover:-translate-y-0.5 hover:shadow-soft active:scale-95">
          <Bell className="size-[18px] transition group-hover:rotate-12" />
          {count > 0 && <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-warning text-[10px] font-bold text-hero-foreground ring-2 ring-background">{count}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-[20px] p-3 shadow-lift">
        <p className="mb-2 px-1 text-sm font-bold">{t.notifications}</p>
        <div className="space-y-2">
          {alerts.map((a) => (
            <AlertCard key={a.id} tone={a.tone} text={a.text} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const TONE_COLOR = { danger: "var(--warning)", warning: "var(--orange)", success: "var(--success)", info: "var(--blue)" };

export function AlertCard({ tone, text }: { tone: "info" | "warning" | "danger" | "success"; text: string }) {
  const c = TONE_COLOR[tone];
  return (
    <div className="flex gap-3 rounded-[14px] border p-3 text-sm" style={{ background: `color-mix(in oklab, ${c} 7%, var(--card))`, borderColor: `color-mix(in oklab, ${c} 18%, transparent)` }}>
      <span className="relative mt-1.5 flex size-2 shrink-0">
        <span className="absolute inset-0 animate-ping rounded-full opacity-50" style={{ background: c }} />
        <span className="relative size-2 rounded-full" style={{ background: c }} />
      </span>
      <p className="leading-snug">{text}</p>
    </div>
  );
}

export function TopHeader() {
  const { t, profile } = useApp();
  const path = useActive();
  const current = NAV.find((n) => n.to === path);
  return (
    <header className="sticky top-0 z-30 px-3 pt-3 sm:px-6 lg:px-8">
      <div className="glass mx-auto flex max-w-[1440px] items-center justify-between gap-3 rounded-[20px] border px-3 py-2 shadow-soft sm:px-4">
        <div className="min-w-0">
          <div className="lg:hidden"><Logo /></div>
          <p className="hidden truncate text-sm font-bold text-muted-foreground lg:block">
            VÍOI <span className="mx-1.5 opacity-40">/</span>
            <span className="text-foreground">{current ? t.nav[current.key] : ""}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden sm:block"><LanguageSwitcher /></div>
          <ThemeToggle />
          <NotificationCenter />
          <Link to="/profile" aria-label={t.nav.profile} className="bg-warm grid size-10 place-items-center rounded-[12px] text-lg transition hover:-translate-y-0.5 hover:shadow-soft">
            {profile.avatar}
          </Link>
        </div>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = useActive();
  const { settings } = useApp();
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <TopHeader />
        <motion.main
          key={path + settings.lang}
          variants={pageVariants}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-[1440px] px-4 pb-32 pt-6 sm:px-6 lg:px-8 lg:pb-12"
        >
          {children}
        </motion.main>
      </div>
      <MobileNav />
    </div>
  );
}
