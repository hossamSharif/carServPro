 

Project Name: CarServ Pro
Project Type: SaaS Web Application (PWA)
Primary Language: Arabic (RTL) with English toggle
Theme: Dark / Light mode support

---

## OVERVIEW

Build a multi-tenant-ready SaaS platform for car service businesses (e.g., paint protection film, ceramic coating, window tinting, detailing, etc.). The platform consists of two separate applications sharing the same Firebase backend:

1. **Customer-facing Website** — for browsing services and making reservations
2. **Admin Dashboard** — for business owners to manage everything

Tech Stack:
- Frontend: React 18 + Vite
- UI Library: shadcn/ui (with Tailwind CSS)
- Backend/Database: Firebase (Firestore, Auth, Storage, Cloud Messaging)
- PWA: Vite PWA plugin (fully installable, offline-capable shell)
- i18n: react-i18next (Arabic default, English toggle)
- RTL: full RTL layout support when Arabic is active
- State: Zustand or React Context
- Forms: React Hook Form + Zod
- No separate backend server — all logic via Firebase SDK and Firestore Security Rules

---

## APPLICATION 1: CUSTOMER WEBSITE

### 1.1 Landing Page

- Hero section with business branding, tagline, and CTA ("Book Now")
- Services preview section — grouped by categories (e.g., PPF, Ceramic, Detailing)
- Active offers/promotions banner section
- About section
- Contact info section
- **Floating WhatsApp button** (bottom-right, always visible) — clicking opens `https://wa.me/<PHONE>` with a pre-filled Arabic message like "مرحباً، أريد الاستفسار عن خدماتكم"
- Footer with links and social media

### 1.2 Services Catalog Page

- Display all services grouped by category
- Each service card shows: name (AR/EN), description, price, category badge, and active offer if applicable
- Services with `hidden: true` in Firestore must NOT appear
- Filter/search by category
- "Add to Cart" button on each service card

### 1.3 Cart

- Accessible via cart icon in header (slide-over drawer)
- User can increase/decrease quantity or remove services
- Shows subtotal
- "Proceed to Reservation" CTA

### 1.4 User Authentication

- **Signup**: Email, Full Name, Phone Number (Saudi format preferred), Password
- **Login**: Email + Password
- Firebase Auth for authentication
- Guest browsing is allowed; cart and checkout require login
- Auth modals/pages must be clean and bilingual

### 1.5 Reservation / Checkout

- NOT a payment flow — this is a booking/reservation flow only
- Steps:
  1. Review cart items
  2. Select preferred date and time slot (available slots configurable by admin)
  3. Add optional notes for the service
  4. Confirm reservation
- On submission: create a Firestore document in `reservations` collection with status `pending`
- Trigger: send WhatsApp message to admin using WhatsApp Business API link or Twilio WhatsApp API with reservation summary (customer name, phone, services, date)
- Show confirmation page with reservation reference number
- User can view their reservations in their profile page

### 1.6 User Profile Page

- View and edit profile (name, phone)
- List of all their reservations with status (pending, confirmed, completed, cancelled)
- View reservation details

---

## APPLICATION 2: ADMIN DASHBOARD

### 2.1 Separated Admin Login

- Admin has a completely separate login page at `/admin/login`
- Admin accounts are NOT created via public signup
- Admin users are provisioned manually in Firebase Auth with a custom claim `role: "admin"` OR via a dedicated `admins` collection in Firestore
- After login, redirect to `/admin/dashboard`
- Admin route protection: all `/admin/*` routes verify admin role via Firebase custom claims

### 2.2 Dashboard Home

- KPI cards: Today's Reservations, Pending Reservations, Total Revenue (current month), Total Expenses (current month), Net Profit
- Recent reservations table (last 10)
- Upcoming appointments list
- Quick links to key sections

### 2.3 Reservations Management

- Full list of all reservations with filters: date range, status, customer name
- Status options: `pending`, `confirmed`, `in_progress`, `completed`, `cancelled`
- Admin can update reservation status
- Admin can view full reservation details: customer info, services, requested date/time, notes
- Action buttons:
  - **"Convert to Invoice"** — converts reservation into a draft invoice, pre-populated with services from reservation
  - **"Cancel Reservation"**
- When a new reservation is created by a customer, admin receives a WhatsApp notification (via WhatsApp Business API link or Twilio integration — make this configurable via `.env`)

### 2.4 Services Management

