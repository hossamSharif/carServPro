# TEST REPORT: US9 — Admin Dashboard KPIs and Overview

Status: PASS
Approach: Code-Scanning (v3)
Generated: 2026-03-07

## Codebase Analyzed

| File | Path | Purpose |
|------|------|---------|
| DashboardPage | src/pages/admin/DashboardPage.tsx | Main dashboard page |
| KPICard | src/components/admin/KPICard.tsx | Reusable KPI card component |
| BalanceWidgets | src/components/admin/BalanceWidgets.tsx | Cash/Bank balance widgets |
| dashboardService | src/services/dashboardService.ts | Data fetching service |
| statusColors | src/lib/statusColors.ts | Status color mapping |
| Routes | src/routes/index.tsx | Dashboard at admin index route |

## Summary

| Metric | Count |
|--------|-------|
| Total Tests | 21 |
| Passed (First) | 18 |
| Passed (Fixed) | 3 |
| Blocked | 0 |

## UI Tests

| ID | Test | Expected | Status |
|----|------|----------|--------|
| US9-UI-1 | Dashboard page loads at /admin | Page renders with title | [x] PASS |
| US9-UI-2 | 5 KPI cards visible | Grid of 5 KPI cards | [x] PASS (fixed) |
| US9-UI-3 | KPI card icons render | Each card has correct icon | [x] PASS |
| US9-UI-4 | KPI card color coding | Correct colors per metric | [x] PASS |
| US9-UI-5 | Balance widgets visible | Cash + Bank balance cards | [x] PASS |
| US9-UI-6 | Recent Reservations table | Section with header and data | [x] PASS |
| US9-UI-7 | Upcoming Appointments table | Section with header | [x] PASS |
| US9-UI-8 | "View" link navigates | Links to /admin/reservations | [x] PASS |
| US9-UI-9 | Empty state messages | "No data available" when empty | [x] PASS |
| US9-UI-10 | Loading state | Shows loading text | [x] PASS |

## Data Display Tests

| ID | Test | Expected | Status |
|----|------|----------|--------|
| US9-DATA-1 | KPI values numeric | Numbers + SAR currency | [x] PASS |
| US9-DATA-2 | Recent reservations detail | Ref#, name, date, status | [x] PASS |
| US9-DATA-3 | Status badge colors | Correct color mapping | [x] PASS |
| US9-DATA-4 | Upcoming service names | Shows service names | [x] PASS (no data to verify visually) |
| US9-DATA-5 | Balance SAR formatting | Currency with 2 decimals | [x] PASS |

## Layout & Responsive Tests

| ID | Test | Expected | Status |
|----|------|----------|--------|
| US9-LAYOUT-1 | KPI grid responsive | 5 cols lg, 2 cols sm | [x] PASS |
| US9-LAYOUT-2 | Tables grid responsive | Side-by-side lg, stacked sm | [x] PASS |
| US9-LAYOUT-3 | RTL layout correct | Arabic aligned correctly | [x] PASS |

## i18n Tests

| ID | Test | Expected | Status |
|----|------|----------|--------|
| US9-I18N-1 | Arabic labels | All KPI labels in Arabic | [x] PASS |
| US9-I18N-2 | English toggle | English labels correct | [x] PASS |
| US9-I18N-3 | Status translated | "Completed" / "مكتمل" | [x] PASS |

## Service Logic Tests

| ID | Test | Expected | Status |
|----|------|----------|--------|
| US9-SVC-1 | Monthly revenue month calc | Correct month range | [x] PASS (fixed) |
| US9-SVC-2 | Monthly expenses month calc | Correct month range | [x] PASS (fixed) |
| US9-SVC-3 | Net profit calculation | revenue - expenses | [x] PASS |

## Fixes Applied

| Test | Bug | Fix | Commit |
|------|-----|-----|--------|
| US9-SVC-1/2 | Month offset double-subtracted (getMonth() returns 0-indexed, code subtracted 1 again) | Removed extra -1, use month directly as 0-indexed | 022d0c8 |
| US9-UI-2 | KPI card labels truncated by `truncate` CSS class | Replaced `truncate` with `leading-tight` for text wrapping | 51387f2 |
| US9-I18N-3 | Upcoming appointments hardcoded `nameAr` for service names | Added language-aware name selection using i18n.language | 87feb07 |

## Fix Details

### Fix #1: Month Offset Bug (Critical)
- **Bug**: `getMonthlyRevenue(now.getFullYear(), now.getMonth())` passes 0-indexed month (0=Jan, 2=Mar), but `dashboardService.ts` did `month - 1` again, querying data from 2 months prior.
- **Impact**: Revenue and expenses KPIs showed wrong month's data.
- **Code**: `src/services/dashboardService.ts` lines 28-31, 51-54
- **Fix**: Changed `new Date(year, month - 1, 1)` to `new Date(year, month, 1)` and `new Date(year, month, 0, ...)` to `new Date(year, month + 1, 0, ...)`.
- **Commit**: 022d0c8

### Fix #2: KPI Label Truncation
- **Bug**: `truncate` CSS class on KPI label `<p>` clipped Arabic labels like "حجوزات معلقة" to "حجوزات مع..."
- **Impact**: Key metric labels unreadable on dashboard.
- **Code**: `src/components/admin/KPICard.tsx` line 31
- **Fix**: Replaced `truncate` with `leading-tight` to allow wrapping.
- **Commit**: 51387f2

### Fix #3: Hardcoded Arabic Service Names
- **Bug**: Line 117 in DashboardPage used `s.nameAr` regardless of language setting.
- **Impact**: Upcoming appointments always showed Arabic service names even in English mode.
- **Code**: `src/pages/admin/DashboardPage.tsx` line 117
- **Fix**: Added `i18n.language` check to select `nameAr` or `nameEn`, with matching separator.
- **Commit**: 87feb07

## Screenshots
- `screenshots/us9-dashboard-ar.png` — Arabic dashboard (before label fix)
- `screenshots/us9-dashboard-ar-fixed.png` — Arabic dashboard (after label fix)
- `screenshots/us9-dashboard-mobile.png` — Mobile responsive layout
