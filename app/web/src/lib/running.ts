import type { Item, Person, RunningRow } from './types';
import { computeSharesForItem } from './splits';
import { round2 } from './math';

export function buildRunningRows(
  people: Person[],
  items: Item[],
  summary: {
    subtotals: number[];
    taxShares: number[];
    tipShares: number[];
    totals: number[];
  },
  taxAmount: number,
  tipAmount: number,
): RunningRow[] {
  const rows: RunningRow[] = [];

  for (const item of items) {
    const cost = item.cost ?? 0;
    if (cost <= 0) continue;
    const { shares, payerDisplay } = computeSharesForItem(item, people);
    rows.push({
      name: item.name.trim() || 'Unnamed Item',
      cost,
      payer: payerDisplay,
      shares: people.map((p, idx) => ({ name: p.name, amount: shares[idx] })),
    });
  }

  if (taxAmount > 0) {
    rows.push({
      name: 'Tax',
      cost: taxAmount,
      payer: 'Split by ratio',
      shares: people.map((p, idx) => ({
        name: p.name,
        amount: summary.taxShares[idx],
      })),
    });
  }

  if (tipAmount > 0) {
    rows.push({
      name: 'Tip',
      cost: tipAmount,
      payer: 'Split by ratio',
      shares: people.map((p, idx) => ({
        name: p.name,
        amount: summary.tipShares[idx],
      })),
    });
  }

  const grandTotal = round2(summary.totals.reduce((a, b) => a + b, 0));
  rows.push({
    name: 'TOTAL',
    cost: grandTotal,
    payer: '',
    shares: people.map((p, idx) => ({
      name: p.name,
      amount: summary.totals[idx],
    })),
    isTotal: true,
  });

  return rows;
}
