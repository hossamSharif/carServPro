# carServPro Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-04

## Active Technologies

- **Language**: TypeScript 5.x, React 18, Node.js 20 (Cloud Functions only)
- **Build**: Vite 5
- **UI**: shadcn/ui (RTL-enabled, `rtl: true` in components.json) + Tailwind CSS 3
- **Backend**: Firebase SDK v10 (Firestore, Auth, Storage, FCM) — no separate server
- **State**: Zustand
- **Forms**: React Hook Form + Zod
- **Routing**: React Router v6
- **i18n**: react-i18next (Arabic default, RTL)
- **PWA**: vite-plugin-pwa
- **PDF**: pdfmake-rtl (Arabic invoice generation)
- **QR**: qrcode (ZATCA TLV QR codes, manual TLV encoding)
- **Hijri Dates**: Native Intl.DateTimeFormat with islamic-umalqura calendar
- **Testing**: Vitest + React Testing Library + Firebase Emulator Suite
- **Payment**: Moyasar (default), configurable (Tap, HyperPay)

## Project Structure

```text
src/
├── components/{ui,common,customer,admin}/
├── pages/{customer,admin}/
├── hooks/
├── stores/           # Zustand stores
├── services/         # Firebase service layer
├── lib/              # Utilities (zatca-qr, invoice-pdf, validators)
├── i18n/{ar,en}.json
├── types/
├── routes/
functions/            # Firebase Cloud Functions (minimal)
├── src/webhook.ts    # Payment webhook (TC-012)
firestore.rules
tests/{unit,integration,e2e}/
```

## Multi-Tenant Architecture

- All Firestore collections scoped under `tenants/{tenantId}/`
- Security rules enforce isolation via `request.auth.token.tenantId`
- Custom claims: `{ tenantId: string, role: 'admin' | 'customer' }`

## Commands

npm run dev; npm run build; npm run test; npm run lint

## Code Style

- TypeScript strict mode
- Use Tailwind logical properties (ms-, me-, ps-, pe-, text-start, text-end) for RTL
- All UI strings via i18n keys — no hardcoded strings
- Zod validation on every form
- Every Firestore collection needs matching security rules

## Recent Changes

- 001-carserv-pro-platform: Initial planning complete (plan.md, research.md, data-model.md, contracts/, quickstart.md)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
