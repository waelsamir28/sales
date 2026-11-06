export function n(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function money(value: unknown): string {
  return n(value).toFixed(2);
}

export function round2(value: unknown): number {
  return Math.round(n(value) * 100) / 100;
}
