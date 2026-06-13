import { AccountingEntry } from './types';

interface AccountingListProps {
  entries: AccountingEntry[];
  onSelect: (entry: AccountingEntry) => void;
}

export const AccountingList: React.FC<AccountingListProps> = ({ entries, onSelect }) => (
  <div>
    <h2>Liste des écritures</h2>
    <ul>
      {entries.map(entry => (
        <li key={entry.id}>
          <button onClick={() => onSelect(entry)}>{entry.label} - {entry.amount}€ ({entry.type})</button>
        </li>
      ))}
    </ul>
  </div>
); 