import type { Item, Person } from './types';
import { generateItemId } from './ids';

export function createEmptyItem(): Item {
  return {
    id: generateItemId(),
    name: '',
    cost: null,
    payer: '',
    custom: { type: 'percent', values: {} },
  };
}

/** Ensure each person id has a slot in custom.values (for Custom split rows). */
export function syncCustomValuesWithPeople(item: Item, people: Person[]): Item {
  const values: Record<string, string> = {};
  for (const p of people) {
    values[p.id] = item.custom.values[p.id] ?? '';
  }
  return {
    ...item,
    custom: { ...item.custom, values },
  };
}

export function syncAllItemsPeople(items: Item[], people: Person[]): Item[] {
  return items.map((item) => syncCustomValuesWithPeople(item, people));
}
