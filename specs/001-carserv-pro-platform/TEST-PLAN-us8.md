# TEST-PLAN: US8 — Landing Page & WhatsApp Quick Contact

Generated: 2026-03-07
Approach: Code-Scanning (v3)

## Codebase Analysis

| File | Path | Purpose |
|------|------|---------|
| LandingPage | src/pages/customer/LandingPage.tsx | Main landing page assembling all sections |
| HeroSection | src/components/customer/HeroSection.tsx | Hero with video bg, branding, CTA |
| StatsBar | src/components/customer/StatsBar.tsx | Animated stats counters |
| OffersShowcase | src/components/customer/OffersShowcase.tsx | Active offers carousel |
| ServicesShowcase | src/components/customer/ServicesShowcase.tsx | Services grid by category |
| ProcessSection | src/components/customer/ProcessSection.tsx | Our process horizontal scroll |
| TestimonialsSection | src/components/customer/TestimonialsSection.tsx | Client testimonials marquee |
| CTABanner | src/components/customer/CTABanner.tsx | Book Now CTA banner |
| Footer | src/components/customer/Footer.tsx | Footer with contact info |
| CustomerLayout | src/components/common/CustomerLayout.tsx | Layout with nav, footer, WhatsApp FAB |
| WhatsApp | src/lib/whatsapp.ts | WhatsApp link generator |
| i18n/ar.json | src/i18n/ar.json | Arabic translations |
| i18n/en.json | src/i18n/en.json | English translations |

## UI Tests — Page Load & Structure

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US8-UI-1 | Landing page loads at / | Page renders without errors | Chrome | [ ] |
| US8-UI-2 | Hero section visible | Video bg, title, subtitle, CTA buttons visible | Chrome | [ ] |
| US8-UI-3 | "Book Now" CTA in hero | Links to /services | Chrome | [ ] |
| US8-UI-4 | "Discover Services" CTA | Links to /services | Chrome | [ ] |
| US8-UI-5 | Trust badges visible | 3 trust items (clients, warranty, team) | Chrome | [ ] |
| US8-UI-6 | Stats bar visible | 4 stats: clients, satisfaction, experience, rating | Chrome | [ ] |
| US8-UI-7 | Services section visible | Section title "الخدمات" visible | Chrome | [ ] |
| US8-UI-8 | Process section visible | "مراحل العمل" title visible | Chrome | [ ] |
| US8-UI-9 | Testimonials section visible | "آراء عملائنا" title visible | Chrome | [ ] |
| US8-UI-10 | CTA banner visible | "جاهز لحماية سيارتك؟" text visible | Chrome | [ ] |
| US8-UI-11 | Footer visible | Brand name, quick links, hours, contact | Chrome | [ ] |

## WhatsApp Tests

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US8-WA-1 | WhatsApp FAB visible | Green floating button at bottom-start | Chrome | [ ] |
| US8-WA-2 | WhatsApp FAB href | Opens wa.me with pre-filled Arabic message | Chrome | [ ] |
| US8-WA-3 | Footer WhatsApp link | Footer has WhatsApp contact link | Chrome | [ ] |
| US8-WA-4 | WhatsApp FAB opens in new tab | target="_blank" and rel="noopener noreferrer" | Chrome | [ ] |

## Navigation Tests

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US8-NAV-1 | Header nav visible | Home + Services links in header | Chrome | [ ] |
| US8-NAV-2 | Logo links to home | Brand name links to / | Chrome | [ ] |
| US8-NAV-3 | Footer quick links | Home, Services, Login, Register links | Chrome | [ ] |

## i18n Tests

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US8-I18N-1 | Arabic default | All text renders in Arabic | Chrome | [ ] |
| US8-I18N-2 | Language toggle | Switch to English, text changes | Chrome | [ ] |
| US8-I18N-3 | RTL layout | Page is RTL by default | Chrome | [ ] |

## Responsive Tests

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US8-RESP-1 | Mobile layout (375px) | Sections stack, no overflow | Chrome | [ ] |
| US8-RESP-2 | Desktop layout (1280px) | Full layout, all sections visible | Chrome | [ ] |

### **HARD STOP** — US8 Complete
