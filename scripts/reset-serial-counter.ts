/**
 * Reset the invoice serial counter so the next issued invoice gets serial 1.
 *
 * Usage (emulator):
 *   npx tsx scripts/reset-serial-counter.ts
 *
 * Usage (production — set TENANT_ID and FIREBASE_CONFIG env vars):
 *   TENANT_ID=your-tenant npx tsx scripts/reset-serial-counter.ts --prod
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, doc, deleteDoc } from 'firebase/firestore';

const isProduction = process.argv.includes('--prod');

const firebaseConfig = isProduction
  ? JSON.parse(process.env.FIREBASE_CONFIG || '{}')
  : {
      apiKey: 'fake-api-key',
      authDomain: 'localhost',
      projectId: 'car-serv-pro',
      storageBucket: 'car-serv-pro.appspot.com',
      messagingSenderId: '000000000000',
      appId: '1:000000000000:web:0000000000000000',
    };

const tenantId = process.env.TENANT_ID || process.env.VITE_TENANT_ID || 'default';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

if (!isProduction) {
  connectFirestoreEmulator(db, 'localhost', 8080);
}

async function main() {
  const counterPath = `tenants/${tenantId}/counters/invoiceCounter`;
  console.log(`Deleting counter document: ${counterPath}`);
  await deleteDoc(doc(db, counterPath));
  console.log('Done. Next issued invoice will get serial 1.');
}

main().catch(console.error);
