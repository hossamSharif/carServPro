export interface StatementLineInput {
  date: string;        // yyyy-mm-dd
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface StatementPdfInput {
  supplierName: string;
  supplierAccountCode: string;
  fromDate: string;
  toDate: string;
  openingBalance: number;
  lines: StatementLineInput[];
  closingBalance: number;
}

function rtl(text: string): string {
  if (!text) return text;
  if (!/[؀-ۿ]/.test(text)) return text;
  return text.split(' ').reverse().join(' ');
}

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
  const withCors = await loadImageToBase64(url, true);
  if (withCors) return withCors;
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

export async function generateSupplierStatementPDF(
  data: StatementPdfInput,
  logoUrl?: string | null,
  sellerNameAr?: string,
): Promise<void> {
  const pdfMakeModule = await import('pdfmake/build/pdfmake');
  const pdfMake = (pdfMakeModule as unknown as {
    default?: {
      addFonts: (f: unknown) => void;
      createPdf: (def: unknown, opts?: unknown) => { download: (name: string) => Promise<void> };
    };
  }).default || pdfMakeModule;

  (pdfMake as unknown as { addFonts: (f: unknown) => void }).addFonts({
    Amiri: {
      normal: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/amiri/Amiri-Regular.ttf',
      bold: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/amiri/Amiri-Bold.ttf',
      italics: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/amiri/Amiri-Italic.ttf',
      bolditalics: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/amiri/Amiri-BoldItalic.ttf',
    },
  });

  let logoBase64: string | null = null;
  if (logoUrl) logoBase64 = await fetchLogoBase64(logoUrl);

  const headerColumns: unknown[] = [
    {
      stack: [
        { text: rtl(sellerNameAr || ''), fontSize: 16, bold: true, alignment: 'right' as const },
        { text: rtl('كشف حساب مورد'), fontSize: 12, bold: true, alignment: 'right' as const, margin: [0, 2, 0, 0] as [number, number, number, number] },
      ],
      width: '*',
    },
  ];
  if (logoBase64) {
    headerColumns.push({ image: logoBase64, width: 60, alignment: 'left' as const });
  }

  const tableBody: unknown[][] = [
    [
      { text: rtl('الرصيد'), bold: true, alignment: 'center' as const, fillColor: '#1e40af', color: '#ffffff', margin: [0, 4, 0, 4] as [number, number, number, number] },
      { text: rtl('دائن'), bold: true, alignment: 'center' as const, fillColor: '#1e40af', color: '#ffffff', margin: [0, 4, 0, 4] as [number, number, number, number] },
      { text: rtl('مدين'), bold: true, alignment: 'center' as const, fillColor: '#1e40af', color: '#ffffff', margin: [0, 4, 0, 4] as [number, number, number, number] },
      { text: rtl('الوصف'), bold: true, alignment: 'right' as const, fillColor: '#1e40af', color: '#ffffff', margin: [0, 4, 0, 4] as [number, number, number, number] },
      { text: rtl('التاريخ'), bold: true, alignment: 'center' as const, fillColor: '#1e40af', color: '#ffffff', margin: [0, 4, 0, 4] as [number, number, number, number] },
    ],
  ];

  if (data.openingBalance !== 0) {
    tableBody.push([
      { text: data.openingBalance.toFixed(2), alignment: 'center' as const, fillColor: '#f3f4f6', bold: true },
      { text: '-', alignment: 'center' as const, fillColor: '#f3f4f6' },
      { text: '-', alignment: 'center' as const, fillColor: '#f3f4f6' },
      { text: rtl('رصيد أول المدة'), alignment: 'right' as const, fillColor: '#f3f4f6', bold: true },
      { text: '-', alignment: 'center' as const, fillColor: '#f3f4f6' },
    ]);
  }

  data.lines.forEach((line, i) => {
    const bg = i % 2 === 1 ? '#f9fafb' : undefined;
    tableBody.push([
      { text: line.balance.toFixed(2), alignment: 'center' as const, fillColor: bg },
      { text: line.credit > 0 ? line.credit.toFixed(2) : '-', alignment: 'center' as const, fillColor: bg },
      { text: line.debit > 0 ? line.debit.toFixed(2) : '-', alignment: 'center' as const, fillColor: bg },
      { text: rtl(line.description), alignment: 'right' as const, fillColor: bg },
      { text: line.date, alignment: 'center' as const, fillColor: bg },
    ]);
  });

  if (data.lines.length === 0 && data.openingBalance === 0) {
    tableBody.push([
      { text: rtl('لا توجد بيانات'), alignment: 'center' as const, colSpan: 5, color: '#999999' },
      {},
      {},
      {},
      {},
    ]);
  }

  const docDefinition = {
    pageSize: 'A4' as const,
    pageMargins: [40, 40, 40, 60] as [number, number, number, number],
    content: [
      { columns: headerColumns },
      {
        canvas: [{ type: 'line' as const, x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 3, lineColor: '#1e40af' }],
        margin: [0, 8, 0, 12] as [number, number, number, number],
      },
      {
        columns: [
          { text: rtl(`من: ${data.fromDate}`), alignment: 'left' as const, fontSize: 10 },
          { text: rtl(`إلى: ${data.toDate}`), alignment: 'center' as const, fontSize: 10 },
          { text: rtl(`المورد: ${data.supplierName}`), alignment: 'right' as const, fontSize: 10, bold: true },
        ],
        margin: [0, 0, 0, 4] as [number, number, number, number],
      },
      ...(data.supplierAccountCode
        ? [{
            text: rtl(`رقم الحساب: ${data.supplierAccountCode}`),
            alignment: 'right' as const,
            fontSize: 9,
            color: '#666666',
            margin: [0, 0, 0, 10] as [number, number, number, number],
          }]
        : [{ text: '', margin: [0, 0, 0, 10] as [number, number, number, number] }]),
      {
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', 'auto', '*', 'auto'],
          body: tableBody,
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#e5e7eb',
          vLineColor: () => '#e5e7eb',
        },
      },
      { text: '\n' },
      {
        columns: [
          { text: '', width: '*' },
          {
            width: 220,
            stack: [
              {
                columns: [
                  { text: `${data.closingBalance.toFixed(2)} ر.س`, alignment: 'left' as const, bold: true, fontSize: 13 },
                  { text: rtl('رصيد آخر المدة'), alignment: 'right' as const, bold: true, fontSize: 13 },
                ],
                margin: [0, 2, 0, 2] as [number, number, number, number],
              },
            ],
          },
        ],
      },
    ],
    styles: {
      header: { fontSize: 16, bold: true },
    },
    defaultStyle: {
      font: 'Amiri',
      fontSize: 10,
    },
  };

  const filename = `supplier-statement-${data.supplierAccountCode || 'all'}-${data.fromDate}-${data.toDate}.pdf`;
  await (pdfMake as unknown as { createPdf: (def: unknown) => { download: (name: string) => Promise<void> } })
    .createPdf(docDefinition)
    .download(filename);
}
