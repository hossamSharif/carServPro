# Data Model: CarServ Pro

**Date**: 2026-03-04
**Storage**: Firebase Firestore (NoSQL document database)
**Isolation**: All collections scoped under `tenants/{tenantId}/`

---

## Firestore Document Structure

### 1. User (Customer)

**Path**: `tenants/{tenantId}/users/{userId}`
**Source**: FR-006, FR-007, FR-012, FR-020, FR-021, FR-022

```typescript
interface User {
  uid: string;                    // Firebase Auth UID (matches doc ID)
  email: string;                  // Login credential
  fullName: string;               // Editable by customer
  phone: string;                  // Saudi format (+966XXXXXXXXX) or international
  createdAt: Timestamp;           // Registration date
  active: boolean;                // false = deactivated (FR-022)
  reservationCount: number;       // Denormalized count for admin list (FR-020)
}
```

**Validation (Zod)**:
- `email`: valid email format
- `fullName`: min 2 chars, max 100 chars
- `phone`: regex `/^\+?[0-9]{9,15}$/` (flexible, Saudi default)
- `active`: boolean, defaults to `true`

---

### 2. Category

**Path**: `tenants/{tenantId}/categories/{categoryId}`
**Source**: FR-019

```typescript
interface Category {
  id: string;                     // Auto-generated doc ID
  nameAr: string;                 // Arabic name (required)
  nameEn: string;                 // English name (required)
  sortOrder: number;              // Display ordering
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Validation**:
- `nameAr`: min 2 chars, max 100 chars
- `nameEn`: min 2 chars, max 100 chars
- `sortOrder`: non-negative integer

---

### 3. Service

**Path**: `tenants/{tenantId}/services/{serviceId}`
**Source**: FR-003, FR-018

```typescript
interface Service {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  categoryId: string;             // Reference to categories/{categoryId}
  price: number;                  // Price in SAR (decimal, e.g., 500.00)
  imageUrl: string;               // Firebase Storage URL
  imagePath: string;              // Firebase Storage path (for deletion)
  hidden: boolean;                // true = excluded from customer view
  offer: ServiceOffer | null;     // Active promotional offer
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface ServiceOffer {
  type: 'percentage' | 'fixed';   // Discount type
  value: number;                  // % or SAR amount
  expiresAt: Timestamp;           // Expiry date
}
```

**Validation**:
- `nameAr`, `nameEn`: min 2 chars, max 200 chars
- `descriptionAr`, `descriptionEn`: max 1000 chars
- `price`: positive number, max 2 decimal places
- `offer.value`: positive number; if percentage, max 100
- `offer.expiresAt`: must be in the future

**Business Rules**:
- Hidden services excluded from customer catalog queries
- Expired offers (`expiresAt < now`) treated as no offer in display logic
- Deleting a category requires reassigning or deleting associated services

---

### 4. Reservation

**Path**: `tenants/{tenantId}/reservations/{reservationId}`
**Source**: FR-009, FR-010, FR-016

```typescript
interface Reservation {
  id: string;
  referenceNumber: string;        // Human-readable ref (e.g., "RES-1709564400123")
  customerId: string;             // Reference to users/{userId}
  customerName: string;           // Denormalized for admin display
  customerPhone: string;          // Denormalized for WhatsApp
  customerEmail: string;          // Denormalized for admin display
  services: ReservationService[]; // Snapshot of services at booking time
  date: string;                   // ISO date "YYYY-MM-DD"
  slotTime: string;               // "HH:mm" format
  notes: string;                  // Customer notes (optional)
  status: ReservationStatus;
  invoiceId: string | null;       // Reference to invoice if converted
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface ReservationService {
  serviceId: string;
  nameAr: string;                 // Snapshot at booking time
  nameEn: string;
  price: number;                  // Price at booking time
  quantity: number;
  offerDiscount: number;          // Applied discount amount (0 if none)
}

type ReservationStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
```

**State Transitions**:
```
pending → confirmed → in_progress → completed
pending → cancelled
confirmed → cancelled
in_progress → completed
```

**Validation**:
- `date`: valid ISO date, not in the past
- `slotTime`: valid HH:mm format
- `services`: at least 1 item, all with positive quantity
- `status`: must follow valid transitions (enforced in application logic)

**Business Rules**:
- Status can only progress forward (no reverting completed to in_progress)
- Cancelling a reservation with an associated invoice triggers admin prompt (edge case)
- Customer name/phone/email denormalized to avoid joins for admin list views

---

### 5. Slot Booking

**Path**: `tenants/{tenantId}/slotBookings/{date_slotTime}`
**Source**: FR-040, FR-041, FR-042
**Doc ID Format**: `{YYYY-MM-DD}_{HHmm}` (e.g., `2026-03-15_0900`)

```typescript
interface SlotBooking {
  date: string;                   // "YYYY-MM-DD"
  slotTime: string;               // "HH:mm"
  currentBookings: number;        // Current count
  maxCapacity: number;            // Denormalized from scheduleConfig
  reservationIds: string[];       // References to reservations
}
```

**Business Rules**:
- Created lazily on first booking for that slot
- Updated atomically via Firestore transaction
- `currentBookings` must never exceed `maxCapacity` (enforced by transaction + security rules)
- Cancelled reservation should decrement `currentBookings`

---

### 6. Invoice

**Path**: `tenants/{tenantId}/invoices/{invoiceId}`
**Source**: FR-023 through FR-028, FR-047

```typescript
interface Invoice {
  id: string;
  invoiceNumber: string | null;   // null for drafts; "INV-YYYY-NNNN" when issued
  status: InvoiceStatus;
  reservationId: string | null;   // Source reservation reference

