# TEST REPORT: US8 — Landing Page & WhatsApp Quick Contact

Status: COMPLETE
Approach: Code-Scanning (v3)
Date: 2026-03-07

## Codebase Analyzed

| File | Path | Purpose |
|------|------|---------|
| LandingPage | src/pages/customer/LandingPage.tsx | Main landing page |
| HeroSection | src/components/customer/HeroSection.tsx | Hero with video bg, CTA |
| StatsBar | src/components/customer/StatsBar.tsx | Animated stats counters |
| OffersShowcase | src/components/customer/OffersShowcase.tsx | Active offers carousel |
| ServicesShowcase | src/components/customer/ServicesShowcase.tsx | Services grid by category |
| ProcessSection | src/components/customer/ProcessSection.tsx | Our process horizontal scroll |
| TestimonialsSection | src/components/customer/TestimonialsSection.tsx | Client testimonials marquee |
| CTABanner | src/components/customer/CTABanner.tsx | Book Now CTA banner |
| Footer | src/components/customer/Footer.tsx | Footer with contact info |
| CustomerLayout | src/components/common/CustomerLayout.tsx | Layout with nav, footer, WhatsApp FAB |
| whatsapp.ts | src/lib/whatsapp.ts | WhatsApp link generator |
| ar.json | src/i18n/ar.json | Arabic translations |
| en.json | src/i18n/en.json | English translations |

## Summary

| Metric | Count |
|--------|-------|
| Total Tests | 22 |
| Passed (First Run) | 19 |
| Passed (After Fix) | 22 |
| Blocked | 0 |

## Test Results

### UI Tests — Page Load & Structure

| ID | Test | Expected | Status |
|----|------|----------|--------|
| US8-UI-1 | Landing page loads at / | Page renders without errors | [x] PASS |
| US8-UI-2 | Hero section visible | Video bg, title, subtitle, CTA buttons | [x] PASS |
| US8-UI-3 | "Book Now" CTA in hero | Links to /services | [x] PASS |
| US8-UI-4 | "Discover Services" CTA | Links to /services | [x] PASS |
| US8-UI-5 | Trust badges visible | 3 trust items (clients, warranty, team) | [x] PASS |
| US8-UI-6 | Stats bar visible | 4 stats with animated counters | [x] PASS |
| US8-UI-7 | Services section visible | Heading "الخدمات" with categorized grid | [x] PASS |
| US8-UI-8 | Process section visible | "مراحل العمل" with 5 horizontal steps | [x] PASS |
| US8-UI-9 | Testimonials section | "آراء عملائنا" with marquee cards | [x] PASS |
| US8-UI-10 | CTA banner visible | "جاهز لحماية سيارتك؟" with Book Now link | [x] PASS |
| US8-UI-11 | Footer visible | Brand, quick links, hours, contact | [x] PASS |

### WhatsApp Tests

| ID | Test | Expected | Status |
|----|------|----------|--------|
| US8-WA-1 | WhatsApp FAB visible | Green floating button at bottom-start | [x] PASS |
| US8-WA-2 | WhatsApp FAB href | wa.me/{number}?text={arabic} | [x] PASS (Fixed) |
| US8-WA-3 | Footer WhatsApp link | wa.me/{number}?text={arabic} | [x] PASS (Fixed) |
| US8-WA-4 | WhatsApp opens new tab | target="_blank" rel="noopener noreferrer" | [x] PASS |

### Navigation Tests

| ID | Test | Expected | Status |
|----|------|----------|--------|
| US8-NAV-1 | Header nav visible | Home + Services links | [x] PASS |
| US8-NAV-2 | Logo links to home | Brand "كار سيرف برو" → / | [x] PASS |
| US8-NAV-3 | Footer quick links | Home, Services, Login, Register | [x] PASS |

### i18n Tests

| ID | Test | Expected | Status |
|----|------|----------|--------|
| US8-I18N-1 | Arabic renders | All text in Arabic when AR selected | [x] PASS |
| US8-I18N-2 | Language toggle | EN/AR switch works, all text changes | [x] PASS |
| US8-I18N-3 | RTL layout | dir="rtl" lang="ar" on html element | [x] PASS |

### Responsive Tests

| ID | Test | Expected | Status |
|----|------|----------|--------|
| US8-RESP-1 | Mobile layout (375px) | Sections stack, no overflow, FAB visible | [x] PASS |
| US8-RESP-2 | Desktop layout (1280px) | Full layout, all sections visible | [x] PASS |

## Fixes Applied

| Test | Bug | Fix | Commit |
|------|-----|-----|--------|
| US8-WA-2 | WhatsApp FAB missing phone number | Fetch whatsappNumber from BusinessProfile | 3d0ad96 |
| US8-WA-3 | Footer WhatsApp missing phone number | Pass whatsappNumber prop to Footer | 3d0ad96 |
| US8-WA-3 | Footer phone shows placeholder | Display businessPhone from settings | 3d0ad96 |

## Fix Details

### Fix #1: WhatsApp links missing business phone number
- **Bug**: WhatsApp FAB (`CustomerLayout.tsx:124`) and Footer WhatsApp link (`Footer.tsx:73`) both used `https://wa.me/?text=...` without a phone number. The Footer also displayed a hardcoded placeholder `+966 XX XXX XXXX`.
- **Root Cause**: Links were hardcoded without fetching the business WhatsApp number from Firestore settings.
- **Code Analyzed**: `CustomerLayout.tsx`, `Footer.tsx`, `settingsService.ts`, `types/index.ts` (BusinessProfile has `whatsappNumber` and `phone` fields)
- **Solution**:
  1. Added `useEffect` in `CustomerLayout` to fetch `getBusinessProfile()` on mount
  2. Stored `whatsappNumber` and `businessPhone` in state
  3. Used dynamic template literal for WhatsApp FAB href: `` `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('...')}` ``
  4. Added `whatsappNumber` and `businessPhone` props to `Footer` component
  5. Footer now displays the real phone from settings and uses dynamic WhatsApp URL
- **Commit**: `3d0ad96` — `fix(whatsapp): use business profile phone number in WhatsApp links`

## Screenshots

| Screenshot | Description |
|------------|-------------|
| screenshots/us8-mobile-375.png | Mobile hero (375px) |
| screenshots/us8-mobile-scroll1.png | Mobile services section |
| screenshots/us8-mobile-footer.png | Mobile process section |
| screenshots/us8-mobile-bottom.png | Mobile footer with real phone |
| screenshots/us8-desktop-1280.png | Desktop hero (1280px) |
