import type { Invoice } from '@/types';

function loadImageToBase64(url: string, useCors: boolean): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    if (useCors) img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function fetchLogoBase64(url: string): Promise<string | null> {
  // Try with CORS first (needed for cross-origin canvas export)
  const withCors = await loadImageToBase64(url, true);
  if (withCors) return withCors;
  // Fallback: fetch as blob to bypass CORS canvas tainting
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// pdfmake doesn't implement the Unicode Bidi Algorithm, so Arabic words
// are laid out left-to-right.  Reversing the word order produces the
// correct visual result for RTL text in the generated PDF.
function rtl(text: string): string {
  if (!text) return text;
  // Only reverse if text contains Arabic characters
  if (!/[\u0600-\u06FF]/.test(text)) return text;

  // Split into segments: Arabic words, numbers, punctuation
  // Reverse the overall word order, but keep number/latin tokens intact
  return text.split(' ').reverse().join(' ');
}

export async function generateInvoicePDF(invoice: Invoice, logoUrl?: string | null, sellerNameAr?: string): Promise<void> {
  // pdfmake v0.3.x exports a singleton instance; Vite wraps it in .default
  const pdfMakeModule = await import('pdfmake/build/pdfmake');
  const pdfMake = (pdfMakeModule as unknown as { default?: { addFonts: (f: unknown) => void; createPdf: (def: unknown, opts?: unknown) => { download: (name: string) => Promise<void> } } }).default || pdfMakeModule;

  // Register Arabic-supporting font
  (pdfMake as unknown as { addFonts: (f: unknown) => void }).addFonts({
    Amiri: {
      normal: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/amiri/Amiri-Regular.ttf',
      bold: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/amiri/Amiri-Bold.ttf',
      italics: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/amiri/Amiri-Italic.ttf',
      bolditalics: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/amiri/Amiri-BoldItalic.ttf',
    },
  });

  // Fetch logo as base64 if available
  let logoBase64: string | null = null;
  if (logoUrl) {
    logoBase64 = await fetchLogoBase64(logoUrl);
  }

  // Header: logo + company name
  const headerColumns: unknown[] = [
    {
      stack: [
        { text: rtl(sellerNameAr || invoice.sellerNameAr), fontSize: 16, bold: true, alignment: 'right' as const },
      ],
      width: '*',
    },
  ];

  if (logoBase64) {
    headerColumns.push({
      image: logoBase64,
      width: 60,
      alignment: 'left' as const,
    });
  }

  // Line items with row numbers
  const lineItemRows = invoice.lineItems.map((item, i) => [
    { text: item.lineTotal.toFixed(2), alignment: 'center' as const },
    { text: item.vatAmount.toFixed(2), alignment: 'center' as const },
    { text: item.unitPrice.toFixed(2), alignment: 'center' as const },
    { text: String(item.quantity), alignment: 'center' as const },
    { text: rtl(item.description), alignment: 'right' as const },
    { text: String(i + 1), alignment: 'center' as const },
  ]);

  const isCreditNote = invoice.invoiceType === 'creditNote' || invoice.status === 'cancelled';
  const paymentLabel = rtl(invoice.paymentMethod === 'cash' ? 'نقدي' : invoice.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : 'إلكتروني');

  const docDefinition = {
    pageSize: 'A4' as const,
    pageMargins: [40, 40, 40, 60] as [number, number, number, number],
    content: [
      // Header
      { columns: headerColumns },
      // Accent line
      {
        canvas: [
          { type: 'line' as const, x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 3, lineColor: '#1e40af' },
        ],
        margin: [0, 8, 0, 12] as [number, number, number, number],
      },

      // Invoice title
      { text: rtl(isCreditNote ? 'إشعار دائن ضريبي مبسط' : 'فاتورة ضريبية مبسطة'), style: 'header', alignment: 'center' as const },
      { text: isCreditNote ? 'Simplified Tax Credit Note' : 'Simplified Tax Invoice', style: 'subheader', alignment: 'center' as const },
      { text: invoice.serialNumber != null ? String(invoice.serialNumber) : (invoice.invoiceNumber || '-'), alignment: 'center' as const, fontSize: 12, bold: true, color: '#1e40af', margin: [0, 4, 0, 2] as [number, number, number, number] },
      ...(isCreditNote && invoice.billingReferenceId ? [{ text: rtl(`إشارة إلى فاتورة رقم: ${invoice.billingReferenceId}`), alignment: 'center' as const, fontSize: 10, color: '#666666', margin: [0, 2, 0, 4] as [number, number, number, number] }] : []),
      { text: '', margin: [0, 0, 0, 6] as [number, number, number, number] },

      // Dates meta row
      {
        columns: [
          { text: rtl(`التاريخ الهجري: ${invoice.invoiceDateHijri}`), alignment: 'left' as const, fontSize: 9, color: '#666666' },
          { text: rtl(`التاريخ الميلادي: ${invoice.invoiceDateGregorian}`), alignment: 'right' as const, fontSize: 9, color: '#666666' },
        ],
        margin: [0, 0, 0, 12] as [number, number, number, number],
      },

      // Seller & Buyer info side by side
      {
        columns: [
          {
            stack: [
              { text: rtl('معلومات العميل'), style: 'sectionHeader', alignment: 'right' as const },
              { text: rtl(invoice.buyerName), alignment: 'right' as const },
              { text: invoice.buyerPhone, alignment: 'right' as const, fontSize: 9, color: '#666666' },
              ...(invoice.buyerEmail ? [{ text: invoice.buyerEmail, alignment: 'right' as const, fontSize: 9, color: '#666666' }] : []),
              ...(invoice.carSerialNo ? [{ text: rtl(`رقم هيكل السيارة: ${invoice.carSerialNo}`), alignment: 'right' as const, fontSize: 9, color: '#666666' }] : []),
            ],
            width: '*',
          },
          { text: '', width: 20 },
          {
            stack: [
              { text: rtl('معلومات البائع'), style: 'sectionHeader', alignment: 'right' as const },
              { text: rtl(invoice.sellerNameAr), alignment: 'right' as const },
              { text: rtl(`الرقم الضريبي: ${invoice.sellerVatNumber}`), alignment: 'right' as const, fontSize: 9, color: '#666666' },
              { text: rtl(`السجل التجاري: ${invoice.sellerCrNumber}`), alignment: 'right' as const, fontSize: 9, color: '#666666' },
              { text: rtl(`العنوان: ${invoice.sellerAddress}`), alignment: 'right' as const, fontSize: 9, color: '#666666' },
            ],
            width: '*',
          },
        ],
        margin: [0, 0, 0, 16] as [number, number, number, number],
      },

      // Line items table
      {
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', 'auto', 'auto', '*', 30],
          body: [
            [
              { text: rtl('الإجمالي'), bold: true, alignment: 'center' as const, fillColor: '#1e40af', color: '#ffffff', margin: [0, 4, 0, 4] as [number, number, number, number] },
              { text: rtl('الضريبة'), bold: true, alignment: 'center' as const, fillColor: '#1e40af', color: '#ffffff', margin: [0, 4, 0, 4] as [number, number, number, number] },
              { text: rtl('السعر'), bold: true, alignment: 'center' as const, fillColor: '#1e40af', color: '#ffffff', margin: [0, 4, 0, 4] as [number, number, number, number] },
              { text: rtl('الكمية'), bold: true, alignment: 'center' as const, fillColor: '#1e40af', color: '#ffffff', margin: [0, 4, 0, 4] as [number, number, number, number] },
              { text: rtl('الوصف'), bold: true, alignment: 'right' as const, fillColor: '#1e40af', color: '#ffffff', margin: [0, 4, 0, 4] as [number, number, number, number] },
              { text: '#', bold: true, alignment: 'center' as const, fillColor: '#1e40af', color: '#ffffff', margin: [0, 4, 0, 4] as [number, number, number, number] },
            ],
            ...lineItemRows.map((row, i) =>
              row.map((cell) => ({
                ...cell,
                fillColor: i % 2 === 1 ? '#f9fafb' : undefined,
                margin: [0, 3, 0, 3] as [number, number, number, number],
              }))
            ),
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#e5e7eb',
          vLineColor: () => '#e5e7eb',
        },
      },
      { text: '\n' },

      // Totals
      {
        columns: [
          { text: '', width: '*' },
          {
            width: 200,
            stack: [
              {
                columns: [
                  { text: `${invoice.subtotal.toFixed(2)} ر.س`, alignment: 'left' as const, width: 'auto' },
                  { text: rtl('المجموع الفرعي'), alignment: 'right' as const, width: '*' },
                ],
                margin: [0, 2, 0, 2] as [number, number, number, number],
              },
              {
                columns: [
                  { text: `${invoice.totalVat.toFixed(2)} ر.س`, alignment: 'left' as const, width: 'auto' },
                  { text: rtl('ضريبة القيمة المضافة (15%)'), alignment: 'right' as const, width: '*' },
                ],
                margin: [0, 2, 0, 2] as [number, number, number, number],
              },
              {
                canvas: [
                  { type: 'line' as const, x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1, lineColor: '#1e40af' },
                ],
                margin: [0, 4, 0, 4] as [number, number, number, number],
              },
              {
                columns: [
                  { text: `${invoice.grandTotal.toFixed(2)} ر.س`, alignment: 'left' as const, bold: true, fontSize: 13, width: 'auto' },
                  { text: rtl('الإجمالي الكلي'), alignment: 'right' as const, bold: true, fontSize: 13, width: '*' },
                ],
              },
            ],
          },
        ],
      },
      { text: '\n' },

      // Payment method
      { text: rtl(`طريقة الدفع: ${paymentLabel}`), alignment: 'right' as const, fontSize: 9, color: '#666666' },
      ...(invoice.notes ? [{ text: rtl(`ملاحظات: ${invoice.notes}`), alignment: 'right' as const, fontSize: 9, color: '#666666' }] : []),
      { text: '\n' },

      // QR Code
      ...(invoice.qrCodeData ? [
        { qr: invoice.qrCodeData, fit: 120, alignment: 'center' as const },
        { text: '\n' },
      ] : []),

      // ZATCA compliance footer
      {
        text: rtl(isCreditNote
          ? 'هذا الإشعار صادر وفقاً لمتطلبات المرحلة الأولى من نظام الفوترة الإلكترونية'
          : 'هذه الفاتورة صادرة وفقاً لمتطلبات المرحلة الأولى من نظام الفوترة الإلكترونية'),
        alignment: 'center' as const,
        fontSize: 8,
        color: '#999999',
        margin: [0, 4, 0, 8] as [number, number, number, number],
      },
      {
        canvas: [
          { type: 'line' as const, x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#cccccc' },
        ],
      },
      {
        text: rtl(`الرقم الضريبي: ${invoice.sellerVatNumber}`),
        alignment: 'center' as const,
        fontSize: 8,
        color: '#aaaaaa',
        margin: [0, 4, 0, 0] as [number, number, number, number],
      },
    ],
    styles: {
      header: { fontSize: 16, bold: true },
      subheader: { fontSize: 10, color: '#666666' },
      sectionHeader: { fontSize: 11, bold: true, margin: [0, 0, 0, 4] as [number, number, number, number] },
    },
    defaultStyle: {
      font: 'Amiri',
      fontSize: 10,
    },
  };

  await (pdfMake as unknown as { createPdf: (def: unknown) => { download: (name: string) => Promise<void> } })
    .createPdf(docDefinition)
    .download(`${invoice.serialNumber != null ? invoice.serialNumber : (invoice.invoiceNumber || 'draft')}.pdf`);
}
