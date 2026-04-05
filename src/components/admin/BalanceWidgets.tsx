import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Banknote, Building2 } from 'lucide-react';
import { getJournalEntries } from '@/services/journalService';
import type { JournalEntry } from '@/types';

export default function BalanceWidgets() {
  const { t } = useTranslation();
  const [cashBalance, setCashBalance] = useState(0);
  const [bankBalance, setBankBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getJournalEntries()
      .then((entries: JournalEntry[]) => {
        let cash = 0;
        let bank = 0;

        for (const entry of entries) {
          for (const line of entry.lines) {
            if (line.accountCode === '1001') {
              cash += line.debit - line.credit;
            }
            if (line.accountCode === '1002') {
              bank += line.debit - line.credit;
            }
          }
        }

        setCashBalance(cash);
        setBankBalance(bank);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Cash Balance */}
      <div className="border rounded-lg bg-card p-5 hover:shadow-sm transition-shadow">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full shrink-0 bg-emerald-500/10 text-emerald-400">
            <Banknote className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">{t('accounting.cashBalance')}</p>
            {loading ? (
              <p className="mt-1 text-lg text-muted-foreground">{t('common.loading')}</p>
            ) : (
              <p className="mt-1 text-2xl font-bold tracking-tight" dir="ltr">
                {formatCurrency(cashBalance)}{' '}
                <span className="text-sm font-normal text-muted-foreground">
                  {t('common.sar')}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bank Balance */}
      <div className="border rounded-lg bg-card p-5 hover:shadow-sm transition-shadow">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full shrink-0 bg-primary/10 text-primary">
            <Building2 className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">{t('accounting.bankBalance')}</p>
            {loading ? (
              <p className="mt-1 text-lg text-muted-foreground">{t('common.loading')}</p>
            ) : (
              <p className="mt-1 text-2xl font-bold tracking-tight" dir="ltr">
                {formatCurrency(bankBalance)}{' '}
                <span className="text-sm font-normal text-muted-foreground">
                  {t('common.sar')}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
