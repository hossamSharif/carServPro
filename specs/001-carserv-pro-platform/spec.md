# Feature Specification: CarServ Pro — Multi-Tenant Car Service SaaS Platform

**Feature Branch**: `001-carserv-pro-platform`
**Created**: 2026-03-04
**Status**: Draft
**Input**: User description: "Build a multi-tenant-ready SaaS platform for car service businesses (paint protection film, ceramic coating, window tinting, detailing) consisting of a Customer-facing Website and an Admin Dashboard with full reservation, invoicing (ZATCA-compliant), and accounting capabilities. Bilingual Arabic (RTL) / English, dark/light mode, PWA-ready."

## Clarifications

### Session 2026-03-04

- Q: What is the technology stack (framework, database, hosting)? → A: React 18 + Vite, shadcn/ui + Tailwind CSS, Firebase (Firestore, Auth, Storage, Cloud Messaging), Vite PWA plugin, react-i18next, Zustand or React Context, React Hook Form + Zod. No separate backend server — all logic via Firebase SDK and Firestore Security Rules.
- Q: How are time slots structured for reservations? → A: Auto-generated. Admin sets working hours + slot duration + max capacity per slot; system generates available slots automatically. Booking blocked when slot capacity is reached.
- Q: What payment methods are supported and is online payment in scope? → A: Cash + bank transfer + online payment via gateway (e.g., Moyasar, Tap, HyperPay). Full payment gateway integration is in scope.
- Q: What multi-tenant data isolation strategy for Firestore? → A: Single project, tenant-scoped subcollections (`tenants/{tenantId}/...`) with Firestore security rules enforcing isolation via `request.auth.token.tenantId`.
- Q: What is the customer authentication method? → A: Email + password only (as specified in FR-006/FR-007). Phone number is a profile field, not an auth method.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Customer Browses Services and Makes a Reservation (Priority: P1)

A customer visits the car service website, browses available services (PPF, ceramic coating, tinting, detailing), adds desired services to their cart, creates an account or logs in, selects a preferred date and time slot, and submits a reservation. The customer receives a confirmation with a reference number. The business owner is notified via WhatsApp.

**Why this priority**: This is the core revenue-generating flow. Without the ability for customers to discover services and book reservations, the platform has no purpose.

**Independent Test**: Can be fully tested by visiting the website, browsing services, adding to cart, registering, selecting a time slot, and confirming a reservation. Delivers immediate value by enabling online bookings.

**Acceptance Scenarios**:

1. **Given** a customer on the landing page, **When** they click "Book Now," **Then** they are taken to the services catalog.
2. **Given** a customer viewing the services catalog, **When** they click "Add to Cart" on a service, **Then** the service is added to the cart and the cart icon updates the count.
3. **Given** a customer with items in the cart, **When** they open the cart drawer, **Then** they see all added services with names, prices, quantities, and a subtotal.
4. **Given** a guest user clicking "Proceed to Reservation," **When** they are not logged in, **Then** they are prompted to log in or create an account before continuing.
5. **Given** a logged-in customer on the reservation page, **When** they select a date and available time slot and confirm, **Then** a reservation is created with status "pending" and a confirmation page displays the reference number.
6. **Given** a successful reservation submission, **When** the reservation is created, **Then** the business owner receives a WhatsApp notification with the customer name, phone, services, and date.

---

### User Story 2 — Admin Manages Reservations and Converts to Invoice (Priority: P1)

A business owner logs into the admin dashboard, views incoming reservations, updates their statuses (confirmed, in progress, completed), and converts completed reservations into invoices. The invoices are ZATCA Phase 1 compliant with QR codes and can be printed or exported as PDF.

**Why this priority**: Reservation management and invoicing are essential for business operations. Without these, the platform cannot facilitate the service lifecycle from booking to payment.

**Independent Test**: Can be tested by logging into admin, viewing reservations, changing statuses, converting a reservation to a draft invoice, editing line items, issuing the invoice, and verifying the printed/PDF output includes all ZATCA-required fields.

**Acceptance Scenarios**:

