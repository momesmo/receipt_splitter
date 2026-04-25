import type { Item, Person } from '../lib/types';
import { syncCustomValuesWithPeople } from '../lib/itemHelpers';
import { getCustomSplitProgress, isCustomSplitValid, isPayerValid } from '../lib/splits';

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

function CustomSplitProgressBar({
  item,
  people,
  cost,
}: {
  item: Item;
  people: Person[];
  cost: number;
}) {
  const progress = getCustomSplitProgress(item, people, cost);
  if (!progress) return null;

  const { current, target, mode, ratio } = progress;
  const barPct = Math.min(100, ratio * 100);
  const over = ratio > 1;
  const complete =
    cost > 0 &&
    item.payer === 'Custom' &&
    isCustomSplitValid(item, people, cost);

  if (mode === 'dollar' && target <= 0) {
    return (
      <div className="custom-split-progress">
        <div className="custom-split-progress-label muted">Enter line cost to track dollar split</div>
      </div>
    );
  }

  const label =
    mode === 'percent'
      ? `${current.toFixed(1)}% of 100%`
      : `$${current.toFixed(2)} of $${target.toFixed(2)}`;

  const ariaMax = mode === 'percent' ? 100 : target;
  const ariaNow = mode === 'percent' ? current : current;

  return (
    <div className="custom-split-progress">
      <div className="custom-split-progress-label">{label}</div>
      <div
        className="custom-split-progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={ariaMax}
        aria-valuenow={ariaNow}
        aria-label={mode === 'percent' ? 'Percent allocated toward 100%' : 'Dollars allocated toward line cost'}
      >
        <div
          className={`custom-split-progress-fill${over ? ' over' : ''}${complete ? ' complete' : ''}`}
          style={{ width: `${barPct}%` }}
        />
      </div>
    </div>
  );
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
                      <CustomSplitProgressBar item={item} people={people} cost={cost} />
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
