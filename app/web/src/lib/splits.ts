import type { Item, Person, SummaryResult } from './types';
import { round2 } from './math';

const TOL = 0.01;

export function evenSplitShares(cost: number, nPeople: number): number[] {
  if (nPeople <= 0) return [];
  const evenShare = Math.floor((cost / nPeople) * 100) / 100;
  const distributed = evenShare * nPeople;
  const remainder = round2(cost - distributed);
  const shares = Array.from({ length: nPeople }, () => evenShare);
  if (remainder !== 0) {
    shares[nPeople - 1] = round2(shares[nPeople - 1] + remainder);
  }
  return shares;
}

function parseCustomValues(item: Item, people: Person[]): number[] {
  return people.map((p) => parseFloat(item.custom.values[p.id] ?? '') || 0);
}

export function isCustomSplitValid(item: Item, people: Person[], cost: number): boolean {
  if (item.payer !== 'Custom') return true;
  if (cost <= 0) return true;
  const values = parseCustomValues(item, people);
  if (item.custom.type === 'percent') {
    return Math.abs(values.reduce((a, b) => a + b, 0) - 100) < TOL;
  }
  if (item.custom.type === 'dollar') {
    return Math.abs(values.reduce((a, b) => a + b, 0) - cost) < TOL;
  }
  return true;
}

export function isPayerValid(item: Item, people: Person[]): boolean {
  if (!item.payer) return false;
  const ids = people.map((p) => p.id);
  return (
    ids.includes(item.payer) ||
    item.payer === 'Split' ||
    item.payer === 'Custom'
  );
}

export function computeSubtotals(people: Person[], items: Item[]): number[] {
  const subtotals = people.map(() => 0);

  for (const item of items) {
    const cost = item.cost ?? 0;
    if (!item.payer) continue;

    const payerIdx = people.findIndex((p) => p.id === item.payer);
    if (payerIdx >= 0) {
      subtotals[payerIdx] += cost;
    } else if (item.payer === 'Split') {
      const shares = evenSplitShares(cost, people.length);
      for (let i = 0; i < people.length; i++) {
        subtotals[i] += shares[i];
      }
    } else if (item.payer === 'Custom') {
      if (isCustomSplitValid(item, people, cost)) {
        const values = parseCustomValues(item, people);
        if (item.custom.type === 'percent') {
          for (let i = 0; i < people.length; i++) {
            subtotals[i] += cost * (values[i] / 100);
          }
        } else if (item.custom.type === 'dollar') {
          for (let i = 0; i < people.length; i++) {
            subtotals[i] += values[i];
          }
        }
      }
    }
  }

  return subtotals.map(round2);
}

export function allocateTaxTip(
  roundedSubtotals: number[],
  taxAmount: number,
  tipAmount: number,
): { taxShares: number[]; tipShares: number[] } {
  const n = roundedSubtotals.length;
  const taxShares = Array.from({ length: n }, () => 0);
  const tipShares = Array.from({ length: n }, () => 0);
  const totalSubtotal = roundedSubtotals.reduce((a, b) => a + b, 0);

  if (totalSubtotal > 0) {
    let distributed = 0;
    for (let i = 0; i < n - 1; i++) {
      taxShares[i] = round2((roundedSubtotals[i] / totalSubtotal) * taxAmount);
      distributed += taxShares[i];
    }
    taxShares[n - 1] = round2(taxAmount - distributed);

    distributed = 0;
    for (let i = 0; i < n - 1; i++) {
      tipShares[i] = round2((roundedSubtotals[i] / totalSubtotal) * tipAmount);
      distributed += tipShares[i];
    }
    tipShares[n - 1] = round2(tipAmount - distributed);
  }

  return { taxShares, tipShares };
}

export function computeSummary(
  people: Person[],
  items: Item[],
  taxAmountRaw: number,
  tipAmountRaw: number,
): SummaryResult {
  const roundedSubtotals = computeSubtotals(people, items);
  const taxAmount = taxAmountRaw || 0;
  const tipAmount = tipAmountRaw || 0;
  const { taxShares, tipShares } = allocateTaxTip(roundedSubtotals, taxAmount, tipAmount);
  const totals = roundedSubtotals.map((s, i) => round2(s + taxShares[i] + tipShares[i]));

  return {
    subtotals: roundedSubtotals,
    taxShares,
    tipShares,
    totals,
  };
}

export type ShareBreakdown = {
  shares: number[];
  payerDisplay: string;
};

export function computeSharesForItem(item: Item, people: Person[]): ShareBreakdown {
  const cost = item.cost ?? 0;
  const shares = people.map(() => 0);
  let payerDisplay = '';

  const payerIdx = people.findIndex((p) => p.id === item.payer);
  if (payerIdx >= 0) {
    shares[payerIdx] = cost;
    payerDisplay = people[payerIdx].name;
  } else if (item.payer === 'Split') {
    const es = evenSplitShares(cost, people.length);
    for (let i = 0; i < people.length; i++) {
      shares[i] = es[i];
    }
    payerDisplay = 'Split Evenly';
  } else if (item.payer === 'Custom') {
    payerDisplay = 'Custom Split';
    if (isCustomSplitValid(item, people, cost)) {
      const values = parseCustomValues(item, people);
      if (item.custom.type === 'percent') {
        for (let i = 0; i < people.length; i++) {
          shares[i] = cost * (values[i] / 100);
        }
      } else if (item.custom.type === 'dollar') {
        for (let i = 0; i < people.length; i++) {
          shares[i] = values[i];
        }
      }
    }
  } else {
    payerDisplay = item.payer || '';
  }

  return { shares, payerDisplay };
}

export function countInvalidCustomItems(items: Item[], people: Person[]): number {
  let n = 0;
  for (const item of items) {
    if (item.payer !== 'Custom') continue;
    const cost = item.cost ?? 0;
    if (cost <= 0) continue;
    if (!isCustomSplitValid(item, people, cost)) n += 1;
  }
  return n;
}
