# Tasks: CarServ Pro — Multi-Tenant Car Service SaaS Platform

**Input**: Design documents from `/specs/001-carserv-pro-platform/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in feature specification. Test tasks are not included.

**Organization**: Tasks grouped by user story for independent implementation and testing. US7 (Bilingual/RTL) is embedded in Phase 2 as cross-cutting foundation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependency installation, build tooling configuration.

- [x] T001 Create project directory structure: `src/components/{ui,common,customer,admin}`, `src/pages/{customer,admin}`, `src/hooks`, `src/stores`, `src/services`, `src/lib`, `src/i18n`, `src/types`, `src/routes`, `functions/src`, `public/icons`, `scripts`, `tests/{unit,integration,e2e}`
- [x] T002 Initialize Vite 5 + React 18 + TypeScript 5.x project and install all dependencies: `tailwindcss`, `postcss`, `autoprefixer`, `firebase` (v10), `zustand`, `react-hook-form`, `zod`, `@hookform/resolvers`, `react-router-dom` (v6), `react-i18next`, `i18next`, `i18next-http-backend`, `i18next-browser-languagedetector`, `vite-plugin-pwa`, `pdfmake-rtl`, `qrcode`, `@types/qrcode`; dev deps: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `eslint`, `typescript`
- [x] T003 [P] Configure Tailwind CSS 3 with logical properties support, `darkMode: 'class'`, custom Arabic font (Noto Sans Arabic), and base Tailwind directives in `tailwind.config.ts` and `src/index.css`
- [x] T004 [P] Initialize shadcn/ui with `rtl: true` in `components.json` and install base components: Button, Input, Card, Dialog, AlertDialog, Sheet, Table, Badge, DropdownMenu, Select, Tabs, Toast, Toaster, Label, Textarea, Checkbox, Separator, ScrollArea, Avatar, Popover, Calendar, Skeleton
- [x] T005 [P] Create Firebase project configuration files: `firebase.json` (Firestore, Auth, Storage, Functions, Emulators with ports), `.firebaserc`, and `.env.example` with all `VITE_FIREBASE_*` and `VITE_TENANT_ID` variables
- [x] T006 [P] Initialize Cloud Functions project: `functions/package.json` with `firebase-admin`, `firebase-functions` (v2), TypeScript; `functions/tsconfig.json`; `functions/src/index.ts` entry point
- [x] T007 [P] Configure ESLint with TypeScript rules, set `tsconfig.json` with strict mode and path aliases (`@/` maps to `src/`), add scripts to `package.json`: `dev`, `build`, `preview`, `test`, `lint`, `seed`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST complete before ANY user story. Includes US7 (Bilingual & RTL) as cross-cutting foundation, authentication, layouts, routing, Firestore service layer, security rules, and Cloud Functions.

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Define all TypeScript interfaces and type aliases in `src/types/index.ts`: User, Category, Service, ServiceOffer, Reservation, ReservationService, ReservationStatus, SlotBooking, Invoice, InvoiceLineItem, InvoiceStatus, InvoiceCounter, Payment, PaymentMethod, PaymentStatus, Account, AccountType, JournalEntry, JournalLine, Expense, Asset, BusinessProfile, ScheduleConfig, DaySchedule, PaymentSettings (follow data-model.md exactly)
- [x] T009 [P] Create Zod validation schemas for all form-facing entities in `src/lib/validators.ts`: userRegistration, login, category, service (with offer sub-schema), reservation, invoiceLineItem, expense, asset, businessProfile, scheduleConfig, manualJournalEntry
- [x] T010 [P] Setup react-i18next with Arabic default language, `i18next-browser-languagedetector` (localStorage + navigator), `i18next-http-backend` for lazy loading from `/locales/{{lng}}/{{ns}}.json`, fallback to Arabic in `src/i18n/config.ts`
- [x] T011 [P] Create Arabic translation file with all UI string keys organized by namespace: common (buttons, labels, status), nav, auth (login, register, logout), customer (services, cart, reservation), admin (dashboard, reservations, invoicing), invoice (fields, statuses), accounting (accounts, journal, reports), validation (error messages) in `src/i18n/ar.json`
- [x] T012 [P] Create English translation file with matching keys in `src/i18n/en.json`
- [x] T013 [P] Implement RTL/LTR direction switching: `useDirection` hook that listens to `i18n.language` changes, sets `document.documentElement.dir` (`rtl`/`ltr`) and `lang` attribute, integrates with Radix DirectionProvider in `src/hooks/useDirection.ts`
- [x] T014 [P] Implement UI Zustand store: theme mode (light/dark/system) with localStorage persistence, sidebar collapsed state; add inline FOUC prevention script in `index.html` `<head>` to set theme class before render in `src/stores/uiStore.ts`
- [x] T015 Initialize Firebase app, Auth, Firestore, and Storage instances using `VITE_FIREBASE_*` env vars; auto-connect to emulators when `location.hostname === 'localhost'` in `src/services/firebase.ts`
- [x] T016 Implement auth service: `registerCustomer` (writes pending registration doc to `pendingRegistrations/{uid}` with tenantId, then creates Firebase Auth user), `loginWithEmail`, `logout`, `onAuthStateChanged` listener that reads custom claims (tenantId, role), `forceTokenRefresh` in `src/services/auth.ts`
- [x] T017 Create auth Zustand store: user object, role, tenantId, isLoading, isAuthenticated computed, login/logout/register async actions wrapping auth service, `initAuth` action that subscribes to `onAuthStateChanged` in `src/stores/authStore.ts`
- [x] T018 [P] Create `useAuth` hook providing typed access to auth store with convenience getters (isAdmin, isCustomer, tenantId) in `src/hooks/useAuth.ts`
- [x] T019 Implement tenant-scoped Firestore base service: all operations auto-prepend `tenants/{tenantId}/` path using tenantId from auth store; exports `getDocRef`, `getCollectionRef`, `addDocument`, `getDocument`, `updateDocument`, `deleteDocument`, `queryDocuments` (with where/orderBy/limit), `onSnapshotListener` in `src/services/firestore.ts`
- [x] T020 [P] Define all route paths and create route configuration with `React.lazy` imports for code-splitting: customer routes (/, /services, /login, /register, /reservation, /reservation/confirm, /profile), admin routes (/admin, /admin/reservations, /admin/services, /admin/categories, /admin/invoices, /admin/invoices/:id, /admin/accounting, /admin/expenses, /admin/assets, /admin/journal, /admin/reports, /admin/users, /admin/settings), 404 page in `src/routes/index.tsx`
- [x] T021 [P] Create route guard components: `RequireAuth` (redirects to login if unauthenticated), `RequireAdmin` (checks `role === 'admin'`), `RequireCustomer` (checks `role === 'customer'`), `RedirectIfAuthenticated` (redirects admin→dashboard, customer→home) in `src/routes/guards.tsx`
- [x] T022 Create customer layout component: responsive header (logo, nav links to services, cart icon with count badge, language toggle, theme toggle, login/register or profile/logout buttons), footer (business name, phone, address, social links), floating WhatsApp FAB (opens `wa.me/{number}?text={arabic_greeting}` using business settings) in `src/components/common/CustomerLayout.tsx`
- [x] T023 Create admin layout component: collapsible RTL-aware sidebar with nav items (Dashboard, Reservations, Services, Categories, Invoices, Accounting sub-menu [Chart of Accounts, Journal Entries, Expenses, Assets, Reports], Users, Settings), header with breadcrumbs + user avatar dropdown (profile, logout) + language/theme toggles in `src/components/common/AdminLayout.tsx`
- [x] T024 [P] Create LanguageToggle component: button displaying current language code, calls `i18n.changeLanguage()` on click, triggers direction update in `src/components/common/LanguageToggle.tsx`
- [x] T025 [P] Create ThemeToggle component: cycles through light → dark → system with corresponding icons (Sun, Moon, Monitor), updates uiStore in `src/components/common/ThemeToggle.tsx`
- [x] T026 [P] Create reusable ConfirmDialog component using shadcn AlertDialog: configurable title, description, confirm/cancel labels, destructive variant styling in `src/components/common/ConfirmDialog.tsx`
- [x] T027 Write complete Firestore security rules per `contracts/firestore-security-rules.md`: helper functions (`isAuthenticated`, `isTenantMember`, `isAdmin`, `isCustomer`), per-collection rules for all 15 collections (settings, services, categories, reservations, invoices, counters, users, journalEntries, expenses, accounts, payments, assets, slotBookings), invoice immutability on issued status, slot booking capacity enforcement, default deny rule in `firestore.rules`
- [x] T028 [P] Write Firebase Storage security rules: allow read/write under `tenants/{tenantId}/` for tenant members, max 5MB file size, restrict to image MIME types (image/jpeg, image/png, image/webp) in `storage.rules`
- [x] T029 Implement user claims setter Cloud Function: `auth.user().onCreate()` trigger reads `pendingRegistrations/{uid}` doc, sets custom claims `{ tenantId, role: 'customer' }` via Admin SDK, creates user profile doc at `tenants/{tenantId}/users/{uid}`, deletes pending registration doc in `functions/src/auth.ts`
- [x] T030 [P] Implement admin role provisioner + user deactivation callable functions: `setAdminRole` (validates caller is admin for same tenant, sets target user claims), `deactivateUser` (disables Auth account via Admin SDK, sets `active: false` in Firestore) in `functions/src/admin.ts`
- [x] T031 Create App.tsx with `RouterProvider`, i18n initialization, `useDirection` hook, theme class application, shadcn `Toaster` in `src/App.tsx`
- [x] T032 Create main.tsx entry point with `React.StrictMode`, `ReactDOM.createRoot`, and PWA service worker registration in `src/main.tsx`
- [x] T033 Create admin login page (separate from customer login per FR-013): email + password form, admin-specific branding, redirect to `/admin` on success in `src/pages/admin/AdminLoginPage.tsx`
- [x] T034 [P] Create seed script: populates Firebase Emulator with default tenant doc, admin user with custom claims, 13 pre-seeded chart of accounts (per data-model.md), default business profile, schedule config (Sun-Thu 9am-6pm, 60min slots, max 3 bookings), 4 sample categories (PPF, Ceramic Coating, Tinting, Detailing), 8 sample services in `scripts/seed.ts`

**Checkpoint**: Foundation ready — bilingual RTL/LTR interface, authentication, admin & customer layouts, routing with guards, Firestore service layer, security rules, and Cloud Functions all operational. User story implementation can begin.

---

## Phase 3: User Story 3 — Admin Manages Services and Categories (Priority: P1) MVP

**Goal**: Admin creates and manages the service catalog — categories with bilingual names and services with bilingual content, images, pricing, and promotional offers. Changes reflect immediately on the customer site.

**Independent Test**: Log into admin, create a category (AR/EN name), add a service with all fields (AR/EN name, description, price, image, offer), toggle visibility, verify changes appear in services list.

### Implementation for User Story 3

- [x] T035 [P] [US3] Implement category Firestore service: `createCategory`, `updateCategory`, `deleteCategory` (with check for associated services), `getCategories` (ordered by `sortOrder`), `onCategoriesSnapshot` in `src/services/categoryService.ts`
- [x] T036 [P] [US3] Implement service Firestore service: `createService` (with image upload to Firebase Storage under `tenants/{tenantId}/services/`), `updateService` (handles image replacement), `deleteService` (deletes image from Storage), `getServices`, `getServicesByCategory`, `getVisibleServices`, `toggleVisibility`, `onServicesSnapshot` in `src/services/serviceService.ts`
- [x] T037 [US3] Create admin categories management page: table view with bilingual names, sort order, service count; add/edit via dialog; delete with confirmation (prevent if services exist); drag-to-reorder in `src/pages/admin/CategoriesPage.tsx`
- [x] T038 [US3] Create category form dialog component (React Hook Form + Zod: nameAr, nameEn, sortOrder) in `src/components/admin/CategoryForm.tsx`
- [x] T039 [US3] Create admin services management page: data table/grid with image thumbnail, bilingual name, category, price, offer badge, visibility toggle; category filter dropdown; add/edit/delete operations in `src/pages/admin/ServicesPage.tsx`
- [x] T040 [US3] Create service form dialog component (React Hook Form + Zod: nameAr, nameEn, descriptionAr, descriptionEn, categoryId select, price in SAR, image upload with preview, offer section with type/value/expiresAt, hidden toggle) in `src/components/admin/ServiceForm.tsx`

**Checkpoint**: Admin can fully manage the service catalog. Services and categories are ready for customer browsing.

---

## Phase 4: User Story 1 — Customer Browses Services and Makes a Reservation (Priority: P1) MVP

**Goal**: Customer visits the website, browses services by category, adds to cart, registers or logs in, selects a date and time slot, and submits a reservation. Receives a confirmation with reference number. Business owner receives WhatsApp notification link.

**Independent Test**: Visit services page, browse by category, add services to cart, register a new account, select a time slot, confirm reservation, verify reference number is displayed and WhatsApp notification link is generated.

### Implementation for User Story 1

- [x] T041 [P] [US1] Implement cart Zustand store: `items` array, `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `getSubtotal` computed, `getItemCount` computed, persist to localStorage, handle unavailable service detection (offer expired or service hidden) in `src/stores/cartStore.ts`
- [x] T042 [P] [US1] Implement schedule service: `getScheduleConfig`, `getAvailableSlots(date)` (generate time slots from ScheduleConfig working hours + slot duration, exclude blocked dates, check SlotBooking docs for remaining capacity), `isSlotAvailable(date, time)` in `src/services/scheduleService.ts`
- [x] T043 [P] [US1] Implement reservation service: `createReservation` (Firestore transaction: read/create SlotBooking doc → validate `currentBookings < maxCapacity` → increment `currentBookings` → add `reservationId` to `reservationIds` → create reservation doc with generated reference number `RES-{timestamp}`), `getCustomerReservations(customerId)`, `getReservationById` in `src/services/reservationService.ts`
- [x] T044 [P] [US1] Implement WhatsApp notification link generator: builds `https://wa.me/{whatsappNumber}?text={encodedMessage}` with Arabic message containing customer name, phone, services list, date, time; reads WhatsApp number from business settings in `src/lib/whatsapp.ts`
- [x] T045 [US1] Create ServiceCard component: displays service name (uses current i18n language to pick AR/EN), truncated description, price in SAR formatted, category badge, offer badge (discount % or fixed amount with expiry), "Add to Cart" button; handles already-in-cart state in `src/components/customer/ServiceCard.tsx`
- [x] T046 [US1] Create services catalog page: category filter tabs (from categories collection), search input, responsive grid of ServiceCard components, cart icon in header with animated count badge in `src/pages/customer/ServicesPage.tsx`
- [x] T047 [US1] Create CartDrawer component (shadcn Sheet, slides from end): lists cart items with service name, unit price, quantity +/- controls, remove button, line total; shows subtotal at bottom; "Proceed to Reservation" button (requires auth, shows login prompt if guest); empty cart state in `src/components/customer/CartDrawer.tsx`
- [x] T048 [US1] Create customer registration page: React Hook Form + Zod (fullName, email, phone with +966 default, password, confirmPassword), submit calls `authStore.register`, success redirects to previous page or reservation, link to login page in `src/pages/customer/RegisterPage.tsx`
- [x] T049 [US1] Create customer login page: email + password form (React Hook Form + Zod), submit calls `authStore.login`, success redirects to previous page or home, link to register page in `src/pages/customer/LoginPage.tsx`
- [x] T050 [US1] Create TimeSlotPicker component: date picker (shadcn Calendar, blocks past dates and blocked dates), available time slots grid for selected date showing remaining capacity per slot, slot selection with visual feedback in `src/components/customer/TimeSlotPicker.tsx`
- [x] T051 [US1] Create reservation page with multi-step flow: Step 1 — cart review (read-only item list with totals); Step 2 — date and time slot selection (TimeSlotPicker); Step 3 — optional notes textarea; Step 4 — confirm button; handles slot-taken race condition with error message and re-selection prompt in `src/pages/customer/ReservationPage.tsx`
- [x] T052 [US1] Create reservation confirmation page: displays success message, reference number, reservation details (services, date, time, total), WhatsApp share button (opens WhatsApp notification link for business owner) in `src/pages/customer/ReservationConfirmPage.tsx`

