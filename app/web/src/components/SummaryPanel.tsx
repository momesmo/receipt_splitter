import type { Person } from '../lib/types';
import { formatCurrency } from '../format';

type Props = {
  people: Person[];
  subtotals: number[];
  taxShares: number[];
  tipShares: number[];
  totals: number[];
};

export function SummaryPanel({ people, subtotals, taxShares, tipShares, totals }: Props) {
  return (
    <div className="summary">
      {people.map((person, idx) => (
        <div key={person.id} className="person-summary">
          <h3>{person.name}</h3>
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>{formatCurrency(subtotals[idx] ?? 0)}</span>
          </div>
          <div className="summary-row">
            <span>Tax Share:</span>
            <span>{formatCurrency(taxShares[idx] ?? 0)}</span>
          </div>
          <div className="summary-row">
            <span>Tip Share:</span>
            <span>{formatCurrency(tipShares[idx] ?? 0)}</span>
          </div>
          <div className="summary-row total">
            <span>Total:</span>
            <span>{formatCurrency(totals[idx] ?? 0)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
