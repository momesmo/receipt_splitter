import type { Item, Person } from './types';
import { computeSharesForItem, computeSummary } from './splits';

function escapeCsvCell(value: string | number): string {
  const s = String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

export function buildCsvContent(
  people: Person[],
  items: Item[],
  taxAmount: number,
  tipAmount: number,
): string {
  const summary = computeSummary(people, items, taxAmount, tipAmount);
  const header = ['Item', 'Cost', 'Expense To', ...people.map((p) => `${p.name} Share`)];
  const rows: (string | number)[][] = [header];

  for (const item of items) {
    const cost = item.cost ?? 0;
    const { shares } = computeSharesForItem(item, people);
    const payerIdx = people.findIndex((p) => p.id === item.payer);
    const expenseTo =
      payerIdx >= 0
        ? people[payerIdx].name
        : item.payer === 'Split'
          ? 'Split Evenly'
          : item.payer === 'Custom'
            ? 'Custom Split'
            : item.payer || '';

    rows.push([
      item.name.trim() || 'Unnamed Item',
      cost.toFixed(2),
      expenseTo,
      ...shares.map((s) => s.toFixed(2)),
    ]);
  }

  rows.push(['Tax', taxAmount.toFixed(2), 'Split by ratio', ...summary.taxShares.map((s) => s.toFixed(2))]);
  rows.push(['Tip', tipAmount.toFixed(2), 'Split by ratio', ...summary.tipShares.map((s) => s.toFixed(2))]);
  rows.push([]);
  rows.push(['TOTALS', '', '', ...summary.totals.map((t) => `$${t.toFixed(2)}`)]);

  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n');
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
