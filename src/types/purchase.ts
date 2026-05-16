import { Timestamp } from 'firebase/firestore';

// Supplier
export interface Supplier {
  id: string;
  nameAr: string;
  nameEn: string;
  phone: string;
  email: string;
  vatNumber: string;
  address: string;
  apAccountCode?: string;
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Purchase Invoice
export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string | null;        // PINV-YYYY-#### (assigned on issue)
  serialNumber: number | null;
  status: PurchaseInvoiceStatus;
  supplierId: string;
  supplierName: string;                 // Denormalized
  supplierVatNumber: string;
  supplierPhone: string;
  externalInvoiceRef: string;           // Supplier's own invoice number
  lineItems: PurchaseLineItem[];
  subtotal: number;
  totalVat: number;
  grandTotal: number;
  invoiceDateGregorian: string;
  invoiceDateHijri: string;
  supplierAccountCode: string;          // Supplier's AP sub-account code (e.g. 2101)
  attachments: PurchaseAttachment[];
  notes: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  issuedAt: Timestamp | null;
  cancelledAt: Timestamp | null;
  amendedFromPurchaseId: string | null;
}

export type PurchaseInvoiceStatus = 'draft' | 'issued' | 'cancelled';

export interface PurchaseLineItem {
  description: string;
  descriptionEn: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;          // 0.15
  vatAmount: number;
  lineTotal: number;
}

export interface PurchaseAttachment {
  name: string;
  url: string;
  path: string;             // Firebase Storage path
}

// Supplier Payment (standalone — not tied to a specific purchase invoice)
export interface SupplierPayment {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierAccountCode: string;
  type: SupplierPaymentType;
  amount: number;
  method: 'cash' | 'bank_transfer';
  date: Timestamp;
  notes: string;
  journalEntryId: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export type SupplierPaymentType = 'payment' | 'receipt';

// Purchase Invoice Counter
export interface PurchaseInvoiceCounter {
  lastNumber: number;
  lastYear: number;
  lastSerial: number;
  updatedAt: Timestamp;
}
