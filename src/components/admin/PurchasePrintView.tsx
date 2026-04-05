import { useTranslation } from 'react-i18next';
import { Printer, Pencil } from 'lucide-react';
import type { PurchaseInvoice } from '@/types/purchase';

interface PurchasePrintViewProps {
  purchase: PurchaseInvoice;
  onEdit?: () => void;
}

export default function PurchasePrintView({ purchase, onEdit }: PurchasePrintViewProps) {
  const { t } = useTranslation();
  const isCancelled = purchase.status === 'cancelled';

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .purchase-print-area, .purchase-print-area * { visibility: visible; }
          .purchase-print-area {
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
        {onEdit && purchase.status === 'issued' && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1 px-3 py-2 text-sm border border-yellow-500 text-yellow-700 rounded-md hover:bg-yellow-50"
          >
            <Pencil className="h-4 w-4" /> {t('purchase.editIssuedPurchase')}
          </button>
        )}
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1 px-3 py-2 text-sm border rounded-md hover:bg-accent"
        >
          <Printer className="h-4 w-4" /> {t('common.print')}
        </button>
      </div>

      {/* Printable A4 Layout */}
      <div
        className="purchase-print-area bg-white text-black mx-auto max-w-[210mm] border rounded-lg print:border-none print:rounded-none"
        dir="rtl"
        style={{ fontFamily: 'Tajawal, Arial, sans-serif', padding: '32px' }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-900">
            {isCancelled ? 'فاتورة مشتريات ملغاة' : t('purchase.purchaseInvoice')}
          </h1>
          <p className="text-sm text-gray-500">Purchase Invoice</p>
          <p className="text-base font-semibold mt-1 text-blue-700" dir="ltr">
            {purchase.serialNumber != null ? purchase.serialNumber : (purchase.invoiceNumber || t('invoice.draft'))}
          </p>
          {purchase.amendedFromPurchaseId && (
            <p className="text-sm text-gray-600 mt-1">
              {t('purchase.amendedFrom')}: <span className="font-semibold">{purchase.amendedFromPurchaseId}</span>
            </p>
          )}
        </div>

        {/* Meta Row */}
        <div
          className="flex items-center justify-center gap-6 text-sm text-gray-600 mb-5 py-2 px-4 rounded"
          style={{ backgroundColor: '#f8f9fa' }}
        >
          <span>{t('invoice.gregorianDate')}: <strong dir="ltr">{purchase.invoiceDateGregorian}</strong></span>
          <span className="text-gray-300">|</span>
          <span>{t('invoice.hijriDate')}: <strong dir="ltr">{purchase.invoiceDateHijri}</strong></span>
        </div>

        {/* Supplier Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-2 pb-1 border-b border-gray-200 text-gray-700">
              {t('purchase.supplierName')}
            </h3>
            <p className="text-sm font-medium text-gray-900">{purchase.supplierName}</p>
            {purchase.supplierVatNumber && (
              <p className="text-xs text-gray-600 mt-1">
                {t('purchase.supplierVat')}: <span dir="ltr">{purchase.supplierVatNumber}</span>
              </p>
            )}
            {purchase.supplierPhone && (
              <p className="text-xs text-gray-600" dir="ltr">{purchase.supplierPhone}</p>
            )}
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-2 pb-1 border-b border-gray-200 text-gray-700">
              {t('purchase.externalRef')}
            </h3>
            <p className="text-sm font-medium text-gray-900" dir="ltr">{purchase.externalInvoiceRef || '-'}</p>
            <p className="text-xs text-gray-600 mt-2">
              {t('invoice.paymentMethod')}: {t(`invoice.${purchase.paymentMethod === 'bank_transfer' ? 'bankTransfer' : purchase.paymentMethod}`)}
            </p>
          </div>
        </div>

        {/* Line Items Table */}
        <table className="w-full mb-6 text-sm border-collapse border border-gray-200">
          <thead>
            <tr style={{ backgroundColor: '#1e40af', color: 'white' }}>
              <th className="text-center px-3 py-2.5 border border-gray-300 w-10 font-medium">#</th>
              <th className="text-start px-3 py-2.5 border border-gray-300 font-medium">{t('invoice.description')}</th>
              <th className="text-center px-3 py-2.5 border border-gray-300 w-16 font-medium">{t('customer.quantity')}</th>
              <th className="text-center px-3 py-2.5 border border-gray-300 w-24 font-medium">{t('invoice.unitPrice')}</th>
              <th className="text-center px-3 py-2.5 border border-gray-300 w-24 font-medium">{t('invoice.vatAmount')}</th>
              <th className="text-center px-3 py-2.5 border border-gray-300 w-24 font-medium">{t('invoice.lineTotal')}</th>
            </tr>
          </thead>
          <tbody>
            {purchase.lineItems.map((item, i) => (
              <tr key={i} style={i % 2 === 1 ? { backgroundColor: '#f9fafb' } : {}}>
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

        {/* Totals Block */}
        <div className="flex justify-start mb-6">
          <div className="w-72 text-sm">
            <div className="flex justify-between py-1.5 px-3">
              <span className="text-gray-600">{t('invoice.subtotal')}</span>
              <span dir="ltr" className="font-medium">{purchase.subtotal.toFixed(2)} {t('common.sar')}</span>
            </div>
            <div className="flex justify-between py-1.5 px-3">
              <span className="text-gray-600">{t('invoice.totalVat')} (15%)</span>
              <span dir="ltr" className="font-medium">{purchase.totalVat.toFixed(2)} {t('common.sar')}</span>
            </div>
            <div
              className="flex justify-between py-2.5 px-3 font-bold text-base rounded mt-1"
              style={{ backgroundColor: '#1e40af', color: 'white' }}
            >
              <span>{t('invoice.grandTotal')}</span>
              <span dir="ltr">{purchase.grandTotal.toFixed(2)} {t('common.sar')}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {purchase.notes && (
          <div className="text-sm py-2 px-3 rounded mb-4" style={{ backgroundColor: '#f8f9fa' }}>
            <span className="font-medium text-gray-700">{t('invoice.notes')}: </span>
            <span>{purchase.notes}</span>
          </div>
        )}
      </div>
    </>
  );
}
