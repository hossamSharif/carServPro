# TEST-PLAN: User Story 6 — Admin Manages Customer Accounts

Generated: 2026-03-07
Approach: Code-Scanning (v3)

## Codebase Analysis

| File | Path | Purpose |
|------|------|---------|
| Component | `src/pages/admin/UsersPage.tsx` | Main admin users management UI |
| Service | `src/services/userService.ts` | User CRUD + search + deactivate |
| ConfirmDialog | `src/components/common/ConfirmDialog.tsx` | Reusable confirmation modal |
| Types | `src/types/index.ts` | User interface definition |
| StatusColors | `src/lib/statusColors.ts` | Reservation status color mapping |
| Routes | `src/routes/index.tsx` | `/admin/users` route definition |
| i18n (AR) | `src/i18n/ar.json` | Arabic translations |
| i18n (EN) | `src/i18n/en.json` | English translations |

## US6 Requirements (from spec)

- **FR-020**: List all registered customers with name, email, phone, registration date, reservation count
- **FR-021**: View customer profile and reservation history
- **FR-022**: Deactivate customer account (prevent future logins)

---

## UI Tests (from JSX analysis)

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US6-UI-1 | Navigate to /admin/users | Page loads with title "إدارة المستخدمين" / "Manage Users" | Chrome | [ ] |
| US6-UI-2 | Search bar visible | Input field + search button rendered | Chrome | [ ] |
| US6-UI-3 | Users table visible | Table with columns: name, email, phone, date, status, actions | Chrome | [ ] |
| US6-UI-4 | Table headers i18n | Headers show correct i18n labels (AR/EN) | Chrome | [ ] |
| US6-UI-5 | User row displays name with icon | User icon + fullName visible | Chrome | [ ] |
| US6-UI-6 | User row displays email (LTR) | Email shown with dir="ltr" | Chrome | [ ] |
| US6-UI-7 | User row displays phone (LTR) | Phone shown with dir="ltr" | Chrome | [ ] |
| US6-UI-8 | User row displays registration date | Formatted date from createdAt Timestamp | Chrome | [ ] |
| US6-UI-9 | Active user shows green badge | "نشط"/"Active" with emerald styling | Chrome | [ ] |
| US6-UI-10 | Inactive user shows red badge | "معطل"/"Inactive" with red styling | Chrome | [ ] |
| US6-UI-11 | Deactivate button visible for active users | Button with UserX icon + label | Chrome | [ ] |
| US6-UI-12 | Deactivate button hidden for inactive users | No deactivate button shown | Chrome | [ ] |
| US6-UI-13 | Empty state when no users | "لا توجد بيانات"/"No data" message | Chrome | [ ] |
| US6-UI-14 | Loading state on page load | Loading text shown while fetching | Chrome | [ ] |

## Expand/Collapse Tests (from JSX analysis)

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US6-EXP-1 | Click user row expands details | Reservation history section appears | Chrome | [ ] |
| US6-EXP-2 | Chevron toggles on expand | ChevronDown → ChevronUp | Chrome | [ ] |
| US6-EXP-3 | Click expanded row collapses | Details section hidden, chevron reverts | Chrome | [ ] |
| US6-EXP-4 | Reservation table in expanded view | Shows ref#, date, status columns | Chrome | [ ] |
| US6-EXP-5 | No reservations message | "لا توجد حجوزات" / "No reservations" shown | Chrome | [ ] |
| US6-EXP-6 | Loading state for reservations | Shows loading text while fetching | Chrome | [ ] |
| US6-EXP-7 | Reservation status badges colored | Correct STATUS_COLORS applied | Chrome | [ ] |

## Search Tests (from code analysis)

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US6-SRCH-1 | Type in search + click button | Filters users by query | Chrome | [ ] |
| US6-SRCH-2 | Search by name | Matching users displayed | Chrome | [ ] |
| US6-SRCH-3 | Search by email | Matching users displayed | Chrome | [ ] |
| US6-SRCH-4 | Search by phone | Matching users displayed | Chrome | [ ] |
| US6-SRCH-5 | Press Enter to search | Same as clicking search button | Chrome | [ ] |
| US6-SRCH-6 | Clear search + search again | Shows all users | Chrome | [ ] |
| US6-SRCH-7 | No results | Empty table with "No data" message | Chrome | [ ] |

## Deactivation Tests (from code analysis)

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US6-DEACT-1 | Click deactivate button | Confirmation dialog opens | Chrome | [ ] |
| US6-DEACT-2 | Confirm dialog shows title + description | "تعطيل الحساب" title, confirmation message | Chrome | [ ] |
| US6-DEACT-3 | Cancel deactivation | Dialog closes, no changes | Chrome | [ ] |
| US6-DEACT-4 | Confirm deactivation | User status changes to inactive | Chrome | [ ] |
| US6-DEACT-5 | After deactivation, button disappears | No deactivate button for that user | Chrome | [ ] |
| US6-DEACT-6 | Click outside dialog closes it | Backdrop click closes dialog | Chrome | [ ] |

## i18n / RTL Tests

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US6-I18N-1 | Page in Arabic (default) | All labels in Arabic, RTL layout | Chrome | [ ] |
| US6-I18N-2 | Switch to English | All labels switch to English, LTR layout | Chrome | [ ] |
| US6-I18N-3 | Search placeholder i18n | Placeholder text matches language | Chrome | [ ] |
| US6-I18N-4 | Status badges i18n | "نشط/معطل" in AR, "Active/Inactive" in EN | Chrome | [ ] |

---

### **HARD STOP** — US6 Test Plan Complete
