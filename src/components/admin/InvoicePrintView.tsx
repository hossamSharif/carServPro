import { useTranslation } from 'react-i18next';
import { Printer, Download, Pencil } from 'lucide-react';
import { generateInvoicePDF } from '@/lib/invoice-pdf';
import { generateQRDataUrl } from '@/lib/zatca-qr';
import { useState, useEffect } from 'react';
import type { Invoice } from '@/types';

interface InvoicePrintViewProps {
  invoice: Invoice;
  logoUrl?: string | null;
  sellerNameAr?: string;
  sellerNameEn?: string;
  onEdit?: () => void;
}

export default function InvoicePrintView({ invoice, logoUrl, sellerNameAr, sellerNameEn, onEdit }: InvoicePrintViewProps) {
  const { t } = useTranslation();
  const isCreditNote = invoice.invoiceType === 'creditNote' || invoice.status === 'cancelled';
  const [qrImageUrl, setQrImageUrl] = useState('');

  useEffect(() => {
    if (invoice.qrCodeData) {
      generateQRDataUrl(invoice.qrCodeData).then(setQrImageUrl);
    }
  }, [invoice.qrCodeData]);

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .invoice-print-area, .invoice-print-area * { visibility: visible; }
          .invoice-print-area {
            position: absolute;
            inset: 0;
            background: white;
            color: black;
            padding: 15mm;
            font-size: 11pt;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print { display: none !important; }
          @page { margin: 10mm; size: A4; }
        }
      `}</style>

      {/* Action Buttons */}
      <div className="no-print flex items-center gap-2 mb-4 justify-end">
        {onEdit && invoice.status === 'issued' && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1 px-3 py-2 text-sm border border-yellow-500 text-yellow-700 rounded-md hover:bg-yellow-50"
          >
            <Pencil className="h-4 w-4" /> {t('invoice.editIssuedInvoice')}
          </button>
        )}
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1 px-3 py-2 text-sm border rounded-md hover:bg-accent"
        >
          <Printer className="h-4 w-4" /> {t('invoice.printInvoice')}
        </button>
        <button
          onClick={() => generateInvoicePDF(invoice, logoUrl, sellerNameAr)}
          className="flex items-center gap-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Download className="h-4 w-4" /> {t('invoice.downloadPDF')}
        </button>
      </div>

      {/* Printable A4 Layout */}
      <div
        className="invoice-print-area bg-white text-black mx-auto max-w-[210mm] border rounded-lg print:border-none print:rounded-none"
        dir="rtl"
        style={{ fontFamily: 'Tajawal, Arial, sans-serif', padding: '32px' }}
      >
        {/* ── Header Band ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{sellerNameAr || invoice.sellerNameAr}</h2>
            {sellerNameEn && (
              <p className="text-sm text-gray-500 mt-0.5">{sellerNameEn}</p>
            )}
          </div>
          {logoUrl && (
            <div className="flex-shrink-0 ms-4">
              <img
                src={logoUrl}
                alt="Company Logo"
                className="h-16 w-auto object-contain"
                style={{ maxWidth: '160px' }}
              />
            </div>
          )}
        </div>
        <div className="h-1 bg-black rounded mb-6" />

        {/* ── Invoice Title ───────────────────────────────────────── */}
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold text-gray-900">
            {isCreditNote ? t('invoice.creditNote') : t('invoice.taxInvoice')}
          </h1>
          <p className="text-sm text-gray-500">
            {isCreditNote ? t('invoice.creditNoteEn') : 'Simplified Tax Invoice'}
          </p>
          <p className="text-base font-semibold mt-1 text-black" dir="ltr">
            {invoice.serialNumber != null ? invoice.serialNumber : (invoice.invoiceNumber || t('invoice.draft'))}
          </p>
          {isCreditNote && invoice.billingReferenceId && (
            <p className="text-sm text-gray-600 mt-1">
              {t('invoice.billingReference')}: <span className="font-semibold" dir="ltr">{invoice.billingReferenceId}</span>
            </p>
          )}
        </div>

        {/* ── Meta Row (dates) ────────────────────────────────────── */}
        <div
          className="flex items-center justify-center gap-6 text-sm text-gray-600 mb-5 py-2 px-4 rounded"
          style={{ backgroundColor: '#f8f9fa' }}
        >
          <span>{t('invoice.gregorianDate')}: <strong dir="ltr">{invoice.invoiceDateGregorian}</strong></span>
          <span className="text-gray-300">|</span>
          <span>{t('invoice.hijriDate')}: <strong dir="ltr">{invoice.invoiceDateHijri}</strong></span>
        </div>

        {/* ── Seller & Buyer Info ─────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Seller */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-2 pb-1 border-b border-gray-200 text-gray-700">
              {t('invoice.sellerInfo')}
            </h3>
            <p className="text-sm font-medium text-gray-900">{invoice.sellerNameAr}</p>
            <p className="text-xs text-gray-600 mt-1">
              {t('invoice.vatNumber')}: <span dir="ltr">{invoice.sellerVatNumber}</span>
            </p>
            <p className="text-xs text-gray-600">
              {t('invoice.crNumber')}: <span dir="ltr">{invoice.sellerCrNumber}</span>
            </p>
            <p className="text-xs text-gray-600">{invoice.sellerAddress}</p>
          </div>

          {/* Buyer */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-2 pb-1 border-b border-gray-200 text-gray-700">
              {t('invoice.buyerInfo')}
            </h3>
            <p className="text-sm font-medium text-gray-900">{invoice.buyerName}</p>
            <p className="text-xs text-gray-600 mt-1" dir="ltr">{invoice.buyerPhone}</p>
            {invoice.buyerEmail && (
              <p className="text-xs text-gray-600" dir="ltr">{invoice.buyerEmail}</p>
            )}
            {invoice.carSerialNo && (
              <p className="text-xs text-gray-600">
                {t('invoice.carSerialNo')}: <span dir="ltr">{invoice.carSerialNo}</span>
              </p>
            )}
          </div>
        </div>

        {/* ── Line Items Table ────────────────────────────────────── */}
        <table className="w-full mb-6 text-sm border-collapse border border-gray-200">
          <thead>
            <tr style={{ backgroundColor: '#000000', color: 'white' }}>
              <th className="text-center px-3 py-2.5 border border-gray-300 w-10 font-medium">#</th>
              <th className="text-start px-3 py-2.5 border border-gray-300 font-medium">{t('invoice.description')}</th>
              <th className="text-center px-3 py-2.5 border border-gray-300 w-16 font-medium">{t('customer.quantity')}</th>
              <th className="text-center px-3 py-2.5 border border-gray-300 w-24 font-medium">{t('invoice.unitPrice')}</th>
              <th className="text-center px-3 py-2.5 border border-gray-300 w-24 font-medium">{t('invoice.vatAmount')}</th>
              <th className="text-center px-3 py-2.5 border border-gray-300 w-24 font-medium">{t('invoice.lineTotal')}</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item, i) => (
              <tr key={i} className={i % 2 === 1 ? '' : ''} style={i % 2 === 1 ? { backgroundColor: '#f9fafb' } : {}}>
                <td className="text-center px-3 py-2 border border-gray-200 text-gray-500">{i + 1}</td>
                <td className="px-3 py-2 border border-gray-200">{item.description}</td>
                <td className="text-center px-3 py-2 border border-gray-200" dir="ltr">{item.quantity}</td>
                <td className="text-center px-3 py-2 border border-gray-200" dir="ltr">{item.unitPrice.toFixed(2)}</td>
                <td className="text-center px-3 py-2 border border-gray-200" dir="ltr">{item.vatAmount.toFixed(2)}</td>
                <td className="text-center px-3 py-2 border border-gray-200 font-medium" dir="ltr">{item.lineTotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Totals Block ────────────────────────────────────────── */}
        <div className="flex justify-start mb-6">
          <div className="w-72 text-sm">
            <div className="flex justify-between py-1.5 px-3">
              <span className="text-gray-600">{t('invoice.subtotal')}</span>
              <span dir="ltr" className="font-medium">{invoice.subtotal.toFixed(2)} {t('common.sar')}</span>
            </div>
            <div className="flex justify-between py-1.5 px-3">
              <span className="text-gray-600">{t('invoice.totalVat')} (15%)</span>
              <span dir="ltr" className="font-medium">{invoice.totalVat.toFixed(2)} {t('common.sar')}</span>
            </div>
            <div
              className="flex justify-between py-2.5 px-3 font-bold text-base rounded mt-1"
              style={{ backgroundColor: '#000000', color: 'white' }}
            >
              <span>{t('invoice.grandTotal')}</span>
              <span dir="ltr">{invoice.grandTotal.toFixed(2)} {t('common.sar')}</span>
            </div>
          </div>
        </div>

        {/* ── Payment & Notes ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="py-2 px-3 rounded" style={{ backgroundColor: '#f8f9fa' }}>
            <span className="font-medium text-gray-700">{t('invoice.paymentMethod')}: </span>
            <span>{t(`invoice.${invoice.paymentMethod === 'bank_transfer' ? 'bankTransfer' : invoice.paymentMethod}`)}</span>
          </div>
          {invoice.notes && (
            <div className="py-2 px-3 rounded" style={{ backgroundColor: '#f8f9fa' }}>
              <span className="font-medium text-gray-700">{t('invoice.notes')}: </span>
              <span>{invoice.notes}</span>
            </div>
          )}
        </div>

        {/* ── QR Code & ZATCA Footer ──────────────────────────────── */}
        <div className="border-t border-gray-200 pt-5">
          {qrImageUrl && (
            <div className="text-center mb-3">
              <img src={qrImageUrl} alt="ZATCA QR Code" className="mx-auto" style={{ width: '120px', height: '120px' }} />
            </div>
          )}

          <p className="text-center text-xs text-gray-500 mb-4">
            {isCreditNote
              ? t('invoice.creditNoteZatcaFooter')
              : 'هذه الفاتورة صادرة وفقاً لمتطلبات المرحلة الأولى من نظام الفوترة الإلكترونية'}
          </p>

          <div className="h-px bg-gray-300 mb-2" />
          <p className="text-center text-xs text-gray-400">
            {t('invoice.vatNumber')}: {invoice.sellerVatNumber}
          </p>
        </div>
      </div>
    </>
  );
}
