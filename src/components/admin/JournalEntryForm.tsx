import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import { getAccounts } from '@/services/accountService';
import { createJournalEntry } from '@/services/journalService';
import { useAuthStore } from '@/stores/authStore';
import { Timestamp } from 'firebase/firestore';
import type { Account, JournalLine } from '@/types';

interface JournalEntryFormProps {
  onSuccess: () => void;
}

interface FormLine {
  accountId: string;
  debit: string;
  credit: string;
}

function emptyLine(): FormLine {
  return { accountId: '', debit: '', credit: '' };
}

export default function JournalEntryForm({ onSuccess }: JournalEntryFormProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const user = useAuthStore((s) => s.user);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<FormLine[]>([emptyLine(), emptyLine()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getAccounts().then(setAccounts).catch(() => {});
  }, []);

  const totalDebits = lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
  const totalCredits = lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01 && totalDebits > 0;

  const updateLine = (index: number, field: keyof FormLine, value: string) => {
    setLines((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line;
        // If setting debit, clear credit and vice versa
        if (field === 'debit' && parseFloat(value) > 0) {
          return { ...line, debit: value, credit: '' };
        }
        if (field === 'credit' && parseFloat(value) > 0) {
          return { ...line, credit: value, debit: '' };
        }
        return { ...line, [field]: value };
      })
    );
  };

  const addLine = () => {
    setLines((prev) => [...prev, emptyLine()]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 2) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const canSubmit =
    date.trim() !== '' &&
    description.trim() !== '' &&
    isBalanced &&
    lines.every((l) => l.accountId !== '') &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError('');

    try {
      const journalLines: JournalLine[] = lines.map((l) => {
        const account = accounts.find((a) => a.id === l.accountId)!;
        return {
          accountId: l.accountId,
          accountCode: account.code,
          accountNameAr: account.nameAr,
          debit: parseFloat(l.debit) || 0,
          credit: parseFloat(l.credit) || 0,
        };
      });

      await createJournalEntry({
        date: Timestamp.fromDate(new Date(date)),
        description,
        lines: journalLines,
        sourceType: 'manual',
        sourceId: null,
        createdBy: user?.uid || '',
      });

      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('validation.journalUnbalanced')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Date */}
      <div>
        <label className="block text-sm font-medium mb-1">{t('common.date')}</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 border rounded-md bg-background text-sm"
          dir="ltr"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1">
          {t('invoice.description')}
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border rounded-md bg-background text-sm"
          placeholder={isAr ? 'وصف القيد...' : 'Entry description...'}
          required
        />
      </div>

      {/* Lines */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">{t('invoice.lineItems')}</label>
          <button
            type="button"
            onClick={addLine}
            className="flex items-center gap-1 text-xs px-2.5 py-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3 w-3" />
            {t('common.add')}
          </button>
        </div>

        {/* Column headers */}
        <div className="hidden sm:grid sm:grid-cols-[1fr_120px_120px_40px] gap-2 mb-1 px-1 text-xs text-muted-foreground font-medium">
          <span>{t('accounting.accountName')}</span>
          <span>{t('accounting.debit')}</span>
          <span>{t('accounting.credit')}</span>
          <span />
        </div>

        <div className="space-y-2">
          {lines.map((line, index) => (
            <div
              key={index}
              className="grid grid-cols-1 sm:grid-cols-[1fr_120px_120px_40px] gap-2 items-start border rounded-md p-2 sm:border-0 sm:p-0"
            >
              {/* Account selector */}
              <select
                value={line.accountId}
                onChange={(e) => updateLine(index, 'accountId', e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                required
              >
                <option value="">
                  {isAr ? '-- اختر الحساب --' : '-- Select Account --'}
                </option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.code} - {isAr ? acc.nameAr : acc.nameEn}
                  </option>
                ))}
              </select>

              {/* Debit */}
              <div className="sm:contents">
                <label className="text-xs text-muted-foreground sm:hidden">
                  {t('accounting.debit')}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.debit}
                  onChange={(e) => updateLine(index, 'debit', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                  dir="ltr"
                  placeholder="0.00"
                />
              </div>

              {/* Credit */}
              <div className="sm:contents">
                <label className="text-xs text-muted-foreground sm:hidden">
                  {t('accounting.credit')}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.credit}
                  onChange={(e) => updateLine(index, 'credit', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                  dir="ltr"
                  placeholder="0.00"
                />
              </div>

              {/* Remove */}
              <button
                type="button"
                onClick={() => removeLine(index)}
                disabled={lines.length <= 2}
                className="p-2 text-destructive hover:bg-accent rounded disabled:opacity-30 disabled:cursor-not-allowed self-center"
                title={t('common.delete')}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Balance indicator */}
      <div className="flex items-center justify-between border rounded-md p-3 text-sm">
        <div className="flex gap-6">
          <span>
            {t('accounting.debit')}:{' '}
            <span className="font-semibold" dir="ltr">
              {totalDebits.toFixed(2)}
            </span>
          </span>
          <span>
            {t('accounting.credit')}:{' '}
            <span className="font-semibold" dir="ltr">
              {totalCredits.toFixed(2)}
            </span>
          </span>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded font-medium ${
            isBalanced
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-red-500/15 text-red-400'
          }`}
        >
          {isBalanced ? t('accounting.balanced') : t('accounting.unbalanced')}
        </span>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? t('common.loading') : t('common.save')}
      </button>
    </form>
  );
}
