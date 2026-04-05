# TEST REPORT: User Story 6 — Admin Manages Customer Accounts

Status: ✅ COMPLETE
Approach: Code-Scanning (v3)
Date: 2026-03-07

## Codebase Analyzed

| File | Path | Purpose |
|------|------|---------|
| Component | `src/pages/admin/UsersPage.tsx` | Main admin users management UI |
| Service | `src/services/userService.ts` | User CRUD + search + deactivate |
| Cloud Function | `functions/src/admin.ts` | deactivateUser callable function |
| ConfirmDialog | `src/components/common/ConfirmDialog.tsx` | Reusable confirmation modal |
| Types | `src/types/index.ts` | User interface definition |
| StatusColors | `src/lib/statusColors.ts` | Reservation status color mapping |
| Routes | `src/routes/index.tsx` | `/admin/users` route definition |
| i18n (AR) | `src/i18n/ar.json` | Arabic translations |
| i18n (EN) | `src/i18n/en.json` | English translations |

## Summary

| Metric | Count |
|--------|-------|
| Total Tests | 34 |
| Passed (First Run) | 33 |
| Passed (After Fix) | 1 |
| Blocked | 0 |
| Bugs Found | 1 |
| Bugs Fixed | 1 |
| Commits | 1 |

## Test Results

### UI Tests (14/14 passed)

| ID | Test | Expected | Status |
|----|------|----------|--------|
| US6-UI-1 | Navigate to /admin/users | Page loads with "إدارة المستخدمين" / "Manage Users" | ✅ |
| US6-UI-2 | Search bar visible | Input + search button rendered | ✅ |
| US6-UI-3 | Users table visible | Table with all columns | ✅ |
| US6-UI-4 | Table headers i18n | Arabic: الاسم الكامل, البريد الإلكتروني, etc. English: Full Name, Email, etc. | ✅ |
| US6-UI-5 | User row displays name with icon | User icon + fullName | ✅ |
| US6-UI-6 | User row displays email (LTR) | Email with dir="ltr" | ✅ |
| US6-UI-7 | User row displays phone (LTR) | Phone with dir="ltr" | ✅ |
| US6-UI-8 | Registration date displayed | 3/4/2026 formatted from Timestamp | ✅ |
| US6-UI-9 | Active user shows green badge | "نشط"/"Active" with emerald styling | ✅ |
| US6-UI-10 | Inactive user shows red badge | "معطل"/"Inactive" with red styling | ✅ |
| US6-UI-11 | Deactivate button for active users | Button with UserX icon visible | ✅ |
| US6-UI-12 | Deactivate button hidden for inactive | No button in actions column | ✅ |
| US6-UI-13 | Empty state | "لا توجد بيانات"/"No data" message | ✅ |
| US6-UI-14 | Loading state | "جاري التحميل..." shown on page load | ✅ (code verified) |

### Expand/Collapse Tests (7/7 passed)

| ID | Test | Expected | Status |
|----|------|----------|--------|
| US6-EXP-1 | Click row expands details | Reservation history section | ✅ |
| US6-EXP-2 | Chevron toggles | ChevronDown → ChevronUp | ✅ |
| US6-EXP-3 | Click again collapses | Details hidden, chevron reverts | ✅ |
| US6-EXP-4 | Reservation table in expanded view | Ref#, date, status columns | ✅ |
| US6-EXP-5 | No reservations message | "لا توجد حجوزات" for admin user | ✅ |
| US6-EXP-6 | Loading state for reservations | Loading text while fetching | ✅ (code verified) |
| US6-EXP-7 | Reservation status badges colored | STATUS_COLORS applied (مكتمل = emerald) | ✅ |

### Search Tests (7/7 passed)

| ID | Test | Expected | Status |
|----|------|----------|--------|
| US6-SRCH-1 | Type + click button | Filters users | ✅ |
| US6-SRCH-2 | Search by name "عميل" | Only customer shown | ✅ |
| US6-SRCH-3 | Search by email "admin@carserv" | Only admin shown | ✅ |
| US6-SRCH-4 | Search by phone "511111" | Only customer shown | ✅ |
| US6-SRCH-5 | Press Enter to search | Same as button click | ✅ |
| US6-SRCH-6 | Clear search + search again | All users restored | ✅ |
| US6-SRCH-7 | No results | "لا توجد بيانات" empty state | ✅ |

### Deactivation Tests (6/6 passed — 1 required fix)

| ID | Test | Expected | Status |
|----|------|----------|--------|
| US6-DEACT-1 | Click deactivate button | Confirmation dialog opens | ✅ |
| US6-DEACT-2 | Dialog shows title + description | "تعطيل الحساب" + "تأكيد" | ✅ |
| US6-DEACT-3 | Cancel deactivation | Dialog closes, no changes | ✅ |
| US6-DEACT-4 | Confirm deactivation | User status → inactive | ✅ (after fix) |
| US6-DEACT-5 | Button disappears after deactivation | No button for deactivated user | ✅ (after fix) |
| US6-DEACT-6 | Backdrop click closes dialog | Dialog dismissed | ✅ |

### i18n / RTL Tests (4/4 passed)

| ID | Test | Expected | Status |
|----|------|----------|--------|
| US6-I18N-1 | Arabic mode (default) | RTL layout, Arabic labels | ✅ |
| US6-I18N-2 | English mode | LTR layout, English labels | ✅ |
| US6-I18N-3 | Search placeholder i18n | "بحث" / "Search" | ✅ |
| US6-I18N-4 | Status badges i18n | "نشط/معطل" / "Active/Inactive" | ✅ |

---

## Fixes Applied

| Test | Bug | Fix | Commit |
|------|-----|-----|--------|
| US6-DEACT-4 | `deactivateUser` sends `{ userId }` but cloud function expects `{ targetUid }` → 400 "Missing targetUid" | Changed parameter name in `userService.ts` to send `{ targetUid: userId }` | `de5ea7d` |

### Fix #1: deactivateUser parameter mismatch

- **Bug**: `src/services/userService.ts:77` sends `{ userId }` to the `deactivateUser` cloud function, but `functions/src/admin.ts:40` destructures `{ targetUid }` from the data. This caused a 400 error: "Missing targetUid".
- **Root Cause**: Parameter naming mismatch between client service and cloud function contract.
- **Code Analyzed**: `src/services/userService.ts`, `functions/src/admin.ts`
- **Solution**: Changed `userService.ts` to send `{ targetUid: userId }` and updated the TypeScript generic from `{ userId: string }` to `{ targetUid: string }`.
- **Commit**: `de5ea7d` — `fix(user-service): send targetUid instead of userId to deactivateUser cloud function`

## Screenshots

| Screenshot | Description |
|------------|-------------|
| `screenshots/us6-page-load.png` | Initial page load with Arabic UI |
| `screenshots/us6-expand-reservations.png` | Expanded user row with reservation history |
| `screenshots/us6-confirm-dialog.png` | Deactivation confirmation dialog |
| `screenshots/us6-deactivated-user.png` | User after deactivation (Arabic) |
| `screenshots/us6-english-mode.png` | English mode with Active/Inactive badges |

## Blocked

None.

---

<promise>ALL_TESTS_COMPLETE</promise>
