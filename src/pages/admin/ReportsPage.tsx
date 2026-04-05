import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Printer } from 'lucide-react';
import {
  generateIncomeStatement,
  generateBalanceSheet,
  generateVATReport,
  getGeneralLedger,
} from '@/services/reportService';

type ReportType = 'income' | 'balance' | 'vat' | 'ledger';

export default function ReportsPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [reportType, setReportType] = useState<ReportType>('income');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<Record<string, unknown> | null>(null);

  const handleGenerate = async () => {
    if (!fromDate || (!toDate && reportType !== 'balance')) return;
    setLoading(true);
    setReportData(null);
    try {
      const from = new Date(fromDate);
      const to = toDate ? new Date(toDate) : new Date();
      let data: Record<string, unknown>;
      switch (reportType) {
        case 'income':
          data = await generateIncomeStatement(from, to) as unknown as Record<string, unknown>;
          break;
        case 'balance':
          data = await generateBalanceSheet(from) as unknown as Record<string, unknown>;
          break;
        case 'vat':
          data = await generateVATReport(from, to) as unknown as Record<string, unknown>;
          break;
        case 'ledger':
          data = { entries: await getGeneralLedger(from, to) };
          break;
        default:
          return;
      }
      setReportData(data);
    } finally {
      setLoading(false);
    }
  };

  const renderAccountLine = (item: { accountCode: string; accountName: string; total: number }) => (
    <tr key={item.accountCode} className="border-t">
      <td className="px-4 py-2 text-sm font-mono" dir="ltr">{item.accountCode}</td>
      <td className="px-4 py-2 text-sm">{item.accountName}</td>
      <td className="px-4 py-2 text-sm font-mono text-end" dir="ltr">{item.total.toFixed(2)}</td>
    </tr>
  );

  const renderIncomeStatement = () => {
    const data = reportData as { revenue: { accountCode: string; accountName: string; total: number }[]; totalRevenue: number; expenses: { accountCode: string; accountName: string; total: number }[]; totalExpenses: number; netProfit: number };
    return (
      <div className="space-y-6 print:text-black">
        <h2 className="text-xl font-bold text-center">{t('accounting.incomeStatement')}</h2>
        <p className="text-center text-sm text-muted-foreground">{fromDate} → {toDate}</p>

        <div>
          <h3 className="font-semibold mb-2 text-emerald-400">{t('accounting.totalRevenue')}</h3>
          <table className="w-full border rounded-lg overflow-hidden">
            <tbody>
              {data.revenue.map(renderAccountLine)}
              <tr className="border-t bg-emerald-500/5 font-semibold">
                <td colSpan={2} className="px-4 py-2 text-sm">{t('accounting.totalRevenue')}</td>
                <td className="px-4 py-2 text-sm font-mono text-end" dir="ltr">{data.totalRevenue.toFixed(2)} {t('common.sar')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="font-semibold mb-2 text-red-400">{t('accounting.totalExpenses')}</h3>
          <table className="w-full border rounded-lg overflow-hidden">
            <tbody>
              {data.expenses.map(renderAccountLine)}
              <tr className="border-t bg-red-500/5 font-semibold">
                <td colSpan={2} className="px-4 py-2 text-sm">{t('accounting.totalExpenses')}</td>
                <td className="px-4 py-2 text-sm font-mono text-end" dir="ltr">{data.totalExpenses.toFixed(2)} {t('common.sar')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="border-t-2 pt-4">
          <div className="flex justify-between text-lg font-bold">
            <span>{t('admin.netProfit')}</span>
            <span dir="ltr" className={data.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {data.netProfit.toFixed(2)} {t('common.sar')}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderBalanceSheet = () => {
    const data = reportData as { assets: { accountCode: string; accountName: string; total: number }[]; liabilities: { accountCode: string; accountName: string; total: number }[]; equity: { accountCode: string; accountName: string; total: number }[]; totalAssets: number; totalLiabilities: number; totalEquity: number };
    const sections = [
      { title: t('accounting.asset'), items: data.assets, total: data.totalAssets, color: 'blue' },
      { title: t('accounting.liability'), items: data.liabilities, total: data.totalLiabilities, color: 'red' },
      { title: t('accounting.equity'), items: data.equity, total: data.totalEquity, color: 'purple' },
    ];
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-center">{t('accounting.balanceSheet')}</h2>
        <p className="text-center text-sm text-muted-foreground">{fromDate}</p>
        {sections.map((section) => (
          <div key={section.title}>
            <h3 className="font-semibold mb-2">{section.title}</h3>
            <table className="w-full border rounded-lg overflow-hidden">
              <tbody>
                {section.items.map(renderAccountLine)}
                <tr className="border-t bg-muted/50 font-semibold">
                  <td colSpan={2} className="px-4 py-2 text-sm">{t('common.total')}</td>
                  <td className="px-4 py-2 text-sm font-mono text-end" dir="ltr">{section.total.toFixed(2)} {t('common.sar')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>
    );
  };

  const renderVATReport = () => {
    const data = reportData as { vatCollected: number; vatPaid: number; vatDeductible: number; netVat: number };
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-center">{t('accounting.vatReport')}</h2>
        <p className="text-center text-sm text-muted-foreground">{fromDate} → {toDate}</p>
        <div className="max-w-md mx-auto border rounded-lg p-6 space-y-4">
          <div className="flex justify-between">
            <span>{isAr ? 'ضريبة مخرجات (مبيعات)' : 'Output VAT (Sales)'}</span>
            <span className="font-mono" dir="ltr">{data.vatCollected.toFixed(2)} {t('common.sar')}</span>
          </div>
          <div className="flex justify-between">
            <span>{isAr ? 'ضريبة مستردة (إرجاعات)' : 'VAT Refunded (Returns)'}</span>
            <span className="font-mono" dir="ltr">{data.vatPaid.toFixed(2)} {t('common.sar')}</span>
          </div>
          <div className="flex justify-between border-t pt-3">
            <span className="font-medium">{isAr ? 'صافي ضريبة المخرجات' : 'Net Output VAT'}</span>
            <span className="font-mono font-medium" dir="ltr">{(data.vatCollected - data.vatPaid).toFixed(2)} {t('common.sar')}</span>
          </div>
          <div className="flex justify-between">
            <span>{isAr ? 'ضريبة مدخلات (مشتريات)' : 'Input VAT (Purchases)'}</span>
            <span className="font-mono" dir="ltr">{data.vatDeductible.toFixed(2)} {t('common.sar')}</span>
          </div>
          <div className="flex justify-between border-t pt-4 font-bold text-lg">
            <span>{isAr ? 'صافي الضريبة المستحقة' : 'Net VAT Due'}</span>
            <span className="font-mono" dir="ltr">{data.netVat.toFixed(2)} {t('common.sar')}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderGeneralLedger = () => {
    const data = reportData as { entries: { entry: { id: string; date: { toDate?: () => Date }; description: string }; runningBalances: Record<string, number> }[] };
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-center">{t('accounting.generalLedger')}</h2>
        <p className="text-center text-sm text-muted-foreground">{fromDate} → {toDate}</p>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-start px-4 py-2 text-sm">{t('common.date')}</th>
                <th className="text-start px-4 py-2 text-sm">{t('invoice.description')}</th>
                <th className="text-start px-4 py-2 text-sm">{t('accounting.debit')}</th>
                <th className="text-start px-4 py-2 text-sm">{t('accounting.credit')}</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map(({ entry }: { entry: { id: string; date: { toDate?: () => Date }; description: string; lines?: { debit: number; credit: number }[] } }) => {
                const dateStr = entry.date && typeof entry.date === 'object' && 'toDate' in entry.date
                  ? entry.date.toDate!().toLocaleDateString()
                  : '-';
                const totalDebit = (entry as unknown as { lines: { debit: number }[] }).lines?.reduce((s: number, l: { debit: number }) => s + l.debit, 0) || 0;
                const totalCredit = (entry as unknown as { lines: { credit: number }[] }).lines?.reduce((s: number, l: { credit: number }) => s + l.credit, 0) || 0;
                return (
                  <tr key={entry.id} className="border-t">
                    <td className="px-4 py-2 text-sm" dir="ltr">{dateStr}</td>
                    <td className="px-4 py-2 text-sm">{entry.description}</td>
                    <td className="px-4 py-2 text-sm font-mono" dir="ltr">{totalDebit.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm font-mono" dir="ltr">{totalCredit.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const tabs: { key: ReportType; label: string }[] = [
    { key: 'income', label: t('accounting.incomeStatement') },
    { key: 'balance', label: t('accounting.balanceSheet') },
    { key: 'vat', label: t('accounting.vatReport') },
    { key: 'ledger', label: t('accounting.generalLedger') },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('accounting.reports')}</h1>

      {/* Report Type Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setReportType(tab.key); setReportData(null); }}
            className={`flex-shrink-0 px-4 py-2 rounded-md text-sm transition-colors ${
              reportType === tab.key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Date Range Picker */}
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">{t('accounting.fromDate')}</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background text-sm"
            dir="ltr"
          />
        </div>
        {reportType !== 'balance' && (
          <div>
            <label className="block text-sm font-medium mb-1">{t('accounting.toDate')}</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background text-sm"
              dir="ltr"
            />
          </div>
        )}
        <button
          onClick={handleGenerate}
          disabled={loading || !fromDate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm disabled:opacity-50"
        >
          <FileText className="h-4 w-4" />
          {t('accounting.generateReport')}
        </button>
        {reportData && (
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm hover:bg-accent"
          >
            <Printer className="h-4 w-4" />
            {t('common.print')}
          </button>
        )}
      </div>

      {loading && <div className="text-center py-8 text-muted-foreground">{t('common.loading')}</div>}

      {reportData && !loading && (
        <div className="border rounded-lg p-6">
          {reportType === 'income' && renderIncomeStatement()}
          {reportType === 'balance' && renderBalanceSheet()}
          {reportType === 'vat' && renderVATReport()}
          {reportType === 'ledger' && renderGeneralLedger()}
        </div>
      )}
    </div>
  );
}
