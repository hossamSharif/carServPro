import {
  addDocument,
  queryDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  where,
  orderBy,
  Timestamp,
  runTransaction,
  db,
  getDocRef,
} from './firestore';
import type { Account, AccountType } from '@/types';

const COLLECTION = 'accounts';

export async function getAccounts(): Promise<Account[]> {
  return queryDocuments<Account>(COLLECTION, [orderBy('code', 'asc')]);
}

export async function getAccountByCode(code: string): Promise<Account | undefined> {
  const results = await queryDocuments<Account>(COLLECTION, [where('code', '==', code)]);
  return results[0];
}

export async function getAccountsByType(type: AccountType): Promise<Account[]> {
  return queryDocuments<Account>(COLLECTION, [where('type', '==', type), orderBy('code', 'asc')]);
}

export async function createAccount(data: {
  code: string;
  nameAr: string;
  nameEn: string;
  type: AccountType;
}): Promise<string> {
  // Check uniqueness
  const existing = await getAccountByCode(data.code);
  if (existing) throw new Error('ACCOUNT_CODE_EXISTS');

  return addDocument(COLLECTION, {
    ...data,
    isSystem: false,
    active: true,
    createdAt: Timestamp.now(),
  });
}

export async function updateAccount(id: string, data: Partial<{ nameAr: string; nameEn: string; type: AccountType; active: boolean }>): Promise<void> {
  await updateDocument(COLLECTION, id, data);
}

export async function ensureSystemAccounts(): Promise<void> {
  const systemAccounts = [
    { code: '1001', nameAr: 'النقدية', nameEn: 'Cash', type: 'asset' as const },
    { code: '1002', nameAr: 'البنك', nameEn: 'Bank', type: 'asset' as const },
    { code: '1300', nameAr: 'ضريبة القيمة المضافة المدفوعة', nameEn: 'Input VAT (VAT Receivable)', type: 'asset' as const },
    { code: '2100', nameAr: 'ذمم دائنة (موردين)', nameEn: 'Accounts Payable', type: 'liability' as const },
    { code: '5100', nameAr: 'مشتريات', nameEn: 'Purchases', type: 'expense' as const },
  ];

  for (const account of systemAccounts) {
    const existing = await getAccountByCode(account.code);
    if (!existing) {
      await addDocument(COLLECTION, {
        ...account,
        isSystem: true,
        active: true,
        createdAt: Timestamp.now(),
      });
    }
  }
}

export async function getAccountBySupplierId(supplierId: string): Promise<Account | undefined> {
  const results = await queryDocuments<Account>(COLLECTION, [where('supplierId', '==', supplierId)]);
  return results[0];
}

export async function createSupplierApAccount(
  supplierId: string,
  supplierNameAr: string,
  supplierNameEn: string
): Promise<{ id: string; code: string }> {
  // Get next AP sub-account code via transaction
  const counterRef = getDocRef('counters', 'apSubAccountCounter');

  const code = await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);
    let lastNumber = 2100; // Start from 2100, first sub-account will be 2101

    if (counterSnap.exists()) {
      lastNumber = counterSnap.data().lastNumber;
    } else {
      // Initialize: check for existing 21xx accounts to avoid collisions
      const existingAccounts = await queryDocuments<Account>(COLLECTION, [
        where('type', '==', 'liability'),
        orderBy('code', 'desc'),
      ]);
      const max21xx = existingAccounts
        .filter((a) => a.code.startsWith('21') && /^\d+$/.test(a.code))
        .map((a) => parseInt(a.code))
        .filter((n) => n > 2100);
      if (max21xx.length > 0) {
        lastNumber = Math.max(...max21xx);
      }
    }

    const newNumber = lastNumber + 1;
    const newCode = String(newNumber);

    transaction.set(counterRef, { lastNumber: newNumber, updatedAt: Timestamp.now() });
    return newCode;
  });

  const id = await addDocument(COLLECTION, {
    code,
    nameAr: `ذمم دائنة - ${supplierNameAr}`,
    nameEn: supplierNameEn ? `AP - ${supplierNameEn}` : `AP - ${supplierNameAr}`,
    type: 'liability' as AccountType,
    isSystem: true,
    active: true,
    supplierId,
    createdAt: Timestamp.now(),
  });

  return { id, code };
}

export async function updateSupplierApAccountName(
  supplierId: string,
  supplierNameAr: string,
  supplierNameEn: string
): Promise<void> {
  const account = await getAccountBySupplierId(supplierId);
  if (account) {
    await updateDocument(COLLECTION, account.id, {
      nameAr: `ذمم دائنة - ${supplierNameAr}`,
      nameEn: supplierNameEn ? `AP - ${supplierNameEn}` : `AP - ${supplierNameAr}`,
    });
  }
}

export async function deleteAccount(id: string): Promise<void> {
  const account = await getDocument<Account>(COLLECTION, id);
  if (account?.isSystem) throw new Error('CANNOT_DELETE_SYSTEM_ACCOUNT');
  await deleteDocument(COLLECTION, id);
}
