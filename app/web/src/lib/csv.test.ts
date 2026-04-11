import { describe, expect, it } from 'vitest';
import { buildCsvContent } from './csv';
import type { Item, Person } from './types';

const people: Person[] = [
  { id: 'a', name: 'A"lice' },
  { id: 'b', name: 'Bob' },
];

describe('buildCsvContent', () => {
  it('escapes quotes in cells', () => {
    const items: Item[] = [
      {
        id: '1',
        name: 'Item "quoted"',
        cost: 1.5,
        payer: 'a',
        custom: { type: 'percent', values: {} },
      },
    ];
    const csv = buildCsvContent(people, items, 0, 0);
    expect(csv).toContain('""');
    expect(csv.split('\n').length).toBeGreaterThan(3);
  });
});
