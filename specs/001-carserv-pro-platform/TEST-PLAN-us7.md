# TEST-PLAN: User Story 7 — Bilingual and RTL Experience

Generated: 2026-03-07
Approach: Code-Scanning (v3)

## Codebase Analysis

| File | Path | Purpose |
|------|------|---------|
| i18n Config | src/i18n/config.ts | Language detection, Arabic default |
| Arabic Translations | src/i18n/ar.json | 345 Arabic translation keys |
| English Translations | src/i18n/en.json | 345 English translation keys |
| Direction Hook | src/hooks/useDirection.ts | RTL/LTR switching |
| Language Toggle | src/components/common/LanguageToggle.tsx | Language switch button |
| App Root | src/App.tsx | DirectionProvider wrapper |
| Customer Layout | src/components/common/CustomerLayout.tsx | Customer header + RTL nav |
| Admin Layout | src/components/common/AdminLayout.tsx | Admin sidebar + RTL |

## Acceptance Scenarios

1. Toggle to Arabic → all UI renders Arabic RTL
2. Toggle to English → all UI renders English LTR
3. Bilingual service content switches with language

---

## UI Tests (Language Toggle)

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US7-UI-1 | Landing page loads in Arabic (default) | Page renders in Arabic, dir=rtl | Chrome | [ ] |
| US7-UI-2 | Language toggle button visible | Shows "EN" when in Arabic mode | Chrome | [ ] |
| US7-UI-3 | Click toggle switches to English | All text changes to English, dir=ltr | Chrome | [ ] |
| US7-UI-4 | Click toggle again switches back to Arabic | All text changes to Arabic, dir=rtl | Chrome | [ ] |
| US7-UI-5 | Admin layout has language toggle | Toggle visible in admin header | Chrome | [ ] |

## RTL/LTR Direction Tests

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US7-RTL-1 | Arabic mode: html dir=rtl | document.documentElement.dir === 'rtl' | Chrome | [ ] |
| US7-RTL-2 | English mode: html dir=ltr | document.documentElement.dir === 'ltr' | Chrome | [ ] |
| US7-RTL-3 | Arabic mode: html lang=ar | document.documentElement.lang === 'ar' | Chrome | [ ] |
| US7-RTL-4 | English mode: html lang=en | document.documentElement.lang === 'en' | Chrome | [ ] |
| US7-RTL-5 | Customer header RTL layout | Nav items flow right-to-left in Arabic | Chrome | [ ] |
| US7-RTL-6 | Customer header LTR layout | Nav items flow left-to-right in English | Chrome | [ ] |
| US7-RTL-7 | Admin sidebar RTL position | Sidebar on right side in Arabic | Chrome | [ ] |
| US7-RTL-8 | Admin sidebar LTR position | Sidebar on left side in English | Chrome | [ ] |

## Translation Completeness Tests

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US7-TRANS-1 | Nav links in Arabic | Show Arabic navigation text | Chrome | [ ] |
| US7-TRANS-2 | Nav links in English | Show English navigation text | Chrome | [ ] |
| US7-TRANS-3 | Auth buttons in Arabic | Login/Register in Arabic | Chrome | [ ] |
| US7-TRANS-4 | Auth buttons in English | Login/Register in English | Chrome | [ ] |
| US7-TRANS-5 | Footer in Arabic | Footer content in Arabic | Chrome | [ ] |
| US7-TRANS-6 | Footer in English | Footer content in English | Chrome | [ ] |
| US7-TRANS-7 | Services page in Arabic | Service page labels in Arabic | Chrome | [ ] |
| US7-TRANS-8 | Services page in English | Service page labels in English | Chrome | [ ] |

## Bilingual Content Tests

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US7-BILING-1 | Service names in Arabic mode | Arabic service names (nameAr) displayed | Chrome | [ ] |
| US7-BILING-2 | Service names in English mode | English service names (nameEn) displayed | Chrome | [ ] |

## State Persistence Tests

| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| US7-STATE-1 | Language persists in localStorage | Language preference saved to localStorage | Chrome | [ ] |
| US7-STATE-2 | Page reload preserves language | After reload, language stays same | Chrome | [ ] |

### **HARD STOP** - US7 Complete
