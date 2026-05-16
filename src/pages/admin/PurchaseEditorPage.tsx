import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, ArrowRight, Upload, X, FileText } from 'lucide-react';
import {
  getPurchaseById, updateDraftPurchase, issuePurchaseInvoice,
  cloneIssuedPurchaseToDraft, deleteDraftPurchase,
  uploadPurchaseAttachment, removePurchaseAttachment,
} from '@/services/purchaseService';
import { getSuppliers } from '@/services/supplierService';
import PurchasePrintView from '@/components/admin/PurchasePrintView';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import type { PurchaseInvoice, PurchaseLineItem, PurchaseAttachment, Supplier } from '@/types/purchase';

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

  useEffect(() => {
    getSuppliers().then(setSuppliers);
  }, []);

  useEffect(() => {
    if (isNew) {
      // Wait for suppliers to load, then show selection
      setLoading(false);
    } else {
      loadPurchase();
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
        supplierAccountCode: supplier.apAccountCode || '',
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
        supplierAccountCode: purchase.supplierAccountCode,
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
        supplierAccountCode: purchase.supplierAccountCode,
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

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    if (!purchase || !supplier) return;
    setPurchase({
      ...purchase,
      supplierId: supplier.id,
      supplierName: supplier.nameAr,
      supplierVatNumber: supplier.vatNumber,
      supplierPhone: supplier.phone,
      supplierAccountCode: supplier.apAccountCode || '',
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

        {error && <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md">{error}</div>}

        <ConfirmDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          title={t('purchase.editIssuedPurchase')}
          description={t('purchase.editIssuedPurchaseConfirm')}
          onConfirm={handleEditIssued}
          loading={editProcessing}
        />
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
          {purchase.supplierAccountCode && (
            <div className="mt-2 px-3 py-2 rounded-md bg-muted/50 text-sm">
              <span className="font-medium">{t('purchase.supplierAccount')}: </span>
              <span className="font-mono" dir="ltr">{purchase.supplierAccountCode}</span>
              <span> - {t('purchase.supplierAccountInfo')}</span>
            </div>
          )}
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

      {/* Notes */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">{t('invoice.notes')}</label>
        <textarea value={purchase.notes} onChange={(e) => setPurchase({ ...purchase, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
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
