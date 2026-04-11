import type { RunningRow } from '../lib/types';
import { formatCurrency } from '../format';

type Props = {
  rows: RunningRow[];
};

export function RunningTotalPanel({ rows }: Props) {
  return (
    <div className="running-total-section">
      <h3>Running Total</h3>
      <table className="running-total-table">
        <thead>
          <tr>
            <th>Item Description</th>
            <th>Cost ($)</th>
            <th>Expense To</th>
            <th>Share</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={row.isTotal ? 'total-row' : undefined}>
              <td className="item-name">{row.name}</td>
              <td className="item-cost">{formatCurrency(row.cost)}</td>
              <td className="item-payer">{row.payer}</td>
              <td className="item-share">
                {row.shares.map((s) => (
                  <div key={s.name}>
                    {s.name}: {formatCurrency(s.amount)}
                  </div>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