1. **Given** an admin on the dashboard, **When** they view the reservations list, **Then** they see all reservations with filters for date range, status, and customer name.
2. **Given** a pending reservation, **When** the admin updates the status to "confirmed," **Then** the status changes and is reflected immediately.
3. **Given** a completed reservation, **When** the admin clicks "Convert to Invoice," **Then** a draft invoice is created pre-populated with the reservation's services, quantities, and prices.
4. **Given** a draft invoice, **When** the admin edits line items, adjusts quantities or prices, and clicks "Issue Invoice," **Then** the invoice becomes immutable, receives a sequential number (INV-YYYY-NNNN), and a ZATCA QR code is generated.
5. **Given** an issued invoice, **When** the admin clicks "Print" or "Export PDF," **Then** a clean A4 RTL Arabic invoice is rendered with all required fields (seller info, buyer info, line items, VAT breakdown, QR code).

---

### User Story 3 — Admin Manages Services and Categories (Priority: P1)

A business owner creates and manages the service catalog from the admin dashboard — adding categories (e.g., PPF, Ceramic Coating, Detailing), creating services within those categories with bilingual names, descriptions, prices, images, and promotional offers. Changes appear immediately on the customer website.

**Why this priority**: The service catalog is the foundation of the customer experience. The admin must be able to set up and maintain their offerings before customers can browse and book.

**Independent Test**: Can be tested by creating a category, adding a service with all fields (AR/EN name, description, price, image, offer), toggling visibility, and verifying changes appear on the customer website in real time.

**Acceptance Scenarios**:

1. **Given** an admin on the services management page, **When** they create a new category with Arabic and English names, **Then** the category appears in the list and is available for assigning services.
2. **Given** an admin adding a new service, **When** they fill in all required fields (name AR/EN, description AR/EN, category, price, image) and save, **Then** the service appears on the customer website under the correct category.
3. **Given** an existing service, **When** the admin sets `hidden` to true, **Then** the service no longer appears on the customer website.
4. **Given** a service, **When** the admin adds a promotional offer (discount percentage with expiry date), **Then** the offer badge appears on the service card on the customer website.

---

### User Story 4 — Admin Tracks Finances with Accounting Module (Priority: P2)

A business owner uses the accounting module to track revenue, expenses, and financial health. Issued invoices automatically generate journal entries. The admin can log expenses, view cash and bank balances, and generate financial reports (Income Statement, Balance Sheet, VAT Report).

**Why this priority**: Financial tracking is critical for business sustainability but can function after the core booking and invoicing flows are established.

**Independent Test**: Can be tested by issuing an invoice, verifying the auto-generated journal entry, logging an expense, checking updated balances, and generating an Income Statement report for a date range.

**Acceptance Scenarios**:

1. **Given** an invoice is issued, **When** the system processes the invoice, **Then** a journal entry is automatically created (Debit: Accounts Receivable or Cash; Credit: Revenue + VAT Payable).
2. **Given** an admin on the expenses page, **When** they log a new expense with date, category, amount, payment method, description, and receipt image, **Then** the expense is saved and a journal entry is auto-created (Debit: Expense Account; Credit: Cash or Bank).
3. **Given** journal entries exist, **When** the admin views the dashboard, **Then** current Cash and Bank balances are displayed, calculated from all journal entries.
4. **Given** an admin on the reports page, **When** they generate an Income Statement for a date range, **Then** total revenue, total expenses, and net profit are displayed correctly.
5. **Given** an issued invoice is cancelled, **When** the cancellation is processed, **Then** a reverse journal entry is automatically created with opposite debits and credits.

---

### User Story 5 — Customer Manages Profile and Reservation History (Priority: P2)

A registered customer views their profile, edits personal information, and reviews past and upcoming reservations with their statuses.

**Why this priority**: Profile and history management improves customer retention and reduces support inquiries, but the platform can operate without it initially.

**Independent Test**: Can be tested by logging in as a customer, navigating to the profile page, editing name/phone, and verifying the reservation list shows correct statuses.

**Acceptance Scenarios**:

1. **Given** a logged-in customer on the profile page, **When** they view their reservations, **Then** all reservations are listed with status (pending, confirmed, in progress, completed, cancelled), date, and services.
2. **Given** a customer on the profile page, **When** they edit their name or phone number and save, **Then** the updated information is persisted.

---

### User Story 6 — Admin Manages Customer Accounts (Priority: P3)

An admin views all registered customers, their profiles, reservation histories, and can deactivate accounts when necessary.

**Why this priority**: User management is an administrative function needed for platform governance but is not critical for the initial launch.

