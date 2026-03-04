 

Spec File: 001-carserv-pro-platform
Feature Branch: 001-carserv-pro-platform
Project: CarServ Pro — Multi-Tenant Car Service SaaS Platform

---

## PLANNING DIRECTIVE

Generate a full implementation plan from the spec file `001-carserv-pro-platform`. 
The plan must be broken into ordered phases with tasks, each task mapped to its 
source requirement (FR-XXX / TC-XXX / SC-XXX). Every phase must be independently 
deployable and testable. Do not generate code — output only the structured plan.

---

## CONSTRAINTS TO RESPECT DURING PLANNING

- Tech Stack: React 18 + Vite, shadcn/ui, Tailwind CSS, Firebase (Firestore, Auth, 
  Storage, FCM), Vite PWA Plugin, react-i18next, Zustand, React Hook Form + Zod
- No separate backend server — all logic via Firebase SDK + Firestore Security Rules
- Exception: TC-012 requires a Firebase Cloud Function ONLY for payment gateway 
  webhook handling — plan this as an isolated, minimal serverless function
- Multi-tenant architecture: all Firestore collections scoped under 
  `tenants/{tenantId}/` with security rules enforcing isolation via 
  `request.auth.token.tenantId`
- Arabic is the default language, RTL layout is the default rendering direction
- Admin authentication is fully separate from customer authentication; 
  no self-service admin signup
- Sequential invoice numbering must use Firestore transactions (TC-010)
- ZATCA Phase 1 only — no Phase 2 e-invoicing XML submission

---

## PHASE STRUCTURE REQUIREMENTS

Organize the plan into the following phases in this order. Each phase must list:
  - Phase name and goal
  - Ordered list of tasks with: task ID, description, source requirement(s), 
    estimated complexity (S/M/L/XL), dependencies (other task IDs)
  - Phase exit criteria (what must be true before moving to the next phase)
  - Testable deliverable at phase completion

### Phase 1 — Project Foundation & Infrastructure
Goal: Establish the full project scaffold, Firebase configuration, multi-tenant 
architecture, routing, i18n setup, theme system, and PWA manifest before any 
feature work begins.

Must include:
  - Vite + React 18 project init with folder structure as specified in spec
  - Firebase project setup: Firestore, Auth, Storage, FCM initialization
  - Multi-tenant Firestore structure (`tenants/{tenantId}/`) and base security rules
  - react-i18next setup with AR (default) and EN locale files, RTL/LTR switching
  - Tailwind CSS + shadcn/ui initialization and component setup
  - Dark/light mode theme provider with persistence
  - React Router v6 route structure for both customer website and admin dashboard
  - Admin route protection (custom claims: `role: "admin"`, `tenantId`)
  - Vite PWA plugin configuration with manifest (Arabic, RTL, icons)
  - Environment variable structure (.env) for all configurable values
  - Base Zustand store structure

### Phase 2 — Customer Authentication & Profile
Goal: Full customer auth flow (signup, login, logout) and profile management, 
using Firebase Auth with email/password.

Must include:
  - Customer signup: email, full name, phone (FR-006), Zod validation
  - Customer login: email + password (FR-007)
  - Auth state management via Zustand
  - Guest browsing allowed; cart/checkout require auth (FR-008)
  - Customer profile page: view/edit name and phone (FR-012)
  - Firestore user document creation on signup under `tenants/{tenantId}/users/`
  - Separate admin login page at `/admin/login` (FR-013); admin provisioning 
    documented (not self-service)

### Phase 3 — Service Catalog & Landing Page (Customer-Facing)
Goal: Full customer-facing website: landing page, services catalog, category 
filtering, and WhatsApp floating button.

Must include:
  - Landing page with all sections: hero + CTA, services preview, offers banner, 
    about, contact, footer (FR-001, US-8)
  - Floating WhatsApp button on all customer pages with pre-filled Arabic message 
    (FR-002)
  - Services catalog page: grouped by category, bilingual names, price, offer badge, 
    hidden services excluded (FR-003)
  - Category filter and search (FR-004)
  - Real-time Firestore listener for services and categories

### Phase 4 — Cart & Reservation Flow
Goal: Cart management and the complete reservation submission flow including 
time slot selection and WhatsApp admin notification.

Must include:
  - Cart slide-over drawer: add/remove/adjust quantity, subtotal (FR-005)
  - Cart persistence in Zustand (in-memory; not localStorage)
  - Reservation flow: review cart → select date/time slot → notes → confirm (FR-009)
  - Time slot generation from Schedule Config (FR-041, FR-042): working hours, 
    slot duration, max capacity
  - Slot availability validation at submission time — race condition protection 
    using Firestore transaction (FR-040, edge case)
  - Reservation document creation with status "pending" and reference number (FR-010)
  - WhatsApp notification to admin on reservation creation via `wa.me` link (FR-011)
  - Confirmation page with reference number
  - Customer reservation history in profile (FR-012)
  - Edge case: hidden service in cart shows notice and blocks checkout

