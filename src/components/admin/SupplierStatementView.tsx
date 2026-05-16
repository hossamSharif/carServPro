import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Printer, Download } from 'lucide-react';
import { getJournalEntries } from '@/services/journalService';
import { getSuppliers } from '@/services/supplierService';
import { generateSupplierStatementPDF } from '@/lib/supplier-statement-pdf';
import { getBusinessProfile } from '@/services/settingsService';
import type { Supplier } from '@/types/purchase';

interface StatementLine {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

function firstOfMonthIso(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

export default function SupplierStatementView() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState(searchParams.get('supplierId') || '');
  const [fromDate, setFromDate] = useState(firstOfMonthIso());
  const [toDate, setToDate] = useState(todayIso());
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState<StatementLine[] | null>(null);
  const [supplierName, setSupplierName] = useState('');
  const [supplierAccountCode, setSupplierAccountCode] = useState('');
  const [openingBalance, setOpeningBalance] = useState(0);

  useEffect(() => {
    getSuppliers().then(setSuppliers);
  }, []);

  const handleGenerate = async () => {
    if (!supplierId || !fromDate || !toDate) return;
    setLoading(true);
    setLines(null);
    try {
      const supplier = suppliers.find((s) => s.id === supplierId);
      if (!supplier) return;
      setSupplierName(supplier.nameAr);
      const apCode = supplier.apAccountCode || '';
      setSupplierAccountCode(apCode);

      if (!apCode) {
        setLines([]);
        return;
      }

      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);

      const allEntries = await getJournalEntries();

      type RawTransaction = { date: Date; description: string; debit: number; credit: number };
      const transactions: RawTransaction[] = [];
      let calcOpeningBalance = 0;

      for (const entry of allEntries) {
        const entryDate = entry.date && typeof entry.date === 'object' && 'toDate' in entry.date
          ? (entry.date as { toDate: () => Date }).toDate()
          : new Date();

        for (const line of entry.lines) {
          if (line.accountCode === apCode) {
            if (entryDate < from) {
              calcOpeningBalance += line.credit - line.debit;
            } else if (entryDate <= to) {
              transactions.push({
                date: entryDate,
                description: entry.description,
                debit: line.debit,
                credit: line.credit,
              });
            }
          }
        }
      }

      setOpeningBalance(calcOpeningBalance);
      transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

      let balance = calcOpeningBalance;
      const statementLines: StatementLine[] = transactions.map((tx) => {
        balance += tx.credit - tx.debit;
        return {
          date: tx.date.toISOString().split('T')[0],
          description: tx.description,
          debit: tx.debit,
          credit: tx.credit,
          balance,
        };
      });

      setLines(statementLines);
    } finally {
      setLoading(false);
    }
  };

  const closingBalance = lines && lines.length > 0 ? lines[lines.length - 1].balance : openingBalance;

  const handleDownloadPdf = async () => {
    if (!lines) return;
    let logoUrl: string | null = null;
    let sellerNameAr = '';
    try {
      const profile = await getBusinessProfile();
      if (profile) {
        logoUrl = profile.logoUrl || null;
        sellerNameAr = profile.nameAr || '';
      }
    } catch { /* ignore */ }

    await generateSupplierStatementPDF(
      {
        supplierName,
        supplierAccountCode,
        fromDate,
        toDate,
        openingBalance,
        lines,
        closingBalance,
      },
      logoUrl,
      sellerNameAr,
    );
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">{t('purchase.supplierStatement')}</h2>

      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">{t('purchase.supplierName')}</label>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="px-3 py-2 text-sm border rounded-md bg-background"
          >
            <option value="">{t('purchase.selectSupplier')}</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.nameAr}{s.apAccountCode ? ` (${s.apAccountCode})` : ''}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('accounting.fromDate')}</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-3 py-2 text-sm border rounded-md bg-background" dir="ltr" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('accounting.toDate')}</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-3 py-2 text-sm border rounded-md bg-background" dir="ltr" />
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading || !supplierId || !fromDate || !toDate}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {t('purchase.generateStatement')}
        </button>
        {lines && (
          <>
            <button onClick={handleDownloadPdf} className="flex items-center gap-1 px-4 py-2 text-sm border rounded-md hover:bg-accent">
              <Download className="h-4 w-4" /> {t('purchase.downloadPdf')}
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-1 px-4 py-2 text-sm border rounded-md hover:bg-accent">
              <Printer className="h-4 w-4" /> {t('common.print')}
            </button>
          </>
        )}
      </div>

      {loading && <div className="text-center py-8 text-muted-foreground">{t('common.loading')}</div>}

      {lines && !loading && (
        <div className="border rounded-lg p-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold">{t('purchase.supplierStatement')}</h3>
            <p className="text-sm text-muted-foreground">{supplierName}</p>
            {supplierAccountCode && (
              <p className="text-sm text-muted-foreground font-mono" dir="ltr">{t('purchase.supplierAccount')}: {supplierAccountCode}</p>
            )}
            <p className="text-sm text-muted-foreground">{fromDate} → {toDate}</p>
          </div>

          <table className="w-full border rounded-lg overflow-hidden text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-start px-4 py-2">{t('common.date')}</th>
                <th className="text-start px-4 py-2">{t('invoice.description')}</th>
                <th className="text-end px-4 py-2">{t('purchase.debit')}</th>
                <th className="text-end px-4 py-2">{t('purchase.credit')}</th>
                <th className="text-end px-4 py-2">{t('purchase.runningBalance')}</th>
              </tr>
            </thead>
            <tbody>
              {openingBalance !== 0 && (
                <tr className="bg-muted/30 font-medium">
                  <td className="px-4 py-2" colSpan={2}>{t('purchase.openingBalance')}</td>
                  <td className="px-4 py-2 text-end" colSpan={2}>-</td>
                  <td className="px-4 py-2 text-end font-mono" dir="ltr">{openingBalance.toFixed(2)}</td>
                </tr>
              )}
              {lines.map((line, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-2" dir="ltr">{line.date}</td>
                  <td className="px-4 py-2">{line.description}</td>
                  <td className="px-4 py-2 text-end font-mono" dir="ltr">{line.debit > 0 ? line.debit.toFixed(2) : '-'}</td>
                  <td className="px-4 py-2 text-end font-mono" dir="ltr">{line.credit > 0 ? line.credit.toFixed(2) : '-'}</td>
                  <td className="px-4 py-2 text-end font-mono" dir="ltr">{line.balance.toFixed(2)}</td>
                </tr>
              ))}
              {lines.length === 0 && openingBalance === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">{t('common.noData')}</td></tr>
              )}
            </tbody>
          </table>

          <div className="mt-4 flex justify-end">
            <div className="border rounded-lg px-6 py-3">
              <span className="text-sm font-medium">{t('purchase.closingBalance')}: </span>
              <span className="font-bold font-mono" dir="ltr">{closingBalance.toFixed(2)} {t('common.sar')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
