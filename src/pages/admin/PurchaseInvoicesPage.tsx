import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Pencil, XCircle, Plus } from 'lucide-react';
import { getPurchaseInvoices, cancelPurchaseInvoice } from '@/services/purchaseService';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import type { PurchaseInvoice } from '@/types/purchase';
import { cn } from '@/lib/utils';
import { INVOICE_STATUS_COLORS, PAYMENT_STATUS_COLORS } from '@/lib/statusColors';

export default function PurchaseInvoicesPage() {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
      if (paymentFilter !== 'all' && inv.paymentStatus !== paymentFilter) return false;
      return true;
    });
  }, [invoices, statusFilter, paymentFilter]);

  const loadData = async () => {
    try {
      setInvoices(await getPurchaseInvoices());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCancel = async () => {
    if (!cancellingId) return;
    await cancelPurchaseInvoice(cancellingId);
    setCancellingId(null);
    loadData();
  };

  if (loading) return <div className="p-6">{t('common.loading')}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('purchase.managePurchases')}</h1>
        <Link
          to="/admin/purchases/new"
          className="flex items-center gap-1 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> {t('purchase.createPurchase')}
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border rounded-md bg-background"
        >
          <option value="all">{t('invoice.allStatuses')}</option>
          <option value="draft">{t('invoice.draft')}</option>
          <option value="issued">{t('invoice.issued')}</option>
          <option value="cancelled">{t('invoice.cancelled')}</option>
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="px-3 py-2 text-sm border rounded-md bg-background"
        >
          <option value="all">{t('invoice.allPaymentStatuses')}</option>
          <option value="unpaid">{t('invoice.unpaid')}</option>
          <option value="paid">{t('invoice.paid')}</option>
          <option value="partially_paid">{t('invoice.partiallyPaid')}</option>
          <option value="refunded">{t('invoice.refunded')}</option>
        </select>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('purchase.purchaseNumber')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('common.date')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('purchase.supplierName')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('purchase.externalRef')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('invoice.grandTotal')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('invoice.paymentStatus')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('common.status')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((inv) => (
              <tr key={inv.id} className="border-t">
                <td className="px-4 py-3 text-sm font-mono" dir="ltr">
                  {inv.serialNumber != null ? inv.serialNumber : (inv.invoiceNumber || t('invoice.draft'))}
                </td>
                <td className="px-4 py-3 text-sm" dir="ltr">{inv.invoiceDateGregorian}</td>
                <td className="px-4 py-3 text-sm">{inv.supplierName}</td>
                <td className="px-4 py-3 text-sm" dir="ltr">{inv.externalInvoiceRef || '-'}</td>
                <td className="px-4 py-3 text-sm" dir="ltr">{inv.grandTotal.toFixed(2)} {t('common.sar')}</td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs px-2 py-1 rounded', PAYMENT_STATUS_COLORS[inv.paymentStatus])}>
                    {t(`invoice.${inv.paymentStatus}`)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs px-2 py-1 rounded', INVOICE_STATUS_COLORS[inv.status])}>
                    {t(`invoice.${inv.status}`)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Link to={`/admin/purchases/${inv.id}`} className="p-1 hover:bg-accent rounded" title={inv.status === 'draft' ? t('invoice.editDraft') : t('common.view')}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                    {inv.status === 'issued' && (
                      <button onClick={() => setCancellingId(inv.id)} className="p-1 hover:bg-accent rounded text-destructive" title={t('purchase.cancelPurchase')}>
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredInvoices.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">{t('common.noData')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!cancellingId}
        onOpenChange={() => setCancellingId(null)}
        title={t('purchase.cancelPurchase')}
        description={t('purchase.cancelPurchaseConfirm')}
        destructive
        onConfirm={handleCancel}
      />
    </div>
  );
}
