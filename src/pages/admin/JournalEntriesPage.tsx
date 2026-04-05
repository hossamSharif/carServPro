import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { getJournalEntries } from '@/services/journalService';
import JournalEntryForm from '@/components/admin/JournalEntryForm';
import type { JournalEntry } from '@/types';
import { cn } from '@/lib/utils';
import { JOURNAL_SOURCE_COLORS } from '@/lib/statusColors';

export default function JournalEntriesPage() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState('');

  const loadEntries = async () => {
    try {
      const data = await getJournalEntries();
      setEntries(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEntries(); }, []);

  const filtered = sourceFilter
    ? entries.filter((e) => e.sourceType === sourceFilter)
    : entries;

  const formatDate = (timestamp: { toDate?: () => Date }) => {
    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
      return timestamp.toDate!().toLocaleDateString();
    }
    return '-';
  };

  if (loading) return <div className="p-6">{t('common.loading')}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('accounting.journalEntries')}</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
        >
          <Plus className="h-4 w-4" />
          {t('accounting.addJournalEntry')}
        </button>
      </div>

      {showForm && (
        <div className="mb-6">
          <JournalEntryForm onSuccess={() => { setShowForm(false); loadEntries(); }} />
        </div>
      )}

      {/* Source Type Filter */}
      <div className="mb-4">
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background text-sm"
        >
          <option value="">{t('common.filter')}</option>
          <option value="invoice">{t('invoice.invoice')}</option>
          <option value="invoice_cancellation">{t('invoice.cancelInvoice')}</option>
          <option value="expense">{t('accounting.expenses')}</option>
          <option value="asset">{t('accounting.assets')}</option>
          <option value="manual">{t('accounting.manualEntry')}</option>
        </select>
      </div>

      {/* Entries Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="w-8"></th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('common.date')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('invoice.description')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('accounting.sourceType')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('accounting.debit')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('accounting.credit')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => {
              const totalDebit = entry.lines.reduce((s, l) => s + l.debit, 0);
              const totalCredit = entry.lines.reduce((s, l) => s + l.credit, 0);
              const isExpanded = expandedId === entry.id;

              return (
                <tr key={entry.id} className="border-t group">
                  <td colSpan={6} className="p-0">
                    <div
                      className="flex items-center cursor-pointer hover:bg-accent/50 px-4 py-3"
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    >
                      <div className="w-8 flex-shrink-0">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 grid grid-cols-5 gap-4">
                        <span className="text-sm" dir="ltr">{formatDate(entry.date)}</span>
                        <span className="text-sm">{entry.description}</span>
                        <span>
                          <span className={cn('text-xs px-2 py-0.5 rounded', JOURNAL_SOURCE_COLORS[entry.sourceType] || JOURNAL_SOURCE_COLORS.manual)}>
                            {entry.sourceType}
                          </span>
                        </span>
                        <span className="text-sm font-mono" dir="ltr">{totalDebit.toFixed(2)}</span>
                        <span className="text-sm font-mono" dir="ltr">{totalCredit.toFixed(2)}</span>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="bg-muted/30 px-12 py-2">
                        <table className="w-full">
                          <tbody>
                            {entry.lines.map((line, i) => (
                              <tr key={i} className="text-sm">
                                <td className="py-1 pe-4 font-mono text-muted-foreground" dir="ltr">{line.accountCode}</td>
                                <td className="py-1 pe-4">{line.accountNameAr}</td>
                                <td className="py-1 pe-4 font-mono" dir="ltr">{line.debit > 0 ? line.debit.toFixed(2) : '-'}</td>
                                <td className="py-1 font-mono" dir="ltr">{line.credit > 0 ? line.credit.toFixed(2) : '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{t('common.noData')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
