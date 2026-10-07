import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { motion, type MotionStyle, type Variants } from "framer-motion";
import {
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Clapperboard,
  GraduationCap,
  Home,
  HeartPulse,
  Shapes,
  type LucideIcon,
} from "lucide-react";
import type { CategoryId, Currency } from "@/lib/types";
import { fromDisplay, toDisplay } from "@/lib/currencyFormatter";
import { cn } from "@/lib/utils";

export const CATEGORY_ICON: Record<CategoryId, LucideIcon> = {
  food: UtensilsCrossed,
  transport: Car,
  shopping: ShoppingBag,
  entertainment: Clapperboard,
  education: GraduationCap,
  housing: Home,
  health: HeartPulse,
  other: Shapes,
};

export const CATEGORY_COLOR: Record<CategoryId, string> = {
  food: "var(--orange)",
  transport: "var(--blue)",
  shopping: "var(--pink)",
  entertainment: "var(--purple)",
  education: "var(--cyan)",
  housing: "var(--indigo)",
  health: "var(--success)",
  other: "#94a3b8",
};

/* ---------- motion presets ---------- */
export const EASE = [0.2, 0.8, 0.2, 1] as const;
export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
};
export const rise: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: EASE } },
};
export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className={className}>
      {children}
    </motion.div>
  );
}
export function Rise({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={rise} className={className}>
      {children}
    </motion.div>
  );
}

export function CategoryIcon({ category, className }: { category: CategoryId; className?: string }) {
  const Icon = CATEGORY_ICON[category];
  const c = CATEGORY_COLOR[category];
  return (
    <span
      className={cn("grid size-10 shrink-0 place-items-center rounded-[14px]", className)}
      style={{ background: `color-mix(in oklab, ${c} 14%, transparent)`, color: c }}
    >
      <Icon className="size-[18px]" />
    </span>
  );
}

/** Tweens to the new value whenever it changes. */
export function AnimatedNumber({ value, format }: { value: number; format: (v: number) => string }) {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / 650, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplay(a + (value - a) * e);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      from.current = value;
    };
  }, [value]);
  return <span className="tabular">{format(display)}</span>;
}

export function ProgressBar({ value, tone = "default", color, className }: { value: number; tone?: "default" | "warning" | "danger"; color?: string; className?: string }) {
  const bg =
    tone === "danger"
      ? "linear-gradient(90deg, var(--orange), var(--warning))"
      : tone === "warning"
        ? "var(--gradient-warm)"
        : color
          ? `linear-gradient(90deg, color-mix(in oklab, ${color} 55%, white), ${color})`
          : "var(--gradient-progress)";
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: bg }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
        transition={{ duration: 0.8, ease: EASE }}
      />
    </div>
  );
}

export function usageTone(pct: number): "default" | "warning" | "danger" {
  return pct >= 100 ? "danger" : pct >= 80 ? "warning" : "default";
}

export function Panel({
  title,
  action,
  children,
  className,
  accent,
  icon,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  accent?: string;
  icon?: ReactNode;
}) {
  return (
    <motion.section
      variants={rise}
      className={cn("surface card-hover p-5 sm:p-6", className)}
      style={accent ? ({ "--card-accent": accent } as MotionStyle) : {}}
    >
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && (
            <h2 className="flex min-w-0 items-center gap-2 truncate text-lg font-bold">
              {icon && (
                <span className="grid size-7 shrink-0 place-items-center rounded-lg" style={{ background: `color-mix(in oklab, ${accent ?? "var(--indigo)"} 14%, transparent)`, color: accent ?? "var(--indigo)" }}>
                  {icon}
                </span>
              )}
              <span className="truncate">{title}</span>
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </motion.section>
  );
}

export function PageHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <motion.div variants={rise} className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[28px] font-extrabold leading-tight sm:text-[32px]">{title}</h1>
        {subtitle && <p className="mt-1 text-[15px] text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </motion.div>
  );
}

export function TextAction({ onClick, children, color = "var(--indigo)" }: { onClick?: () => void; children: ReactNode; color?: string }) {
  return (
    <button
      onClick={onClick}
      className="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition hover:bg-muted active:scale-[0.98]"
      style={{ color }}
    >
      {children}
    </button>
  );
}

export function CurrencyInput({
  value,
  onChange,
  currency,
  id,
  placeholder,
  className,
  large,
}: {
  value: number;
  onChange: (vnd: number) => void;
  currency: Currency;
  id?: string;
  placeholder?: string;
  className?: string;
  large?: boolean;
}) {
  const shown = value ? toDisplay(value, currency) : 0;
  const text = shown ? (currency === "VND" ? Math.round(shown).toLocaleString("vi-VN") : String(+shown.toFixed(2))) : "";
  return (
    <div className={cn("relative", className)}>
      <input
        id={id}
        inputMode="decimal"
        placeholder={placeholder ?? "0"}
        value={text}
        onChange={(e) => {
          const raw = currency === "VND" ? e.target.value.replace(/\D/g, "") : e.target.value.replace(/[^\d.]/g, "");
          onChange(fromDisplay(Number(raw) || 0, currency));
        }}
        className={cn(fieldClass, "tabular pr-10 font-bold", large && "h-14 text-xl")}
      />
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
        {currency === "VND" ? "₫" : "$"}
      </span>
    </div>
  );
}

export const fieldClass =
  "h-12 w-full rounded-[14px] border border-input bg-card px-4 text-[15px] outline-none transition duration-300 hover:border-indigo/40 focus:border-indigo focus:ring-4 focus:ring-indigo/15";

export function Segmented<T extends string>({ value, options, onChange, id }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; id: string }) {
  return (
    <div className="inline-flex rounded-[13px] bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn("relative rounded-[10px] px-3 py-1.5 text-xs font-bold transition-colors", value === o.value ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
        >
          {value === o.value && (
            <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-[10px] bg-card shadow-soft" transition={{ type: "spring", stiffness: 500, damping: 38 }} />
          )}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function Ring({ value, size = 160, stroke = 14, color = "var(--cyan)", gradientId, children }: { value: number; size?: number; stroke?: number; color?: string; gradientId?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.min(Math.max(value, 0), 100);
  const gid = gradientId ?? "ring-grad";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.55} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - v / 100) }}
          transition={{ duration: 1, ease: EASE }}
          style={{ filter: `drop-shadow(0 4px 10px color-mix(in oklab, ${color} 40%, transparent))` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-2xl", className)} />;
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-full items-end gap-2 px-2 pb-6", className)}>
      {[40, 65, 50, 80, 55, 70, 90, 60].map((h, i) => (
        <div key={i} className="shimmer flex-1 rounded-t-lg" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}
