const DAY = 86400000;

export function todayISO() {
  const d = new Date();
  return toISO(d);
}
export function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export function parseISO(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y ?? 1970, (m || 1) - 1, d || 1);
}
export function daysBetween(fromISO: string, toISODate: string) {
  return Math.round((parseISO(toISODate).getTime() - parseISO(fromISO).getTime()) / DAY);
}
export function addDays(iso: string, n: number) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}
export function formatShortDate(iso: string) {
  const d = parseISO(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}
export function formatDate(iso: string) {
  return `${formatShortDate(iso)}/${parseISO(iso).getFullYear()}`;
}
export function sameMonth(a: string, b: string) {
  return a.slice(0, 7) === b.slice(0, 7);
}
export function prevMonthKey(iso: string) {
  const d = parseISO(iso);
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return toISO(d).slice(0, 7);
}
