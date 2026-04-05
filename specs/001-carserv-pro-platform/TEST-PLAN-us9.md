# TEST-PLAN: US9 — Admin Dashboard KPIs and Overview

Generated: 2026-03-07
Approach: Code-Scanning (v3)

## Codebase Analysis

| File | Path | Purpose |
|------|------|---------|
| DashboardPage | src/pages/admin/DashboardPage.tsx | Main dashboard page |
| KPICard | src/components/admin/KPICard.tsx | Reusable KPI card component |
| BalanceWidgets | src/components/admin/BalanceWidgets.tsx | Cash/Bank balance widgets |
| dashboardService | src/services/dashboardService.ts | Data fetching service |
| statusColors | src/lib/statusColors.ts | Status color mapping |
| Routes | src/routes/index.tsx | Dashboard at admin index route |

## UI Tests (from JSX analysis)

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US9-UI-1 | Dashboard page loads at /admin | Page renders with title "لوحة التحكم" or "Dashboard" | Chrome | [ ] |
| US9-UI-2 | 5 KPI cards visible | Grid of 5 KPI cards: Today's Reservations, Pending, Revenue, Expenses, Net Profit | Chrome | [ ] |
| US9-UI-3 | KPI card icons render | Each card has an icon (CalendarDays, Clock, TrendingUp, TrendingDown, DollarSign) | Chrome | [ ] |
| US9-UI-4 | KPI card color coding | Pending=yellow, Revenue=green, Expenses=red, NetProfit=dynamic | Chrome | [ ] |
| US9-UI-5 | Balance widgets section visible | Cash Balance and Bank Balance cards shown below KPIs | Chrome | [ ] |
| US9-UI-6 | Recent Reservations table visible | Section with header "أحدث الحجوزات" / "Recent Reservations" | Chrome | [ ] |
| US9-UI-7 | Upcoming Appointments table visible | Section with header "المواعيد القادمة" / "Upcoming Appointments" | Chrome | [ ] |
| US9-UI-8 | "View" link in recent reservations | Link to /admin/reservations exists | Chrome | [ ] |
| US9-UI-9 | Empty state messages | When no data, "لا توجد بيانات" / "No data" message appears | Chrome | [ ] |
| US9-UI-10 | Loading state | Shows loading text before data loads | Chrome | [ ] |

## Data Display Tests

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US9-DATA-1 | KPI values are numeric | Today and Pending show numbers, Revenue/Expenses/Profit show "X SAR" | Chrome | [ ] |
| US9-DATA-2 | Recent reservations show ref# | Each row has referenceNumber, customer name, date, status badge | Chrome | [ ] |
| US9-DATA-3 | Status badges have correct colors | Each status badge uses correct color from STATUS_COLORS | Chrome | [ ] |
| US9-DATA-4 | Upcoming shows service names | Each upcoming appointment shows Arabic service names | Chrome | [ ] |
| US9-DATA-5 | Balance widgets show SAR currency | Cash and Bank balances formatted with SAR | Chrome | [ ] |

## Layout & Responsive Tests

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US9-LAYOUT-1 | KPI grid responsive | 5 cols on lg, 2 on sm, 1 on xs | Chrome | [ ] |
| US9-LAYOUT-2 | Tables grid responsive | Side-by-side on lg, stacked on smaller | Chrome | [ ] |
| US9-LAYOUT-3 | RTL layout correct | Arabic text aligned correctly, logical props used | Chrome | [ ] |

## i18n Tests

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US9-I18N-1 | Arabic labels on KPI cards | All 5 KPI labels in Arabic when ar language | Chrome | [ ] |
| US9-I18N-2 | English toggle works | Switching to English shows English labels | Chrome | [ ] |
| US9-I18N-3 | Status labels translated | Status badges show translated text | Chrome | [ ] |

## Service Logic Tests (code review)

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US9-SVC-1 | getMonthlyRevenue month bug | Check if month param 0-indexed vs 1-indexed mismatch | Code Review | [ ] |
| US9-SVC-2 | getMonthlyExpenses month bug | Same check for expenses | Code Review | [ ] |
| US9-SVC-3 | Net profit calculation | netProfit = revenue - expenses | Code Review | [ ] |

### **HARD STOP** — US9 Complete
