export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Whole cents; use for comparing money amounts without float drift. */
export function dollarsToCents(d: number): number {
  return Math.round(d * 100);
}
