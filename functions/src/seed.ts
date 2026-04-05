import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();
const authAdmin = admin.auth();

export const seedData = functions.https.onRequest(async (req, res) => {
  // Only allow POST
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  const TENANT_ID = 'default-tenant';
  const now = admin.firestore.Timestamp.now();
  const results: string[] = [];

  try {
    // 1. Tenant doc
    await db.doc(`tenants/${TENANT_ID}`).set({ name: 'Smart Operation', createdAt: now }, { merge: true });
    results.push('Tenant doc created');

    // 2. Admin user
    let adminUid: string;
    try {
      const existing = await authAdmin.getUserByEmail('Otauba.89@gmail.com');
      adminUid = existing.uid;
      results.push(`Admin user exists: ${adminUid}`);
    } catch {
      const adminUser = await authAdmin.createUser({
        email: 'Otauba.89@gmail.com',
        password: 'admin123',
        displayName: 'مدير النظام',
      });
      adminUid = adminUser.uid;
      results.push(`Admin user created: ${adminUid}`);
    }
    await authAdmin.setCustomUserClaims(adminUid, { tenantId: TENANT_ID, role: 'admin' });
    await db.doc(`tenants/${TENANT_ID}/users/${adminUid}`).set({
      uid: adminUid, email: 'Otauba.89@gmail.com', fullName: 'مدير النظام',
      phone: '+966500000000', createdAt: now, active: true, reservationCount: 0,
    }, { merge: true });
    results.push('Admin claims & profile set');

    // 3. Customer user
    let customerUid: string;
    try {
      const existing = await authAdmin.getUserByEmail('customer@carserv.test');
      customerUid = existing.uid;
      results.push(`Customer user exists: ${customerUid}`);
    } catch {
      const custUser = await authAdmin.createUser({
        email: 'customer@carserv.test',
        password: 'customer123',
        displayName: 'عميل تجريبي',
      });
      customerUid = custUser.uid;
      results.push(`Customer user created: ${customerUid}`);
    }
    await authAdmin.setCustomUserClaims(customerUid, { tenantId: TENANT_ID, role: 'customer' });
    await db.doc(`tenants/${TENANT_ID}/users/${customerUid}`).set({
      uid: customerUid, email: 'customer@carserv.test', fullName: 'عميل تجريبي',
      phone: '+966511111111', createdAt: now, active: true, reservationCount: 0,
    }, { merge: true });
    results.push('Customer claims & profile set');

    // 4. Settings
    await db.doc(`tenants/${TENANT_ID}/settings/businessProfile`).set({
      nameAr: 'Smart Operation', nameEn: 'Smart Operation', phone: '+966500000000',
      whatsappNumber: '+966500000000', vatNumber: '300000000000003', crNumber: '1234567890',
      address: 'الرياض، المملكة العربية السعودية', logoUrl: null, logoPath: null, updatedAt: now,
    }, { merge: true });

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
      slotDurationMinutes: 60, maxBookingsPerSlot: 3, blockedDates: [], updatedAt: now,
    }, { merge: true });

    await db.doc(`tenants/${TENANT_ID}/settings/payment`).set({
      provider: 'moyasar', moyasar: { publishableKey: 'pk_test_xxx' },
      tap: null, hyperpay: null, updatedAt: now,
    }, { merge: true });
    results.push('Settings seeded');

    // 5. Accounts
    const accountsSnap = await db.collection(`tenants/${TENANT_ID}/accounts`).limit(1).get();
    if (accountsSnap.empty) {
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
      for (const a of accounts) {
        await db.collection(`tenants/${TENANT_ID}/accounts`).add({ ...a, isSystem: true, active: true, createdAt: now });
      }
      results.push('Accounts seeded (13)');
    } else {
      results.push('Accounts already exist');
    }

    // 6. Categories
    const catsSnap = await db.collection(`tenants/${TENANT_ID}/categories`).limit(1).get();
    const catIds: string[] = [];
    if (catsSnap.empty) {
      const cats = [
        { nameAr: 'حماية الطلاء (PPF)', nameEn: 'Paint Protection Film (PPF)', sortOrder: 1 },
        { nameAr: 'طلاء السيراميك', nameEn: 'Ceramic Coating', sortOrder: 2 },
        { nameAr: 'تظليل النوافذ', nameEn: 'Window Tinting', sortOrder: 3 },
        { nameAr: 'التفصيل والتنظيف', nameEn: 'Detailing', sortOrder: 4 },
      ];
      for (const c of cats) {
        const ref = await db.collection(`tenants/${TENANT_ID}/categories`).add({ ...c, createdAt: now, updatedAt: now });
        catIds.push(ref.id);
      }
      results.push('Categories seeded (4)');
    } else {
      const all = await db.collection(`tenants/${TENANT_ID}/categories`).orderBy('sortOrder').get();
      all.forEach(d => catIds.push(d.id));
      results.push(`Categories exist (${catIds.length})`);
    }

    // 7. Services
    const svcsSnap = await db.collection(`tenants/${TENANT_ID}/services`).limit(1).get();
    if (svcsSnap.empty && catIds.length >= 4) {
      const future = admin.firestore.Timestamp.fromDate(new Date('2026-04-30'));
      const svcs = [
        { nameAr: 'حماية كاملة PPF', nameEn: 'Full Body PPF', descriptionAr: 'حماية كاملة للسيارة بفيلم حماية الطلاء', descriptionEn: 'Full body PPF', categoryId: catIds[0], price: 8000 },
        { nameAr: 'حماية أمامية PPF', nameEn: 'Front PPF', descriptionAr: 'حماية الواجهة الأمامية', descriptionEn: 'Front PPF', categoryId: catIds[0], price: 3500 },
        { nameAr: 'طلاء سيراميك 9H', nameEn: '9H Ceramic Coating', descriptionAr: 'طلاء سيراميك بصلابة 9H', descriptionEn: '9H ceramic coating', categoryId: catIds[1], price: 2500 },
        { nameAr: 'طلاء سيراميك غرافين', nameEn: 'Graphene Ceramic', descriptionAr: 'طلاء سيراميك بتقنية الغرافين', descriptionEn: 'Graphene ceramic coating', categoryId: catIds[1], price: 3500 },
        { nameAr: 'تظليل كامل', nameEn: 'Full Tint', descriptionAr: 'تظليل جميع نوافذ السيارة', descriptionEn: 'Full window tinting', categoryId: catIds[2], price: 800 },
        { nameAr: 'تظليل أمامي', nameEn: 'Front Tint', descriptionAr: 'تظليل الزجاج الأمامي', descriptionEn: 'Front tint only', categoryId: catIds[2], price: 350 },
        { nameAr: 'تفصيل داخلي وخارجي', nameEn: 'Full Detail', descriptionAr: 'تنظيف شامل مع تلميع', descriptionEn: 'Full detailing', categoryId: catIds[3], price: 500, offer: { type: 'percentage', value: 20, expiresAt: future } },
        { nameAr: 'غسيل خارجي ممتاز', nameEn: 'Premium Wash', descriptionAr: 'غسيل خارجي مع شمع', descriptionEn: 'Premium exterior wash', categoryId: catIds[3], price: 150 },
      ];
      for (const s of svcs) {
        await db.collection(`tenants/${TENANT_ID}/services`).add({
          ...s, hidden: false, imageUrl: '', imagePath: '', offer: (s as any).offer || null,
          createdAt: now, updatedAt: now,
        });
      }
      results.push('Services seeded (8)');
    } else {
      results.push('Services already exist');
    }

    // 8. Invoice counter
    await db.doc(`tenants/${TENANT_ID}/counters/invoiceCounter`).set({
      lastNumber: 0, lastYear: new Date().getFullYear(), updatedAt: now,
    }, { merge: true });
    results.push('Invoice counter set');

    res.json({ success: true, results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, results });
  }
});
