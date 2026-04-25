import { describe, expect, it } from 'vitest';
import {
  allocateTaxTip,
  computeSharesForItem,
  computeSubtotals,
  computeSummary,
  countInvalidCustomItems,
  evenSplitShares,
  getCustomSplitProgress,
  isCustomSplitValid,
} from './splits';
import type { Item, Person } from './types';

const alice: Person = { id: 'a', name: 'Alice' };
const bob: Person = { id: 'b', name: 'Bob' };
const twoPeople = [alice, bob];

describe('evenSplitShares', () => {
  it('splits evenly with remainder on last person', () => {
    const s = evenSplitShares(10.01, 2);
    expect(s[0] + s[1]).toBeCloseTo(10.01, 5);
    expect(s[0]).toBe(5);
    expect(s[1]).toBeCloseTo(5.01, 5);
  });

  it('handles three-way split', () => {
    const s = evenSplitShares(10.0, 3);
    const sum = s.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(10, 5);
  });
});

describe('computeSubtotals', () => {
  it('assigns full cost to one payer', () => {
    const items: Item[] = [
      {
        id: '1',
        name: 'x',
        cost: 20,
        payer: 'a',
        custom: { type: 'percent', values: {} },
      },
    ];
    expect(computeSubtotals(twoPeople, items)).toEqual([20, 0]);
  });

  it('splits evenly', () => {
    const items: Item[] = [
      {
        id: '1',
        name: 'x',
        cost: 10,
        payer: 'Split',
        custom: { type: 'percent', values: {} },
      },
    ];
    const st = computeSubtotals(twoPeople, items);
    expect(st[0] + st[1]).toBeCloseTo(10, 5);
  });

  it('applies custom percent when valid', () => {
    const items: Item[] = [
      {
        id: '1',
        name: 'x',
        cost: 100,
        payer: 'Custom',
        custom: {
          type: 'percent',
          values: { a: '60', b: '40' },
        },
      },
    ];
    expect(computeSubtotals(twoPeople, items)).toEqual([60, 40]);
  });

  it('omits invalid custom split from subtotals', () => {
    const items: Item[] = [
      {
        id: '1',
        name: 'x',
        cost: 100,
        payer: 'Custom',
        custom: {
          type: 'percent',
          values: { a: '50', b: '40' },
        },
      },
    ];
    expect(computeSubtotals(twoPeople, items)).toEqual([0, 0]);
  });
});

describe('allocateTaxTip', () => {
  it('allocates tax and tip by subtotal ratio; last gets remainder', () => {
    const subtotals = [30, 70];
    const { taxShares, tipShares } = allocateTaxTip(subtotals, 10, 5);
    expect(taxShares.reduce((a, b) => a + b, 0)).toBeCloseTo(10, 5);
    expect(tipShares.reduce((a, b) => a + b, 0)).toBeCloseTo(5, 5);
  });
});

describe('computeSummary', () => {
  it('matches displayed totals within one cent', () => {
    const items: Item[] = [
      {
        id: '1',
        name: 'Food',
        cost: 50,
        payer: 'Split',
        custom: { type: 'percent', values: {} },
      },
    ];
    const s = computeSummary(twoPeople, items, 5, 3);
    expect(s.totals[0] + s.totals[1]).toBeCloseTo(50 + 5 + 3, 5);
  });
});

describe('isCustomSplitValid', () => {
  it('accepts percent totaling 100', () => {
    const item: Item = {
      id: '1',
      name: 'x',
      cost: 50,
      payer: 'Custom',
      custom: { type: 'percent', values: { a: '50', b: '50' } },
    };
    expect(isCustomSplitValid(item, twoPeople, 50)).toBe(true);
  });

  it('accepts dollar totaling cost', () => {
    const item: Item = {
      id: '1',
      name: 'x',
      cost: 50,
      payer: 'Custom',
      custom: {
        type: 'dollar',
        values: { a: '30', b: '20' },
      },
    };
    expect(isCustomSplitValid(item, twoPeople, 50)).toBe(true);
  });

  it('rejects dollar custom split when off by one cent from line cost', () => {
    const item: Item = {
      id: '1',
      name: 'x',
      cost: 10,
      payer: 'Custom',
      custom: {
        type: 'dollar',
        values: { a: '5.00', b: '4.99' },
      },
    };
    expect(isCustomSplitValid(item, twoPeople, 10)).toBe(false);
  });

  it('accepts dollar custom split when cent sums match line cost (multi-person)', () => {
    const three: Person[] = [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
      { id: 'c', name: 'C' },
    ];
    const item: Item = {
      id: '1',
      name: 'x',
      cost: 100,
      payer: 'Custom',
      custom: {
        type: 'dollar',
        values: { a: '33.33', b: '33.33', c: '33.34' },
      },
    };
    expect(isCustomSplitValid(item, three, 100)).toBe(true);
  });
});

describe('countInvalidCustomItems', () => {
  it('counts lines with invalid custom split', () => {
    const items: Item[] = [
      {
        id: '1',
        name: 'bad',
        cost: 10,
        payer: 'Custom',
        custom: { type: 'percent', values: { a: '50', b: '40' } },
      },
      {
        id: '2',
        name: 'ok',
        cost: 10,
        payer: 'Custom',
        custom: { type: 'percent', values: { a: '50', b: '50' } },
      },
    ];
    expect(countInvalidCustomItems(items, twoPeople)).toBe(1);
  });
});

describe('computeSharesForItem', () => {
  it('returns zero shares when custom invalid', () => {
    const item: Item = {
      id: '1',
      name: 'x',
      cost: 10,
      payer: 'Custom',
      custom: { type: 'percent', values: { a: '10', b: '10' } },
    };
    const { shares } = computeSharesForItem(item, twoPeople);
    expect(shares.every((s) => s === 0)).toBe(true);
  });
});

describe('getCustomSplitProgress', () => {
  it('tracks percent toward 100', () => {
    const item: Item = {
      id: '1',
      name: 'x',
      cost: 50,
      payer: 'Custom',
      custom: { type: 'percent', values: { a: '50', b: '25' } },
    };
    const p = getCustomSplitProgress(item, twoPeople, 50);
    expect(p?.mode).toBe('percent');
    expect(p?.current).toBe(75);
    expect(p?.target).toBe(100);
    expect(p?.ratio).toBe(0.75);
  });

  it('tracks dollars toward line cost', () => {
    const item: Item = {
      id: '1',
      name: 'x',
      cost: 40,
      payer: 'Custom',
      custom: { type: 'dollar', values: { a: '10', b: '10' } },
    };
    const p = getCustomSplitProgress(item, twoPeople, 40);
    expect(p?.mode).toBe('dollar');
    expect(p?.current).toBe(20);
    expect(p?.target).toBe(40);
    expect(p?.ratio).toBe(0.5);
  });

  it('returns null when payer is not Custom', () => {
    const item: Item = {
      id: '1',
      name: 'x',
      cost: 10,
      payer: 'Split',
      custom: { type: 'percent', values: {} },
    };
    expect(getCustomSplitProgress(item, twoPeople, 10)).toBeNull();
  });
});
