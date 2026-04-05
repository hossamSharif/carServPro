# TEST-PLAN: US4 (Accounting Module) & US5 (Customer Profile)

Generated: 2026-03-05
Approach: Code-Scanning (v3)
Branch: 001-carserv-pro-platform

## Codebase Analysis

### US4 - Admin Tracks Finances with Accounting Module

| File | Path | Purpose |
|------|------|---------|
| AccountsPage | src/pages/admin/AccountsPage.tsx | Chart of accounts CRUD |
| ExpensesPage | src/pages/admin/ExpensesPage.tsx | Expense logging with receipt |
| JournalEntriesPage | src/pages/admin/JournalEntriesPage.tsx | Journal entry ledger |
| ReportsPage | src/pages/admin/ReportsPage.tsx | Financial reports (Income, Balance, VAT, Ledger) |
| DashboardPage | src/pages/admin/DashboardPage.tsx | Dashboard with KPI + balance widgets |
| BalanceWidgets | src/components/admin/BalanceWidgets.tsx | Cash/Bank balance display |
| JournalEntryForm | src/components/admin/JournalEntryForm.tsx | Manual journal entry form |
| KPICard | src/components/admin/KPICard.tsx | KPI display card |
| accountService | src/services/accountService.ts | Account CRUD operations |
| expenseService | src/services/expenseService.ts | Expense creation + auto journal |
| journalService | src/services/journalService.ts | Journal entry creation + validation |
| reportService | src/services/reportService.ts | Report generation logic |

### US5 - Customer Manages Profile and Reservation History

| File | Path | Purpose |
|------|------|---------|
| ProfilePage | src/pages/customer/ProfilePage.tsx | Profile edit + reservation history |
| ReservationCard | src/components/customer/ReservationCard.tsx | Individual reservation display |
| userService | src/services/userService.ts | Profile CRUD + validation |
| reservationService | src/services/reservationService.ts | Customer reservation queries |

---

## US4 TESTS

### Accounts Page (`/admin/accounting`)

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US4-ACC-UI-1 | Navigate to /admin/accounting | Page loads with "Chart of Accounts" heading | Chrome | [ ] |
| US4-ACC-UI-2 | Verify accounts table structure | Accounts grouped by type (asset, liability, equity, revenue, expense) with colored badges | Chrome | [ ] |
| US4-ACC-UI-3 | Verify "Add Account" button exists | Button with Plus icon visible | Chrome | [ ] |
| US4-ACC-UI-4 | Click "Add Account" button | Form appears with code, nameAr, nameEn, type fields | Chrome | [ ] |
| US4-ACC-UI-5 | System accounts show shield icon | System accounts display shield icon and no edit/delete buttons | Chrome | [ ] |
| US4-ACC-UI-6 | Non-system accounts show edit/delete | Edit and delete action buttons visible for custom accounts | Chrome | [ ] |
| US4-ACC-CRUD-1 | Create a new account | Fill form (code: 5010, nameAr: test, nameEn: Test Expense, type: expense), save, verify appears in list | Chrome | [ ] |
| US4-ACC-CRUD-2 | Edit an existing account | Click edit on custom account, modify name, save, verify updated | Chrome | [ ] |
| US4-ACC-CRUD-3 | Delete a custom account | Click delete on custom account, confirm, verify removed from list | Chrome | [ ] |
| US4-ACC-VAL-1 | Cancel form | Click cancel, form disappears, no changes saved | Chrome | [ ] |
| US4-ACC-VAL-2 | Account code disabled during edit | When editing, code field is disabled | Chrome | [ ] |

### Expenses Page (`/admin/expenses`)

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US4-EXP-UI-1 | Navigate to /admin/expenses | Page loads with "Expenses" heading and table | Chrome | [ ] |
| US4-EXP-UI-2 | Empty state displayed | When no expenses, "No data" message shown | Chrome | [ ] |
| US4-EXP-UI-3 | Click "Add Expense" button | Expense form appears with date, account, amount, payment method, description, receipt fields | Chrome | [ ] |
| US4-EXP-UI-4 | Expense accounts dropdown populated | Dropdown shows only expense-type accounts | Chrome | [ ] |
| US4-EXP-UI-5 | Payment method options | Cash and Bank Transfer options available | Chrome | [ ] |
| US4-EXP-CRUD-1 | Create a new expense | Fill form with valid data, save, verify appears in table | Chrome | [ ] |
| US4-EXP-VAL-1 | Submit empty form | Validation errors shown for required fields | Chrome | [ ] |
| US4-EXP-VAL-2 | Cancel expense form | Click cancel, form closes, no expense created | Chrome | [ ] |

