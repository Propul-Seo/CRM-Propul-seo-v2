import { AccountingEntry } from './types';

interface AccountingDetailsProps {
  entry: AccountingEntry;
  onClose: () => void;
}

export const AccountingDetails: React.FC<AccountingDetailsProps> = ({ entry, onClose }) => (
  <div>
    <h2>Détails de l'écriture</h2>
    <p><strong>Libellé :</strong> {entry.label}</p>
    <p><strong>Montant :</strong> {entry.amount} €</p>
    <p><strong>Date :</strong> {entry.date}</p>
    <p><strong>Type :</strong> {entry.type}</p>
    <button onClick={onClose}>Fermer</button>
  </div>
); 