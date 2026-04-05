import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Printer } from 'lucide-react';
import { getPurchaseInvoices } from '@/services/purchaseService';
import { getPurchasePaymentsBySupplier } from '@/services/purchasePaymentService';
import { getSuppliers } from '@/services/supplierService';
import type { Supplier } from '@/types/purchase';

interface StatementLine {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export default function SupplierStatementView() {
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState<StatementLine[] | null>(null);
  const [supplierName, setSupplierName] = useState('');

  // Load suppliers on mount
  useEffect(() => {
    getSuppliers().then(setSuppliers);
  }, []);

  const handleGenerate = async () => {
    if (!supplierId || !fromDate || !toDate) return;
    setLoading(true);
    setLines(null);
    try {
      const supplier = suppliers.find((s) => s.id === supplierId);
      setSupplierName(supplier?.nameAr || '');

      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);

      // Get all purchase invoices and payments for this supplier
      const allInvoices = await getPurchaseInvoices();
      const invoices = allInvoices.filter(
        (inv) => inv.supplierId === supplierId && inv.status === 'issued'
      );

      const payments = await getPurchasePaymentsBySupplier(supplierId);

      // Build unified transaction list
      type RawTransaction = { date: Date; description: string; debit: number; credit: number };
      const transactions: RawTransaction[] = [];

      for (const inv of invoices) {
        const invDate = new Date(inv.invoiceDateGregorian);
        if (invDate >= from && invDate <= to) {
          transactions.push({
            date: invDate,
            description: `${t('purchase.purchaseInvoice')} ${inv.invoiceNumber || inv.id}`,
            debit: inv.grandTotal,
            credit: 0,
          });
        }
      }

      for (const pay of payments) {
        const payDate = pay.createdAt && typeof pay.createdAt === 'object' && 'toDate' in pay.createdAt
          ? (pay.createdAt as { toDate: () => Date }).toDate()
          : new Date();
        if (payDate >= from && payDate <= to) {
          transactions.push({
            date: payDate,
            description: `${t('purchase.recordPayment')} - ${pay.notes || ''}`.trim(),
            debit: 0,
            credit: pay.amount,
          });
        }
      }

      // Sort by date
      transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

      // Build statement with running balance
      let balance = 0;
      const statementLines: StatementLine[] = transactions.map((tx) => {
        balance += tx.debit - tx.credit;
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

  const closingBalance = lines && lines.length > 0 ? lines[lines.length - 1].balance : 0;

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
              <option key={s.id} value={s.id}>{s.nameAr}</option>
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
          <button onClick={() => window.print()} className="flex items-center gap-1 px-4 py-2 text-sm border rounded-md hover:bg-accent">
            <Printer className="h-4 w-4" /> {t('common.print')}
          </button>
        )}
      </div>

      {loading && <div className="text-center py-8 text-muted-foreground">{t('common.loading')}</div>}

      {lines && !loading && (
        <div className="border rounded-lg p-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold">{t('purchase.supplierStatement')}</h3>
            <p className="text-sm text-muted-foreground">{supplierName}</p>
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
              {lines.map((line, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-2" dir="ltr">{line.date}</td>
                  <td className="px-4 py-2">{line.description}</td>
                  <td className="px-4 py-2 text-end font-mono" dir="ltr">{line.debit > 0 ? line.debit.toFixed(2) : '-'}</td>
                  <td className="px-4 py-2 text-end font-mono" dir="ltr">{line.credit > 0 ? line.credit.toFixed(2) : '-'}</td>
                  <td className="px-4 py-2 text-end font-mono" dir="ltr">{line.balance.toFixed(2)}</td>
                </tr>
              ))}
              {lines.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">{t('common.noData')}</td></tr>
              )}
            </tbody>
          </table>

          {lines.length > 0 && (
            <div className="mt-4 flex justify-end">
              <div className="border rounded-lg px-6 py-3">
                <span className="text-sm font-medium">{t('purchase.closingBalance')}: </span>
                <span className="font-bold font-mono" dir="ltr">{closingBalance.toFixed(2)} {t('common.sar')}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