**Checkpoint**: Full customer booking flow operational — browse, cart, register/login, book, confirm. Core MVP is functional.

---

## Phase 5: User Story 2 — Admin Manages Reservations and Converts to Invoice (Priority: P1)

**Goal**: Admin views and manages reservations (status updates), converts completed reservations to ZATCA Phase 1 compliant invoices with QR codes, edits drafts, issues invoices (immutable, sequential number), prints/exports PDF. Payment recording for cash/bank/online.

**Independent Test**: Log into admin, view reservations, change statuses, convert a completed reservation to invoice, edit line items, issue invoice, verify ZATCA QR code, print, export PDF with all required fields (seller info, buyer info, line items, VAT breakdown, Hijri/Gregorian dates, QR code).

### Implementation for User Story 2

- [x] T053 [P] [US2] Implement ZATCA Phase 1 TLV QR code encoder: `encodeTLV(sellerName, vatNumber, timestamp, invoiceTotal, vatAmount)` using `TextEncoder` + `Uint8Array` + `btoa()` for Base64 TLV string; `generateQRDataUrl(tlvBase64)` using `qrcode` package with error correction level M in `src/lib/zatca-qr.ts`
- [x] T054 [P] [US2] Implement Hijri date utilities: `formatHijriDate(date)` using `Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura')`, `getHijriDateString(date)` for invoice display (numeric format) in `src/lib/hijri-date.ts`
- [x] T055 [P] [US2] Implement invoice PDF generator using `pdfmake-rtl` (lazy-loaded via dynamic import): A4 page, RTL Arabic layout; header with seller info (nameAr, VAT, CR, address) and buyer info; line items table (description, qty, unit price, VAT amount, line total); subtotal, total VAT, grand total; payment method; Hijri + Gregorian dates; ZATCA QR code image; `generateInvoicePDF(invoice)` returns download in `src/lib/invoice-pdf.ts`
- [x] T056 [P] [US2] Implement account service: `getAccounts`, `getAccountByCode(code)`, `createAccount`, `seedDefaultAccounts` (creates 13 pre-seeded accounts per data-model.md if not exist) in `src/services/accountService.ts`
- [x] T057 [P] [US2] Implement journal entry service: `createJournalEntry(entry)` with double-entry validation (debits === credits), `createInvoiceJournalEntry(invoice)` (auto: debit Cash/Receivable, credit Revenue + VAT Payable), `createReversalEntry(originalEntryId)` (for invoice cancellation), `getJournalEntries`, `getJournalEntriesBySource(sourceType, sourceId)` in `src/services/journalService.ts`
- [x] T058 [US2] Implement invoice service: `createFromReservation(reservationId)` (creates draft pre-populated with reservation services/prices/customer info + seller info from business settings), `updateDraftInvoice(invoiceId, updates)` (edit line items, notes, payment method — only if status is draft), `issueInvoice(invoiceId)` (calls Cloud Function for sequential number, generates ZATCA QR, sets issuedAt, creates journal entry, marks immutable), `cancelInvoice(invoiceId)` (sets status cancelled, creates reverse journal entry), `getInvoices`, `getInvoiceById`, `onInvoicesSnapshot` in `src/services/invoiceService.ts`
- [x] T059 [US2] Implement invoice number generator callable Cloud Function per `contracts/cloud-function-webhook.md`: validates caller is admin, runs Firestore transaction on `tenants/{tenantId}/counters/invoiceCounter` (read → year reset check → increment → write), formats `INV-{year}-{nnnn}` (4-digit zero-padded), updates invoice doc with number + status + issuedAt, returns `{ invoiceNumber }` in `functions/src/invoicing.ts`
- [x] T060 [P] [US2] Implement payment service: `recordPayment(invoiceId, amount, method)` for cash/bank transfer (admin records manually), updates invoice `paymentStatus` (paid if full amount, partially_paid if partial), `getPaymentsByInvoice(invoiceId)` in `src/services/paymentService.ts`
- [x] T061 [US2] Create admin reservations management page: data table with columns (ref#, customer, date, time, services summary, status badge), filters (date range picker, status multi-select, customer name search), status update dropdown per row, "Convert to Invoice" action button on completed reservations in `src/pages/admin/ReservationsPage.tsx`
- [x] T062 [US2] Create reservation detail component: full reservation info panel (customer details, services table, date/time, notes), status badge with allowed transitions, status update buttons, link to associated invoice if converted in `src/components/admin/ReservationDetail.tsx`
- [x] T063 [US2] Create invoice editor page: seller info display (from settings), buyer info (editable on draft), line items table with add/remove/edit rows (description AR/EN, quantity, unit price — VAT and totals auto-calculated at 15%), notes textarea, payment method selector, running totals panel (subtotal, VAT, grand total), "Save Draft" and "Issue Invoice" buttons (issue shows confirmation dialog) in `src/pages/admin/InvoiceEditorPage.tsx`
- [x] T064 [US2] Create invoices list page: data table with columns (invoice#, date, customer, grand total, payment status badge, invoice status badge), filters (status, payment status, date range, search by number), row actions (view, edit draft, print, PDF, cancel issued) in `src/pages/admin/InvoicesPage.tsx`
- [x] T065 [US2] Create invoice print/PDF view component: clean A4 RTL Arabic layout matching PDF output — seller block, buyer block, line items table, VAT breakdown, totals, dates (Hijri + Gregorian), QR code image, invoice number; print button (`window.print` with `@media print` styles), PDF download button (calls invoice-pdf generator) in `src/components/admin/InvoicePrintView.tsx`
- [x] T066 [US2] Implement payment webhook Cloud Function per `contracts/cloud-function-webhook.md`: HTTPS trigger, HMAC-SHA256 signature verification (Moyasar), idempotency check (existing payment with same `gatewayTransactionId`), extract `tenantId` + `invoiceId` from metadata, validate amount against invoice `grandTotal`, create payment doc, update invoice `paymentStatus`, auto-create journal entry; returns 200/401/400 in `functions/src/webhook.ts`
- [x] T067 [US2] Implement online payment gateway integration: Moyasar widget/redirect initialization with publishable key, payment session creation with invoice metadata (invoiceId, tenantId), success/failure callback handling, payment status polling as fallback in `src/services/paymentGateway.ts`

**Checkpoint**: Full reservation-to-invoice lifecycle operational. ZATCA-compliant invoicing with sequential numbering, QR codes, PDF export, payment tracking (cash, bank, online).

---

## Phase 6: User Story 8 — Landing Page and WhatsApp Quick Contact (Priority: P2)

**Goal**: Professional landing page with hero section, services preview by category, active promotions, about/contact sections. Floating WhatsApp button on all customer pages for quick inquiries.

**Independent Test**: Visit landing page, verify all sections render (hero with "Book Now" CTA, services preview grouped by category, active offers, about section, contact info, footer), verify WhatsApp button opens correct link with pre-filled Arabic greeting.

### Implementation for User Story 8

- [x] T068 [P] [US8] Create hero section component with business logo/name, tagline, "Book Now" CTA button (links to /services), responsive background image or gradient in `src/components/customer/HeroSection.tsx`
- [x] T069 [P] [US8] Create offers section component: displays services with active non-expired offers in a carousel or grid, showing original price, discount badge, discounted price, and expiry date in `src/components/customer/OffersSection.tsx`
- [x] T070 [US8] Create landing page assembling all sections: HeroSection, services preview (top categories with 3-4 featured services each using ServiceCard), OffersSection (active promotions), about section (business description from settings), contact section (phone, WhatsApp, address, working hours from schedule config), smooth scroll navigation in `src/pages/customer/LandingPage.tsx`

**Checkpoint**: Professional landing page live with all sections. First impression and conversion funnel established.

---

## Phase 7: User Story 5 — Customer Manages Profile and Reservation History (Priority: P2)

**Goal**: Logged-in customer views and edits their profile (name, phone), and reviews all past and upcoming reservations with statuses.

**Independent Test**: Log in as customer, navigate to profile page, edit name and phone number, verify reservation list shows all reservations with correct statuses (pending, confirmed, in progress, completed, cancelled).

### Implementation for User Story 5

- [x] T071 [P] [US5] Implement user profile service: `getUserProfile(userId)`, `updateProfile(userId, { fullName, phone })` with Zod validation in `src/services/userService.ts`
- [x] T072 [P] [US5] Create reservation history card component: reference number, date + time, services list with quantities, total amount, color-coded status badge (pending=yellow, confirmed=blue, in_progress=orange, completed=green, cancelled=red) in `src/components/customer/ReservationCard.tsx`
- [x] T073 [US5] Create customer profile page: editable profile section (React Hook Form + Zod: fullName, phone, email read-only), reservation history section with ReservationCard list ordered by date descending, empty state for no reservations in `src/pages/customer/ProfilePage.tsx`

**Checkpoint**: Customers can self-manage profiles and track reservation history independently.

---

## Phase 8: User Story 4 — Admin Tracks Finances with Accounting Module (Priority: P2)

**Goal**: Admin tracks revenue and expenses, views auto-generated journal entries from invoices, logs expenses with receipts, manages chart of accounts, and generates financial reports (Income Statement, Balance Sheet, VAT Report, General Ledger).

**Independent Test**: Issue an invoice, verify auto-generated journal entry, log an expense with receipt image, check Cash/Bank balance widgets update, generate Income Statement for a date range, verify totals are accurate.

### Implementation for User Story 4

- [x] T074 [P] [US4] Extend account service with full CRUD: `createAccount(account)` with unique code validation, `updateAccount(id, updates)`, `deleteAccount(id)` (prevent deletion if `isSystem === true`), `getAccountsByType(type)` in `src/services/accountService.ts`
- [x] T075 [P] [US4] Implement expense service: `createExpense(expense)` (uploads receipt image to Storage under `tenants/{tenantId}/receipts/`, auto-creates journal entry via journalService: debit expense account, credit cash/bank), `getExpenses`, `getExpensesByDateRange(from, to)` in `src/services/expenseService.ts`
- [x] T076 [P] [US4] Implement financial reports service: `generateIncomeStatement(fromDate, toDate)` (aggregates revenue and expense journal lines), `generateBalanceSheet(asOfDate)` (aggregates asset, liability, equity lines), `generateVATReport(fromDate, toDate)` (VAT collected vs paid), `getGeneralLedger(fromDate, toDate)` (all journal entries sorted by date with running balances) in `src/services/reportService.ts`
- [x] T077 [US4] Create chart of accounts management page: table with code, bilingual name, type badge (Asset/Liability/Equity/Revenue/Expense), system account indicator; add custom account form; edit/delete with system account protection in `src/pages/admin/AccountsPage.tsx`
- [x] T078 [US4] Create journal entries ledger page: data table with date, description, source type badge, debit/credit columns per line, expandable rows for multi-line entries; date range filter; source type filter (invoice, expense, asset, manual) in `src/pages/admin/JournalEntriesPage.tsx`
- [x] T079 [US4] Create manual journal entry form: date picker, description, dynamic line rows (account selector, debit or credit amount), real-time balance validation (total debits must equal total credits), submit button disabled until balanced in `src/components/admin/JournalEntryForm.tsx`
- [x] T080 [US4] Create expenses page: expense logging form (React Hook Form + Zod: date, expense account selector, amount, payment method cash/bank, description, receipt image upload with preview), expenses list table with date range filter and category filter in `src/pages/admin/ExpensesPage.tsx`
- [x] T081 [US4] Create financial reports page: report type selector tabs (Income Statement, Balance Sheet, VAT Report, General Ledger), date range picker, "Generate" button, formatted report output with bilingual labels, printable layout in `src/pages/admin/ReportsPage.tsx`
- [x] T082 [US4] Create Cash and Bank balance widget components: query journal entries to calculate current balance for account 1001 (Cash) and 1002 (Bank), display with currency formatting in SAR in `src/components/admin/BalanceWidgets.tsx`

**Checkpoint**: Full accounting module operational. Revenue tracking, expense management, journal ledger, and financial reporting available.

---

## Phase 9: User Story 9 — Admin Dashboard KPIs and Overview (Priority: P2)

**Goal**: Admin dashboard home displays key performance indicators (today's reservations, pending count, monthly revenue/expenses, net profit) and quick-access lists (recent reservations, upcoming appointments).

**Independent Test**: Log into admin dashboard, verify KPI cards show accurate numbers derived from actual reservation and financial data.

### Implementation for User Story 9

- [x] T083 [P] [US9] Implement dashboard data service: `getTodayReservationCount`, `getPendingReservationCount`, `getMonthlyRevenue(year, month)` (sum revenue journal entries), `getMonthlyExpenses(year, month)` (sum expense journal entries), `getRecentReservations(limit)` (last 10), `getUpcomingAppointments(limit)` (confirmed reservations with future dates) in `src/services/dashboardService.ts`
- [x] T084 [P] [US9] Create KPICard component: icon, bilingual label, formatted numeric value, optional trend indicator or color coding in `src/components/admin/KPICard.tsx`
- [x] T085 [US9] Create admin dashboard home page: KPI cards grid (today's reservations, pending reservations, monthly revenue in SAR, monthly expenses in SAR, net profit), recent reservations mini-table (ref#, customer, date, status — clickable to full detail), upcoming appointments list in `src/pages/admin/DashboardPage.tsx`

**Checkpoint**: Admin has at-a-glance business intelligence on login. Dashboard provides operational overview.

---

## Phase 10: User Story 6 — Admin Manages Customer Accounts (Priority: P3)

**Goal**: Admin views all registered customers with profiles and reservation histories, searches customers, and can deactivate accounts.

**Independent Test**: Navigate to user management, search for a customer by name/email, view their reservation history, deactivate their account, verify the customer can no longer log in.

### Implementation for User Story 6

- [x] T086 [P] [US6] Extend user service with admin functions: `getAllUsers` (with pagination), `getUserWithReservations(userId)`, `searchUsers(query)` (search by name, email, or phone), `deactivateUser(userId)` (calls deactivateUser Cloud Function) in `src/services/userService.ts`
- [x] T087 [US6] Create admin users management page: searchable data table (name, email, phone, registration date, reservation count, active status badge), user detail drawer/dialog showing full profile + reservation history list, "Deactivate" action button with ConfirmDialog in `src/pages/admin/UsersPage.tsx`

**Checkpoint**: Admin can manage customer accounts and handle account governance.

---

## Phase 11: User Story 10 — Admin Registers Business Assets (Priority: P3)

**Goal**: Admin registers business assets (equipment, tools, vehicles) with purchase details and values. Asset purchases auto-generate journal entries (Debit: Fixed Assets, Credit: Cash/Bank).

**Independent Test**: Register an asset with name, category, purchase date, value, and payment method. Verify journal entry is created with correct debit/credit. Verify asset appears in assets list.

### Implementation for User Story 10

- [x] T088 [P] [US10] Implement asset service: `createAsset(asset)` (auto-creates journal entry: debit 1200 Fixed Assets, credit 1001 Cash or 1002 Bank), `getAssets`, `updateAsset(id, { currentValue })` in `src/services/assetService.ts`
- [x] T089 [US10] Create assets management page: assets list table (name, category, purchase date, purchase value, current value, payment method), add asset form (React Hook Form + Zod: name, category, purchaseDate, purchaseValue, currentValue, paymentMethod), linked journal entry reference in `src/pages/admin/AssetsPage.tsx`

**Checkpoint**: Asset tracking operational with automatic accounting integration.

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Business settings management, performance optimization, PWA finalization, and cross-cutting improvements.

- [x] T090 [P] Implement business settings service: `getBusinessProfile`, `updateBusinessProfile` (name AR/EN, phone, WhatsApp, VAT, CR, address, logo upload), `getScheduleConfig`, `updateScheduleConfig`, `getPaymentSettings`, `updatePaymentSettings` in `src/services/settingsService.ts`
- [x] T091 Create admin settings page with tabs: Business Profile (form with logo upload), Schedule (working hours per day, slot duration, max bookings, blocked dates manager), Payment (gateway provider selector, publishable key input) in `src/pages/admin/SettingsPage.tsx`
- [x] T092 [P] Add loading states (Skeleton components) and error boundaries to all pages in `src/components/common/ErrorBoundary.tsx` and page-level implementations
- [x] T093 [P] Implement PWA offline handling: cache app shell, show offline indicator when disconnected, display cached service catalog for browsing, queue reservation submission for when connectivity returns in `src/hooks/useOnlineStatus.ts`
- [x] T094 Optimize bundle size: verify code-splitting per route via React.lazy, lazy-load pdfmake-rtl only on PDF generation, lazy-load payment gateway SDK, audit and tree-shake unused shadcn components
- [x] T095 [P] Create PWA icons (192x192, 512x512) and finalize `public/manifest.json` with Arabic app name, theme color, and display standalone configuration in `public/`
- [x] T096 Run full validation against quickstart.md: verify dev server starts, emulator seeds correctly, customer flow works end-to-end (browse → cart → register → reserve → confirm), admin flow works (login → manage services → manage reservations → invoice → PDF)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US3 (Phase 3)**: Depends on Foundational — admin must create services before customers can browse
- **US1 (Phase 4)**: Depends on Foundational + US3 (services must exist in catalog)
- **US2 (Phase 5)**: Depends on Foundational + US1 (reservations must exist to manage/convert)
- **US8 (Phase 6)**: Depends on Foundational + US3 (landing page shows services/offers)
- **US5 (Phase 7)**: Depends on Foundational + US1 (customer must have reservations to view history)
- **US4 (Phase 8)**: Depends on Foundational + US2 (accounting builds on invoice journal entries)
- **US9 (Phase 9)**: Depends on US2 + US4 (dashboard aggregates reservation + financial data)
- **US6 (Phase 10)**: Depends on Foundational (user management is independent of other stories)
- **US10 (Phase 11)**: Depends on US4 (asset service uses journal entry and account services)
- **Polish (Phase 12)**: Depends on all desired user stories being complete

### User Story Dependencies (Simplified)

```
Phase 1 (Setup) → Phase 2 (Foundational)
                        │
                        ├─→ Phase 3 (US3: Services) ──→ Phase 4 (US1: Booking) ──→ Phase 5 (US2: Invoicing)
                        │         │                              │                          │
                        │         └──→ Phase 6 (US8: Landing)   │                          ├─→ Phase 8 (US4: Accounting)
                        │                                        │                          │         │
                        │                                        └──→ Phase 7 (US5: Profile)│         └─→ Phase 9 (US9: Dashboard)
                        │                                                                   │                    │
                        ├─→ Phase 10 (US6: Users)                                          │         Phase 11 (US10: Assets) ←─┘
                        │                                                                   │
                        └───────────────────────────────────────────────────────────────────→ Phase 12 (Polish)
```

### Within Each User Story

- Models/services before UI pages
- Services that depend on other services come after
- Core pages before detail/form components (or parallel if independent files)

### Parallel Opportunities

**Within Phase 2 (Foundational)**:
- T009-T014 are all independent files ([P] marked) — can run in parallel
- T020-T021, T024-T026, T028 are independent — can run in parallel
- T029-T030, T033-T034 are independent — can run in parallel

**Within Phase 3 (US3)**:
- T035 and T036 (category + service services) — parallel
- T037-T038 and T039-T040 (categories page/form and services page/form) — parallel after services

**Within Phase 4 (US1)**:
- T041-T044 (cart store, schedule service, reservation service, WhatsApp util) — all parallel
- T048 and T049 (register + login pages) — parallel

**Within Phase 5 (US2)**:
- T053-T057 (ZATCA QR, Hijri dates, PDF, account service, journal service) — all parallel
- T060 (payment service) parallel with T061-T062 (reservation pages)

**Across Phases** (if team capacity allows):
- Phase 6 (US8) can start once Phase 3 is done, in parallel with Phase 4
- Phase 10 (US6) can start right after Phase 2, independent of other stories

---

## Parallel Example: Phase 4 (User Story 1)

```bash
# Launch all services/stores in parallel:
Task: T041 "Implement cart Zustand store in src/stores/cartStore.ts"
Task: T042 "Implement schedule service in src/services/scheduleService.ts"
Task: T043 "Implement reservation service in src/services/reservationService.ts"
Task: T044 "Implement WhatsApp notification link generator in src/lib/whatsapp.ts"

# Then launch pages (some can be parallel):
Task: T045 "Create ServiceCard component in src/components/customer/ServiceCard.tsx"
Task: T048 "Create customer registration page in src/pages/customer/RegisterPage.tsx"
Task: T049 "Create customer login page in src/pages/customer/LoginPage.tsx"
```

---

## Implementation Strategy

### MVP First (Phases 1-5)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: US3 — Admin creates service catalog
4. Complete Phase 4: US1 — Customer browsing and booking
5. **STOP AND VALIDATE**: Full booking flow works end-to-end
6. Complete Phase 5: US2 — Admin manages reservations and invoicing
7. **MVP COMPLETE**: Core business operations functional

### Incremental Delivery

1. Setup + Foundational → Framework ready
2. Add US3 → Admin can manage catalog → Demo-ready
3. Add US1 → Customers can book → **MVP Launch!**
4. Add US2 → Admin can invoice → **Revenue operations live**
5. Add US8 → Landing page → Better first impression
6. Add US5 → Customer profiles → Improved retention
7. Add US4 → Accounting → Financial management
8. Add US9 → Dashboard KPIs → Business intelligence
9. Add US6 → User management → Platform governance
10. Add US10 → Asset tracking → Complete accounting
11. Polish → Production-ready

### Suggested MVP Scope

**Phases 1-5** (T001-T067): Setup + Foundational + US3 + US1 + US2 = 67 tasks

This delivers:
- Admin can create/manage service catalog
- Customers can browse, add to cart, register, book reservations
- Admin can manage reservations, convert to ZATCA-compliant invoices, print/export PDF
- Full bilingual AR/EN interface with RTL support
- Dark/light mode
- PWA-ready

---

## Notes

- [P] tasks = different files, no dependencies on other incomplete tasks in same phase
- [Story] label maps task to specific user story for traceability
- Each user story phase should be independently completable and testable
- Commit after each task or logical group of tasks
- Stop at any checkpoint to validate story independently
- All UI strings use i18n keys — never hardcode Arabic or English text
- All Firestore operations scoped under `tenants/{tenantId}/`
- Use Tailwind logical properties (ms-, me-, ps-, pe-, text-start, text-end) — never hardcode left/right