- CRUD for services: Add, Edit, Delete
- Service fields: Name (AR + EN), Description (AR + EN), Category, Price (SAR), Image (Firebase Storage), Active Offers (discount % or fixed amount, with expiry date), Visibility toggle (`hidden` field)
- Category management: Add/Edit/Delete categories (Name AR + EN)
- Changes reflect instantly on the customer website

### 2.5 Users Management

- List all registered customers with: name, email, phone, registration date, number of reservations
- Admin can view user profile and their reservation history
- Admin can deactivate a user account (set `disabled: true` via Firebase Auth Admin SDK callable function)

### 2.6 Invoices Management

#### 2.6.1 Invoice Lifecycle
- Reservations converted to invoices become **Draft Invoices**
- Admin can edit draft: add/remove services, edit quantities, edit unit prices, add notes
- Admin can issue a **Final Invoice** from a draft
- Issued invoices are immutable (no editing after issuance)
- Admin can cancel an invoice (triggers reverse accounting entry)

#### 2.6.2 Invoice Structure (ZATCA Phase 1 Compliant — Saudi Arabia)
Each invoice must include:
- Invoice number (sequential, formatted: `INV-YYYY-NNNN`)
- Invoice date (Hijri + Gregorian)
- Seller info: Business name (AR), VAT registration number (15 digits), CR number, address
- Buyer info: Customer name, phone, email (if available)
- Line items: Description (AR), Quantity, Unit Price (SAR), VAT % (15%), VAT Amount, Total per line
- Subtotal (before VAT), Total VAT, Grand Total (inclusive of VAT)
- Payment method (Cash / Bank Transfer / Other)
- Invoice type field: `Standard` or `Simplified` (use Simplified for B2C — which this is)
- QR code generated on invoice using ZATCA Phase 1 TLV encoding (Seller Name, VAT Number, Timestamp, Total, VAT Amount) — use a JS library like `qrcode` with TLV encoding helper
- Invoice status: `draft`, `issued`, `cancelled`
- Print-ready invoice layout — clean Arabic RTL invoice template for printing (A4)
- PDF export option

#### 2.6.3 Invoice → Accounting Integration
- When invoice is **issued**: automatically create an accounting journal entry:
  - Debit: Accounts Receivable (or Cash if paid)
  - Credit: Revenue
  - Credit: VAT Payable
- When invoice is **cancelled**: automatically create a **reverse journal entry** with opposite debits/credits
- All journal entries are stored in `journalEntries` Firestore collection with reference to source invoice ID

### 2.7 Accounting Module

#### 2.7.1 Chart of Accounts
Pre-seeded chart of accounts including:
- Assets: Cash (1001), Bank Account (1002), Accounts Receivable (1100)
- Liabilities: VAT Payable (2001), Accounts Payable (2100)
- Equity: Owner's Equity (3001)
- Revenue: Service Revenue (4001)
- Expenses: General Expenses (5001), Rent (5002), Salaries (5003), Utilities (5004), Other Expenses (5099)

Admin can add custom accounts under each category.

#### 2.7.2 Journal Entries
- Auto-generated from invoices (as described above)
- Admin can manually add journal entries for other transactions
- Each entry: Date, Description (AR/EN), Debit Account, Credit Account, Amount, Reference, Source (`invoice` / `expense` / `manual`)

#### 2.7.3 Expenses Management
- Admin can log expenses: Date, Category (from COA), Amount, Payment method (Cash/Bank), Description, Receipt image upload (Firebase Storage)
- Logging an expense auto-creates a journal entry:
  - Debit: Expense Account
  - Credit: Cash or Bank

#### 2.7.4 Assets Management
- Admin can register business assets: Name, Category, Purchase Date, Purchase Value, Depreciation Method (optional for Phase 1), Current Value
- Assets linked to journal entry on purchase (Debit: Asset Account, Credit: Cash/Bank)

#### 2.7.5 Cash & Bank Tracking
- Real-time balance calculation from journal entries
- Cash Balance = Sum of all debits to Cash (1001) - Sum of all credits to Cash (1001)
- Bank Balance = Same logic for account 1002
- Dashboard widget showing current Cash and Bank balances
- Ledger view per account: list of all transactions affecting that account

#### 2.7.6 Financial Reports
- **Income Statement**: Revenue - Expenses = Net Profit (filterable by date range)
- **Balance Sheet**: Assets vs Liabilities + Equity (as of selected date)
- **VAT Report**: Total VAT collected per period (for ZATCA filing reference)
- **General Ledger**: All journal entries in date order

---

## FIRESTORE DATA MODEL