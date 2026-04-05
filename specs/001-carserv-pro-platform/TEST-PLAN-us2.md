# TEST-PLAN: US2 — Admin Manages Reservations & Converts to Invoice

Generated: 2026-03-05
Approach: Code-Scanning (v3)

## Codebase Analysis

| File | Path | Purpose |
|------|------|---------|
| ReservationsPage | src/pages/admin/ReservationsPage.tsx | Admin reservation list, status mgmt, convert to invoice |
| InvoicesPage | src/pages/admin/InvoicesPage.tsx | Invoice list with filters and actions |
| InvoiceEditorPage | src/pages/admin/InvoiceEditorPage.tsx | Draft invoice editing, line items, issue flow |
| ReservationDetail | src/components/admin/ReservationDetail.tsx | Reservation info display component |
| InvoicePrintView | src/components/admin/InvoicePrintView.tsx | A4 RTL print layout |
| invoiceService | src/services/invoiceService.ts | Invoice CRUD, create from reservation, issue, cancel |
| reservationService | src/services/reservationService.ts | Reservation CRUD, status updates |
| paymentService | src/services/paymentService.ts | Payment recording |
| statusColors | src/lib/statusColors.ts | Status badge color maps |
| Types | src/types/index.ts | Invoice, Payment, Reservation types |
| Routes | src/routes/index.tsx | Admin route definitions |
| AdminLayout | src/components/common/AdminLayout.tsx | Sidebar navigation |

## US2 Routes

| Route | Page | Auth |
|-------|------|------|
| /admin/reservations | ReservationsPage | RequireAdmin |
| /admin/invoices | InvoicesPage | RequireAdmin |
| /admin/invoices/:id | InvoiceEditorPage | RequireAdmin |

---

## Section 1: Admin Reservations Page

### UI Tests (from ReservationsPage.tsx JSX)
| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US2-RES-UI-1 | Navigate to /admin/reservations | Page loads with title "admin.manageReservations" | Chrome | [ ] |
| US2-RES-UI-2 | Reservations table renders | Table with columns: Ref#, Name, Date, Time, Status, Actions | Chrome | [ ] |
| US2-RES-UI-3 | Status filter dropdown visible | Filter dropdown with options: pending, confirmed, in_progress, completed, cancelled | Chrome | [ ] |
| US2-RES-UI-4 | Status badges render with correct colors | Each reservation shows colored status badge | Chrome | [ ] |
| US2-RES-UI-5 | Loading state shown | Loading text while data loads | Chrome | [ ] |
| US2-RES-UI-6 | Empty state shown | "No data" message when no reservations match filter | Chrome | [ ] |

### Status Transition Tests (from STATUS_TRANSITIONS map)
| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US2-RES-ST-1 | Pending reservation shows Confirmed + Cancelled buttons | Two action buttons visible | Chrome | [ ] |
| US2-RES-ST-2 | Confirmed reservation shows In Progress + Cancelled buttons | Two action buttons visible | Chrome | [ ] |
| US2-RES-ST-3 | In Progress reservation shows Completed button | One action button visible | Chrome | [ ] |
| US2-RES-ST-4 | Completed reservation shows no status buttons | No transition buttons | Chrome | [ ] |
| US2-RES-ST-5 | Cancelled reservation shows no status buttons | No transition buttons | Chrome | [ ] |

### Convert to Invoice Tests (from handleConvertToInvoice)
| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US2-RES-INV-1 | Completed reservation shows Convert to Invoice button | Button with FileText icon visible | Chrome | [ ] |
| US2-RES-INV-2 | Completed reservation with existing invoiceId hides convert button | No convert button when invoiceId set | Chrome | [ ] |

### Filter Tests (from statusFilter state)
| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US2-RES-FLT-1 | Select "pending" filter | Only pending reservations shown | Chrome | [ ] |
| US2-RES-FLT-2 | Select "completed" filter | Only completed reservations shown | Chrome | [ ] |
| US2-RES-FLT-3 | Clear filter (select all) | All reservations shown | Chrome | [ ] |

### **HARD STOP** — Section 1 Complete

---

## Section 2: Admin Invoices Page

### UI Tests (from InvoicesPage.tsx JSX)
| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US2-INV-UI-1 | Navigate to /admin/invoices | Page loads with title "admin.manageInvoices" | Chrome | [ ] |
| US2-INV-UI-2 | Invoices table renders | Table with columns: Invoice#, Date, Name, Total, Payment Status, Status, Actions | Chrome | [ ] |
| US2-INV-UI-3 | Draft invoice shows "draft" label instead of number | Draft text in invoice# column | Chrome | [ ] |
| US2-INV-UI-4 | Invoice status badge colors correct | draft=yellow, issued=green, cancelled=red | Chrome | [ ] |
| US2-INV-UI-5 | Payment status badge colors correct | unpaid=gray, paid=green, partially_paid=yellow | Chrome | [ ] |
| US2-INV-UI-6 | Empty state shown | "No data" when no invoices exist | Chrome | [ ] |

