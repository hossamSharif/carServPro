import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, setDoc, Timestamp, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'fake-api-key',
  authDomain: 'localhost',
  projectId: 'car-serv-pro',
  storageBucket: 'car-serv-pro.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:0000000000000000',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
connectFirestoreEmulator(db, 'localhost', 8080);

const TENANT_ID = 'default-tenant';
const now = Timestamp.now();

async function seed() {
  console.log('Seeding Firebase Emulator...');

  // 1. Create tenant doc
  await setDoc(doc(db, `tenants/${TENANT_ID}`), { name: 'Smart Operation', createdAt: now });

  // 2. Create admin user
  try {
    const adminCred = await createUserWithEmailAndPassword(auth, 'Otauba.89@gmail.com', 'admin123');
    await setDoc(doc(db, `pendingRegistrations/${adminCred.user.uid}`), {
      email: 'Otauba.89@gmail.com',
      fullName: 'مدير النظام',
      phone: '+966500000000',
      tenantId: TENANT_ID,
      createdAt: now,
    });
    await setDoc(doc(db, `tenants/${TENANT_ID}/users/${adminCred.user.uid}`), {
      uid: adminCred.user.uid,
      email: 'Otauba.89@gmail.com',
      fullName: 'مدير النظام',
      phone: '+966500000000',
      createdAt: now,
      active: true,
      reservationCount: 0,
    });
    console.log('Admin user created');
  } catch (e: unknown) {
    console.log('Admin user may already exist:', (e as Error).message);
  }

  // 3. Create customer user
  try {
    const custCred = await createUserWithEmailAndPassword(auth, 'customer@carserv.test', 'customer123');
    await setDoc(doc(db, `pendingRegistrations/${custCred.user.uid}`), {
      email: 'customer@carserv.test',
      fullName: 'عميل تجريبي',
      phone: '+966511111111',
      tenantId: TENANT_ID,
      createdAt: now,
    });
    console.log('Customer user created');
  } catch (e: unknown) {
    console.log('Customer user may already exist:', (e as Error).message);
  }

  // 4. Business Profile
  await setDoc(doc(db, `tenants/${TENANT_ID}/settings/businessProfile`), {
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
  });

  // 5. Schedule Config
  await setDoc(doc(db, `tenants/${TENANT_ID}/settings/scheduleConfig`), {
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
  });

  // 6. Payment Settings
  await setDoc(doc(db, `tenants/${TENANT_ID}/settings/payment`), {
    provider: 'moyasar',
    moyasar: { publishableKey: 'pk_test_xxx' },
    tap: null,
    hyperpay: null,
    updatedAt: now,
  });

  // 7. Chart of Accounts (13 pre-seeded)
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
    await addDoc(collection(db, `tenants/${TENANT_ID}/accounts`), {
      ...account,
      isSystem: true,
      active: true,
      createdAt: now,
    });
  }
  console.log('Chart of accounts seeded');

  // 8. Sample Categories
  const categories = [
    { nameAr: 'حماية الطلاء (PPF)', nameEn: 'Paint Protection Film (PPF)', sortOrder: 1 },
    { nameAr: 'طلاء السيراميك', nameEn: 'Ceramic Coating', sortOrder: 2 },
    { nameAr: 'تظليل النوافذ', nameEn: 'Window Tinting', sortOrder: 3 },
    { nameAr: 'التفصيل والتنظيف', nameEn: 'Detailing', sortOrder: 4 },
  ];

  const categoryIds: string[] = [];
  for (const cat of categories) {
    const ref = await addDoc(collection(db, `tenants/${TENANT_ID}/categories`), {
      ...cat,
      createdAt: now,
      updatedAt: now,
    });
    categoryIds.push(ref.id);
  }
  console.log('Categories seeded');

  // 9. Sample Services
  const services = [
    { nameAr: 'حماية كاملة PPF', nameEn: 'Full Body PPF', descriptionAr: 'حماية كاملة للسيارة بفيلم حماية الطلاء', descriptionEn: 'Full body paint protection film installation', categoryId: categoryIds[0], price: 8000, hidden: false },
    { nameAr: 'حماية أمامية PPF', nameEn: 'Front PPF', descriptionAr: 'حماية الواجهة الأمامية بفيلم حماية الطلاء', descriptionEn: 'Front bumper and hood PPF protection', categoryId: categoryIds[0], price: 3500, hidden: false },
    { nameAr: 'طلاء سيراميك 9H', nameEn: '9H Ceramic Coating', descriptionAr: 'طلاء سيراميك بصلابة 9H لحماية طويلة الأمد', descriptionEn: '9H hardness ceramic coating for long-lasting protection', categoryId: categoryIds[1], price: 2500, hidden: false },
    { nameAr: 'طلاء سيراميك غرافين', nameEn: 'Graphene Ceramic Coating', descriptionAr: 'طلاء سيراميك متطور بتقنية الغرافين', descriptionEn: 'Advanced graphene ceramic coating technology', categoryId: categoryIds[1], price: 3500, hidden: false },
    { nameAr: 'تظليل كامل', nameEn: 'Full Tint', descriptionAr: 'تظليل جميع نوافذ السيارة', descriptionEn: 'Complete window tinting for all windows', categoryId: categoryIds[2], price: 800, hidden: false },
    { nameAr: 'تظليل أمامي', nameEn: 'Front Tint', descriptionAr: 'تظليل الزجاج الأمامي فقط', descriptionEn: 'Front windshield tinting only', categoryId: categoryIds[2], price: 350, hidden: false },
    { nameAr: 'تفصيل داخلي وخارجي', nameEn: 'Full Detail', descriptionAr: 'تنظيف شامل داخلي وخارجي مع تلميع', descriptionEn: 'Complete interior and exterior detailing with polish', categoryId: categoryIds[3], price: 500, hidden: false, offer: { type: 'percentage', value: 20, expiresAt: Timestamp.fromDate(new Date('2026-04-30')) } },
    { nameAr: 'غسيل خارجي ممتاز', nameEn: 'Premium Exterior Wash', descriptionAr: 'غسيل خارجي مع شمع حماية', descriptionEn: 'Premium exterior wash with protective wax', categoryId: categoryIds[3], price: 150, hidden: false },
  ];

  for (const svc of services) {
    await addDoc(collection(db, `tenants/${TENANT_ID}/services`), {
      ...svc,
      imageUrl: '',
      imagePath: '',
      offer: svc.offer || null,
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log('Services seeded');

  // 10. Invoice Counter
  await setDoc(doc(db, `tenants/${TENANT_ID}/counters/invoiceCounter`), {
    lastNumber: 0,
    lastYear: new Date().getFullYear(),
    updatedAt: now,
  });

  console.log('Seed complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
