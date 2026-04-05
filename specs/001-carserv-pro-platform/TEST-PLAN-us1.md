# TEST-PLAN: User Story 1 — Customer Browses Services & Makes Reservation

Generated: 2026-03-05
Approach: Code-Scanning (v3)

## Codebase Analysis

| File | Path | Purpose |
|------|------|---------|
| LandingPage | src/pages/customer/LandingPage.tsx | Home page with all sections |
| HeroSection | src/components/customer/HeroSection.tsx | Hero with video + CTA |
| StatsBar | src/components/customer/StatsBar.tsx | Animated stats counters |
| ServicesShowcase | src/components/customer/ServicesShowcase.tsx | Featured services grid |
| OffersShowcase | src/components/customer/OffersShowcase.tsx | Active offers carousel |
| ProcessSection | src/components/customer/ProcessSection.tsx | How-to booking process |
| TestimonialsSection | src/components/customer/TestimonialsSection.tsx | Testimonials marquee |
| CTABanner | src/components/customer/CTABanner.tsx | CTA Book Now banner |
| Footer | src/components/customer/Footer.tsx | Footer with links |
| ServicesPage | src/pages/customer/ServicesPage.tsx | Full service catalog |
| ServiceCard | src/components/customer/ServiceCard.tsx | Individual service card |
| CartDrawer | src/components/customer/CartDrawer.tsx | Cart side panel |
| LoginPage | src/pages/customer/LoginPage.tsx | Login form |
| RegisterPage | src/pages/customer/RegisterPage.tsx | Registration form |
| Routes | src/routes/index.tsx | Route definitions |
| cartStore | src/stores/cartStore.ts | Cart Zustand store |
| authStore | src/stores/authStore.ts | Auth Zustand store |

---

## Section 1: Landing Page — UI Tests

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US1-LP-1 | Navigate to / | Landing page loads without errors | Chrome | [ ] |
| US1-LP-2 | Hero section visible | Hero text, CTA buttons visible | Chrome | [ ] |
| US1-LP-3 | Hero "Book Now" CTA links to /services | Link href = /services | Chrome | [ ] |
| US1-LP-4 | Stats bar visible | Stats counters are rendered (500+, 98%, etc.) | Chrome | [ ] |
| US1-LP-5 | Testimonials section visible | Testimonials title + cards visible | Chrome | [ ] |
| US1-LP-6 | CTA Banner section visible | CTA banner with "Book Now" button visible | Chrome | [ ] |
| US1-LP-7 | Footer visible | Footer with brand, links, contact info visible | Chrome | [ ] |
| US1-LP-8 | Footer quick links work | Links to /, /services, /login, /register exist | Chrome | [ ] |

### **CHECKPOINT** — Landing Page UI Complete

---

## Section 2: Services Page — UI Tests

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US1-SVC-1 | Navigate to /services | Services page loads with title | Chrome | [ ] |
| US1-SVC-2 | "All Categories" filter visible | Category tabs displayed with "All" active | Chrome | [ ] |
| US1-SVC-3 | Search input visible | Search input with placeholder text rendered | Chrome | [ ] |
| US1-SVC-4 | Cart icon with badge visible | Cart icon in header, badge shows count | Chrome | [ ] |
| US1-SVC-5 | Service cards rendered | At least one service card visible (or empty state) | Chrome | [ ] |
| US1-SVC-6 | Service card shows name + price | Service name and SAR price visible | Chrome | [ ] |
| US1-SVC-7 | "Add to Cart" button on service card | Button visible and clickable | Chrome | [ ] |

### **CHECKPOINT** — Services Page UI Complete

---

## Section 3: Cart — Interaction Tests

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US1-CART-1 | Click "Add to Cart" on a service | Button changes to "In Cart" / checkmark state | Chrome | [ ] |
| US1-CART-2 | Cart badge updates | Cart icon badge shows count = 1 | Chrome | [ ] |
| US1-CART-3 | Open Cart Drawer | Click cart icon, drawer opens with item | Chrome | [ ] |
| US1-CART-4 | Cart shows item details | Item name, price, quantity visible | Chrome | [ ] |
| US1-CART-5 | Cart shows subtotal | Subtotal amount displayed | Chrome | [ ] |
| US1-CART-6 | Increase quantity | Click + button, quantity increments | Chrome | [ ] |
| US1-CART-7 | Decrease quantity | Click - button, quantity decrements | Chrome | [ ] |
| US1-CART-8 | Remove item from cart | Click trash icon, item removed | Chrome | [ ] |
| US1-CART-9 | Empty cart message | Cart shows "empty" message when no items | Chrome | [ ] |
| US1-CART-10 | Proceed button (unauthenticated) | Shows "Login to Reserve" when not logged in | Chrome | [ ] |

### **CHECKPOINT** — Cart Interaction Complete

---

## Section 4: Navigation Tests

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US1-NAV-1 | Hero CTA navigates to /services | Click "Book Now" → URL changes to /services | Chrome | [ ] |
| US1-NAV-2 | CTA Banner navigates to /services | Click CTA banner button → URL changes to /services | Chrome | [ ] |
| US1-NAV-3 | Footer "Services" link | Click footer services link → /services | Chrome | [ ] |
| US1-NAV-4 | Footer "Login" link | Click footer login link → /login | Chrome | [ ] |
| US1-NAV-5 | Navigate to /login | Login page renders with form | Chrome | [ ] |
| US1-NAV-6 | Navigate to /register | Register page renders with form | Chrome | [ ] |
| US1-NAV-7 | Login page link to register | "No account?" link goes to /register | Chrome | [ ] |
| US1-NAV-8 | Register page link to login | "Has account?" link goes to /login | Chrome | [ ] |

### **CHECKPOINT** — Navigation Complete

---

## Section 5: Auth Pages — UI Tests

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US1-AUTH-1 | Login page form fields | Email + Password inputs rendered | Chrome | [ ] |
| US1-AUTH-2 | Login page submit button | Login button visible | Chrome | [ ] |
| US1-AUTH-3 | Register page form fields | Name, Email, Phone, Password, Confirm Password inputs | Chrome | [ ] |
| US1-AUTH-4 | Register page submit button | Register button visible | Chrome | [ ] |
| US1-AUTH-5 | Register validation (empty submit) | Error messages appear on empty submit | Chrome | [ ] |

### **CHECKPOINT** — Auth Pages Complete

---

## Section 6: i18n & RTL Tests

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US1-I18N-1 | Page loads in Arabic (default) | Arabic text visible, RTL layout | Chrome | [ ] |
| US1-I18N-2 | Language switcher works | Toggle to English, text changes to English | Chrome | [ ] |
| US1-I18N-3 | No missing i18n keys | No "hero." or "customer." raw keys visible on page | Chrome | [ ] |

### **CHECKPOINT** — i18n Complete

---

## Section 7: Responsive / Visual Tests

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US1-RESP-1 | Desktop layout (1280px) | Full-width layout, multi-column grids | Chrome | [ ] |
| US1-RESP-2 | Mobile layout (375px) | Single column, elements stack properly | Chrome | [ ] |

### **CHECKPOINT** — Responsive Complete

---

## Summary

| Section | Tests |
|---------|-------|
| Landing Page UI | 8 |
| Services Page UI | 7 |
| Cart Interaction | 10 |
| Navigation | 8 |
| Auth Pages | 5 |
| i18n & RTL | 3 |
| Responsive | 2 |
| **Total** | **43** |

### **HARD STOP** — US1 Test Plan Complete
