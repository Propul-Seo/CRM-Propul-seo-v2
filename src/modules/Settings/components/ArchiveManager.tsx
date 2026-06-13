import { useState, useEffect } from 'react';
import { Archive, AlertTriangle, TrendingUp, TrendingDown, FolderArchive, RefreshCw, ChevronRight, Wallet, ChevronDown, Plus, Pencil, Trash2, X, Check, FileText } from 'lucide-react';
import { ArchiveService, YearlyStats, ArchivedAccountingEntry } from '@/services/archiveService';
import { formatCurrency } from '@/utils';
import { toast } from 'sonner';

interface ArchiveCounts {
  transactions: number;
  projects: number;
  tasks: number;
}

interface EditingEntry {
  id: string;
  description: string;
  amount: string;
  type: 'revenue' | 'expense';
  entry_date: string;
}

export function ArchiveManager() {
  const [isArchiving, setIsArchiving] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [archivedYears, setArchivedYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedStats, setSelectedStats] = useState<YearlyStats | null>(null);
  const [archiveCounts, setArchiveCounts] = useState<ArchiveCounts | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Transactions state
  const [showTransactions, setShowTransactions] = useState(false);
  const [transactions, setTransactions] = useState<ArchivedAccountingEntry[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [editingEntry, setEditingEntry] = useState<EditingEntry | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newEntry, setNewEntry] = useState({
    description: '',
    amount: '',
    type: 'revenue' as 'revenue' | 'expense',
    entry_date: '',
  });

  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  useEffect(() => {
    loadArchivedYears();
  }, []);

  useEffect(() => {
    if (archivedYears.length > 0 && !selectedYear) {
      loadYearStats(archivedYears[0]);
    }
  }, [archivedYears]);

  const loadArchivedYears = async () => {
    const years = await ArchiveService.getArchivedYears();
    setArchivedYears(years);
  };

  const loadYearStats = async (year: number) => {
    setSelectedYear(year);
    setLoadingStats(true);
    setShowTransactions(false);
    const [stats, summary] = await Promise.all([
      ArchiveService.getYearlyStats(year),
      ArchiveService.getArchiveSummary(year)
    ]);
    setSelectedStats(stats);
    setArchiveCounts(summary);
    setLoadingStats(false);
  };

  const loadTransactions = async () => {
    if (!selectedYear) return;
    setLoadingTransactions(true);
    const data = await ArchiveService.getArchivedAccountingEntries(selectedYear);
    setTransactions(data);
    setLoadingTransactions(false);
  };

  const toggleTransactions = async () => {
    if (!showTransactions && transactions.length === 0) {
      await loadTransactions();
    }
    setShowTransactions(!showTransactions);
  };

  const refreshStatsAndCounts = async () => {
    if (!selectedYear) return;

    // Recharger les stats depuis les données archivées actuelles
    const result = await ArchiveService.recalculateYearlyStatsFromArchive(selectedYear);
    const summary = await ArchiveService.getArchiveSummary(selectedYear);

    if (result.success && result.stats) {
      setSelectedStats(result.stats);
    }
    setArchiveCounts(summary);
  };

  const handleRecalculateStats = async (showToast = true) => {
    if (!selectedStats || !selectedYear) return;

    setIsRecalculating(true);
    await refreshStatsAndCounts();
    if (showToast) {
      toast.success(`Statistiques ${selectedYear} recalculees`);
    }
    setIsRecalculating(false);
  };

  const handleArchive = async () => {
    const confirmMessage = `Archiver l'annee ${previousYear} ?\n\nCette action va :\n- Sauvegarder les statistiques comptables\n- Archiver transactions, projets et taches termines\n- Supprimer ces donnees des tables actives\n\nLes contacts CRM ne seront PAS affectes.`;

    if (!confirm(confirmMessage)) return;

    setIsArchiving(true);

    const archiveResult = await ArchiveService.archiveYear(previousYear);

    if (archiveResult.success) {
      toast.success(
        `Archive ${previousYear} terminee : ${archiveResult.archived.transactions} transactions, ${archiveResult.archived.projects} projets, ${archiveResult.archived.tasks} taches`
      );
      await loadArchivedYears();
      loadYearStats(previousYear);
    } else {
      toast.error(`Erreur : ${archiveResult.error}`);
    }

    setIsArchiving(false);
  };

  // CRUD handlers
  const startEdit = (entry: ArchivedAccountingEntry) => {
    setEditingEntry({
      id: entry.id,
      description: entry.description,
      amount: entry.amount.toString(),
      type: entry.type,
      entry_date: entry.entry_date,
    });
  };

  const cancelEdit = () => {
    setEditingEntry(null);
  };

  const saveEdit = async () => {
    if (!editingEntry) return;

    const result = await ArchiveService.updateArchivedEntry(editingEntry.id, {
      description: editingEntry.description,
      amount: parseFloat(editingEntry.amount),
      type: editingEntry.type,
      entry_date: editingEntry.entry_date,
    });

    if (result.success) {
      setEditingEntry(null);
      await loadTransactions();
      await refreshStatsAndCounts();
      toast.success('Transaction modifiee - Totaux mis a jour');
    } else {
      toast.error(`Erreur: ${result.error}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette transaction ?')) return;

    const result = await ArchiveService.deleteArchivedEntry(id);

    if (result.success) {
      // Mettre à jour la liste locale immédiatement
      setTransactions(prev => prev.filter(t => t.id !== id));

      // Puis recalculer les stats depuis la base
      await refreshStatsAndCounts();

      toast.success('Transaction supprimee - Totaux mis a jour');
    } else {
      toast.error(`Erreur: ${result.error}`);
    }
  };

  const handleAddNew = async () => {
    if (!selectedYear || !newEntry.description || !newEntry.amount || !newEntry.entry_date) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const result = await ArchiveService.addArchivedEntry(selectedYear, {
      description: newEntry.description,
      amount: parseFloat(newEntry.amount),
      type: newEntry.type,
      entry_date: newEntry.entry_date,
    });

    if (result.success) {
      setIsAddingNew(false);
      setNewEntry({ description: '', amount: '', type: 'revenue', entry_date: '' });
      await loadTransactions();
      await refreshStatsAndCounts();
      toast.success('Transaction ajoutee - Totaux mis a jour');
    } else {
      toast.error(`Erreur: ${result.error}`);
    }
  };

  const isYearAlreadyArchived = archivedYears.includes(previousYear);
  const hasStatsIssue = archiveCounts && archiveCounts.transactions > 0 &&
    selectedStats?.total_income === 0 && selectedStats?.total_expenses === 0;

  return (
    <div className="glass-surface-static rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-purple-900/20 to-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-900/40 rounded-lg">
              <FolderArchive className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Gestion des Archives
              </h2>
              <p className="text-sm text-muted-foreground">
                Archivez les annees passees et consultez l'historique
              </p>
            </div>
          </div>

          {!isYearAlreadyArchived && (
            <button
              onClick={handleArchive}
              disabled={isArchiving}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-muted text-white rounded-lg transition-colors text-sm font-medium"
            >
              {isArchiving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Archivage...
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4" />
                  Archiver {previousYear}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {archivedYears.length > 0 ? (
          <div className="space-y-6">
            {/* Navigation par annees */}
            <div className="flex items-center gap-2 pb-4 border-b border-border">
              <span className="text-sm text-muted-foreground mr-2">Annee :</span>
              {archivedYears.map(year => (
                <button
                  key={year}
                  onClick={() => loadYearStats(year)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedYear === year
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-surface-2/50 text-muted-foreground hover:bg-surface-3'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>

            {loadingStats ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent" />
              </div>
            ) : selectedStats ? (
              <div className="space-y-6">
                {/* Alerte si probleme de stats */}
                {hasStatsIssue && (
                  <div className="flex items-center justify-between p-4 bg-amber-900/20 rounded-lg border border-amber-800">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      <span className="text-sm text-amber-200">
                        {archiveCounts?.transactions} transactions archivees mais totaux a 0€
                      </span>
                    </div>
                    <button
                      onClick={handleRecalculateStats}
                      disabled={isRecalculating}
                      className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-muted text-white text-sm rounded-lg transition-colors"
                    >
                      {isRecalculating ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      Recalculer
                    </button>
                  </div>
                )}

                {/* Stats financieres */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="relative overflow-hidden p-5 bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl border border-green-800">
                    <TrendingUp className="absolute -right-2 -top-2 w-16 h-16 text-green-800" />
                    <p className="text-sm font-medium text-green-300 mb-1">Revenus</p>
                    <p className="text-2xl font-bold text-green-400">
                      {formatCurrency(selectedStats.total_income)}
                    </p>
                  </div>

                  <div className="relative overflow-hidden p-5 bg-gradient-to-br from-red-900/20 to-rose-900/20 rounded-xl border border-red-800">
                    <TrendingDown className="absolute -right-2 -top-2 w-16 h-16 text-red-800" />
                    <p className="text-sm font-medium text-red-300 mb-1">Depenses</p>
                    <p className="text-2xl font-bold text-red-400">
                      {formatCurrency(selectedStats.total_expenses)}
                    </p>
                  </div>

                  <div className="relative overflow-hidden p-5 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                    <Wallet className="absolute -right-2 -top-2 w-16 h-16 text-primary/20" />
                    <p className="text-sm font-medium text-primary mb-1">Resultat</p>
                    <p className={`text-2xl font-bold ${
                      selectedStats.net_profit >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(selectedStats.net_profit)}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-4 p-4 bg-surface-1 rounded-xl">
                    <div className="flex items-center justify-center w-10 h-10 bg-purple-900/40 rounded-lg">
                      <span className="text-lg font-bold text-purple-400">
                        {archiveCounts?.transactions || 0}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Transactions</p>
                      <p className="text-xs text-muted-foreground">archivees</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-surface-1 rounded-xl">
                    <div className="flex items-center justify-center w-10 h-10 bg-primary/20 rounded-lg">
                      <span className="text-lg font-bold text-primary">
                        {selectedStats.projects_completed}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Projets</p>
                      <p className="text-xs text-muted-foreground">termines</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-surface-1 rounded-xl">
                    <div className="flex items-center justify-center w-10 h-10 bg-green-900/40 rounded-lg">
                      <span className="text-lg font-bold text-green-400">
                        {selectedStats.new_clients}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Clients</p>
                      <p className="text-xs text-muted-foreground">nouveaux</p>
                    </div>
                  </div>
                </div>

                {/* Section Transactions */}
                <div className="border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={toggleTransactions}
                    className="w-full flex items-center justify-between p-4 bg-surface-1 hover:bg-surface-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium text-foreground">
                        Transactions comptables {selectedYear}
                      </span>
                      <span className="px-2 py-0.5 bg-purple-900/40 text-purple-300 text-xs rounded-full">
                        {archiveCounts?.transactions || 0}
                      </span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showTransactions ? 'rotate-180' : ''}`} />
                  </button>

                  {showTransactions && (
                    <div className="p-4 space-y-4">
                      {/* Bouton ajouter */}
                      <div className="flex justify-end">
                        <button
                          onClick={() => setIsAddingNew(true)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Ajouter
                        </button>
                      </div>

                      {/* Formulaire nouvelle entree */}
                      {isAddingNew && (
                        <div className="p-4 bg-green-900/20 rounded-lg border border-green-800 space-y-3">
                          <div className="grid grid-cols-4 gap-3">
                            <input
                              type="date"
                              value={newEntry.entry_date}
                              onChange={(e) => setNewEntry({ ...newEntry, entry_date: e.target.value })}
                              className="px-3 py-2 bg-surface-2/50 border border-border rounded-lg text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Description"
                              value={newEntry.description}
                              onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                              className="px-3 py-2 bg-surface-2/50 border border-border rounded-lg text-sm"
                            />
                            <input
                              type="number"
                              placeholder="Montant"
                              value={newEntry.amount}
                              onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })}
                              className="px-3 py-2 bg-surface-2/50 border border-border rounded-lg text-sm"
                            />
                            <select
                              value={newEntry.type}
                              onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value as 'revenue' | 'expense' })}
                              className="px-3 py-2 bg-surface-2/50 border border-border rounded-lg text-sm"
                            >
                              <option value="revenue">Revenu</option>
                              <option value="expense">Depense</option>
                            </select>
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setIsAddingNew(false)}
                              className="px-3 py-1.5 text-muted-foreground hover:text-foreground text-sm"
                            >
                              Annuler
                            </button>
                            <button
                              onClick={handleAddNew}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg"
                            >
                              <Check className="w-4 h-4" />
                              Enregistrer
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Liste des transactions */}
                      {loadingTransactions ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent" />
                        </div>
                      ) : transactions.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Date</th>
                                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Description</th>
                                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Type</th>
                                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Montant</th>
                                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {transactions.map((entry) => (
                                <tr key={entry.id} className="border-b border-border hover:bg-surface-3">
                                  {editingEntry?.id === entry.id ? (
                                    // Mode edition
                                    <>
                                      <td className="py-2 px-3">
                                        <input
                                          type="date"
                                          value={editingEntry.entry_date}
                                          onChange={(e) => setEditingEntry({ ...editingEntry, entry_date: e.target.value })}
                                          className="w-full px-2 py-1 bg-surface-2/50 border border-border rounded text-sm"
                                        />
                                      </td>
                                      <td className="py-2 px-3">
                                        <input
                                          type="text"
                                          value={editingEntry.description}
                                          onChange={(e) => setEditingEntry({ ...editingEntry, description: e.target.value })}
                                          className="w-full px-2 py-1 bg-surface-2/50 border border-border rounded text-sm"
                                        />
                                      </td>
                                      <td className="py-2 px-3">
                                        <select
                                          value={editingEntry.type}
                                          onChange={(e) => setEditingEntry({ ...editingEntry, type: e.target.value as 'revenue' | 'expense' })}
                                          className="px-2 py-1 bg-surface-2/50 border border-border rounded text-sm"
                                        >
                                          <option value="revenue">Revenu</option>
                                          <option value="expense">Depense</option>
                                        </select>
                                      </td>
                                      <td className="py-2 px-3">
                                        <input
                                          type="number"
                                          value={editingEntry.amount}
                                          onChange={(e) => setEditingEntry({ ...editingEntry, amount: e.target.value })}
                                          className="w-full px-2 py-1 bg-surface-2/50 border border-border rounded text-sm text-right"
                                        />
                                      </td>
                                      <td className="py-2 px-3">
                                        <div className="flex items-center justify-end gap-1">
                                          <button
                                            onClick={saveEdit}
                                            className="p-1.5 text-green-600 hover:bg-green-900/30 rounded"
                                          >
                                            <Check className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={cancelEdit}
                                            className="p-1.5 text-muted-foreground hover:bg-surface-3 rounded"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </td>
                                    </>
                                  ) : (
                                    // Mode lecture
                                    <>
                                      <td className="py-2 px-3 text-foreground">
                                        {new Date(entry.entry_date).toLocaleDateString('fr-FR')}
                                      </td>
                                      <td className="py-2 px-3 text-foreground">
                                        {entry.description}
                                      </td>
                                      <td className="py-2 px-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                          entry.type === 'revenue'
                                            ? 'bg-green-900/40 text-green-300'
                                            : 'bg-red-900/40 text-red-300'
                                        }`}>
                                          {entry.type === 'revenue' ? 'Revenu' : 'Depense'}
                                        </span>
                                      </td>
                                      <td className={`py-2 px-3 text-right font-medium ${
                                        entry.type === 'revenue' ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        {entry.type === 'revenue' ? '+' : '-'}{formatCurrency(entry.amount)}
                                      </td>
                                      <td className="py-2 px-3">
                                        <div className="flex items-center justify-end gap-1">
                                          <button
                                            onClick={() => startEdit(entry)}
                                            className="p-1.5 text-primary hover:bg-primary/20 rounded"
                                            title="Modifier"
                                          >
                                            <Pencil className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() => handleDelete(entry.id)}
                                            className="p-1.5 text-red-400 hover:bg-red-900/30 rounded"
                                            title="Supprimer"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </td>
                                    </>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          Aucune transaction archivee pour {selectedYear}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-surface-3 rounded-full mb-4">
              <Archive className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Aucune archive
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Archivez l'annee {previousYear} pour sauvegarder vos donnees et demarrer {currentYear} a zero.
            </p>
            <button
              onClick={handleArchive}
              disabled={isArchiving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-muted text-white rounded-lg transition-colors font-medium"
            >
              {isArchiving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Archivage en cours...
                </>
              ) : (
                <>
                  <Archive className="w-5 h-5" />
                  Archiver {previousYear}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
