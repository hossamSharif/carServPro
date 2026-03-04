# Research: CarServ Pro — Multi-Tenant Car Service SaaS Platform

**Date**: 2026-03-04
**Status**: Complete — All NEEDS CLARIFICATION resolved

---

## Table of Contents

1. [ZATCA Phase 1 QR Code TLV Encoding](#1-zatca-phase-1-qr-code-tlv-encoding)
2. [Firebase Multi-Tenant Architecture](#2-firebase-multi-tenant-architecture)
3. [RTL/i18n/PWA Patterns](#3-rtli18npwa-patterns)
4. [Payment Gateway Integration](#4-payment-gateway-integration)
5. [PDF Invoice Generation](#5-pdf-invoice-generation)
6. [Consolidated Technology Decisions](#6-consolidated-technology-decisions)

---

## 1. ZATCA Phase 1 QR Code TLV Encoding

### Decision: Manual TLV encoding with `TextEncoder` + `Uint8Array` + `btoa()`, QR rendering with `qrcode` npm package

### TLV Structure

Each field is encoded as Tag (1 byte) + Length (1 byte) + Value (variable UTF-8 bytes). All five fields are concatenated and Base64-encoded.

| Tag | Field | Data Type | Example |
|-----|-------|-----------|---------|
| 1 | Seller Name | UTF-8 string | `"شركة كار سيرف"` |
| 2 | VAT Registration Number | UTF-8 string (15 digits) | `"300000000000003"` |
| 3 | Invoice Timestamp | UTF-8 string (ISO 8601 Zulu) | `"2026-03-04T14:25:09Z"` |
| 4 | Invoice Total (with VAT) | UTF-8 string (decimal) | `"115.00"` |
| 5 | VAT Total | UTF-8 string (decimal) | `"15.00"` |

**Critical**: Length byte = byte count of UTF-8 encoded value (not character count). Arabic characters use 2-3 bytes in UTF-8.

### Implementation Pattern

```typescript
function encodeTLV(sellerName: string, vatNumber: string, timestamp: string, invoiceTotal: string, vatAmount: string): string {
  const encoder = new TextEncoder();
  const fields = [
    { tag: 1, value: sellerName },
    { tag: 2, value: vatNumber },
    { tag: 3, value: timestamp },
    { tag: 4, value: invoiceTotal },
    { tag: 5, value: vatAmount },
  ];
  const encodedFields = fields.map(f => ({ tag: f.tag, valueBytes: encoder.encode(f.value) }));
  const totalLength = encodedFields.reduce((sum, f) => sum + 1 + 1 + f.valueBytes.length, 0);
  const tlvBytes = new Uint8Array(totalLength);
  let offset = 0;
  for (const { tag, valueBytes } of encodedFields) {
    tlvBytes[offset++] = tag;
    tlvBytes[offset++] = valueBytes.length;
    tlvBytes.set(valueBytes, offset);
    offset += valueBytes.length;
  }
  let binary = '';
  for (let i = 0; i < tlvBytes.length; i++) binary += String.fromCharCode(tlvBytes[i]);
  return btoa(binary);
}
```

### QR Code Rendering

Use `qrcode` npm package with error correction level `"M"` (ZATCA-mandated):

```typescript
import QRCode from 'qrcode';
const dataUrl = await QRCode.toDataURL(base64TlvString, { errorCorrectionLevel: 'M', type: 'image/png', width: 200 });
```

### Rationale

- Manual TLV is ~30 lines; avoids `@axenda/zatca` which uses Node.js `Buffer` requiring browser polyfill
- `TextEncoder` and `btoa()` are native browser APIs — zero dependencies
- `qrcode` npm package has ~3.5M weekly downloads, supports `toDataURL()` for `<img>` tags

### Alternatives Considered

| Package | Rejected Because |
|---------|-----------------|
| `@axenda/zatca` | Uses Node.js `Buffer`; needs polyfill in browser; encoding is trivial to implement manually |
| `zatca-qr-generator` | Phase 2 focused; requires private key/certificate; overkill for Phase 1 |
| Custom QR rendering | `qrcode` is battle-tested and tiny; no reason to reimplement |

---

## 2. Firebase Multi-Tenant Architecture

### Decision: Subcollection-based isolation with custom claims, Cloud Functions for claims management and invoice numbering

### Firestore Collection Structure

```
tenants/{tenantId}/
  ├── settings/businessProfile
  ├── settings/scheduleConfig
  ├── settings/payment
  ├── users/{userId}
  ├── categories/{categoryId}
  ├── services/{serviceId}
  ├── reservations/{reservationId}
  ├── invoices/{invoiceId}
  ├── payments/{paymentId}
  ├── journalEntries/{entryId}
  ├── accounts/{accountId}
  ├── expenses/{expenseId}
  ├── assets/{assetId}
  ├── slotBookings/{date_slot}
  └── counters/invoiceCounter
```

### Custom Claims

Content: `{ tenantId: string, role: 'admin' | 'customer' }` — must stay under 1000 bytes.

**Provisioning mechanism**: Cloud Functions only (Admin SDK required).
- Customer claims: `auth.user().onCreate()` trigger reads a pending registration doc, sets `{ tenantId, role: 'customer' }`
- Admin claims: Callable Cloud Function restricted to existing admins (no self-service)

**Token refresh**: After claims are set, call `getAuth().currentUser?.getIdToken(true)` on the client to force refresh.

### Security Rules Pattern

```javascript
function isTenantMember(tenantId) {
  return request.auth != null && request.auth.token.tenantId == tenantId;
}
function isAdmin(tenantId) {
  return isTenantMember(tenantId) && request.auth.token.role == 'admin';
}
function isCustomer(tenantId) {
  return isTenantMember(tenantId) && request.auth.token.role == 'customer';
}
```

### Access Control Matrix

| Collection | Customer Read | Customer Write | Admin Read | Admin Write |
|------------|--------------|----------------|------------|-------------|
| settings/* | Yes | No | Yes | Yes |
| services/* | Yes | No | Yes | CRUD |
| categories/* | Yes | No | Yes | CRUD |
| reservations/* | Own only | Create own | All | Update/delete |
| invoices/* | Own only | No | All | Full lifecycle |
| users/* | Own profile | Own profile | All | All |
| journalEntries/* | No | No | Yes | Yes |
| expenses/* | No | No | Yes | Yes |
| accounts/* | No | No | Yes | Yes |
| payments/* | Own only | No | All | Yes |
| assets/* | No | No | Yes | Yes |
| slotBookings/* | Yes | Via transaction | Yes | Yes |
| counters/* | No | No | Yes | Via transaction |

### Sequential Invoice Numbering (TC-010)

Callable Cloud Function with Firestore transaction:
- Counter doc at `tenants/{tenantId}/counters/invoiceCounter` stores `{ lastNumber, lastYear }`
- Transaction: read → increment → write → return `INV-{year}-{nnnn}`
- Year reset: if `lastYear < currentYear`, reset counter to 1
- Single counter doc is fine — invoice numbering is low-throughput (~10-50/day)

### Slot Booking Race Condition Prevention (FR-040)

Client-side Firestore transaction with optimistic concurrency:
- Slot doc at `tenants/{tenantId}/slotBookings/{date}_{time}` stores `{ currentBookings, maxCapacity }`
- Transaction: read slot → check `currentBookings < maxCapacity` → increment + create reservation
- Firestore auto-retries (up to 5x) on contention — second concurrent booker sees updated count and gets rejected

### Rationale

- Path-based isolation eliminates `.where('tenantId', '==', ...)` on every query
- Custom claims in JWT = no database read for authorization checks
- Server-side counter transaction prevents client tampering with invoice numbers
- Client-side booking transaction is acceptable since security rules also enforce capacity limits

---

## 3. RTL/i18n/PWA Patterns

### Decision: react-i18next with lazy-loaded translations, Tailwind logical properties, shadcn/ui RTL mode, native Intl.DateTimeFormat for Hijri dates

### i18n Setup

Libraries: `react-i18next`, `i18next`, `i18next-browser-languagedetector`, `i18next-http-backend`

```typescript
i18n.init({
  lng: 'ar',                    // Arabic default
  fallbackLng: 'ar',
  supportedLngs: ['ar', 'en'],
  backend: { loadPath: '/locales/{{lng}}/{{ns}}.json' },
  detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
});
```

### RTL/LTR Switching

- `useEffect` on `i18n.language` sets `document.documentElement.dir` and `document.documentElement.lang`
- **Prefer Tailwind logical properties**: `ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end` (auto-flip with `dir`)
- Use `rtl:` variants only for icon rotation (`rtl:rotate-180`)

### shadcn/ui RTL Support

shadcn/ui has first-class RTL support (January 2026 release):
- Set `"rtl": true` in `components.json`
- CLI auto-transforms `left-*`/`right-*` → `start-*`/`end-*`, `ml-*`/`mr-*` → `ms-*`/`me-*`
- Wrap app in `<DirectionProvider direction={dir}>` for Radix UI primitives
- Run `npx shadcn migrate rtl` for existing components

### Dark/Light Mode

- Tailwind class-based dark mode (`darkMode: 'class'` in v3)
- Three states: light, dark, system (respects OS preference)
- Persist to `localStorage`
- Inline `<head>` script prevents FOUC (flash of unstyled content)

### PWA Configuration

```typescript
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'كار سيرف برو',
    short_name: 'كار سيرف',
    dir: 'rtl',
    lang: 'ar',
    display: 'standalone',
    icons: [
      { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  },
  workbox: {
    runtimeCaching: [
      { urlPattern: /\/locales\/.*\.json$/, handler: 'StaleWhileRevalidate', options: { cacheName: 'i18n-cache' } },
      { urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/, handler: 'CacheFirst', options: { cacheName: 'firebase-images' } },
      { urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/, handler: 'NetworkFirst', options: { cacheName: 'firestore-cache' } },
    ],
  },
})
```

### Hijri Date Conversion

**Primary**: Native `Intl.DateTimeFormat` with `islamic-umalqura` calendar (zero dependencies):

```typescript
function formatHijriDate(date: Date): string {
  return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(date);
}
```

Umm al-Qura is the official Saudi civil calendar. No library needed for formatting. Keep `@tabby_ai/hijri-converter` as fallback only if Hijri arithmetic becomes necessary.

### Rationale

- Logical properties reduce RTL-specific code by ~80% vs `rtl:` variants everywhere
- shadcn/ui native RTL eliminates manual component fixes
- `Intl.DateTimeFormat` is zero-dependency and uses the same calendar as the Saudi government
- Lazy-loaded translations keep initial bundle small

---

## 4. Payment Gateway Integration

### Decision: Moyasar as default gateway, strategy pattern for configurable provider

### Gateway Comparison

| Criteria | Moyasar | Tap Payments | HyperPay |
|----------|---------|-------------|----------|
| Webhook type | Push (HMAC-SHA256) | Push (HMAC-SHA256 on concatenated fields) | Pull-based / AES-GCM encrypted push |
| Cloud Function complexity | Simple (~15 lines) | Moderate (field concatenation) | High (AES decryption or polling) |
| Official npm packages | CDN widget only | `@tap-payments/card-sdk`, `@tap-payments/gosell` | None for payments |
| API format | JSON REST | JSON REST | URL-encoded form data |
| Amount format | Smallest unit (100 = 1 SAR) | Decimal (100.00 = 100 SAR) | Decimal |
| Webhook retries | 5 with escalating backoff | 2 | N/A (poll-based) |
| Mada/STC Pay/Apple Pay | Yes | Yes | Yes |
| Developer friction | Low | Low | Medium-High |

### Recommended Default: Moyasar

1. Saudi-native company, SAR-first
2. Simplest webhook verification (HMAC-SHA256 on full payload body)
3. Client-side JS widget fits React SPA model
4. 5-retry webhook is more resilient

### Strategy Pattern Architecture

```typescript
interface PaymentGatewayProvider {
  name: 'moyasar' | 'tap' | 'hyperpay';
  createPaymentSession(params: PaymentSessionParams): Promise<{ redirectUrl: string; sessionId: string }>;
  verifyPayment(params: VerifyParams): Promise<PaymentResult>;
  verifyWebhookSignature(req: Request): Promise<boolean>;
  processWebhookPayload(body: unknown): Promise<PaymentResult>;
}
```

Factory function selects provider based on `tenants/{tenantId}/settings/payment.provider`.

### Security Considerations

- Always verify HMAC/signature before processing webhooks
- Use `crypto.timingSafeEqual()` for signature comparison
- Use `req.rawBody` for HMAC computation in Firebase Cloud Functions
- Implement idempotency (check payment ID before processing)
- Validate paid amount against expected invoice amount server-side
- Store secret keys in Firebase Functions config or Secret Manager, never in Firestore

---

## 5. PDF Invoice Generation

### Decision: pdfmake with pdfmake-rtl for Arabic RTL A4 invoices

### Library Comparison

| Criteria | jsPDF | html2pdf.js | @react-pdf/renderer | pdfmake + RTL |
|----------|-------|-------------|---------------------|---------------|
| Arabic text rendering | Broken with mixed content | Works (raster only) | Broken (open bugs) | Automatic via pdfmake-rtl |
| Mixed Arabic/English/Numbers | Broken | Works (raster) | Broken | Works (auto-detection) |
| Text selectable/searchable | Yes | **No** | Yes | Yes |
| Table support | Plugin (autotable) | HTML tables (raster) | Manual flex layout | **Native first-class** |
| QR code support | External library | External library | External library | **Built-in native** |
| Print quality | Good | Poor (raster) | Good (when working) | Good |
| Bundle size (gzipped) | ~90 KB | ~200 KB | ~500 KB | ~300 KB |

### Why pdfmake-rtl

1. **Arabic RTL works out of the box** — auto-detects Arabic script, handles bidirectional content, includes Cairo font
2. **Built-in QR code**: `{ qr: zatcaBase64String, fit: 120 }` — no external QR library needed for PDF
3. **Native tables**: First-class table support with headers, column widths, borders, spanning — ideal for invoice line items
4. **Declarative JSON API**: Maps cleanly to Firestore invoice data model
5. **Lazy-loadable**: Use dynamic `import()` to load only when user triggers PDF generation

### Implementation Pattern

```typescript
import pdfMake from 'pdfmake-rtl';

const invoiceDefinition = {
  pageSize: 'A4',
  content: [
    { text: 'فاتورة ضريبية', style: 'header', alignment: 'right' },
    { text: `رقم الفاتورة: ${invoice.number}`, alignment: 'right' },
    {
      table: {
        headerRows: 1,
        widths: ['*', 'auto', 'auto', 'auto', 'auto'],
        body: [
          ['الإجمالي', 'الضريبة', 'السعر', 'الكمية', 'الوصف'],
          ...invoice.lineItems.map(item => [
            item.total.toFixed(2), item.vat.toFixed(2),
            item.price.toFixed(2), item.quantity, item.description
          ])
        ]
      }
    },
    { qr: invoice.zatcaQrBase64, fit: 120, alignment: 'center' }
  ]
};
pdfMake.createPdf(invoiceDefinition).download(`${invoice.number}.pdf`);
```

### Alternatives Rejected

| Library | Rejected Because |
|---------|-----------------|
| jsPDF | `processArabic()` breaks with mixed Arabic/English/numbers in same string |
| html2pdf.js | Raster-based (non-selectable text, blurry print, large files) — unprofessional for business invoices |
| @react-pdf/renderer | Arabic text rendering broken (multiple open issues 2021-2025), no layout-level RTL |

---

## 6. Consolidated Technology Decisions

| Topic | Decision | Rationale |
|-------|----------|-----------|
| **State management** | Zustand (confirmed, not React Context) | Spec allows either; Zustand is more ergonomic for multiple stores (auth, cart, UI) |
| **ZATCA QR** | Manual TLV encoder + `qrcode` npm package | ~30 lines, zero dependencies, native browser APIs |
| **PDF invoices** | `pdfmake-rtl` | Only library with working Arabic RTL + built-in QR + native tables |
| **Hijri dates** | Native `Intl.DateTimeFormat` with `islamic-umalqura` | Zero dependencies, uses official Saudi calendar |
| **i18n** | `react-i18next` + `i18next-http-backend` | Lazy-loaded translations, Arabic default |
| **RTL layout** | Tailwind logical properties + shadcn/ui `rtl: true` | Auto-flipping layout, minimal RTL-specific code |
| **Dark mode** | Tailwind class-based + localStorage persistence | Three states (light/dark/system), FOUC prevention |
| **PWA** | `vite-plugin-pwa` with Workbox runtime caching | Arabic manifest, i18n cache, Firebase image cache |
| **Multi-tenant** | Subcollection isolation + custom claims | Path-based scoping, JWT-embedded authorization |
| **Invoice numbering** | Callable Cloud Function + Firestore transaction | Atomic counter, server-side integrity |
| **Slot booking** | Client-side Firestore transaction | Optimistic concurrency with auto-retry |
| **Payment gateway** | Moyasar (default), configurable via strategy pattern | Simplest webhook, Saudi-native, resilient retries |
| **User deactivation** | Callable Cloud Function with Admin SDK | Admin SDK required to disable Firebase Auth accounts |
| **Testing** | Vitest + React Testing Library + Firebase Emulator Suite | Fast unit tests, realistic integration tests |
| **Font** | Noto Sans Arabic / IBM Plex Sans Arabic | Full Arabic glyph coverage, variable weight support |

### Cloud Functions Required (Minimal — per TC-004/TC-012)

1. **Payment webhook handler** (`functions/src/webhook.ts`) — per TC-012
2. **Custom claims setter** (`functions/src/auth.ts`) — `auth.user().onCreate()` trigger
3. **Admin role provisioner** (`functions/src/admin.ts`) — callable function for admin creation
4. **Invoice number generator** (`functions/src/invoicing.ts`) — callable function with transaction
5. **User deactivation** (`functions/src/admin.ts`) — callable function using Admin SDK

These are all minimal serverless functions, consistent with the spec's "no separate backend server" constraint. The Cloud Function for payment webhooks is explicitly authorized by TC-012.
