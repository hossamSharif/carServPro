import QRCode from 'qrcode';

export function encodeTLV(
  sellerName: string,
  vatNumber: string,
  timestamp: string,
  invoiceTotal: string,
  vatAmount: string
): string {
  const encoder = new TextEncoder();
  const fields = [
    { tag: 1, value: sellerName },
    { tag: 2, value: vatNumber },
    { tag: 3, value: timestamp },
    { tag: 4, value: invoiceTotal },
    { tag: 5, value: vatAmount },
  ];

  const encodedFields = fields.map((f) => ({
    tag: f.tag,
    valueBytes: encoder.encode(f.value),
  }));

  const totalLength = encodedFields.reduce((sum, f) => sum + 1 + 1 + f.valueBytes.length, 0);
  const tlvBytes = new Uint8Array(totalLength);
  let offset = 0;

  for (const { tag, valueBytes } of encodedFields) {
    tlvBytes[offset++] = tag;
    tlvBytes[offset++] = valueBytes.length;
    tlvBytes.set(valueBytes, offset);
    offset += valueBytes.length;
  }

  let binary = '';
  for (let i = 0; i < tlvBytes.length; i++) {
    binary += String.fromCharCode(tlvBytes[i]);
  }
  return btoa(binary);
}

export async function generateQRDataUrl(tlvBase64: string): Promise<string> {
  return QRCode.toDataURL(tlvBase64, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    width: 200,
  });
}
