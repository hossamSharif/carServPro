# TEST-PLAN: User Story 3 — Admin Manages Services and Categories

Generated: 2026-03-05
Approach: Code-Scanning (v3)

## Codebase Analysis

| File | Path | Purpose |
|------|------|---------|
| Category Service | src/services/categoryService.ts | CRUD operations for categories |
| Service Service | src/services/serviceService.ts | CRUD operations for services |
| Categories Page | src/pages/admin/CategoriesPage.tsx | Admin categories management UI |
| Services Page | src/pages/admin/ServicesPage.tsx | Admin services management UI |
| Category Form | src/components/admin/CategoryForm.tsx | Add/edit category dialog |
| Service Form | src/components/admin/ServiceForm.tsx | Add/edit service dialog |
| Validators | src/lib/validators.ts | Zod schemas for category/service |
| Types | src/types/index.ts | Category, Service, ServiceOffer interfaces |
| i18n AR | src/i18n/ar.json | Arabic translations |
| i18n EN | src/i18n/en.json | English translations |

## UI Tests (from JSX analysis)

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US3-UI-1 | Categories page loads | Renders title "Manage Categories" + table | Chrome | [ ] |
| US3-UI-2 | Services page loads | Renders title "Manage Services" + table | Chrome | [ ] |
| US3-UI-3 | Categories table shows seeded data | PPF, Ceramic Coating, Tinting, Detailing categories visible | Chrome | [ ] |
| US3-UI-4 | Services table shows seeded data | Sample services visible with image/name/category/price/status | Chrome | [ ] |
| US3-UI-5 | Add Category button visible | Plus icon button with "Add Category" text | Chrome | [ ] |
| US3-UI-6 | Add Service button visible | Plus icon button with "Add Service" text | Chrome | [ ] |
| US3-UI-7 | Category filter dropdown on services page | Dropdown with "All Categories" default + category options | Chrome | [ ] |
| US3-UI-8 | Visibility toggle button on services | Eye/EyeOff icons present on each service row | Chrome | [ ] |

## CRUD Tests (from service analysis)

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US3-CRUD-1 | Create category | Fill form (AR/EN name, sort order), submit → new row in table | Chrome | [ ] |
| US3-CRUD-2 | Edit category | Click edit, modify fields, save → table updated | Chrome | [ ] |
| US3-CRUD-3 | Delete category (no services) | Click delete, confirm → row removed | Chrome | [ ] |
| US3-CRUD-4 | Delete category (has services) | Click delete, confirm → error message shown | Chrome | [ ] |
| US3-CRUD-5 | Create service | Fill form (names, descriptions, category, price), submit → new row | Chrome | [ ] |
| US3-CRUD-6 | Edit service | Click edit, modify fields, save → table updated | Chrome | [ ] |
| US3-CRUD-7 | Delete service | Click delete, confirm → row removed | Chrome | [ ] |
| US3-CRUD-8 | Toggle service visibility | Click eye icon → status badge changes | Chrome | [ ] |

## Validation Tests (from form analysis)

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US3-VAL-1 | Category form required fields | Submit empty form → validation errors shown | Chrome | [ ] |
| US3-VAL-2 | Category form valid input | Fill valid data → form submits successfully | Chrome | [ ] |
| US3-VAL-3 | Service form required fields | Submit empty form → validation errors on required fields | Chrome | [ ] |
| US3-VAL-4 | Service form valid input | Fill valid data → form submits successfully | Chrome | [ ] |

## i18n Tests (from code analysis)

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US3-I18N-1 | No hardcoded Arabic in table headers | All table headers use i18n keys | Code Review | [ ] |
| US3-I18N-2 | No hardcoded labels in forms | All form labels use i18n keys | Code Review | [ ] |
| US3-I18N-3 | Category form uses correct i18n keys | Labels for name/sortOrder are category-specific, not accounting | Code Review | [ ] |
| US3-I18N-4 | Confirm dialog text correct | Delete confirm shows proper description, not always "has services" | Code Review | [ ] |

## State Tests (from hook analysis)

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US3-STATE-1 | Loading state on categories page | Shows loading indicator before data loads | Chrome | [ ] |
| US3-STATE-2 | Loading state on services page | Shows loading indicator before data loads | Chrome | [ ] |
| US3-STATE-3 | Empty state for filtered services | Filter by category with no services shows "No data" message | Chrome | [ ] |

### **HARD STOP** - US3 Complete
