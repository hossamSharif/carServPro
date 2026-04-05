import {
  addDocument,
  queryDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  where,
  orderBy,
  Timestamp,
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
    { code: '1300', nameAr: 'ضريبة القيمة المضافة المدفوعة', nameEn: 'Input VAT (VAT Receivable)', type: 'asset' as const },
    { code: '2100', nameAr: 'ذمم دائنة (موردين)', nameEn: 'Accounts Payable', type: 'liability' as const },
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

export async function deleteAccount(id: string): Promise<void> {
  const account = await getDocument<Account>(COLLECTION, id);
  if (account?.isSystem) throw new Error('CANNOT_DELETE_SYSTEM_ACCOUNT');
  await deleteDocument(COLLECTION, id);
}
