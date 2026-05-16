import { Timestamp } from 'firebase/firestore';

// User (Customer)
export interface User {
  uid: string;
  email: string;
  fullName: string;
  phone: string;
  role?: 'admin' | 'moderator' | 'customer';
  createdAt: Timestamp;
  active: boolean;
  reservationCount: number;
}

// Category
export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  sortOrder: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Service
export interface Service {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  categoryId: string;
  price: number;
  imageUrl: string;
  imagePath: string;
  hidden: boolean;
  offer: ServiceOffer | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ServiceOffer {
  type: 'percentage' | 'fixed';
  value: number;
  expiresAt: Timestamp;
}

// Reservation
export interface Reservation {
  id: string;
  referenceNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  services: ReservationService[];
  date: string;
  slotTime: string;
  notes: string;
  status: ReservationStatus;
  invoiceId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ReservationService {
  serviceId: string;
  nameAr: string;
  nameEn: string;
  price: number;
  quantity: number;
  offerDiscount: number;
}

export type ReservationStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

// Slot Booking
export interface SlotBooking {
  date: string;
  slotTime: string;
  currentBookings: number;
  maxCapacity: number;
  reservationIds: string[];
}

// Invoice
export interface Invoice {
  id: string;
  invoiceNumber: string | null;
  serialNumber: number | null;
  status: InvoiceStatus;
  reservationId: string | null;
  sellerNameAr: string;
  sellerVatNumber: string;
  sellerCrNumber: string;
  sellerAddress: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  carSerialNo: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  totalVat: number;
  grandTotal: number;
  invoiceDateGregorian: string;
  invoiceDateHijri: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  invoiceType: 'simplified' | 'creditNote';
  billingReferenceId: string | null;
  qrCodeData: string;
  notes: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  issuedAt: Timestamp | null;
  cancelledAt: Timestamp | null;
  amendedFromInvoiceId: string | null;
}

export interface InvoiceLineItem {
  description: string;
  descriptionEn: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  vatAmount: number;
  lineTotal: number;
}

export type InvoiceStatus = 'draft' | 'issued' | 'cancelled';

// Invoice Counter
export interface InvoiceCounter {
  lastNumber: number;
  lastYear: number;
  lastSerial: number;
  updatedAt: Timestamp;
}

// Payment
export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  status: 'pending' | 'success' | 'failed';
  gatewayProvider: string | null;
  gatewayTransactionId: string | null;
  gatewayResponse: Record<string, unknown> | null;
  recordedBy: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'online';
export type PaymentStatus = 'unpaid' | 'paid' | 'partially_paid' | 'refunded';

// Account (Chart of Accounts)
export interface Account {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  type: AccountType;
  isSystem: boolean;
  active: boolean;
  supplierId?: string;
  createdAt: Timestamp;
}

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

// Journal Entry
export interface JournalEntry {
  id: string;
  date: Timestamp;
  description: string;
  lines: JournalLine[];
  sourceType: 'invoice' | 'invoice_cancellation' | 'expense' | 'asset' | 'manual' | 'purchase' | 'purchase_cancellation' | 'supplier_payment' | 'supplier_payment_reversal';
  sourceId: string | null;
  createdBy: string;
  createdAt: Timestamp;
}

export interface JournalLine {
  accountId: string;
  accountCode: string;
  accountNameAr: string;
  debit: number;
  credit: number;
}

// Expense
export interface Expense {
  id: string;
  date: Timestamp;
  accountId: string;
  accountCode: string;
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer';
  description: string;
  receiptImageUrl: string | null;
  receiptImagePath: string | null;
  journalEntryId: string;
  createdBy: string;
  createdAt: Timestamp;
}

// Asset
export interface Asset {
  id: string;
  name: string;
  category: string;
  purchaseDate: Timestamp;
  purchaseValue: number;
  currentValue: number;
  paymentMethod: 'cash' | 'bank_transfer';
  journalEntryId: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Business Profile (Settings)
export interface BusinessProfile {
  nameAr: string;
  nameEn: string;
  phone: string;
  whatsappNumber: string;
  vatNumber: string;
  crNumber: string;
  address: string;
  logoUrl: string | null;
  logoPath: string | null;
  updatedAt: Timestamp;
}

// Schedule Config (Settings)
export interface ScheduleConfig {
  workingHours: Record<string, DaySchedule>;
  slotDurationMinutes: number;
  maxBookingsPerSlot: number;
  blockedDates: string[];
  updatedAt: Timestamp;
}

export interface DaySchedule {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

// Payment Settings
export interface PaymentSettings {
  provider: 'moyasar' | 'tap' | 'hyperpay';
  moyasar: { publishableKey: string } | null;
  tap: { publishableKey: string } | null;
  hyperpay: { entityId: string } | null;
  updatedAt: Timestamp;
}