### Phase 5 — Admin Dashboard: Core & Reservations Management
Goal: Admin dashboard home with KPIs and full reservations management.

Must include:
  - Admin dashboard layout: collapsible sidebar, header with language + theme toggle
  - KPI cards: today's reservations, pending, monthly revenue, monthly expenses, 
    net profit (FR-015)
  - Recent reservations list (last 10) and upcoming appointments (FR-015)
  - Reservations management page: filters by date range, status, customer name 
    (FR-016)
  - Status update flow: pending → confirmed → in_progress → completed / cancelled 
    (FR-016)
  - Reservation detail view: customer info, services, date/time, notes
  - Edge case: admin cancels reservation with associated invoice — prompt with 
    clear messaging (edge case from spec)
  - Admin receives WhatsApp notification (same mechanism as FR-011, confirmed 
    working from Phase 4)

### Phase 6 — Admin: Services & Categories Management
Goal: Full CRUD for services and categories from admin dashboard, changes 
reflected in real time on customer website.

Must include:
  - Category CRUD: bilingual name AR + EN (FR-019)
  - Service CRUD: name AR/EN, description AR/EN, category, price SAR, image 
    (Firebase Storage), visibility toggle (FR-018)
  - Promotional offer management per service: type (% or fixed), value, expiry 
    (FR-018)
  - Real-time sync to customer website via Firestore listeners
  - Image upload to Firebase Storage with preview
  - Confirm dialogs for delete actions

### Phase 7 — Admin: User Management
Goal: Admin can view, search, and manage customer accounts.

Must include:
  - Customer list: name, email, phone, registration date, reservation count (FR-020)
  - Customer detail page with reservation history (FR-021)
  - Account deactivation via Firebase Auth Admin SDK (callable Cloud Function) 
    (FR-022)
  - Edge case: deactivated user retains reservation history visible to admin

### Phase 8 — Invoicing (ZATCA Phase 1 Compliant)
Goal: Full invoice lifecycle from draft to issued, with ZATCA-compliant output 
and PDF export.

Must include:
  - "Convert to Invoice" action on reservation → creates draft invoice pre-populated 
    with reservation services (FR-017)
  - Draft invoice editor: add/remove/edit line items, quantities, prices, notes 
    (FR-024)
  - Invoice issuance: sequential number (INV-YYYY-NNNN) via Firestore transaction 
    (FR-026, TC-010)
  - ZATCA Phase 1 required fields: invoice number, Hijri + Gregorian dates, seller 
    info (VAT number, CR number, address), buyer info, line items with 15% VAT 
    calculation, subtotal, total VAT, grand total, payment method, invoice type 
    "Simplified" (FR-026)
  - ZATCA TLV-encoded QR code generation in browser (seller name, VAT number, 
    timestamp, total, VAT amount) using `qrcode` library with TLV helper (FR-026)
  - Issued invoices are immutable (FR-025)
  - Print-ready A4 RTL Arabic invoice layout (FR-027)
  - PDF export of invoice (FR-027)
  - Invoice cancellation → triggers reverse journal entry (FR-028)
  - Payment status tracking: Unpaid, Paid, Partially Paid, Refunded (FR-047)
  - Manual payment recording for Cash and Bank Transfer (FR-046)
  - Edge case: concurrent invoice numbering — Firestore transaction guarantees 
    no gaps or duplicates (TC-010)

### Phase 9 — Payment Gateway Integration
Goal: Online payment processing via configurable gateway (Moyasar/Tap/HyperPay) 
with secure webhook handling.

Must include:
  - Payment method selection at checkout: Cash, Bank Transfer, Online (FR-043)
  - Gateway integration: redirect to gateway checkout, handle success/failure 
    callbacks (FR-044, FR-045)
  - Firebase Cloud Function for webhook verification and payment status update 
    (TC-012) — this is the ONLY backend function
  - Invoice payment status auto-update on successful payment (FR-047)
  - Configurable gateway provider via Business Settings / .env (FR-044)
  - Payment document creation in `tenants/{tenantId}/payments/` on each transaction

### Phase 10 — Accounting Module
Goal: Full accounting system: chart of accounts, journal entries, expense logging, 
asset registration, cash/bank tracking, financial reports.