  // Seller Info (from business settings snapshot)
  sellerNameAr: string;
  sellerVatNumber: string;
  sellerCrNumber: string;
  sellerAddress: string;

  // Buyer Info
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;

  // Line Items
  lineItems: InvoiceLineItem[];

  // Calculated Totals
  subtotal: number;               // Sum of line totals before VAT
  totalVat: number;               // Total VAT amount
  grandTotal: number;             // subtotal + totalVat

  // Dates
  invoiceDateGregorian: string;   // ISO date
  invoiceDateHijri: string;       // Hijri formatted string

  // Payment
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;

  // ZATCA
  invoiceType: 'simplified';      // B2C only for Phase 1
  qrCodeData: string;             // Base64 TLV-encoded QR string

  // Notes
  notes: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
  issuedAt: Timestamp | null;     // Set when status changes to 'issued'
  cancelledAt: Timestamp | null;
}

interface InvoiceLineItem {
  description: string;            // Arabic description
  descriptionEn: string;          // English description
  quantity: number;
  unitPrice: number;              // Price per unit in SAR
  vatRate: number;                // 0.15 (15%)
  vatAmount: number;              // unitPrice * quantity * vatRate
  lineTotal: number;              // (unitPrice * quantity) + vatAmount
}

type InvoiceStatus = 'draft' | 'issued' | 'cancelled';
type PaymentMethod = 'cash' | 'bank_transfer' | 'online';
type PaymentStatus = 'unpaid' | 'paid' | 'partially_paid' | 'refunded';
```

**State Transitions**:
```
draft → issued → cancelled
draft → (deleted)
```

**Business Rules**:
- Issued invoices are **immutable** (FR-025) — no field edits after issuance
- Only status change allowed on issued invoices: `issued → cancelled`
- Cancellation triggers reverse journal entry (FR-028)
- Invoice number assigned via Cloud Function transaction at issuance (TC-010)
- QR code generated at issuance from seller/VAT/timestamp/total/VAT fields
- VAT rate is fixed at 15% (Saudi tax regulation)

---

### 7. Invoice Counter

**Path**: `tenants/{tenantId}/counters/invoiceCounter`
**Source**: TC-010

```typescript
interface InvoiceCounter {
  lastNumber: number;             // Last used sequential number
  lastYear: number;               // Year of last invoice (for annual reset)
  updatedAt: Timestamp;
}
```

**Business Rules**:
- Read and updated exclusively via Firestore transaction in Cloud Function
- Resets to 1 when year changes
- Format: `INV-{year}-{nnnn}` (4-digit zero-padded)

---

### 8. Payment

**Path**: `tenants/{tenantId}/payments/{paymentId}`
**Source**: FR-043 through FR-047

```typescript
interface Payment {
  id: string;
  invoiceId: string;              // Reference to invoice
  amount: number;                 // Amount paid in SAR
  method: PaymentMethod;          // cash | bank_transfer | online
  status: 'pending' | 'success' | 'failed';
  gatewayProvider: string | null; // 'moyasar' | 'tap' | 'hyperpay' (for online only)
  gatewayTransactionId: string | null; // Gateway-assigned transaction ID
  gatewayResponse: Record<string, unknown> | null; // Raw gateway response
  recordedBy: string | null;      // Admin UID for manual recordings
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Business Rules**:
- Online payments created with status `pending`, updated to `success`/`failed` via webhook
- Cash/bank transfer payments manually recorded by admin (FR-046)
- Successful payment updates invoice `paymentStatus` accordingly

---

### 9. Account (Chart of Accounts)

**Path**: `tenants/{tenantId}/accounts/{accountId}`
**Source**: FR-029

```typescript
interface Account {
  id: string;
  code: string;                   // Account code (e.g., "1001", "4001")
  nameAr: string;
  nameEn: string;
  type: AccountType;
  isSystem: boolean;              // true = pre-seeded, cannot delete
  active: boolean;
  createdAt: Timestamp;
}

type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
```

**Pre-seeded Accounts**:

| Code | Name (EN) | Name (AR) | Type |
|------|-----------|-----------|------|
| 1001 | Cash | النقدية | asset |
| 1002 | Bank | البنك | asset |
| 1100 | Accounts Receivable | الذمم المدينة | asset |
| 1200 | Fixed Assets | الأصول الثابتة | asset |
| 2001 | VAT Payable | ضريبة القيمة المضافة المستحقة | liability |
| 3001 | Owner's Equity | حقوق الملكية | equity |
| 4001 | Service Revenue | إيرادات الخدمات | revenue |
| 5001 | Rent Expense | مصروف الإيجار | expense |
| 5002 | Utilities Expense | مصروف المرافق | expense |
| 5003 | Salaries Expense | مصروف الرواتب | expense |
| 5004 | Supplies Expense | مصروف اللوازم | expense |
| 5005 | Marketing Expense | مصروف التسويق | expense |
| 5099 | Other Expenses | مصروفات أخرى | expense |

**Business Rules**:
- System accounts (`isSystem: true`) cannot be deleted
- Admins can add custom accounts under existing types (FR-029)
- Account codes must be unique within a tenant

---

### 10. Journal Entry

**Path**: `tenants/{tenantId}/journalEntries/{entryId}`
**Source**: FR-030, FR-031, FR-032, FR-033

```typescript
interface JournalEntry {
  id: string;
  date: Timestamp;
  description: string;
  lines: JournalLine[];
  sourceType: 'invoice' | 'invoice_cancellation' | 'expense' | 'asset' | 'manual';
  sourceId: string | null;        // Reference to source document
  createdBy: string;              // Admin UID
  createdAt: Timestamp;
}

interface JournalLine {
  accountId: string;              // Reference to accounts/{accountId}
  accountCode: string;            // Denormalized for display
  accountNameAr: string;          // Denormalized
  debit: number;                  // Amount debited (0 if credit)
  credit: number;                 // Amount credited (0 if debit)
}
```

**Validation**:
- Sum of all debits must equal sum of all credits (double-entry)
- At least 2 lines per entry
- Each line must have either debit > 0 or credit > 0 (not both)

**Auto-generated Entries**:

| Event | Debit | Credit |
|-------|-------|--------|
| Invoice issued (cash) | 1001 Cash | 4001 Revenue + 2001 VAT Payable |
| Invoice issued (receivable) | 1100 Accounts Receivable | 4001 Revenue + 2001 VAT Payable |
| Invoice cancelled | Reverse of original | Reverse of original |
| Expense (cash) | 5XXX Expense Account | 1001 Cash |
| Expense (bank) | 5XXX Expense Account | 1002 Bank |
| Asset purchase (cash) | 1200 Fixed Assets | 1001 Cash |
| Asset purchase (bank) | 1200 Fixed Assets | 1002 Bank |

---

### 11. Expense

**Path**: `tenants/{tenantId}/expenses/{expenseId}`
**Source**: FR-032

```typescript
interface Expense {
  id: string;
  date: Timestamp;
  accountId: string;              // Expense account reference
  accountCode: string;            // Denormalized
  amount: number;                 // Amount in SAR
  paymentMethod: 'cash' | 'bank_transfer';
  description: string;
  receiptImageUrl: string | null; // Firebase Storage URL
  receiptImagePath: string | null;// Firebase Storage path
  journalEntryId: string;        // Reference to auto-created journal entry
  createdBy: string;              // Admin UID
  createdAt: Timestamp;
}
```

**Validation**:
- `amount`: positive number
- `accountId`: must reference an account with type `expense`
- `description`: min 2 chars, max 500 chars

---

### 12. Asset

**Path**: `tenants/{tenantId}/assets/{assetId}`
**Source**: FR-033

```typescript
interface Asset {
  id: string;
  name: string;
  category: string;               // Free-text category (e.g., "Equipment", "Vehicle")
  purchaseDate: Timestamp;
  purchaseValue: number;          // Original cost in SAR
  currentValue: number;           // Current estimated value in SAR
  paymentMethod: 'cash' | 'bank_transfer';
  journalEntryId: string;        // Reference to auto-created journal entry
  createdBy: string;              // Admin UID
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### 13. Business Settings

**Path**: `tenants/{tenantId}/settings/businessProfile`
**Source**: FR-041, FR-042

```typescript
interface BusinessProfile {
  nameAr: string;
  nameEn: string;
  phone: string;
  whatsappNumber: string;         // For customer notifications (wa.me link)
  vatNumber: string;              // 15-digit VAT registration number
  crNumber: string;               // Commercial registration number
  address: string;
  logoUrl: string | null;
  logoPath: string | null;
  updatedAt: Timestamp;
}
```

---

### 14. Schedule Config

**Path**: `tenants/{tenantId}/settings/scheduleConfig`
**Source**: FR-041, FR-042

```typescript
interface ScheduleConfig {
  workingHours: {
    [day: string]: DaySchedule;   // Keys: "sunday" through "saturday"
  };
  slotDurationMinutes: number;    // e.g., 30, 60
  maxBookingsPerSlot: number;     // Max simultaneous bookings
  blockedDates: string[];         // ISO dates for holidays/closures
  updatedAt: Timestamp;
}

interface DaySchedule {
  isOpen: boolean;
  openTime: string;               // "HH:mm" (e.g., "09:00")
  closeTime: string;              // "HH:mm" (e.g., "18:00")
}
```

---

### 15. Payment Settings

**Path**: `tenants/{tenantId}/settings/payment`

```typescript
interface PaymentSettings {
  provider: 'moyasar' | 'tap' | 'hyperpay';
  moyasar: {
    publishableKey: string;
  } | null;
  tap: {
    publishableKey: string;
  } | null;
  hyperpay: {
    entityId: string;
  } | null;
  updatedAt: Timestamp;
}
```

**Note**: Secret keys/access tokens stored in Firebase Functions config or Google Cloud Secret Manager, NOT in Firestore.

---

## Entity Relationship Diagram (Logical)

```
Category 1──* Service
Service *──* Reservation (via ReservationService snapshot)
User 1──* Reservation
Reservation 1──0..1 Invoice
Invoice 1──* Payment
Invoice 1──1 JournalEntry (auto on issuance)
Invoice (cancelled) 1──1 JournalEntry (reverse entry)
Expense 1──1 JournalEntry (auto on creation)
Asset 1──1 JournalEntry (auto on creation)
Account 1──* JournalLine
ScheduleConfig → SlotBooking (generates available slots)
SlotBooking *──* Reservation (via reservationIds)
```

## Firestore Indexes Required

| Collection | Fields | Query Use Case |
|------------|--------|----------------|
| reservations | `status`, `date` | Admin filter by status + date range |
| reservations | `customerId`, `createdAt` | Customer reservation history |
| invoices | `status`, `createdAt` | Admin invoice listing |
| invoices | `customerId`, `createdAt` | Customer invoice history |
| journalEntries | `date` | Reports by date range |
| journalEntries | `sourceType`, `sourceId` | Find entries by source |
| services | `categoryId`, `hidden` | Customer catalog filtered by category |
| expenses | `date` | Expense reports by date range |
| slotBookings | `date` | Available slots for a given date |
