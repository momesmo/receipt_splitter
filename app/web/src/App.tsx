import { useEffect, useMemo, useRef, useState } from 'react';
import { buildCsvContent, downloadCsv } from './lib/csv';
import { generatePersonId } from './lib/ids';
import { createEmptyItem, syncAllItemsPeople } from './lib/itemHelpers';
import { buildRunningRows } from './lib/running';
import { computeSummary, countInvalidCustomItems } from './lib/splits';
import type { Item, Person } from './lib/types';
import { ItemsTable } from './components/ItemsTable';
import { PeopleConfig } from './components/PeopleConfig';
import { RunningTotalPanel } from './components/RunningTotalPanel';
import { SummaryPanel } from './components/SummaryPanel';
import { TaxTip } from './components/TaxTip';

function App() {
  const [people, setPeople] = useState<Person[]>(() => [
    { id: generatePersonId(), name: 'Person 1' },
    { id: generatePersonId(), name: 'Person 2' },
  ]);
  const [items, setItems] = useState<Item[]>(() => [createEmptyItem()]);
  const [taxAmount, setTaxAmount] = useState(0);
  const [tipAmount, setTipAmount] = useState(0);

  const peopleIdsKey = useMemo(() => people.map((p) => p.id).join('|'), [people]);
  const peopleRef = useRef(people);
  useEffect(() => {
    peopleRef.current = people;
  });

  useEffect(() => {
    setItems((prev) => syncAllItemsPeople(prev, peopleRef.current));
  }, [peopleIdsKey]);

  const summary = useMemo(
    () => computeSummary(people, items, taxAmount, tipAmount),
    [people, items, taxAmount, tipAmount],
  );

  const runningRows = useMemo(
    () => buildRunningRows(people, items, summary, taxAmount, tipAmount),
    [people, items, summary, taxAmount, tipAmount],
  );

  const invalidCustomCount = useMemo(
    () => countInvalidCustomItems(items, people),
    [items, people],
  );

  const addPerson = () => {
    setPeople((prev) => [...prev, { id: generatePersonId(), name: `Person ${prev.length + 1}` }]);
  };

  const changePersonName = (index: number, name: string) => {
    setPeople((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], name };
      return next;
    });
  };

  const deletePerson = (index: number) => {
    if (people.length <= 2) return;
    const removedId = people[index]?.id;
    setPeople((prev) => prev.filter((_, i) => i !== index));
    setItems((prev) =>
      prev.map((it) => (it.payer === removedId ? { ...it, payer: '' } : it)),
    );
  };

  const updateItem = (id: string, patch: Partial<Item> | ((prev: Item) => Item)) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        if (typeof patch === 'function') return patch(it);
        return { ...it, ...patch };
      }),
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, createEmptyItem()]);
    queueMicrotask(() => {
      const nodes = document.querySelectorAll<HTMLInputElement>('.item-name');
      nodes[nodes.length - 1]?.focus();
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const exportCsv = () => {
    if (invalidCustomCount > 0) return;
    const csv = buildCsvContent(people, items, taxAmount, tipAmount);
    downloadCsv(csv, 'grocery_split.csv');
  };

  return (
    <div className="container">
      <h1>Receipt Cost Splitter</h1>

      {invalidCustomCount > 0 && (
        <div className="invalid-split-banner" role="status">
          {invalidCustomCount === 1
            ? 'One item has an invalid custom split. Fix it to include it in totals, or export CSV.'
            : `${invalidCustomCount} items have invalid custom splits. Fix them to include them in totals, or export CSV.`}{' '}
          CSV export is disabled until all custom splits are valid.
        </div>
      )}

      <PeopleConfig
        people={people}
        onChangeName={changePersonName}
        onAddPerson={addPerson}
        onDeletePerson={deletePerson}
      />

      <ItemsTable
        items={items}
        people={people}
        onUpdateItem={updateItem}
        onRemoveItem={removeItem}
        onAddItem={addItem}
        onNameEnter={addItem}
      />

      <TaxTip
        taxAmount={taxAmount}
        tipAmount={tipAmount}
        onTaxChange={setTaxAmount}
        onTipChange={setTipAmount}
      />

      <SummaryPanel
        people={people}
        subtotals={summary.subtotals}
        taxShares={summary.taxShares}
        tipShares={summary.tipShares}
        totals={summary.totals}
      />

      <RunningTotalPanel rows={runningRows} />

      <div className="export-section">
        <button
          type="button"
          className="export-button"
          disabled={invalidCustomCount > 0}
          onClick={exportCsv}
        >
          Export to CSV
        </button>
        <p>
          <small>
            {invalidCustomCount > 0
              ? 'Fix invalid custom splits to enable download.'
              : 'Click to download a CSV file that you can open in Excel'}
          </small>
        </p>
      </div>
    </div>
  );
}

export default App;