Must include:
  - Pre-seeded chart of accounts (FR-029): standard accounts as specified in spec 
    data model (1001 Cash, 1002 Bank, 1100 AR, 2001 VAT Payable, 4001 Revenue, 
    5001–5099 Expenses, Asset accounts)
  - Admin can add custom accounts under existing categories (FR-029)
  - Auto journal entry on invoice issuance: Debit Receivable/Cash, Credit Revenue 
    + VAT Payable (FR-030)
  - Auto reverse journal entry on invoice cancellation (FR-030, FR-028)
  - Manual journal entry creation by admin (FR-031)
  - Expense logging: date, account, amount, payment method, description, receipt 
    image upload. Auto journal entry: Debit Expense, Credit Cash/Bank (FR-032)
  - Asset registration: name, category, purchase date, purchase value, current value. 
    Auto journal entry: Debit Asset Account, Credit Cash/Bank (FR-033)
  - Real-time Cash balance (account 1001) and Bank balance (account 1002) on 
    dashboard, derived from journal entries (FR-034, SC-010)
  - Reports: Income Statement by date range, Balance Sheet as of date, VAT Report 
    by period, General Ledger (FR-035)
  - All journal entries stored in `tenants/{tenantId}/journalEntries/` with 
    source reference (invoice ID / expense ID / manual)

### Phase 11 — Business Settings & Schedule Configuration
Goal: Admin can configure all business parameters: identity, contact, scheduling, 
and payment gateway selection.

Must include:
  - Business Settings page: name AR/EN, phone, WhatsApp number, VAT number, 
    CR number, address, logo upload
  - Schedule Config: working hours per day-of-week (open/close time), slot duration 
    in minutes, max simultaneous bookings per slot, blocked dates/holidays
    (FR-041, FR-042)
  - Invoice settings: seller info defaults for invoice generation
  - Payment gateway selector: Moyasar / Tap / HyperPay + credentials config
  - Settings stored in `tenants/{tenantId}/settings/`

### Phase 12 — PWA, Offline, Push Notifications & Final Polish
Goal: Complete PWA experience, offline behavior, push notifications, and 
production readiness.

Must include:
  - Workbox service worker configuration via Vite PWA plugin: cache strategies 
    for app shell and static assets
  - Offline shell: app loads from cache; data-dependent pages show offline message
  - Reservation submission queue when offline — retry on connectivity restore
  - Firebase Cloud Messaging (FCM): admin receives push notification on new 
    reservation (FR-039, SC-007)
  - PWA manifest finalized: name AR, `dir: "rtl"`, `lang: "ar"`, icons 192/512
  - Final accessibility review: ARIA labels in Arabic, focus management for RTL
  - Performance audit: target <3s load on 3G (SC-006)
  - Firestore Security Rules final review for all collections across all phases
  - End-to-end smoke test of all P1 user stories (US-1, US-2, US-3, US-7)

---

## CROSS-CUTTING CONCERNS TO WEAVE THROUGH ALL PHASES

The following must be addressed within each relevant phase, not deferred:
  - **i18n**: Every UI string added in any phase must have a key in both `ar.json` 
    and `en.json`. No hardcoded strings in components.
  - **RTL/LTR**: Every new page/component must be tested in both directions. Use 
    Tailwind `rtl:` variants consistently.
  - **Dark/Light Mode**: Every shadcn/ui component and custom layout must respect 
    the active theme. No hardcoded colors.
  - **Firestore Security Rules**: Every new collection introduced in any phase must 
    have corresponding security rules written and tested in the same phase.
  - **Zod Validation**: Every form in any phase must have a Zod schema; no 
    unvalidated form submissions reach Firestore.
  - **Error States & Loading States**: Every data-fetching operation must have a 
    loading skeleton and an error boundary/toast.
  - **Confirm Dialogs**: Every destructive action (delete, cancel, deactivate) must 
    have a shadcn/ui confirmation dialog.
  - **Tenant Scoping**: Every Firestore read/write must be scoped to 
    `tenants/{tenantId}/` — no root-level writes from client code.

---

## PRIORITY MAPPING (from spec user stories)

P1 (build first, blocking):
  US-1 (Reservation Flow) → Phases 3, 4
  US-2 (Admin Reservations + Invoicing) → Phases 5, 8
  US-3 (Services Management) → Phase 6
  US-7 (Bilingual RTL) → Phase 1 (foundation), all phases

P2 (build second, important):
  US-4 (Accounting) → Phase 10
  US-5 (Customer Profile) → Phase 2
  US-8 (Landing Page + WhatsApp) → Phase 3
  US-9 (Admin KPIs) → Phase 5

P3 (build last, nice to have):
  US-6 (User Management) → Phase 7
  US-10 (Asset Registration) → Phase 10

---

## TASK ID FORMAT

Use the following format for all task IDs:
  `P{phase_number}-T{task_number}` — e.g., `P1-T1`, `P4-T3`, `P8-T7`

---

## OUTPUT FORMAT EXPECTED FROM PLAN COMMAND

For each phase output: