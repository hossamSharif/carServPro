import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Printer, Download } from 'lucide-react';
import { getInvoiceById, updateDraftInvoice, issueInvoice } from '@/services/invoiceService';
import { generateInvoicePDF } from '@/lib/invoice-pdf';
import { generateQRDataUrl } from '@/lib/zatca-qr';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import type { Invoice, InvoiceLineItem } from '@/types';

export default function InvoiceEditorPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [error, setError] = useState('');

  const loadInvoice = async () => {
    if (!id) return;
    try {
      const data = await getInvoiceById(id);
      setInvoice(data);
      if (data?.qrCodeData) {
        const url = await generateQRDataUrl(data.qrCodeData);
        setQrImageUrl(url);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInvoice(); }, [id]);

  const isDraft = invoice?.status === 'draft';

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

  const addLineItem = () => {
    if (!invoice) return;
    setInvoice({
      ...invoice,
      lineItems: [
        ...invoice.lineItems,
        { description: '', descriptionEn: '', quantity: 1, unitPrice: 0, vatRate: 0.15, vatAmount: 0, lineTotal: 0 },
      ],
    });
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
      await updateDraftInvoice(id, {
        lineItems: invoice.lineItems,
        buyerName: invoice.buyerName,
        buyerPhone: invoice.buyerPhone,
        notes: invoice.notes,
        paymentMethod: invoice.paymentMethod,
      });
      loadInvoice();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleIssue = async () => {
    if (!id) return;
    setSaving(true);
    setError('');
    try {
      await issueInvoice(id);
      loadInvoice();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSaving(false);
      setIssueDialogOpen(false);
    }
  };

  if (loading) return <div className="p-6">{t('common.loading')}</div>;
  if (!invoice) return <div className="p-6">{t('common.noData')}</div>;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {invoice.invoiceNumber || t('invoice.draft')}
        </h1>
        <div className="flex items-center gap-2">
          {isDraft && (
            <>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm border rounded-md hover:bg-accent disabled:opacity-50">
                {t('invoice.saveDraft')}
              </button>
              <button onClick={() => setIssueDialogOpen(true)} disabled={saving} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50">
                {t('invoice.issueInvoice')}
              </button>
            </>
          )}
          {invoice.status === 'issued' && (
            <>
              <button onClick={() => window.print()} className="flex items-center gap-1 px-3 py-2 text-sm border rounded-md hover:bg-accent">
                <Printer className="h-4 w-4" /> {t('invoice.printInvoice')}
              </button>
              <button onClick={() => generateInvoicePDF(invoice)} className="flex items-center gap-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                <Download className="h-4 w-4" /> {t('invoice.downloadPDF')}
              </button>
            </>
          )}
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
          {isDraft ? (
            <div className="space-y-2">
              <input value={invoice.buyerName} onChange={(e) => setInvoice({ ...invoice, buyerName: e.target.value })} className="w-full px-2 py-1 border rounded text-sm bg-background" placeholder={t('auth.fullName')} />
              <input value={invoice.buyerPhone} onChange={(e) => setInvoice({ ...invoice, buyerPhone: e.target.value })} className="w-full px-2 py-1 border rounded text-sm bg-background" dir="ltr" placeholder={t('auth.phone')} />
            </div>
          ) : (
            <>
              <p className="text-sm">{invoice.buyerName}</p>
              <p className="text-sm text-muted-foreground">{invoice.buyerPhone}</p>
              <p className="text-sm text-muted-foreground">{invoice.buyerEmail}</p>
            </>
          )}
        </div>
      </div>

      {/* Line Items */}
      <div className="border rounded-lg overflow-hidden mb-6">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-start px-3 py-2 text-sm">{t('invoice.description')}</th>
              <th className="text-start px-3 py-2 text-sm w-20">{t('customer.quantity')}</th>
              <th className="text-start px-3 py-2 text-sm w-28">{t('invoice.unitPrice')}</th>
              <th className="text-start px-3 py-2 text-sm w-24">{t('invoice.vatAmount')}</th>
              <th className="text-start px-3 py-2 text-sm w-28">{t('invoice.lineTotal')}</th>
              {isDraft && <th className="w-10"></th>}
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item, i) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-2">
                  {isDraft ? (
                    <input value={item.description} onChange={(e) => updateLineItem(i, 'description', e.target.value)} className="w-full px-2 py-1 border rounded text-sm bg-background" />
                  ) : (
                    <span className="text-sm">{item.description}</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {isDraft ? (
                    <input type="number" value={item.quantity} onChange={(e) => updateLineItem(i, 'quantity', parseInt(e.target.value) || 0)} className="w-full px-2 py-1 border rounded text-sm bg-background" dir="ltr" min="1" />
                  ) : (
                    <span className="text-sm" dir="ltr">{item.quantity}</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {isDraft ? (
                    <input type="number" step="0.01" value={item.unitPrice} onChange={(e) => updateLineItem(i, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1 border rounded text-sm bg-background" dir="ltr" />
                  ) : (
                    <span className="text-sm" dir="ltr">{item.unitPrice.toFixed(2)}</span>
                  )}
                </td>
                <td className="px-3 py-2 text-sm" dir="ltr">{item.vatAmount.toFixed(2)}</td>
                <td className="px-3 py-2 text-sm font-medium" dir="ltr">{item.lineTotal.toFixed(2)}</td>
                {isDraft && (
                  <td className="px-3 py-2">
                    <button onClick={() => removeLineItem(i)} className="p-1 hover:bg-accent rounded text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {isDraft && (
          <button onClick={addLineItem} className="flex items-center gap-1 px-3 py-2 text-sm text-primary hover:bg-accent w-full">
            <Plus className="h-4 w-4" /> {t('invoice.addLineItem')}
          </button>
        )}
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
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">{t('invoice.paymentMethod')}</label>
          {isDraft ? (
            <select
              value={invoice.paymentMethod}
              onChange={(e) => setInvoice({ ...invoice, paymentMethod: e.target.value as Invoice['paymentMethod'] })}
              className="w-full px-3 py-2 border rounded-md bg-background text-sm"
            >
              <option value="cash">{t('invoice.cash')}</option>
              <option value="bank_transfer">{t('invoice.bankTransfer')}</option>
              <option value="online">{t('invoice.online')}</option>
            </select>
          ) : (
            <p className="text-sm">{t(`invoice.${invoice.paymentMethod === 'bank_transfer' ? 'bankTransfer' : invoice.paymentMethod}`)}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('invoice.notes')}</label>
          {isDraft ? (
            <textarea value={invoice.notes} onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
          ) : (
            <p className="text-sm">{invoice.notes || '-'}</p>
          )}
        </div>
      </div>

      {/* QR Code */}
      {qrImageUrl && (
        <div className="text-center mb-6">
          <img src={qrImageUrl} alt="ZATCA QR Code" className="mx-auto" />
        </div>
      )}

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
    </div>
  );
}