**Independent Test**: Can be tested by navigating to user management, searching for a customer, viewing their reservation history, and deactivating their account.

**Acceptance Scenarios**:

1. **Given** an admin on the users management page, **When** they view the customer list, **Then** each customer shows name, email, phone, registration date, and reservation count.
2. **Given** an admin viewing a specific customer, **When** they click "Deactivate," **Then** the customer account is disabled and the customer can no longer log in.

---

### User Story 7 — Bilingual and RTL Experience (Priority: P1)

All users (customers and admins) can switch between Arabic and English. When Arabic is active, the entire interface renders in RTL layout. When English is active, the layout switches to LTR.

**Why this priority**: The primary audience is Arabic-speaking users in Saudi Arabia. Full RTL support and bilingual content are essential for usability from day one.

**Independent Test**: Can be tested by switching the language toggle on any page and verifying all text, layout direction, and content switch correctly between Arabic RTL and English LTR.

**Acceptance Scenarios**:

1. **Given** any page in the application, **When** the user toggles the language to Arabic, **Then** all UI elements, labels, and content render in Arabic with RTL layout.
2. **Given** any page in the application, **When** the user toggles the language to English, **Then** all UI elements, labels, and content render in English with LTR layout.
3. **Given** a service with both Arabic and English names, **When** the language is Arabic, **Then** the Arabic name and description are displayed; when English, the English name and description.

---

### User Story 8 — Landing Page and WhatsApp Quick Contact (Priority: P2)

A potential customer visits the landing page, sees the business branding, service highlights, active promotions, and about/contact sections. A floating WhatsApp button is always visible for quick inquiries.

**Why this priority**: The landing page is the first impression and drives conversions, but the core booking flow can function with a simple services page initially.

**Independent Test**: Can be tested by visiting the landing page and verifying all sections (hero, services preview, offers, about, contact, footer) render correctly, and that the WhatsApp button opens the correct link with a pre-filled Arabic message.

**Acceptance Scenarios**:

1. **Given** a customer visiting the landing page, **When** the page loads, **Then** they see a hero section with branding and "Book Now" CTA, services preview grouped by category, active offers, about section, and contact information.
2. **Given** any page on the customer website, **When** the customer clicks the floating WhatsApp button, **Then** WhatsApp opens with the business phone number and a pre-filled Arabic greeting message.

---

### User Story 9 — Admin Dashboard KPIs and Overview (Priority: P2)

An admin logs into the dashboard and sees key performance indicators: today's reservations, pending reservations, monthly revenue, monthly expenses, and net profit. Recent reservations and upcoming appointments are listed for quick access.

**Why this priority**: The dashboard overview provides business intelligence at a glance but is not required for core operations.

**Independent Test**: Can be tested by logging into the admin dashboard and verifying that all KPI cards display accurate numbers derived from actual reservation and financial data.

**Acceptance Scenarios**:

1. **Given** an admin on the dashboard home, **When** the page loads, **Then** KPI cards show today's reservations, pending reservations, total revenue (current month), total expenses (current month), and net profit.
2. **Given** reservations exist, **When** the admin views the dashboard, **Then** the last 10 reservations and upcoming appointments are displayed.

---

### User Story 10 — Admin Registers Business Assets (Priority: P3)

An admin registers business assets (equipment, tools, vehicles) with purchase details and values. Asset purchases generate corresponding journal entries.

**Why this priority**: Asset tracking is important for financial reporting but is a secondary accounting feature.

**Independent Test**: Can be tested by registering an asset, verifying a journal entry is created, and checking the asset appears in the assets list.

**Acceptance Scenarios**:

1. **Given** an admin on the assets page, **When** they register a new asset with name, category, purchase date, and value, **Then** the asset is saved and a journal entry is created (Debit: Asset Account; Credit: Cash/Bank).

---

### Edge Cases

