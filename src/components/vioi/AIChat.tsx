import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SendHorizonal, PieChart, Headphones, PiggyBank, CalendarDays } from "lucide-react";
import { useApp } from "@/store/AppStore";
import { aiRespond } from "@/lib/insights";
import { categoryStats } from "@/lib/financialCalculations";
import { EASE } from "./primitives";
import { cn } from "@/lib/utils";

interface Msg {
  id: number;
  role: "ai" | "user";
  text: string;
}

const PROMPT_STYLE = [
  { icon: PieChart, color: "var(--blue)" },
  { icon: Headphones, color: "var(--pink)" },
  { icon: PiggyBank, color: "var(--success)" },
  { icon: CalendarDays, color: "var(--orange)" },
];

export function AIOrb({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <span className={cn("relative block shrink-0", size === "sm" && "size-8", size === "md" && "size-10", size === "lg" && "size-14")}>
      <span className="bg-orb absolute inset-0 rounded-full opacity-60 blur-md" />
      <span className="bg-orb animate-orb relative block size-full rounded-full ring-2 ring-hero-foreground/30" />
    </span>
  );
}

export function AIChat() {
  const app = useApp();
  const { t, profile, settings } = app;
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMsgs([{ id: 0, role: "ai", text: t.ai.hello(profile.name.split(" ").pop() ?? profile.name) }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.lang]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, thinking]);

  const ask = (q: string) => {
    if (!q.trim() || thinking) return;
    setMsgs((m) => [...m, { id: Date.now(), role: "user", text: q }]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      const answer = aiRespond(q, {
        lang: settings.lang,
        t,
        stats: categoryStats(app.transactions, app.budgets, app.today),
        summary: app.summary,
        txs: app.transactions,
        today: app.today,
        nextIncome: profile.nextIncomeDate,
        fmt: (v) => app.fmt(v),
      });
      setMsgs((m) => [...m, { id: Date.now() + 1, role: "ai", text: answer }]);
      setThinking(false);
    }, 900);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="surface bg-chat relative flex h-[calc(100dvh-17rem)] min-h-[460px] flex-col overflow-hidden lg:h-[calc(100vh-13rem)]"
    >
      <div className="pointer-events-none absolute -right-20 -top-20 size-60 rounded-full bg-purple opacity-15 blur-3xl" />
      <div className="relative flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        <AnimatePresence initial={false}>
          {msgs.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.28, ease: EASE }}
              className={cn("flex items-end gap-2.5", m.role === "user" && "flex-row-reverse")}
            >
              {m.role === "ai" && <AIOrb size="sm" />}
              <div
                className={cn(
                  "max-w-[82%] whitespace-pre-line px-4 py-3 text-[15px] leading-relaxed",
                  m.role === "ai"
                    ? "rounded-[22px] rounded-bl-md border border-purple/15 bg-tint-purple"
                    : "rounded-[22px] rounded-br-md bg-navy text-hero-foreground shadow-soft dark:bg-indigo",
                )}
              >
                {m.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {thinking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-2.5">
            <AIOrb size="sm" />
            <div className="flex items-center gap-2 rounded-[22px] rounded-bl-md border border-purple/15 bg-tint-purple px-4 py-3">
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="size-1.5 animate-bounce rounded-full bg-purple" style={{ animationDelay: `${i * 140}ms` }} />
                ))}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">{t.ai.thinking}</span>
            </div>
          </motion.div>
        )}
        <div ref={endRef} />
      </div>
      <div className="glass relative border-t p-3 sm:p-4">
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {t.ai.prompts.map((p, i) => {
            const { icon: Icon, color } = PROMPT_STYLE[i % PROMPT_STYLE.length]!;
            return (
              <motion.button
                key={p}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => ask(p)}
                className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{ background: `color-mix(in oklab, ${color} 8%, var(--card))`, borderColor: `color-mix(in oklab, ${color} 25%, transparent)` }}
              >
                <Icon className="size-3.5" style={{ color }} />
                {p}
              </motion.button>
            );
          })}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.ai.placeholder}
            className="h-12 min-w-0 flex-1 rounded-[16px] border border-input bg-card px-4 text-[15px] outline-none transition focus:border-purple focus:ring-4 focus:ring-purple/15"
          />
          <motion.button whileTap={{ scale: 0.94 }} type="submit" aria-label="Send" className="btn-ai grid size-12 shrink-0 place-items-center rounded-[16px]">
            <SendHorizonal className="size-5" />
          </motion.button>
        </form>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">{t.ai.demo}</p>
      </div>
    </motion.div>
  );
}
