import type { Currency } from "./types";

/** All amounts are stored in VND; USD is a display conversion. */
export const USD_RATE = 25000;

export function toDisplay(vnd: number, currency: Currency) {
  return currency === "USD" ? vnd / USD_RATE : vnd;
}
export function fromDisplay(value: number, currency: Currency) {
  return currency === "USD" ? Math.round(value * USD_RATE) : Math.round(value);
}

export function formatCurrency(vnd: number, currency: Currency, opts?: { compact?: boolean | undefined }) {
  const v = toDisplay(vnd, currency);
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: opts?.compact ? "compact" : "standard",
      maximumFractionDigits: 2,
      minimumFractionDigits: opts?.compact ? 0 : 2,
    }).format(v);
  }
  if (opts?.compact) {
    if (Math.abs(v) >= 1e6) return `${(v / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}tr`;
    if (Math.abs(v) >= 1e3) return `${Math.round(v / 1e3)}k`;
  }
  return `${Math.round(v).toLocaleString("vi-VN")} ₫`;
}