- What happens when a customer tries to book a time slot that was just taken by another customer? The system must validate slot availability at submission time and show an error if the slot is no longer available, prompting the customer to select a different slot.
- What happens when the admin cancels a reservation that has already been converted to an invoice? The system must prompt the admin to also cancel the associated invoice or leave it as-is, with clear messaging about the financial implications.
- What happens when a service is hidden after a customer has already added it to their cart? The item should remain in the cart with a notice that the service is no longer available, and the customer should not be able to proceed to reservation with unavailable items.
- How does the system handle concurrent invoice numbering? Invoice numbers (INV-YYYY-NNNN) must be generated sequentially without gaps or duplicates, even under concurrent admin usage.
- What happens when a customer's account is deactivated while they have pending reservations? Pending reservations remain visible to the admin but the customer can no longer log in or create new reservations.
- What happens when the WhatsApp notification fails to send? The reservation is still created successfully; a retry mechanism or fallback (e.g., admin dashboard notification) ensures the admin is informed.
- How does the system behave offline (PWA)? The app shell loads from cache. Data-dependent features show a clear offline message. Browsing cached service data is possible; reservation submission is queued until connectivity returns.

## Requirements *(mandatory)*

### Functional Requirements

#### Customer Website

- **FR-001**: System MUST display a landing page with hero section, services preview by category, active offers, about section, contact info, and footer.
- **FR-002**: System MUST show a floating WhatsApp button on all customer pages that opens a WhatsApp chat with the business number and a pre-filled Arabic greeting.
- **FR-003**: System MUST display all non-hidden services grouped by category, showing name (in active language), description, price (SAR), category badge, and any active promotional offer.
- **FR-004**: System MUST allow customers to filter and search services by category.
- **FR-005**: System MUST provide a cart (slide-over drawer) where customers can add services, adjust quantities, remove items, and see a subtotal.
- **FR-006**: System MUST support customer registration with email, full name, phone number, and password.
- **FR-007**: System MUST support customer login with email and password.
- **FR-008**: System MUST allow guest browsing; cart access and checkout MUST require authentication.
- **FR-009**: System MUST provide a reservation flow: review cart → select date and time slot → add optional notes → confirm.
- **FR-010**: System MUST create a reservation record with status "pending" upon confirmation and display a reference number.
- **FR-011**: System MUST send a WhatsApp notification to the business owner when a new reservation is created, including customer name, phone, services, and date.
- **FR-012**: System MUST provide a customer profile page to view/edit name and phone, and list all reservations with status.

#### Admin Dashboard