### Action Tests (from InvoicesPage.tsx actions)
| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US2-INV-ACT-1 | Edit/view icon visible on all invoices | Pencil icon link navigates to /admin/invoices/:id | Chrome | [ ] |
| US2-INV-ACT-2 | Download PDF button on issued invoice | Download icon visible only for issued invoices | Chrome | [ ] |
| US2-INV-ACT-3 | Cancel button on issued invoice | XCircle icon visible only for issued invoices | Chrome | [ ] |
| US2-INV-ACT-4 | Cancel confirmation dialog | ConfirmDialog appears with cancel warning | Chrome | [ ] |

### **HARD STOP** — Section 2 Complete

---

## Section 3: Invoice Editor Page

### UI Tests (from InvoiceEditorPage.tsx JSX)
| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US2-EDT-UI-1 | Navigate to invoice editor | Page loads with invoice number or "Draft" title | Chrome | [ ] |
| US2-EDT-UI-2 | Seller info card renders | Shows seller name, VAT#, CR#, address | Chrome | [ ] |
| US2-EDT-UI-3 | Buyer info card renders | Shows buyer name and phone | Chrome | [ ] |
| US2-EDT-UI-4 | Line items table renders | Table with Description, Qty, Unit Price, VAT, Total columns | Chrome | [ ] |
| US2-EDT-UI-5 | Totals section renders | Subtotal, VAT (15%), Grand Total displayed | Chrome | [ ] |
| US2-EDT-UI-6 | Payment method section renders | Payment method dropdown/text | Chrome | [ ] |
| US2-EDT-UI-7 | Notes section renders | Notes textarea/text | Chrome | [ ] |
| US2-EDT-UI-8 | Dates section renders | Gregorian and Hijri dates shown | Chrome | [ ] |

### Draft Mode Tests (from isDraft conditional rendering)
| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US2-EDT-DRF-1 | Draft: Save Draft button visible | "Save Draft" button shown | Chrome | [ ] |
| US2-EDT-DRF-2 | Draft: Issue Invoice button visible | "Issue Invoice" button shown | Chrome | [ ] |
| US2-EDT-DRF-3 | Draft: Buyer name is editable | Input field for buyer name | Chrome | [ ] |
| US2-EDT-DRF-4 | Draft: Line item description editable | Input fields in line items | Chrome | [ ] |
| US2-EDT-DRF-5 | Draft: Quantity editable | Number input for quantity | Chrome | [ ] |
| US2-EDT-DRF-6 | Draft: Unit price editable | Number input for unit price | Chrome | [ ] |
| US2-EDT-DRF-7 | Draft: Add line item button | "Add line item" button adds new row | Chrome | [ ] |
| US2-EDT-DRF-8 | Draft: Remove line item button | Trash icon removes line item (min 1) | Chrome | [ ] |
| US2-EDT-DRF-9 | Draft: Payment method dropdown | Select with cash/bank_transfer/online | Chrome | [ ] |
| US2-EDT-DRF-10 | Draft: Notes textarea editable | Textarea for notes | Chrome | [ ] |

### Issued Mode Tests
| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US2-EDT-ISS-1 | Issued: Print button visible | Print button with Printer icon | Chrome | [ ] |
| US2-EDT-ISS-2 | Issued: Download PDF button visible | Download button shown | Chrome | [ ] |
| US2-EDT-ISS-3 | Issued: Fields are read-only | No input fields, text display only | Chrome | [ ] |
| US2-EDT-ISS-4 | Issued: QR code displayed | QR code image rendered | Chrome | [ ] |
| US2-EDT-ISS-5 | Issued: No Save/Issue buttons | Draft action buttons hidden | Chrome | [ ] |

### Calculation Tests (from updateLineItem logic)
| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US2-EDT-CALC-1 | VAT auto-calculates at 15% | vatAmount = unitPrice * quantity * 0.15 | Chrome | [ ] |
| US2-EDT-CALC-2 | Line total auto-calculates | lineTotal = (unitPrice * quantity) + vatAmount | Chrome | [ ] |
| US2-EDT-CALC-3 | Grand total updates on line item change | grandTotal = subtotal + totalVat | Chrome | [ ] |

### Issue Confirmation Tests
| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US2-EDT-ISS-CONF-1 | Click Issue shows confirmation dialog | ConfirmDialog with issueConfirm message | Chrome | [ ] |

### **HARD STOP** — Section 3 Complete

---

## Section 4: Navigation & Routing

### Nav Tests (from AdminLayout.tsx)
| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US2-NAV-1 | Reservations link in sidebar | CalendarDays icon + "nav.reservations" text | Chrome | [ ] |
| US2-NAV-2 | Invoices link in sidebar | FileText icon + "nav.invoices" text | Chrome | [ ] |
| US2-NAV-3 | Active link highlighted | Current page link has bg-primary/10 styling | Chrome | [ ] |
| US2-NAV-4 | Navigate Reservations → Invoices | Clicking invoices nav goes to /admin/invoices | Chrome | [ ] |

### **HARD STOP** — Section 4 Complete
