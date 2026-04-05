# TEST-PLAN: All Features (Code-Scanning v3)

Generated: 2026-03-04
Approach: Code-Scanning (v3) - Codebase is the specification
Branch: 001-carserv-pro-platform

## Codebase Analysis

| File | Path | Purpose |
|------|------|---------|
| Routes | src/routes/index.tsx | App routing with lazy loading |
| Guards | src/routes/guards.tsx | Auth route protection |
| Auth Store | src/stores/authStore.ts | Authentication state |
| Cart Store | src/stores/cartStore.ts | Shopping cart state |
| UI Store | src/stores/uiStore.ts | Theme/sidebar state |
| Types | src/types/index.ts | All domain models |
| 19 Components | src/components/ | UI components |
| 22 Pages | src/pages/ | Page-level views |
| 18 Services | src/services/ | Firebase service layer |

---

## Section 1: Landing Page (LandingPage.tsx)

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| LP-UI-1 | Landing page loads | Hero section visible with title | Chrome | [ ] |
| LP-UI-2 | Navigation header | Logo, Home, Services links visible | Chrome | [ ] |
| LP-UI-3 | Auth links | Login and Register links visible | Chrome | [ ] |
| LP-UI-4 | Language toggle | Click EN toggles to English | Chrome | [ ] |
| LP-UI-5 | Theme toggle | Click toggles dark/light mode | Chrome | [ ] |
| LP-UI-6 | About section | "من نحن" section renders | Chrome | [ ] |
| LP-UI-7 | Contact section | Phone, hours, location shown | Chrome | [ ] |
| LP-UI-8 | Footer | Copyright text visible | Chrome | [ ] |
| LP-UI-9 | WhatsApp FAB | WhatsApp floating button present | Chrome | [ ] |
| LP-NAV-1 | Services link | Navigates to /services | Chrome | [ ] |
| LP-NAV-2 | Login link | Navigates to /login | Chrome | [ ] |
| LP-NAV-3 | Register link | Navigates to /register | Chrome | [ ] |

### **HARD STOP** - Landing Page Complete

---

## Section 2: Services Page (ServicesPage.tsx)

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| SV-UI-1 | Services page loads | Page title and grid visible | Chrome | [ ] |
| SV-UI-2 | Category tabs | "All" tab + category tabs shown | Chrome | [ ] |
| SV-UI-3 | Search input | Search field visible | Chrome | [ ] |
| SV-UI-4 | Cart icon | Cart icon in header with badge | Chrome | [ ] |
| SV-UI-5 | Empty state | Shows message when no services | Chrome | [ ] |
| SV-UI-6 | Service cards | Cards show name, price, image | Chrome | [ ] |

### **HARD STOP** - Services Page Complete

---

## Section 3: Authentication Pages

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| AUTH-UI-1 | Login page loads | Email/password form visible | Chrome | [ ] |
| AUTH-UI-2 | Login validation | Empty submit shows errors | Chrome | [ ] |
| AUTH-UI-3 | Login link to register | Register link works | Chrome | [ ] |
| AUTH-UI-4 | Register page loads | Full registration form visible | Chrome | [ ] |
| AUTH-UI-5 | Register validation | Empty submit shows errors | Chrome | [ ] |
| AUTH-UI-6 | Register link to login | Login link works | Chrome | [ ] |
| AUTH-UI-7 | Phone prefix | +966 prefix pre-filled | Chrome | [ ] |

### **HARD STOP** - Auth Pages Complete

---

## Section 4: Admin Login

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| ADM-UI-1 | Admin login page loads | Email/password form visible | Chrome | [ ] |
| ADM-UI-2 | Admin login validation | Empty submit shows errors | Chrome | [ ] |
| ADM-UI-3 | Admin branding | "كار سيرف برو" title visible | Chrome | [ ] |

### **HARD STOP** - Admin Login Complete

---

## Section 5: 404 Not Found

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| NF-UI-1 | Invalid route | 404 page shown | Chrome | [ ] |
| NF-UI-2 | Home link | Link to return home | Chrome | [ ] |

### **HARD STOP** - 404 Page Complete

---

## Section 6: Language & RTL

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| I18N-1 | Default Arabic | Arabic text renders | Chrome | [ ] |
| I18N-2 | Toggle to English | EN button switches to English | Chrome | [ ] |
| I18N-3 | Toggle back to Arabic | AR button switches back | Chrome | [ ] |
| I18N-4 | RTL direction | Document dir="rtl" for Arabic | Chrome | [ ] |

### **HARD STOP** - i18n Complete

---

## Section 7: Theme Toggle

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| THEME-1 | Default theme | Page renders with theme | Chrome | [ ] |
| THEME-2 | Toggle dark/light | Theme class changes on html | Chrome | [ ] |

### **HARD STOP** - Theme Complete

---

## Section 8: Console Errors Audit

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| ERR-1 | Landing console | No JS errors (Firebase OK) | Chrome | [ ] |
| ERR-2 | Services console | No JS errors | Chrome | [ ] |
| ERR-3 | Login console | No JS errors | Chrome | [ ] |
| ERR-4 | Register console | No JS errors | Chrome | [ ] |

### **HARD STOP** - Error Audit Complete

---

## Summary

| Section | Tests |
|---------|-------|
| Landing Page | 12 |
| Services Page | 6 |
| Authentication | 7 |
| Admin Login | 3 |
| 404 Page | 2 |
| i18n & RTL | 4 |
| Theme | 2 |
| Console Errors | 4 |
| **Total** | **40** |

Note: CRUD operations requiring Firebase backend (reservations, invoices, etc.) are excluded from browser tests as they require authenticated sessions and Firebase emulator. These would need integration tests with emulator suite.
