import type { Person } from '../lib/types';

type Props = {
  people: Person[];
  onChangeName: (index: number, name: string) => void;
  onAddPerson: () => void;
  onDeletePerson: (index: number) => void;
};

export function PeopleConfig({ people, onChangeName, onAddPerson, onDeletePerson }: Props) {
  const rows: Person[][] = [];
  for (let i = 0; i < people.length; i += 2) {
    rows.push(people.slice(i, i + 2));
  }

  return (
    <div className="config-section">
      <div className="config-header">
        <h3>Configuration</h3>
        <button id="add-person-btn" type="button" onClick={onAddPerson}>
          + Add Person
        </button>
      </div>
      <div id="people-config-list">
        {rows.map((row, ri) => (
          <div key={ri} className="config-row">
            {row.map((person) => {
              const globalIdx = people.indexOf(person);
              return (
                <div key={person.id} className="config-input">
                  <div className="person-config-flex">
                    <label htmlFor={`person-${person.id}-name`}>Person {globalIdx + 1} Name:</label>
                    <input
                      id={`person-${person.id}-name`}
                      type="text"
                      className="person-name-input"
                      value={person.name}
                      onChange={(e) => onChangeName(globalIdx, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          onAddPerson();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="delete-person-btn"
                      style={{ display: people.length > 2 ? 'inline-block' : 'none', marginLeft: 8 }}
                      onClick={() => onDeletePerson(globalIdx)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
