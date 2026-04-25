import { describe, expect, it } from 'vitest';
import { dollarsToCents } from './math';

describe('dollarsToCents', () => {
  it('matches integer-cent equality used for custom dollar validation', () => {
    expect(dollarsToCents(5.0) + dollarsToCents(4.99)).toBe(999);
    expect(dollarsToCents(10.0)).toBe(1000);
    expect(dollarsToCents(5.0) + dollarsToCents(4.99)).not.toBe(dollarsToCents(10.0));
  });
});