- **FR-013**: System MUST provide a separate admin login page, accessible only to users with admin privileges.
- **FR-014**: System MUST protect all admin routes so only authenticated admin users can access them.
- **FR-015**: System MUST display a dashboard home page with KPI cards (today's reservations, pending reservations, monthly revenue, monthly expenses, net profit), recent reservations, and upcoming appointments.
- **FR-016**: System MUST provide a reservations management page with filters (date range, status, customer name) and the ability to update reservation status (pending, confirmed, in_progress, completed, cancelled).
- **FR-017**: System MUST allow admins to convert a reservation into a draft invoice pre-populated with the reservation's services.
- **FR-018**: System MUST provide full CRUD for services: name (AR + EN), description (AR + EN), category, price (SAR), image, promotional offers (discount with expiry), and visibility toggle.
- **FR-019**: System MUST provide CRUD for service categories with bilingual names (AR + EN).
- **FR-020**: System MUST list all registered customers with name, email, phone, registration date, and reservation count.
- **FR-021**: System MUST allow admins to view a customer's profile and reservation history.
- **FR-022**: System MUST allow admins to deactivate a customer account, preventing future logins.

#### Invoicing (ZATCA Phase 1 Compliant)

- **FR-023**: System MUST support an invoice lifecycle: Draft → Issued → Cancelled.
- **FR-024**: System MUST allow admins to edit draft invoices (add/remove services, edit quantities, edit prices, add notes).
- **FR-025**: Issued invoices MUST be immutable (no edits after issuance).
- **FR-026**: Each issued invoice MUST include: sequential invoice number (INV-YYYY-NNNN), invoice date (Hijri + Gregorian), seller info (business name AR, VAT number, CR number, address), buyer info (name, phone, email), line items (description AR, quantity, unit price, 15% VAT, VAT amount, line total), subtotal, total VAT, grand total, payment method, invoice type (Simplified for B2C), and a ZATCA Phase 1 TLV-encoded QR code.
- **FR-027**: System MUST provide a print-ready A4 RTL Arabic invoice layout and PDF export.
- **FR-028**: System MUST allow admins to cancel an issued invoice, triggering a reverse journal entry.

#### Accounting

- **FR-029**: System MUST provide a pre-seeded chart of accounts (Assets, Liabilities, Equity, Revenue, Expenses) with the ability for admins to add custom accounts.
- **FR-030**: System MUST auto-generate journal entries when invoices are issued (Debit: Receivable/Cash; Credit: Revenue + VAT Payable) and when invoices are cancelled (reverse entries).
- **FR-031**: System MUST allow admins to manually create journal entries for other transactions.
- **FR-032**: System MUST allow admins to log expenses with date, category, amount, payment method, description, and receipt image. Logging an expense MUST auto-create a journal entry.
- **FR-033**: System MUST allow admins to register business assets with name, category, purchase date, purchase value, and current value. Registering an asset MUST auto-create a journal entry.
- **FR-034**: System MUST display real-time Cash and Bank balances calculated from journal entries.
- **FR-035**: System MUST provide financial reports: Income Statement (by date range), Balance Sheet (as of date), VAT Report (by period), and General Ledger (all entries in date order).

#### Cross-Cutting

- **FR-036**: System MUST support full bilingual interface (Arabic and English) with a language toggle.
- **FR-037**: System MUST render in RTL layout when Arabic is active and LTR when English is active.
- **FR-038**: System MUST support dark and light mode themes.
- **FR-039**: System MUST be installable as a Progressive Web App with offline-capable shell.
- **FR-040**: System MUST validate time slot availability at reservation submission time to prevent double-booking.
- **FR-041**: System MUST auto-generate available time slots from admin-configured working hours, slot duration, and max capacity per slot.
- **FR-042**: System MUST allow admins to configure scheduling parameters: working hours per day-of-week, slot duration (in minutes), max simultaneous bookings per slot, and blocked dates/holidays.

#### Payments

- **FR-043**: System MUST support three payment methods: Cash, Bank Transfer, and Online Payment (via payment gateway).
- **FR-044**: System MUST integrate with a payment gateway (Moyasar, Tap, or HyperPay) to process online payments. The specific provider is configurable in Business Settings.
- **FR-045**: For online payments, system MUST redirect the customer to the gateway checkout, handle success/failure callbacks, and update invoice payment status accordingly.
- **FR-046**: For Cash and Bank Transfer, admin MUST manually record payment receipt on the invoice.
- **FR-047**: System MUST track payment status on invoices: Unpaid, Paid, Partially Paid, Refunded.

### Key Entities

- **User**: Represents a registered customer (name, email, phone, password, registration date, active status). Has many reservations.
- **Admin**: A user with elevated privileges who manages the platform (separate from customer users).
- **Service**: A car service offering (bilingual name, bilingual description, category reference, price in SAR, image, visibility status). May have active offers.
- **Category**: A grouping for services (bilingual name). Has many services.
- **Offer**: A promotional discount on a service (discount type: percentage or fixed amount, discount value, expiry date). Belongs to a service.
- **Cart**: A temporary collection of services selected by a customer (service reference, quantity). Belongs to a user session.
- **Reservation**: A booking request by a customer (reference number, customer reference, list of services with quantities, preferred date, preferred time slot, notes, status). Created from a cart.
- **Invoice**: A financial document for services rendered (sequential number, dates in Hijri/Gregorian, seller info, buyer info, line items, VAT calculations, payment method, payment status, invoice type, QR code data, status). May be created from a reservation. Payment status: Unpaid, Paid, Partially Paid, Refunded.
- **Payment**: A record of a payment transaction (invoice reference, amount, method: Cash/Bank Transfer/Online, gateway transaction ID for online payments, date, status: success/failed/pending). Belongs to an invoice.
- **Journal Entry**: A double-entry accounting record (date, description, debit account, credit account, amount, reference, source type). Auto-generated from invoices and expenses, or manually created.
- **Account (Chart of Accounts)**: A financial account for categorizing transactions (code, name, type: Asset/Liability/Equity/Revenue/Expense). Pre-seeded with standard accounts.
- **Expense**: A business expenditure record (date, account category, amount, payment method, description, receipt image). Auto-generates a journal entry.
- **Asset**: A business asset record (name, category, purchase date, purchase value, current value). Auto-generates a journal entry on creation.
- **Time Slot**: An auto-generated booking window derived from Business Settings. Generated from working hours, slot duration, and max capacity per slot. Each slot tracks current booking count against capacity to prevent overbooking.
- **Schedule Config**: Admin-defined scheduling parameters (working hours per day-of-week, slot duration in minutes, max simultaneous bookings per slot, blocked dates/holidays). Part of Business Settings.
- **Business Settings**: Platform configuration (business name AR/EN, phone, WhatsApp number, VAT number, CR number, address, logo, working hours).

### Technical Constraints

- **TC-001**: Frontend: React 18 with Vite build tooling.
- **TC-002**: UI Library: shadcn/ui components with Tailwind CSS for styling.
- **TC-003**: Backend/Database: Firebase — Firestore (NoSQL document database), Firebase Authentication, Firebase Storage (images/receipts), Firebase Cloud Messaging (push notifications).
- **TC-004**: No separate backend server. All business logic executes client-side via Firebase SDK. Data access control enforced via Firestore Security Rules.
- **TC-005**: PWA: Vite PWA plugin for installable, offline-capable app shell.
- **TC-006**: Internationalization: react-i18next with Arabic as default language, English as toggle.
- **TC-007**: Full RTL layout rendering when Arabic is active; LTR when English is active.
- **TC-008**: State management: Zustand or React Context (to be finalized during planning).
- **TC-009**: Form handling: React Hook Form with Zod schema validation.
- **TC-010**: Sequential invoice numbering (INV-YYYY-NNNN) must be implemented via Firestore transactions to guarantee atomicity without a dedicated backend.
- **TC-011**: All Firestore collections are scoped under `tenants/{tenantId}/` subcollections for multi-tenant data isolation. Firestore Security Rules enforce tenant isolation via custom claims (`request.auth.token.tenantId`).
- **TC-012**: Payment gateway integration (Moyasar, Tap, or HyperPay) requires a Cloud Function or equivalent serverless endpoint for secure callback handling and webhook verification.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Customers can discover services and complete a reservation in under 3 minutes from landing page to confirmation.
- **SC-002**: Admins can convert a reservation into an issued invoice in under 2 minutes.
- **SC-003**: 100% of issued invoices contain all ZATCA Phase 1 required fields and a valid TLV-encoded QR code.
- **SC-004**: Financial reports (Income Statement, Balance Sheet, VAT Report) accurately reflect all journal entries with zero discrepancy.
- **SC-005**: Language switching between Arabic and English completes within 1 second with correct RTL/LTR layout rendering on all pages.
- **SC-006**: The platform loads within 3 seconds on standard mobile connections (3G+) and is fully functional as an installed PWA.
- **SC-007**: Business owner receives a WhatsApp notification within 30 seconds of a customer submitting a reservation.
- **SC-008**: Zero double-bookings occur — time slot validation prevents conflicting reservations.
- **SC-009**: All administrative actions (service CRUD, reservation management, invoicing, expense logging) are available in both Arabic and English.
- **SC-010**: Cash and Bank balance widgets on the dashboard reflect the correct totals derived from all journal entries at all times.

## Assumptions

- The business operates in Saudi Arabia and all prices are in SAR (Saudi Riyal).
- VAT rate is fixed at 15% as per current Saudi tax regulations.
- ZATCA Phase 1 compliance (simplified tax invoices for B2C) is sufficient; Phase 2 (integration with ZATCA e-invoicing systems) is out of scope for this version.
- WhatsApp notifications use WhatsApp Business API links (`wa.me`) as the default mechanism; integration with Twilio or other messaging APIs is configurable but not required for initial launch.
- Admin accounts are provisioned manually (not self-service registration).
- The platform serves a single business tenant initially; multi-tenant data isolation architecture is designed but full multi-tenancy (onboarding, billing) is out of scope. Data isolation uses tenant-scoped subcollections in a single Firestore project (`tenants/{tenantId}/...`), with security rules enforcing isolation via `request.auth.token.tenantId`.
- Phone numbers follow Saudi format (+966 followed by 9 digits) as default validation but international numbers are accepted.
- Hijri date conversion uses a standard calendar conversion library; minor discrepancies in Hijri dates (1-2 day variance due to moon sighting vs. calculated calendars) are acceptable.
- The chart of accounts follows Saudi accounting standards with the pre-seeded account structure; customization is limited to adding accounts under existing categories.
- Offline PWA capability covers the app shell and cached service catalog browsing; transactional operations (reservations, invoicing) require connectivity.
