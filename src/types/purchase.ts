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
  paymentMethod: 'cash' | 'bank_transfer';
  paymentStatus: PurchasePaymentStatus;
  expenseAccountCode: string;           // Default expense account (e.g. 5xxx)
  attachments: PurchaseAttachment[];
  notes: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  issuedAt: Timestamp | null;
  cancelledAt: Timestamp | null;
  amendedFromPurchaseId: string | null;
}

export type PurchaseInvoiceStatus = 'draft' | 'issued' | 'cancelled';
export type PurchasePaymentStatus = 'unpaid' | 'paid' | 'partially_paid' | 'refunded';

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

// Purchase Payment
export interface PurchasePayment {
  id: string;
  purchaseInvoiceId: string;
  supplierId: string;
  amount: number;
  method: 'cash' | 'bank_transfer';
  journalEntryId: string;
  notes: string;
  recordedBy: string;
  createdAt: Timestamp;
}

// Purchase Invoice Counter
export interface PurchaseInvoiceCounter {
  lastNumber: number;
  lastYear: number;
  lastSerial: number;
  updatedAt: Timestamp;
}
