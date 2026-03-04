# Quickstart: CarServ Pro Development Setup

## Prerequisites

- Node.js 20+ (LTS)
- npm 9+ or pnpm 8+
- Firebase CLI (`npm install -g firebase-tools`)
- Git

## 1. Clone and Install

```bash
git clone <repository-url>
cd carServPro
npm install
cd functions && npm install && cd ..
```

## 2. Firebase Project Setup

```bash
# Login to Firebase
firebase login

# Initialize Firebase project (select Firestore, Auth, Storage, Functions, Emulators)
firebase init

# Or link to existing project
firebase use --add
```

### Required Firebase Services

- **Authentication**: Email/Password provider enabled
- **Firestore**: Native mode
- **Storage**: Default bucket
- **Cloud Functions**: Node.js 20 runtime
- **Cloud Messaging**: For push notifications (Phase 12)

## 3. Environment Configuration

Create `.env` in the project root:

```env
# Firebase Client Config
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Tenant Configuration
VITE_TENANT_ID=default-tenant

# Payment Gateway (publishable keys only - secrets in Functions config)
VITE_PAYMENT_PROVIDER=moyasar
VITE_MOYASAR_PUBLISHABLE_KEY=pk_test_xxx
```

Set Cloud Functions secrets:

```bash
firebase functions:config:set \
  moyasar.webhook_secret="your-webhook-secret" \
  moyasar.secret_key="sk_test_xxx"
```

## 4. Firebase Emulator Suite

```bash
# Start emulators for local development
firebase emulators:start --import=./emulator-data --export-on-exit=./emulator-data
```

Emulator ports:
- Auth: `localhost:9099`
- Firestore: `localhost:8080`
- Storage: `localhost:9199`
- Functions: `localhost:5001`
- Emulator UI: `localhost:4000`

## 5. Seed Initial Data

After emulators are running, seed the default tenant:

```bash
# Run seed script (creates tenant, admin user, chart of accounts, sample categories/services)
npm run seed
```

This creates:
- Tenant document at `tenants/default-tenant`
- Admin user with custom claims `{ tenantId: 'default-tenant', role: 'admin' }`
- Pre-seeded chart of accounts (13 accounts)
- Default business settings and schedule config
- Sample categories and services

## 6. Development Server

```bash
# Start Vite dev server
npm run dev
```

The app runs at `http://localhost:5173`.

### Default Credentials (Emulator)

- **Admin**: `admin@carserv.test` / `admin123`
- **Customer**: `customer@carserv.test` / `customer123`

## 7. Key Development Workflows

### Adding a New Page

1. Create component in `src/pages/{customer|admin}/`
2. Add route in `src/routes/`
3. Add i18n keys in `src/i18n/ar.json` and `src/i18n/en.json`
4. If admin page: wrap with auth guard checking `role == 'admin'`

### Adding a New Firestore Collection

1. Define TypeScript interface in `src/types/`
2. Add Zod validation schema
3. Create service functions in `src/services/`
4. Add security rules in `firestore.rules`
5. Add Firestore indexes if needed in `firestore.indexes.json`

### Working with i18n

- All UI strings must use `t('key')` from `useTranslation()`
- Add keys to both `src/i18n/ar.json` and `src/i18n/en.json`
- Use namespace prefixes: `common.`, `customer.`, `admin.`, `invoice.`, `accounting.`

### Deploying Cloud Functions

```bash
cd functions
npm run build
firebase deploy --only functions
```

## 8. Project Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run test` | Run Vitest unit tests |
| `npm run test:integration` | Run integration tests with Firebase Emulators |
| `npm run lint` | Run ESLint |
| `npm run seed` | Seed emulator with initial data |

## 9. Tech Stack Reference

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework |
| Vite | 5.x | Build tool |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Styling |
| shadcn/ui | latest | Component library (RTL-enabled) |
| Firebase SDK | 10.x | Backend services |
| Zustand | 4.x | State management |
| React Hook Form | 7.x | Form handling |
| Zod | 3.x | Schema validation |
| React Router | 6.x | Routing |
| react-i18next | 14.x | Internationalization |
| vite-plugin-pwa | 0.x | PWA support |
| pdfmake-rtl | latest | Arabic PDF generation |
| qrcode | 1.x | QR code rendering |
| Vitest | 1.x | Unit testing |
