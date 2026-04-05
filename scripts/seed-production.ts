/**
 * Seed script for real Firebase (not emulator).
 * Uses firebase-admin SDK with Application Default Credentials.
 * Run: npx tsx scripts/seed-production.ts
 */
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

const app = initializeApp({ credential: applicationDefault() });
const authAdmin = getAuth(app);
const db = getFirestore(app);

const TENANT_ID = 'default-tenant';
const now = Timestamp.now();

async function seed() {
  console.log('Seeding real Firebase project...');

  // 1. Create tenant doc
  await db.doc(`tenants/${TENANT_ID}`).set({ name: 'Smart Operation', createdAt: now }, { merge: true });
  console.log('Tenant doc created');

  // 2. Create admin user
  let adminUid: string;
  try {
    const existing = await authAdmin.getUserByEmail('Otauba.89@gmail.com');
    adminUid = existing.uid;
    console.log('Admin user already exists:', adminUid);
  } catch {
    const adminUser = await authAdmin.createUser({
      email: 'Otauba.89@gmail.com',
      password: 'admin123',
      displayName: 'مدير النظام',
    });
    adminUid = adminUser.uid;
    console.log('Admin user created:', adminUid);
  }

  // Set admin custom claims
  await authAdmin.setCustomUserClaims(adminUid, { tenantId: TENANT_ID, role: 'admin' });
  console.log('Admin claims set');

  // Create admin user profile
  await db.doc(`tenants/${TENANT_ID}/users/${adminUid}`).set({
    uid: adminUid,
    email: 'Otauba.89@gmail.com',
    fullName: 'مدير النظام',
    phone: '+966500000000',
    createdAt: now,
    active: true,
    reservationCount: 0,
  }, { merge: true });

  // 3. Create customer user
  let customerUid: string;
  try {
    const existing = await authAdmin.getUserByEmail('customer@carserv.test');
    customerUid = existing.uid;
    console.log('Customer user already exists:', customerUid);
  } catch {
    const custUser = await authAdmin.createUser({
      email: 'customer@carserv.test',
      password: 'customer123',
      displayName: 'عميل تجريبي',
    });
    customerUid = custUser.uid;
    console.log('Customer user created:', customerUid);
  }

  // Set customer custom claims
  await authAdmin.setCustomUserClaims(customerUid, { tenantId: TENANT_ID, role: 'customer' });
  console.log('Customer claims set');

  // Create customer user profile
  await db.doc(`tenants/${TENANT_ID}/users/${customerUid}`).set({
    uid: customerUid,
    email: 'customer@carserv.test',
    fullName: 'عميل تجريبي',
    phone: '+966511111111',
    createdAt: now,
    active: true,
    reservationCount: 0,
  }, { merge: true });

  // 4. Business Profile
  await db.doc(`tenants/${TENANT_ID}/settings/businessProfile`).set({
    nameAr: 'Smart Operation',
    nameEn: 'Smart Operation',
    phone: '+966500000000',
    whatsappNumber: '+966500000000',
    vatNumber: '300000000000003',
    crNumber: '1234567890',
    address: 'الرياض، المملكة العربية السعودية',
    logoUrl: null,
    logoPath: null,
    updatedAt: now,
  }, { merge: true });
  console.log('Business profile seeded');

  // 5. Schedule Config
  await db.doc(`tenants/${TENANT_ID}/settings/scheduleConfig`).set({
    workingHours: {
      sunday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      friday: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
      saturday: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
    },
    slotDurationMinutes: 60,
    maxBookingsPerSlot: 3,
    blockedDates: [],
    updatedAt: now,
  }, { merge: true });
  console.log('Schedule config seeded');

  // 6. Payment Settings
  await db.doc(`tenants/${TENANT_ID}/settings/payment`).set({
    provider: 'moyasar',
    moyasar: { publishableKey: 'pk_test_xxx' },
    tap: null,
    hyperpay: null,
    updatedAt: now,
  }, { merge: true });
  console.log('Payment settings seeded');

  // 7. Chart of Accounts
  const accountsSnapshot = await db.collection(`tenants/${TENANT_ID}/accounts`).limit(1).get();
  if (accountsSnapshot.empty) {
    const accounts = [
      { code: '1001', nameAr: 'النقدية', nameEn: 'Cash', type: 'asset' },
      { code: '1002', nameAr: 'البنك', nameEn: 'Bank', type: 'asset' },
      { code: '1100', nameAr: 'الذمم المدينة', nameEn: 'Accounts Receivable', type: 'asset' },
      { code: '1200', nameAr: 'الأصول الثابتة', nameEn: 'Fixed Assets', type: 'asset' },
      { code: '2001', nameAr: 'ضريبة القيمة المضافة المستحقة', nameEn: 'VAT Payable', type: 'liability' },
      { code: '3001', nameAr: 'حقوق الملكية', nameEn: "Owner's Equity", type: 'equity' },
      { code: '4001', nameAr: 'إيرادات الخدمات', nameEn: 'Service Revenue', type: 'revenue' },
      { code: '5001', nameAr: 'مصروف الإيجار', nameEn: 'Rent Expense', type: 'expense' },
      { code: '5002', nameAr: 'مصروف المرافق', nameEn: 'Utilities Expense', type: 'expense' },
      { code: '5003', nameAr: 'مصروف الرواتب', nameEn: 'Salaries Expense', type: 'expense' },
      { code: '5004', nameAr: 'مصروف اللوازم', nameEn: 'Supplies Expense', type: 'expense' },
      { code: '5005', nameAr: 'مصروف التسويق', nameEn: 'Marketing Expense', type: 'expense' },
      { code: '5099', nameAr: 'مصروفات أخرى', nameEn: 'Other Expenses', type: 'expense' },
    ];
    for (const account of accounts) {
      await db.collection(`tenants/${TENANT_ID}/accounts`).add({
        ...account,
        isSystem: true,
        active: true,
        createdAt: now,
      });
    }
    console.log('Chart of accounts seeded (13 accounts)');
  } else {
    console.log('Accounts already exist, skipping');
  }

  // 8. Categories
  const catsSnapshot = await db.collection(`tenants/${TENANT_ID}/categories`).limit(1).get();
  const categoryIds: string[] = [];
  if (catsSnapshot.empty) {
    const categories = [
      { nameAr: 'حماية الطلاء (PPF)', nameEn: 'Paint Protection Film (PPF)', sortOrder: 1 },
      { nameAr: 'طلاء السيراميك', nameEn: 'Ceramic Coating', sortOrder: 2 },
      { nameAr: 'تظليل النوافذ', nameEn: 'Window Tinting', sortOrder: 3 },
      { nameAr: 'التفصيل والتنظيف', nameEn: 'Detailing', sortOrder: 4 },
    ];
    for (const cat of categories) {
      const ref = await db.collection(`tenants/${TENANT_ID}/categories`).add({
        ...cat,
        createdAt: now,
        updatedAt: now,
      });
      categoryIds.push(ref.id);
    }
    console.log('Categories seeded (4)');
  } else {
    // Get existing category IDs
    const allCats = await db.collection(`tenants/${TENANT_ID}/categories`).orderBy('sortOrder').get();
    allCats.forEach(doc => categoryIds.push(doc.id));
    console.log('Categories already exist, using existing IDs:', categoryIds.length);
  }

  // 9. Services
  const svcsSnapshot = await db.collection(`tenants/${TENANT_ID}/services`).limit(1).get();
  if (svcsSnapshot.empty && categoryIds.length >= 4) {
    const futureDate = Timestamp.fromDate(new Date('2026-04-30'));
    const services = [
      { nameAr: 'حماية كاملة PPF', nameEn: 'Full Body PPF', descriptionAr: 'حماية كاملة للسيارة بفيلم حماية الطلاء', descriptionEn: 'Full body paint protection film installation', categoryId: categoryIds[0], price: 8000, hidden: false, offer: null },
      { nameAr: 'حماية أمامية PPF', nameEn: 'Front PPF', descriptionAr: 'حماية الواجهة الأمامية بفيلم حماية الطلاء', descriptionEn: 'Front bumper and hood PPF protection', categoryId: categoryIds[0], price: 3500, hidden: false, offer: null },
      { nameAr: 'طلاء سيراميك 9H', nameEn: '9H Ceramic Coating', descriptionAr: 'طلاء سيراميك بصلابة 9H لحماية طويلة الأمد', descriptionEn: '9H hardness ceramic coating for long-lasting protection', categoryId: categoryIds[1], price: 2500, hidden: false, offer: null },
      { nameAr: 'طلاء سيراميك غرافين', nameEn: 'Graphene Ceramic Coating', descriptionAr: 'طلاء سيراميك متطور بتقنية الغرافين', descriptionEn: 'Advanced graphene ceramic coating technology', categoryId: categoryIds[1], price: 3500, hidden: false, offer: null },
      { nameAr: 'تظليل كامل', nameEn: 'Full Tint', descriptionAr: 'تظليل جميع نوافذ السيارة', descriptionEn: 'Complete window tinting for all windows', categoryId: categoryIds[2], price: 800, hidden: false, offer: null },
      { nameAr: 'تظليل أمامي', nameEn: 'Front Tint', descriptionAr: 'تظليل الزجاج الأمامي فقط', descriptionEn: 'Front windshield tinting only', categoryId: categoryIds[2], price: 350, hidden: false, offer: null },
      { nameAr: 'تفصيل داخلي وخارجي', nameEn: 'Full Detail', descriptionAr: 'تنظيف شامل داخلي وخارجي مع تلميع', descriptionEn: 'Complete interior and exterior detailing with polish', categoryId: categoryIds[3], price: 500, hidden: false, offer: { type: 'percentage', value: 20, expiresAt: futureDate } },
      { nameAr: 'غسيل خارجي ممتاز', nameEn: 'Premium Exterior Wash', descriptionAr: 'غسيل خارجي مع شمع حماية', descriptionEn: 'Premium exterior wash with protective wax', categoryId: categoryIds[3], price: 150, hidden: false, offer: null },
    ];
    for (const svc of services) {
      await db.collection(`tenants/${TENANT_ID}/services`).add({
        ...svc,
        imageUrl: '',
        imagePath: '',
        createdAt: now,
        updatedAt: now,
      });
    }
    console.log('Services seeded (8)');
  } else {
    console.log('Services already exist or not enough categories, skipping');
  }

  // 10. Invoice Counter
  await db.doc(`tenants/${TENANT_ID}/counters/invoiceCounter`).set({
    lastNumber: 0,
    lastYear: new Date().getFullYear(),
    updatedAt: now,
  }, { merge: true });
  console.log('Invoice counter seeded');

  console.log('\n=== SEED COMPLETE ===');
  console.log('Admin login:    Otauba.89@gmail.com / admin123');
  console.log('Customer login: customer@carserv.test / customer123');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
