# TEST-PLAN: User Story 10 — Admin Registers Business Assets

Generated: 2026-03-07
Approach: Code-Scanning (v3)

## Codebase Analysis

| File | Path | Purpose |
|------|------|---------|
| Component | src/pages/admin/AssetsPage.tsx | Assets list + add form |
| Service | src/services/assetService.ts | createAsset, getAssets, updateAsset |
| Accounts Service | src/services/accountService.ts | getAccountByCode (1200, 1001, 1002) |
| Journal Service | src/services/journalService.ts | createJournalEntry (double-entry) |
| Types | src/types/index.ts | Asset interface |
| Validators | src/lib/validators.ts | assetSchema (Zod) |
| Route | src/routes/index.tsx | /admin/assets |

## UI Tests (from JSX analysis)

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US10-UI-1 | Navigate to /admin/assets | Page loads with title "الأصول" / "Assets" | Chrome | [ ] |
| US10-UI-2 | Assets table renders | Table with 6 columns: name, category, purchaseDate, purchaseValue, currentValue, paymentMethod | Chrome | [ ] |
| US10-UI-3 | Empty state displays | Shows "لا توجد بيانات" / "No data" when no assets | Chrome | [ ] |
| US10-UI-4 | "Add Asset" button visible | Button with Plus icon exists | Chrome | [ ] |
| US10-UI-5 | Click "Add Asset" opens form | Form with 6 fields appears: name, category, purchaseDate, purchaseValue, currentValue, paymentMethod | Chrome | [ ] |
| US10-UI-6 | Cancel hides form | Click cancel hides form, resets fields | Chrome | [ ] |

## CRUD Tests (from service analysis)

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US10-CRUD-1 | Create asset (cash) | Asset saved to Firestore with all fields, journal entry created (debit 1200, credit 1001) | Chrome+DB | [ ] |
| US10-CRUD-2 | Create asset (bank transfer) | Asset saved, journal entry created (debit 1200, credit 1002) | Chrome+DB | [ ] |
| US10-CRUD-3 | Read assets list | Previously created assets appear in table | Chrome | [ ] |
| US10-CRUD-4 | Update current value | Click value → inline edit → save → value updated | Chrome | [ ] |

## Validation Tests (from form analysis)

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US10-VAL-1 | Submit empty form | Validation errors shown for required fields | Chrome | [ ] |
| US10-VAL-2 | Valid complete form | Accepted, asset created | Chrome | [ ] |

## State Tests (from component analysis)

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US10-STATE-1 | Loading state | Shows loading indicator on initial load | Chrome | [ ] |
| US10-STATE-2 | Form saving state | Save button disabled during submission | Chrome | [ ] |

## Journal Entry Integration Tests

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US10-JE-1 | Journal entry auto-created | After creating asset, navigate to /admin/journal to verify entry exists with description "شراء أصل: {name}" | Chrome | [ ] |
| US10-JE-2 | Journal entry balanced | Debit total equals credit total for the asset journal entry | Chrome | [ ] |

### **HARD STOP** - US10 Complete
