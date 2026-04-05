import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, ArrowRight, Upload, X, FileText } from 'lucide-react';
import {
  getPurchaseById, updateDraftPurchase, issuePurchaseInvoice,
  cloneIssuedPurchaseToDraft, deleteDraftPurchase,
  uploadPurchaseAttachment, removePurchaseAttachment,
} from '@/services/purchaseService';
import { getPurchasePaymentsByInvoice, recordPurchasePayment } from '@/services/purchasePaymentService';
import { getSuppliers } from '@/services/supplierService';
import { getAccountsByType } from '@/services/accountService';
import PurchasePrintView from '@/components/admin/PurchasePrintView';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import type { PurchaseInvoice, PurchaseLineItem, PurchaseAttachment, Supplier, PurchasePayment } from '@/types/purchase';
import type { Account } from '@/types';

export default function PurchaseEditorPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState<PurchaseInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editProcessing, setEditProcessing] = useState(false);
  const [error, setError] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<Account[]>([]);
  const [payments, setPayments] = useState<PurchasePayment[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer'>('cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Select supplier state
  const [selectedSupplierId, setSelectedSupplierId] = useState('');

  const isNew = !id;

  const loadPurchase = async () => {
    if (!id) return;
    try {
      const data = await getPurchaseById(id);
      setPurchase(data);
      if (data) setSelectedSupplierId(data.supplierId);
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    if (!id) return;
    const data = await getPurchasePaymentsByInvoice(id);
    setPayments(data);
  };

  useEffect(() => {
    getSuppliers().then(setSuppliers);
    getAccountsByType('expense').then(setExpenseAccounts);
  }, []);

  useEffect(() => {
    if (isNew) {
      // Wait for suppliers to load, then show selection
      setLoading(false);
    } else {
      loadPurchase();
      loadPayments();
    }
  }, [id]);

  const handleCreateNew = async () => {
    const supplier = suppliers.find((s) => s.id === selectedSupplierId);
    if (!supplier) return;
    setSaving(true);
    setError('');
    try {
      const { createPurchaseInvoice } = await import('@/services/purchaseService');
      const newId = await createPurchaseInvoice({
        supplierId: supplier.id,
        supplierName: supplier.nameAr,
        supplierVatNumber: supplier.vatNumber,
        supplierPhone: supplier.phone,
      });
      navigate(`/admin/purchases/${newId}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditIssued = async () => {
    if (!id) return;
    setEditProcessing(true);
    setError('');
    try {
      const newDraftId = await cloneIssuedPurchaseToDraft(id);
      navigate(`/admin/purchases/${newDraftId}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setEditProcessing(false);
      setEditDialogOpen(false);
    }
  };

  const updateLineItem = (index: number, field: keyof PurchaseLineItem, value: string | number) => {
    if (!purchase) return;
    const items = [...purchase.lineItems];
    const item = { ...items[index], [field]: value };

    const subtotalLine = item.unitPrice * item.quantity;
    item.vatAmount = subtotalLine * item.vatRate;
    item.lineTotal = subtotalLine + item.vatAmount;
    items[index] = item;

    const totalSubtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const totalVat = items.reduce((s, i) => s + i.vatAmount, 0);

    setPurchase({ ...purchase, lineItems: items, subtotal: totalSubtotal, totalVat, grandTotal: totalSubtotal + totalVat });
  };

  const addLineItem = () => {
    if (!purchase) return;
    setPurchase({
      ...purchase,
      lineItems: [
        ...purchase.lineItems,
        { description: '', descriptionEn: '', quantity: 1, unitPrice: 0, vatRate: 0.15, vatAmount: 0, lineTotal: 0 },
      ],
    });
  };

  const removeLineItem = (index: number) => {
    if (!purchase || purchase.lineItems.length <= 1) return;
    const items = purchase.lineItems.filter((_, i) => i !== index);
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const totalVat = items.reduce((s, i) => s + i.vatAmount, 0);
    setPurchase({ ...purchase, lineItems: items, subtotal, totalVat, grandTotal: subtotal + totalVat });
  };

  const handleSave = async () => {
    if (!purchase || !id) return;
    setSaving(true);
    setError('');
    try {
      const recalcItems = purchase.lineItems.map((item) => {
        const sub = item.unitPrice * item.quantity;
        const vat = sub * item.vatRate;
        return { ...item, vatAmount: vat, lineTotal: sub + vat };
      });
      await updateDraftPurchase(id, {
        supplierId: purchase.supplierId,
        supplierName: purchase.supplierName,
        supplierVatNumber: purchase.supplierVatNumber,
        supplierPhone: purchase.supplierPhone,
        externalInvoiceRef: purchase.externalInvoiceRef,
        lineItems: recalcItems,
        paymentMethod: purchase.paymentMethod,
        expenseAccountCode: purchase.expenseAccountCode,
        notes: purchase.notes,
        attachments: purchase.attachments,
      });
      await loadPurchase();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleIssue = async () => {
    if (!id || !purchase) return;
    setSaving(true);
    setError('');
    try {
      // Save first
      const recalcItems = purchase.lineItems.map((item) => {
        const sub = item.unitPrice * item.quantity;
        const vat = sub * item.vatRate;
        return { ...item, vatAmount: vat, lineTotal: sub + vat };
      });
      await updateDraftPurchase(id, {
        supplierId: purchase.supplierId,
        supplierName: purchase.supplierName,
        supplierVatNumber: purchase.supplierVatNumber,
        supplierPhone: purchase.supplierPhone,
        externalInvoiceRef: purchase.externalInvoiceRef,
        lineItems: recalcItems,
        paymentMethod: purchase.paymentMethod,
        expenseAccountCode: purchase.expenseAccountCode,
        notes: purchase.notes,
        attachments: purchase.attachments,
      });
      await issuePurchaseInvoice(id);
      await loadPurchase();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
      setIssueDialogOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setSaving(true);
    setError('');
    try {
      await deleteDraftPurchase(id);
      navigate('/admin/purchases', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!purchase || !id || !e.target.files?.[0]) return;
    setSaving(true);
    try {
      const attachment = await uploadPurchaseAttachment(id, e.target.files[0]);
      const updatedAttachments = [...purchase.attachments, attachment];
      setPurchase({ ...purchase, attachments: updatedAttachments });
      await updateDraftPurchase(id, { attachments: updatedAttachments });
    } finally {
      setSaving(false);
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = async (att: PurchaseAttachment) => {
    if (!purchase || !id) return;
    await removePurchaseAttachment(att);
    const updatedAttachments = purchase.attachments.filter((a) => a.path !== att.path);
    setPurchase({ ...purchase, attachments: updatedAttachments });
    await updateDraftPurchase(id, { attachments: updatedAttachments });
  };

  const handleRecordPayment = async () => {
    if (!id || !purchase) return;
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) return;
    setSaving(true);
    setError('');
    try {
      await recordPurchasePayment({
        purchaseInvoiceId: id,
        supplierId: purchase.supplierId,
        amount,
        method: paymentMethod,
        notes: paymentNotes,
        invoiceNumber: purchase.invoiceNumber,
        supplierName: purchase.supplierName,
      });
      setPaymentDialogOpen(false);
      setPaymentAmount('');
      setPaymentNotes('');
      await loadPurchase();
      await loadPayments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    if (!purchase || !supplier) return;
    setPurchase({
      ...purchase,
      supplierId: supplier.id,
      supplierName: supplier.nameAr,
      supplierVatNumber: supplier.vatNumber,
      supplierPhone: supplier.phone,
    });
  };

  if (loading) return <div className="p-6">{t('common.loading')}</div>;

  // ── New purchase: select supplier ──
  if (isNew) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <button
          onClick={() => navigate('/admin/purchases')}
          className="flex items-center gap-1 mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowRight className="h-4 w-4" /> {t('nav.purchaseInvoices')}
        </button>
        <h1 className="text-2xl font-bold mb-6">{t('purchase.createPurchase')}</h1>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('purchase.selectSupplier')} *</label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background text-sm"
            >
              <option value="">{t('purchase.selectSupplier')}</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.nameAr}{s.nameEn ? ` (${s.nameEn})` : ''}</option>
              ))}
            </select>
          </div>
          {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">{error}</div>}
          <button
            onClick={handleCreateNew}
            disabled={!selectedSupplierId || saving}
            className="w-full px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? t('common.loading') : t('purchase.createPurchase')}
          </button>
        </div>
      </div>
    );
  }

  if (!purchase) return <div className="p-6">{t('common.noData')}</div>;

  // ── Issued/cancelled: show print view ──
  if (purchase.status !== 'draft') {
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = purchase.grandTotal - totalPaid;
    return (
      <div className="max-w-4xl">
        <button
          onClick={() => navigate('/admin/purchases')}
          className="flex items-center gap-1 mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowRight className="h-4 w-4" /> {t('nav.purchaseInvoices')}
        </button>
        <PurchasePrintView
          purchase={purchase}
          onEdit={purchase.status === 'issued' ? () => setEditDialogOpen(true) : undefined}
        />

        {/* Payments section for issued invoices */}
        {purchase.status === 'issued' && (
          <div className="mt-6 border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{t('purchase.payments')}</h3>
              {remaining > 0.01 && (
                <button
                  onClick={() => { setPaymentAmount(remaining.toFixed(2)); setPaymentDialogOpen(true); }}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" /> {t('purchase.recordPayment')}
                </button>
              )}
            </div>
            {payments.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-start px-3 py-2">{t('common.date')}</th>
                    <th className="text-start px-3 py-2">{t('common.amount')}</th>
                    <th className="text-start px-3 py-2">{t('purchase.paymentMethod')}</th>
                    <th className="text-start px-3 py-2">{t('invoice.notes')}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="px-3 py-2" dir="ltr">
                        {p.createdAt && typeof p.createdAt === 'object' && 'toDate' in p.createdAt
                          ? (p.createdAt as { toDate: () => Date }).toDate().toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="px-3 py-2 font-mono" dir="ltr">{p.amount.toFixed(2)} {t('common.sar')}</td>
                      <td className="px-3 py-2">{t(`invoice.${p.method === 'bank_transfer' ? 'bankTransfer' : p.method}`)}</td>
                      <td className="px-3 py-2">{p.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted-foreground">{t('purchase.noPayments')}</p>
            )}
            <div className="mt-3 flex gap-6 text-sm border-t pt-3">
              <span>{t('purchase.totalPaid')}: <strong dir="ltr">{totalPaid.toFixed(2)} {t('common.sar')}</strong></span>
              <span>{t('purchase.remainingBalance')}: <strong dir="ltr">{remaining.toFixed(2)} {t('common.sar')}</strong></span>
            </div>
          </div>
        )}

        {error && <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md">{error}</div>}

        <ConfirmDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          title={t('purchase.editIssuedPurchase')}
          description={t('purchase.editIssuedPurchaseConfirm')}
          onConfirm={handleEditIssued}
          loading={editProcessing}
        />

        {/* Payment Dialog */}
        {paymentDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50" onClick={() => !saving && setPaymentDialogOpen(false)} />
            <div className="relative bg-background rounded-lg border shadow-lg p-6 w-full max-w-sm mx-4">
              <h2 className="text-lg font-semibold mb-4">{t('purchase.recordPayment')}</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('purchase.paymentAmount')} *</label>
                  <input type="number" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="w-full px-3 py-2 border rounded-md bg-background text-sm" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('purchase.paymentMethod')}</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'bank_transfer')} className="w-full px-3 py-2 border rounded-md bg-background text-sm">
                    <option value="cash">{t('invoice.cash')}</option>
                    <option value="bank_transfer">{t('invoice.bankTransfer')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('purchase.paymentNotes')}</label>
                  <input value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setPaymentDialogOpen(false)} disabled={saving} className="px-4 py-2 text-sm rounded-md border hover:bg-accent disabled:opacity-50">
                  {t('common.cancel')}
                </button>
                <button onClick={handleRecordPayment} disabled={saving || !paymentAmount} className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  {saving ? t('common.loading') : t('common.confirm')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Draft: editable form ──
  return (
    <div className="max-w-4xl">
      <button
        onClick={() => navigate('/admin/purchases')}
        className="flex items-center gap-1 mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowRight className="h-4 w-4" /> {t('nav.purchaseInvoices')}
      </button>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {purchase.serialNumber != null ? purchase.serialNumber : (purchase.invoiceNumber || t('invoice.draft'))}
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setDeleteDialogOpen(true)} disabled={saving} className="px-4 py-2 text-sm border border-destructive text-destructive rounded-md hover:bg-destructive/10 disabled:opacity-50">
            {t('purchase.deleteDraftPurchase')}
          </button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm border rounded-md hover:bg-accent disabled:opacity-50">
            {t('invoice.saveDraft')}
          </button>
          <button onClick={() => setIssueDialogOpen(true)} disabled={saving} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50">
            {t('purchase.issuePurchase')}
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md">{error}</div>}

      {/* Supplier & Purchase Info */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="font-semibold mb-2">{t('purchase.supplierName')}</h3>
          <select
            value={purchase.supplierId}
            onChange={(e) => handleSupplierChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background text-sm"
          >
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.nameAr}{s.nameEn ? ` (${s.nameEn})` : ''}</option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            {purchase.supplierVatNumber && <>{t('purchase.supplierVat')}: <span dir="ltr">{purchase.supplierVatNumber}</span><br /></>}
            {purchase.supplierPhone && <><span dir="ltr">{purchase.supplierPhone}</span></>}
          </p>
        </div>
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="font-semibold mb-2">{t('purchase.purchaseInvoice')}</h3>
          <div>
            <label className="block text-sm font-medium mb-1">{t('purchase.externalRef')}</label>
            <input value={purchase.externalInvoiceRef} onChange={(e) => setPurchase({ ...purchase, externalInvoiceRef: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('purchase.expenseAccount')}</label>
            <select
              value={purchase.expenseAccountCode}
              onChange={(e) => setPurchase({ ...purchase, expenseAccountCode: e.target.value })}
              className="w-full px-3 py-2 border rounded-md bg-background text-sm"
            >
              {expenseAccounts.map((a) => (
                <option key={a.id} value={a.code}>{a.code} - {a.nameAr}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="border rounded-lg mb-6">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-start px-3 py-2 text-sm">{t('invoice.description')}</th>
              <th className="text-start px-3 py-2 text-sm w-20">{t('customer.quantity')}</th>
              <th className="text-start px-3 py-2 text-sm w-28">{t('invoice.unitPrice')}</th>
              <th className="text-start px-3 py-2 text-sm w-24">{t('invoice.vatAmount')}</th>
              <th className="text-start px-3 py-2 text-sm w-28">{t('invoice.lineTotal')}</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {purchase.lineItems.map((item, i) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-2">
                  <input
                    value={item.description}
                    onChange={(e) => updateLineItem(i, 'description', e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm bg-background"
                  />
                </td>
                <td className="px-3 py-2">
                  <input type="number" value={item.quantity} onChange={(e) => updateLineItem(i, 'quantity', parseInt(e.target.value) || 0)} className="w-full px-2 py-1 border rounded text-sm bg-background" dir="ltr" min="1" />
                </td>
                <td className="px-3 py-2">
                  <input type="number" step="0.01" value={item.unitPrice} onChange={(e) => updateLineItem(i, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1 border rounded text-sm bg-background" dir="ltr" />
                </td>
                <td className="px-3 py-2 text-sm" dir="ltr">{item.vatAmount.toFixed(2)}</td>
                <td className="px-3 py-2 text-sm font-medium" dir="ltr">{item.lineTotal.toFixed(2)}</td>
                <td className="px-3 py-2">
                  <button onClick={() => removeLineItem(i)} className="p-1 hover:bg-accent rounded text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={addLineItem} className="flex items-center gap-1 px-3 py-2 text-sm text-primary hover:bg-accent w-full">
          <Plus className="h-4 w-4" /> {t('invoice.addLineItem')}
        </button>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm">
            <span>{t('invoice.subtotal')}</span>
            <span dir="ltr">{purchase.subtotal.toFixed(2)} {t('common.sar')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>{t('invoice.totalVat')} (15%)</span>
            <span dir="ltr">{purchase.totalVat.toFixed(2)} {t('common.sar')}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg border-t pt-2">
            <span>{t('invoice.grandTotal')}</span>
            <span dir="ltr">{purchase.grandTotal.toFixed(2)} {t('common.sar')}</span>
          </div>
        </div>
      </div>

      {/* Attachments */}
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-2">{t('purchase.attachments')}</h3>
        <div className="flex flex-wrap gap-2 mb-2">
          {purchase.attachments.map((att, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm bg-muted/50">
              <FileText className="h-4 w-4" />
              <a href={att.url} target="_blank" rel="noreferrer" className="hover:underline">{att.name}</a>
              <button onClick={() => handleRemoveAttachment(att)} className="text-destructive hover:bg-accent rounded p-0.5">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <label className="flex items-center gap-1 px-3 py-2 text-sm text-primary hover:bg-accent rounded-md cursor-pointer w-fit border border-dashed">
          <Upload className="h-4 w-4" /> {t('purchase.uploadAttachment')}
          <input type="file" className="hidden" onChange={handleUploadAttachment} disabled={saving} />
        </label>
      </div>

      {/* Payment Method & Notes */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">{t('invoice.paymentMethod')}</label>
          <select
            value={purchase.paymentMethod}
            onChange={(e) => setPurchase({ ...purchase, paymentMethod: e.target.value as 'cash' | 'bank_transfer' })}
            className="w-full px-3 py-2 border rounded-md bg-background text-sm"
          >
            <option value="cash">{t('invoice.cash')}</option>
            <option value="bank_transfer">{t('invoice.bankTransfer')}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('invoice.notes')}</label>
          <textarea value={purchase.notes} onChange={(e) => setPurchase({ ...purchase, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
        </div>
      </div>

      {/* Dates */}
      <div className="flex gap-6 text-sm text-muted-foreground">
        <span>{t('invoice.gregorianDate')}: {purchase.invoiceDateGregorian}</span>
        <span>{t('invoice.hijriDate')}: {purchase.invoiceDateHijri}</span>
      </div>

      <ConfirmDialog
        open={issueDialogOpen}
        onOpenChange={setIssueDialogOpen}
        title={t('purchase.issuePurchase')}
        description={t('purchase.issuePurchaseConfirm')}
        onConfirm={handleIssue}
      />
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t('purchase.deleteDraftPurchase')}
        description={t('purchase.deleteDraftPurchaseConfirm')}
        onConfirm={handleDelete}
        loading={saving}
      />
    </div>
  );
}