### Journal Entries Page (`/admin/journal`)

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US4-JE-UI-1 | Navigate to /admin/journal | Page loads with "Journal Entries" heading | Chrome | [ ] |
| US4-JE-UI-2 | Verify table columns | Date, Description, Source Type, Debit, Credit columns visible | Chrome | [ ] |
| US4-JE-UI-3 | Source type filter dropdown | Filter dropdown with invoice, expense, asset, manual options | Chrome | [ ] |
| US4-JE-UI-4 | Empty state | "No data" message when no entries exist | Chrome | [ ] |
| US4-JE-UI-5 | Click "Add Journal Entry" | JournalEntryForm component appears | Chrome | [ ] |
| US4-JE-UI-6 | Expandable rows | Click entry row to expand, shows line details with account code, name, debit, credit | Chrome | [ ] |
| US4-JE-UI-7 | Source type badges | Colored badges for each source type | Chrome | [ ] |
| US4-JE-FORM-1 | Journal entry form structure | Date, description, line items with account selector, debit/credit, add/remove line buttons | Chrome | [ ] |
| US4-JE-FORM-2 | Balance indicator | Shows total debits and credits with balanced/unbalanced indicator | Chrome | [ ] |
| US4-JE-FORM-3 | Submit disabled when unbalanced | Save button disabled until debits equal credits and > 0 | Chrome | [ ] |
| US4-JE-FORM-4 | Mutual exclusion of debit/credit | Setting debit clears credit and vice versa | Chrome | [ ] |
| US4-JE-FORM-5 | Minimum 2 lines enforced | Cannot remove lines below 2 | Chrome | [ ] |
| US4-JE-FORM-6 | Add line | Click add button, new empty line row appears | Chrome | [ ] |
| US4-JE-CRUD-1 | Create manual journal entry | Fill balanced entry, submit, verify appears in list | Chrome | [ ] |
| US4-JE-FILTER-1 | Filter by source type | Select "manual" filter, only manual entries shown | Chrome | [ ] |

### Reports Page (`/admin/reports`)

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US4-RPT-UI-1 | Navigate to /admin/reports | Page loads with "Reports" heading and report type tabs | Chrome | [ ] |
| US4-RPT-UI-2 | Report type tabs | 4 tabs: Income Statement, Balance Sheet, VAT Report, General Ledger | Chrome | [ ] |
| US4-RPT-UI-3 | Date range picker visible | From/To date inputs and Generate button | Chrome | [ ] |
| US4-RPT-UI-4 | Balance Sheet hides "To" date | When Balance Sheet tab selected, only From date shown | Chrome | [ ] |
| US4-RPT-UI-5 | Generate button disabled without date | Button disabled when fromDate is empty | Chrome | [ ] |
| US4-RPT-GEN-1 | Generate Income Statement | Select date range, click Generate, report shows revenue/expenses/net profit | Chrome | [ ] |
| US4-RPT-GEN-2 | Generate Balance Sheet | Select as-of date, click Generate, report shows assets/liabilities/equity | Chrome | [ ] |
| US4-RPT-GEN-3 | Generate VAT Report | Select date range, click Generate, shows VAT collected/paid/net | Chrome | [ ] |
| US4-RPT-GEN-4 | Generate General Ledger | Select date range, click Generate, shows entries with debit/credit | Chrome | [ ] |
| US4-RPT-UI-6 | Print button appears after report | After generating, Print button visible | Chrome | [ ] |
| US4-RPT-UI-7 | Tab switching clears report | Click different tab, previous report data cleared | Chrome | [ ] |

### Dashboard Balance Widgets (`/admin`)

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US4-DASH-UI-1 | Navigate to /admin | Dashboard loads with KPI cards and balance widgets | Chrome | [ ] |
| US4-DASH-UI-2 | Balance widgets visible | Cash Balance and Bank Balance widgets with icons and SAR amounts | Chrome | [ ] |
| US4-DASH-UI-3 | KPI cards displayed | 5 KPI cards: today reservations, pending, monthly revenue, expenses, net profit | Chrome | [ ] |

---

## US5 TESTS

### Profile Page (`/profile`)

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US5-PROF-UI-1 | Navigate to /profile (unauthenticated) | Redirected to /login | Chrome | [ ] |
| US5-PROF-UI-2 | Profile page loads (authenticated customer) | Page shows profile heading, email (read-only), name, phone fields, save button | Chrome | [ ] |
| US5-PROF-UI-3 | Email field is disabled | Email input is read-only/disabled with muted background | Chrome | [ ] |
| US5-PROF-UI-4 | Form pre-populated | Name and phone fields filled from user profile | Chrome | [ ] |
| US5-PROF-UI-5 | Reservation history section visible | "My Reservations" heading with reservation list or empty state | Chrome | [ ] |
| US5-PROF-CRUD-1 | Update profile name | Change name, click save, success indicator appears | Chrome | [ ] |
| US5-PROF-CRUD-2 | Update profile phone | Change phone, click save, success indicator appears | Chrome | [ ] |
| US5-PROF-VAL-1 | Invalid name (too short) | Enter 1 char name, submit, validation error shown | Chrome | [ ] |
| US5-PROF-VAL-2 | Invalid phone | Enter invalid phone, submit, validation error shown | Chrome | [ ] |

### Reservation Card Component

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US5-CARD-UI-1 | Reservation card structure | Shows reference number, status badge, date, time, services list, total | Chrome | [ ] |
| US5-CARD-UI-2 | Status badge colors | pending=yellow, confirmed=blue, in_progress=orange, completed=green, cancelled=red | Chrome | [ ] |
| US5-CARD-UI-3 | Service line items | Each service shows name, quantity (if >1), and line total | Chrome | [ ] |
| US5-CARD-UI-4 | Total amount | Total calculated correctly from service prices and quantities | Chrome | [ ] |

### Empty State

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US5-EMPTY-1 | No reservations | When customer has no reservations, empty state message displayed | Chrome | [ ] |

---

## Summary

| Category | Count |
|----------|-------|
| US4 Tests | 42 |
| US5 Tests | 14 |
| **Total** | **56** |

### HARD STOPS
- After all Accounts tests complete
- After all Expenses tests complete
- After all Journal Entries tests complete
- After all Reports tests complete
- After all Dashboard tests complete
- After all Profile tests complete
- After all Reservation Card tests complete
