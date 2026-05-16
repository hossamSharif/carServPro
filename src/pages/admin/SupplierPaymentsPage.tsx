import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  getSupplierPayments,
  createSupplierPayment,
  updateSupplierPayment,
  deleteSupplierPayment,
} from '@/services/supplierPaymentService';
import { getSuppliers } from '@/services/supplierService';
import { resetPurchaseData } from '@/services/migrations/resetPurchaseData';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import type { Supplier, SupplierPayment, SupplierPaymentType } from '@/types/purchase';

interface PaymentFormState {
  supplierId: string;
  type: SupplierPaymentType;
  amount: string;
  method: 'cash' | 'bank_transfer';
  date: string;
  notes: string;
}

function todayIso(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function emptyForm(): PaymentFormState {
  return {
    supplierId: '',
    type: 'payment',
    amount: '',
    method: 'cash',
    date: todayIso(),
    notes: '',
  };
}

function paymentDate(p: SupplierPayment): Date {
  const anyDate = p.date as unknown;
  if (anyDate && typeof anyDate === 'object' && 'toDate' in (anyDate as object)) {
    return (anyDate as { toDate: () => Date }).toDate();
  }
  return new Date();
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function SupplierPaymentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showResetButton = searchParams.get('reset') === '1';

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterType, setFilterType] = useState<'' | SupplierPaymentType>('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PaymentFormState>(emptyForm());
  const [error, setError] = useState('');

  // Delete confirm
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Reset dev button state
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sup, pays] = await Promise.all([getSuppliers(), getSupplierPayments()]);
      setSuppliers(sup);
      setPayments(pays);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (filterSupplier && p.supplierId !== filterSupplier) return false;
      if (filterType && p.type !== filterType) return false;
      if (filterFrom || filterTo) {
        const d = paymentDate(p);
        if (filterFrom && d < new Date(filterFrom)) return false;
        if (filterTo) {
          const to = new Date(filterTo);
          to.setHours(23, 59, 59, 999);
          if (d > to) return false;
        }
      }
      return true;
    });
  }, [payments, filterSupplier, filterType, filterFrom, filterTo]);

  const totals = useMemo(() => {
    let totalPayments = 0;
    let totalReceipts = 0;
    for (const p of filteredPayments) {
      if (p.type === 'payment') totalPayments += p.amount;
      else totalReceipts += p.amount;
    }
    return { totalPayments, totalReceipts, net: totalPayments - totalReceipts };
  }, [filteredPayments]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (p: SupplierPayment) => {
    setEditingId(p.id);
    setForm({
      supplierId: p.supplierId,
      type: p.type,
      amount: String(p.amount),
      method: p.method,
      date: formatDate(paymentDate(p)),
      notes: p.notes || '',
    });
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.supplierId) {
      setError(t('validation.required'));
      return;
    }
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      setError(t('validation.positiveNumber'));
      return;
    }
    const dateObj = new Date(form.date);
    if (Number.isNaN(dateObj.getTime())) {
      setError(t('validation.required'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await updateSupplierPayment(editingId, {
          type: form.type,
          amount,
          method: form.method,
          date: dateObj,
          notes: form.notes,
        });
      } else {
        const supplier = suppliers.find((s) => s.id === form.supplierId);
        if (!supplier) {
          setError(t('validation.required'));
          setSaving(false);
          return;
        }
        await createSupplierPayment({
          supplierId: supplier.id,
          supplierName: supplier.nameAr,
          supplierAccountCode: supplier.apAccountCode || '',
          type: form.type,
          amount,
          method: form.method,
          date: dateObj,
          notes: form.notes,
        });
      }
      setDialogOpen(false);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setSaving(true);
    try {
      await deleteSupplierPayment(deletingId);
      setDeleteDialogOpen(false);
      setDeletingId(null);
      await loadAll();
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setResetBusy(true);
    setResetMessage('');
    try {
      const summary = await resetPurchaseData();
      setResetMessage(
        `${t('purchase.resetPurchaseDataDone')} ` +
          `suppliers:${summary.suppliers} invoices:${summary.purchaseInvoices} ` +
          `supplierPayments:${summary.supplierPayments} purchasePayments:${summary.purchasePayments} ` +
          `journalEntries:${summary.legacyJournalEntries} accounts:${summary.supplierApAccounts}`,
      );
      setResetDialogOpen(false);
      await loadAll();
    } catch (err) {
      setResetMessage(err instanceof Error ? err.message : 'Error');
    } finally {
      setResetBusy(false);
    }
  };

  if (loading) return <div className="p-6">{t('common.loading')}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('purchase.manageSupplierPayments')}</h1>
        <div className="flex items-center gap-2">
          {showResetButton && (
            <button
              onClick={() => setResetDialogOpen(true)}
              className="px-3 py-2 text-sm border border-destructive text-destructive rounded-md hover:bg-destructive/10"
            >
              {t('purchase.resetPurchaseData')}
            </button>
          )}
          <button
            onClick={openAdd}
            className="flex items-center gap-1 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> {t('purchase.addSupplierPayment')}
          </button>
        </div>
      </div>

      {resetMessage && (
        <div className="mb-4 p-3 text-sm rounded-md border bg-muted/50" dir="ltr">
          {resetMessage}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('purchase.supplierName')}</label>
          <select
            value={filterSupplier}
            onChange={(e) => setFilterSupplier(e.target.value)}
            className="px-3 py-2 text-sm border rounded-md bg-background"
          >
            <option value="">{t('purchase.filterAllSuppliers')}</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nameAr}
                {s.apAccountCode ? ` (${s.apAccountCode})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('purchase.paymentType')}</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as '' | SupplierPaymentType)}
            className="px-3 py-2 text-sm border rounded-md bg-background"
          >
            <option value="">{t('purchase.filterAllTypes')}</option>
            <option value="payment">{t('purchase.payment')}</option>
            <option value="receipt">{t('purchase.receipt')}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('accounting.fromDate')}</label>
          <input
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="px-3 py-2 text-sm border rounded-md bg-background"
            dir="ltr"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('accounting.toDate')}</label>
          <input
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            className="px-3 py-2 text-sm border rounded-md bg-background"
            dir="ltr"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('common.date')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('purchase.supplierName')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('purchase.paymentType')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('purchase.paymentAmount')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('purchase.paymentMethod')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('purchase.paymentNotes')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-3 text-sm" dir="ltr">{formatDate(paymentDate(p))}</td>
                <td className="px-4 py-3 text-sm">
                  <div>{p.supplierName}</div>
                  {p.supplierAccountCode && (
                    <div className="text-xs text-muted-foreground font-mono" dir="ltr">{p.supplierAccountCode}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={
                      p.type === 'payment'
                        ? 'inline-block px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-700'
                        : 'inline-block px-2 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-700'
                    }
                  >
                    {p.type === 'payment' ? t('purchase.payment') : t('purchase.receipt')}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-mono" dir="ltr">
                  {p.amount.toFixed(2)} {t('common.sar')}
                </td>
                <td className="px-4 py-3 text-sm">
                  {t(p.method === 'bank_transfer' ? 'invoice.bankTransfer' : 'invoice.cash')}
                </td>
                <td className="px-4 py-3 text-sm">{p.notes || '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/admin/supplier-statement?supplierId=${p.supplierId}`)}
                      className="p-1 hover:bg-accent rounded text-primary"
                      title={t('purchase.viewStatement')}
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEdit(p)}
                      className="p-1 hover:bg-accent rounded"
                      title={t('purchase.editSupplierPayment')}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingId(p.id);
                        setDeleteDialogOpen(true);
                      }}
                      className="p-1 hover:bg-accent rounded text-destructive"
                      title={t('purchase.deleteSupplierPayment')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredPayments.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  {t('common.noData')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totals footer */}
      <div className="mt-4 flex flex-wrap justify-end gap-6 text-sm">
        <span>
          {t('purchase.totalPayments')}: <strong dir="ltr">{totals.totalPayments.toFixed(2)} {t('common.sar')}</strong>
        </span>
        <span>
          {t('purchase.totalReceipts')}: <strong dir="ltr">{totals.totalReceipts.toFixed(2)} {t('common.sar')}</strong>
        </span>
        <span>
          {t('purchase.netSupplierPayments')}: <strong dir="ltr">{totals.net.toFixed(2)} {t('common.sar')}</strong>
        </span>
      </div>

      {/* Add / Edit Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => !saving && setDialogOpen(false)} />
          <div className="relative bg-background rounded-lg border shadow-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-4">
              {editingId ? t('purchase.editSupplierPayment') : t('purchase.addSupplierPayment')}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">{t('purchase.supplierName')} *</label>
                <select
                  value={form.supplierId}
                  onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                  disabled={!!editingId}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm disabled:opacity-50"
                >
                  <option value="">{t('purchase.selectSupplier')}</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameAr}
                      {s.apAccountCode ? ` (${s.apAccountCode})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('purchase.paymentType')} *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: 'payment' })}
                    className={
                      'px-3 py-2 text-sm border rounded-md transition ' +
                      (form.type === 'payment'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-accent')
                    }
                  >
                    {t('purchase.payment')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: 'receipt' })}
                    className={
                      'px-3 py-2 text-sm border rounded-md transition ' +
                      (form.type === 'receipt'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-accent')
                    }
                  >
                    {t('purchase.receipt')}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('purchase.paymentDate')} *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('purchase.paymentAmount')} *</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('purchase.paymentMethod')} *</label>
                <select
                  value={form.method}
                  onChange={(e) => setForm({ ...form, method: e.target.value as 'cash' | 'bank_transfer' })}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                >
                  <option value="cash">{t('invoice.cash')}</option>
                  <option value="bank_transfer">{t('invoice.bankTransfer')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('purchase.paymentNotes')}</label>
                <input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                />
              </div>
              {error && <div className="text-sm text-destructive">{error}</div>}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDialogOpen(false)}
                disabled={saving}
                className="px-4 py-2 text-sm rounded-md border hover:bg-accent disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.supplierId || !form.amount}
                className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setDeletingId(null);
        }}
        title={t('purchase.deleteSupplierPayment')}
        description={t('purchase.deleteSupplierPaymentConfirm')}
        destructive
        onConfirm={handleDelete}
        loading={saving}
      />

      <ConfirmDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        title={t('purchase.resetPurchaseData')}
        description={t('purchase.resetPurchaseDataConfirm')}
        destructive
        onConfirm={handleReset}
        loading={resetBusy}
      />
    </div>
  );
}
