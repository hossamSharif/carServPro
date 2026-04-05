import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, ChevronDown, ArrowRight } from 'lucide-react';
import { getInvoiceById, updateDraftInvoice, issueInvoice, cloneIssuedInvoiceToDraft, createStandaloneInvoice, deleteDraftInvoice } from '@/services/invoiceService';
import { getPaymentsByInvoice } from '@/services/paymentService';
import { getServices } from '@/services/serviceService';
import { getBusinessProfile } from '@/services/settingsService';
import InvoicePrintView from '@/components/admin/InvoicePrintView';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import type { Invoice, InvoiceLineItem, Service } from '@/types';

export default function InvoiceEditorPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editProcessing, setEditProcessing] = useState(false);
  const [hasPayments, setHasPayments] = useState(false);
  const [error, setError] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [sellerNameAr, setSellerNameAr] = useState('');
  const [sellerNameEn, setSellerNameEn] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [serviceDropdownIndex, setServiceDropdownIndex] = useState<number | null>(null);
  const [serviceSearch, setServiceSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isNew = !id;

  const loadInvoice = async () => {
    if (!id) return;
    try {
      const data = await getInvoiceById(id);
      setInvoice(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isNew) {
      // Create a new standalone invoice and redirect to it
      createStandaloneInvoice().then((newId) => {
        navigate(`/admin/invoices/${newId}`, { replace: true });
      }).catch(() => {
        setError(t('common.error'));
        setLoading(false);
      });
    } else {
      loadInvoice();
    }
  }, [id]);

  // Check if issued invoice has payments
  useEffect(() => {
    if (id && invoice?.status === 'issued') {
      getPaymentsByInvoice(id).then((payments) => {
        setHasPayments(payments.some((p) => p.status === 'success'));
      });
    }
  }, [id, invoice?.status]);

  const handleEditIssued = async () => {
    if (!id) return;
    setEditProcessing(true);
    setError('');
    try {
      const newDraftId = await cloneIssuedInvoiceToDraft(id);
      navigate(`/admin/invoices/${newDraftId}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setEditProcessing(false);
      setEditDialogOpen(false);
    }
  };

  useEffect(() => {
    getBusinessProfile().then((profile) => {
      if (profile) {
        setLogoUrl(profile.logoUrl);
        setSellerNameAr(profile.nameAr || '');
        setSellerNameEn(profile.nameEn || '');
      }
    });
    getServices().then(setServices);
  }, []);

  // Close service dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setServiceDropdownIndex(null);
        setServiceSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const updateLineItem = (index: number, field: keyof InvoiceLineItem, value: string | number) => {
    if (!invoice) return;
    const items = [...invoice.lineItems];
    const item = { ...items[index], [field]: value };

    // Recalculate
    const subtotal = item.unitPrice * item.quantity;
    item.vatAmount = subtotal * item.vatRate;
    item.lineTotal = subtotal + item.vatAmount;
    items[index] = item;

    const totalSubtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const totalVat = items.reduce((s, i) => s + i.vatAmount, 0);

    setInvoice({
      ...invoice,
      lineItems: items,
      subtotal: totalSubtotal,
      totalVat,
      grandTotal: totalSubtotal + totalVat,
    });
  };

  const selectServiceForLine = (index: number, service: Service) => {
    if (!invoice) return;
    const items = [...invoice.lineItems];
    const unitPrice = service.price;
    const quantity = items[index].quantity || 1;
    const subtotalLine = unitPrice * quantity;
    const vatAmount = subtotalLine * 0.15;
    items[index] = {
      ...items[index],
      description: service.nameAr,
      descriptionEn: service.nameEn,
      unitPrice,
      quantity,
      vatRate: 0.15,
      vatAmount,
      lineTotal: subtotalLine + vatAmount,
    };

    const totalSubtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const totalVat = items.reduce((s, i) => s + i.vatAmount, 0);
    setInvoice({ ...invoice, lineItems: items, subtotal: totalSubtotal, totalVat, grandTotal: totalSubtotal + totalVat });
    setServiceDropdownIndex(null);
    setServiceSearch('');
  };

  const addLineItem = () => {
    if (!invoice) return;
    const newIndex = invoice.lineItems.length;
    setInvoice({
      ...invoice,
      lineItems: [
        ...invoice.lineItems,
        { description: '', descriptionEn: '', quantity: 1, unitPrice: 0, vatRate: 0.15, vatAmount: 0, lineTotal: 0 },
      ],
    });
    setServiceDropdownIndex(newIndex);
    setServiceSearch('');
  };

  const removeLineItem = (index: number) => {
    if (!invoice || invoice.lineItems.length <= 1) return;
    const items = invoice.lineItems.filter((_, i) => i !== index);
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const totalVat = items.reduce((s, i) => s + i.vatAmount, 0);
    setInvoice({ ...invoice, lineItems: items, subtotal, totalVat, grandTotal: subtotal + totalVat });
  };

  const handleSave = async () => {
    if (!invoice || !id) return;
    setSaving(true);
    setError('');
    try {
      // Recalculate all line items before save to ensure consistency
      const recalcItems = invoice.lineItems.map((item) => {
        const sub = item.unitPrice * item.quantity;
        const vat = sub * item.vatRate;
        return { ...item, vatAmount: vat, lineTotal: sub + vat };
      });
      await updateDraftInvoice(id, {
        lineItems: recalcItems,
        buyerName: invoice.buyerName,
        buyerPhone: invoice.buyerPhone,
        carSerialNo: invoice.carSerialNo,
        notes: invoice.notes,
        paymentMethod: invoice.paymentMethod,
        paymentStatus: invoice.paymentStatus,
      });
      await loadInvoice();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleIssue = async () => {
    if (!id || !invoice) return;
    setSaving(true);
    setError('');
    try {
      // Save current in-memory edits before issuing
      const recalcItems = invoice.lineItems.map((item) => {
        const sub = item.unitPrice * item.quantity;
        const vat = sub * item.vatRate;
        return { ...item, vatAmount: vat, lineTotal: sub + vat };
      });
      await updateDraftInvoice(id, {
        lineItems: recalcItems,
        buyerName: invoice.buyerName,
        buyerPhone: invoice.buyerPhone,
        carSerialNo: invoice.carSerialNo,
        notes: invoice.notes,
        paymentMethod: invoice.paymentMethod,
        paymentStatus: invoice.paymentStatus,
      });
      await issueInvoice(id);
      await loadInvoice();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
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
      await deleteDraftInvoice(id);
      navigate('/admin/invoices', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSaving(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) return <div className="p-6">{t('common.loading')}</div>;
  if (!invoice) return <div className="p-6">{t('common.noData')}</div>;

  // ── Issued invoice: show professional print view ──────────────────────────
  if (invoice.status !== 'draft') {
    return (
      <div className="max-w-4xl">
        <button
          onClick={() => navigate('/admin/invoices')}
          className="flex items-center gap-1 mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowRight className="h-4 w-4" /> {t('nav.invoices')}
        </button>
        <InvoicePrintView
          invoice={invoice}
          logoUrl={logoUrl}
          sellerNameAr={sellerNameAr}
          sellerNameEn={sellerNameEn}
          onEdit={invoice.status === 'issued' ? () => setEditDialogOpen(true) : undefined}
        />
        {error && (
          <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md">{error}</div>
        )}
        <ConfirmDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          title={t('invoice.editIssuedInvoice')}
          description={
            hasPayments
              ? `${t('invoice.editIssuedConfirm')}\n\n${t('invoice.editIssuedPaymentWarning')}`
              : t('invoice.editIssuedConfirm')
          }
          onConfirm={handleEditIssued}
          loading={editProcessing}
        />
      </div>
    );
  }

  // ── Draft invoice: show editable form ─────────────────────────────────────
  return (
    <div className="max-w-4xl">
      <button
        onClick={() => navigate('/admin/invoices')}
        className="flex items-center gap-1 mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowRight className="h-4 w-4" /> {t('nav.invoices')}
      </button>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {invoice.serialNumber != null ? invoice.serialNumber : (invoice.invoiceNumber || t('invoice.draft'))}
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setDeleteDialogOpen(true)} disabled={saving} className="px-4 py-2 text-sm border border-destructive text-destructive rounded-md hover:bg-destructive/10 disabled:opacity-50">
            {t('invoice.deleteDraft')}
          </button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm border rounded-md hover:bg-accent disabled:opacity-50">
            {t('invoice.saveDraft')}
          </button>
          <button onClick={() => setIssueDialogOpen(true)} disabled={saving} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50">
            {t('invoice.issueInvoice')}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md">{error}</div>
      )}

      {/* Seller & Buyer Info */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">{t('invoice.sellerInfo')}</h3>
          <p className="text-sm">{invoice.sellerNameAr}</p>
          <p className="text-sm text-muted-foreground">{t('invoice.vatNumber')}: {invoice.sellerVatNumber}</p>
          <p className="text-sm text-muted-foreground">{t('invoice.crNumber')}: {invoice.sellerCrNumber}</p>
          <p className="text-sm text-muted-foreground">{invoice.sellerAddress}</p>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">{t('invoice.buyerInfo')}</h3>
          <div className="space-y-2">
            <input value={invoice.buyerName} onChange={(e) => setInvoice({ ...invoice, buyerName: e.target.value })} className="w-full px-2 py-1 border rounded text-sm bg-background" placeholder={t('auth.fullName')} />
            <input value={invoice.buyerPhone} onChange={(e) => setInvoice({ ...invoice, buyerPhone: e.target.value })} className="w-full px-2 py-1 border rounded text-sm bg-background" dir="ltr" placeholder={t('auth.phone')} />
            <input value={invoice.carSerialNo} onChange={(e) => setInvoice({ ...invoice, carSerialNo: e.target.value })} className="w-full px-2 py-1 border rounded text-sm bg-background" dir="ltr" placeholder={t('invoice.carSerialNo')} />
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
            {invoice.lineItems.map((item, i) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-2 relative">
                  <div className="flex gap-1">
                    <input
                      value={item.description}
                      onChange={(e) => updateLineItem(i, 'description', e.target.value)}
                      className="w-full px-2 py-1 border rounded text-sm bg-background"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setServiceDropdownIndex(serviceDropdownIndex === i ? null : i);
                        setServiceSearch('');
                      }}
                      className="px-1 border rounded hover:bg-accent shrink-0"
                      title={t('services.services')}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                  {serviceDropdownIndex === i && (
                    <div ref={dropdownRef} className="absolute z-50 top-full start-3 end-3 mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-auto">
                      <input
                        autoFocus
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        placeholder={t('common.search')}
                        className="w-full px-3 py-2 text-sm border-b bg-background sticky top-0"
                      />
                      {services
                        .filter((s) => {
                          const q = serviceSearch.toLowerCase();
                          return !q || s.nameAr.toLowerCase().includes(q) || s.nameEn.toLowerCase().includes(q);
                        })
                        .map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => selectServiceForLine(i, s)}
                            className="w-full text-start px-3 py-2 text-sm hover:bg-accent flex justify-between items-center"
                          >
                            <span>{s.nameAr}</span>
                            <span className="text-muted-foreground" dir="ltr">{s.price.toFixed(2)}</span>
                          </button>
                        ))}
                      {services.length === 0 && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">{t('common.noData')}</div>
                      )}
                    </div>
                  )}
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
            <span dir="ltr">{invoice.subtotal.toFixed(2)} {t('common.sar')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>{t('invoice.totalVat')} (15%)</span>
            <span dir="ltr">{invoice.totalVat.toFixed(2)} {t('common.sar')}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg border-t pt-2">
            <span>{t('invoice.grandTotal')}</span>
            <span dir="ltr">{invoice.grandTotal.toFixed(2)} {t('common.sar')}</span>
          </div>
        </div>
      </div>

      {/* Payment & Notes */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">{t('invoice.paymentMethod')}</label>
          <select
            value={invoice.paymentMethod}
            onChange={(e) => setInvoice({ ...invoice, paymentMethod: e.target.value as Invoice['paymentMethod'] })}
            className="w-full px-3 py-2 border rounded-md bg-background text-sm"
          >
            <option value="cash">{t('invoice.cash')}</option>
            <option value="bank_transfer">{t('invoice.bankTransfer')}</option>
            <option value="online">{t('invoice.online')}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('invoice.paymentStatus')}</label>
          <select
            value={invoice.paymentStatus}
            onChange={(e) => setInvoice({ ...invoice, paymentStatus: e.target.value as Invoice['paymentStatus'] })}
            className="w-full px-3 py-2 border rounded-md bg-background text-sm"
          >
            <option value="unpaid">{t('invoice.unpaid')}</option>
            <option value="paid">{t('invoice.paid')}</option>
            <option value="partially_paid">{t('invoice.partiallyPaid')}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('invoice.notes')}</label>
          <textarea value={invoice.notes} onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
        </div>
      </div>

      {/* Dates */}
      <div className="flex gap-6 text-sm text-muted-foreground">
        <span>{t('invoice.gregorianDate')}: {invoice.invoiceDateGregorian}</span>
        <span>{t('invoice.hijriDate')}: {invoice.invoiceDateHijri}</span>
      </div>

      <ConfirmDialog
        open={issueDialogOpen}
        onOpenChange={setIssueDialogOpen}
        title={t('invoice.issueInvoice')}
        description={t('invoice.issueConfirm')}
        onConfirm={handleIssue}
      />
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t('invoice.deleteDraft')}
        description={t('invoice.deleteDraftConfirm')}
        onConfirm={handleDelete}
        loading={saving}
      />
    </div>
  );
}
