import type { Item, Person } from '../lib/types';
import { syncCustomValuesWithPeople } from '../lib/itemHelpers';
import { isCustomSplitValid, isPayerValid } from '../lib/splits';

type Props = {
  items: Item[];
  people: Person[];
  onUpdateItem: (id: string, patch: Partial<Item> | ((prev: Item) => Item)) => void;
  onRemoveItem: (id: string) => void;
  onAddItem: () => void;
  onNameEnter: () => void;
};

function customInputWidthPct(nPeople: number): number {
  return Math.max(100 / nPeople - 2, 20);
}

export function ItemsTable({
  items,
  people,
  onUpdateItem,
  onRemoveItem,
  onAddItem,
  onNameEnter,
}: Props) {
  return (
    <div className="input-section">
      <h3>Add Items</h3>
      <table className="input-table">
        <thead>
          <tr>
            <th>Item Description</th>
            <th>Cost ($)</th>
            <th>Expense To</th>
            <th>Custom Split</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const cost = item.cost ?? 0;
            const payerInvalid = Boolean(item.payer) && !isPayerValid(item, people);
            const customInvalid =
              item.payer === 'Custom' && cost > 0 && !isCustomSplitValid(item, people, cost);

            return (
              <tr key={item.id} className="input-row">
                <td>
                  <input
                    type="text"
                    placeholder="Enter item name"
                    className="item-name item-description-input"
                    value={item.name}
                    onChange={(e) => onUpdateItem(item.id, { name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        onNameEnter();
                      }
                    }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="item-cost"
                    value={item.cost === null || item.cost === undefined ? '' : item.cost}
                    onChange={(e) => {
                      const v = e.target.value;
                      onUpdateItem(item.id, {
                        cost: v === '' ? null : parseFloat(v),
                      });
                    }}
                    min={0}
                  />
                </td>
                <td>
                  <select
                    className={`item-payer${payerInvalid ? ' input-invalid' : ''}`}
                    value={item.payer}
                    onChange={(e) => {
                      const v = e.target.value;
                      onUpdateItem(item.id, (prev) => {
                        if (v === 'Custom') {
                          return syncCustomValuesWithPeople({ ...prev, payer: v }, people);
                        }
                        return {
                          ...prev,
                          payer: v,
                          custom: { type: 'percent' as const, values: {} },
                        };
                      });
                    }}
                  >
                    <option value="">Select...</option>
                    {people.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                    <option value="Split">Split Evenly</option>
                    <option value="Custom">Custom Split</option>
                  </select>
                  {payerInvalid && (
                    <div className="validation-message">Select a valid person or split option.</div>
                  )}
                </td>
                <td className="custom-split-cell">
                  {item.payer === 'Custom' && (
                    <div>
                      {people.map((person) => (
                        <input
                          key={person.id}
                          type="number"
                          className={`custom-split-person${customInvalid ? ' input-invalid' : ''}`}
                          style={{
                            width: `${customInputWidthPct(people.length)}%`,
                            display: 'inline-block',
                            marginRight: '2px',
                          }}
                          placeholder={`${person.name} % or $`}
                          min={0}
                          value={item.custom.values[person.id] ?? ''}
                          onChange={(e) =>
                            onUpdateItem(item.id, (prev) => ({
                              ...prev,
                              custom: {
                                ...prev.custom,
                                values: {
                                  ...prev.custom.values,
                                  [person.id]: e.target.value,
                                },
                              },
                            }))
                          }
                        />
                      ))}
                      <select
                        className="custom-split-type"
                        style={{ width: '100%', marginTop: 2 }}
                        value={item.custom.type}
                        onChange={(e) =>
                          onUpdateItem(item.id, (prev) => ({
                            ...prev,
                            custom: {
                              ...prev.custom,
                              type: e.target.value as 'percent' | 'dollar',
                            },
                          }))
                        }
                      >
                        <option value="percent">%</option>
                        <option value="dollar">$</option>
                      </select>
                      {customInvalid && (
                        <div className="validation-message">
                          Custom split must total 100% or match item cost.
                        </div>
                      )}
                    </div>
                  )}
                </td>
                <td>
                  <button type="button" onClick={() => onRemoveItem(item.id)}>
                    Remove
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button type="button" className="add-button" onClick={onAddItem}>
        + Add Another Item
      </button>
    </div>
  );
}
