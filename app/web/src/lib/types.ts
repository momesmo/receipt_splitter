export type Person = {
  id: string;
  name: string;
};

export type CustomSplitType = 'percent' | 'dollar';

/** payer: person id, 'Split', 'Custom', or '' */
export type Item = {
  id: string;
  name: string;
  cost: number | null;
  payer: string;
  custom: {
    type: CustomSplitType;
    values: Record<string, string>;
  };
};

export type SummaryResult = {
  subtotals: number[];
  taxShares: number[];
  tipShares: number[];
  totals: number[];
};

export type RunningRowShare = { name: string; amount: number };

export type RunningRow = {
  name: string;
  cost: number;
  payer: string;
  shares: RunningRowShare[];
  isTotal?: boolean;
};
