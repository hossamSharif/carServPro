import {
  addDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  where,
  orderBy,
  Timestamp,
} from './firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';
import { useAuthStore } from '@/stores/authStore';
import { createJournalEntry, updateJournalEntry, deleteJournalEntry } from './journalService';
import { getAccountByCode } from './accountService';
import type { Expense, JournalLine } from '@/types';

const COLLECTION = 'expenses';

function getTenantId(): string {
  return useAuthStore.getState().tenantId || import.meta.env.VITE_TENANT_ID;
}

function getAdminUid(): string {
  return useAuthStore.getState().user?.uid || '';
}

export async function createExpense(data: {
  date: Date;
  accountId: string;
  accountCode: string;
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer';
  description: string;
  receiptImage?: File;
}): Promise<string> {
  let receiptImageUrl: string | null = null;
  let receiptImagePath: string | null = null;

  // Upload receipt image if provided
  if (data.receiptImage) {
    const path = `tenants/${getTenantId()}/receipts/${crypto.randomUUID()}_${data.receiptImage.name}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, data.receiptImage);
    receiptImageUrl = await getDownloadURL(storageRef);
    receiptImagePath = path;
  }

  // Look up the expense account for journal line details
  const expenseAccount = await getAccountByCode(data.accountCode);
  if (!expenseAccount) throw new Error('EXPENSE_ACCOUNT_NOT_FOUND');

  // Determine the credit account based on payment method
  const creditAccountCode = data.paymentMethod === 'cash' ? '1001' : '1002';
  const creditAccount = await getAccountByCode(creditAccountCode);
  if (!creditAccount) throw new Error('CREDIT_ACCOUNT_NOT_FOUND');

  // Create journal entry: debit expense account, credit cash/bank
  const lines: JournalLine[] = [
    {
      accountId: expenseAccount.id,
      accountCode: expenseAccount.code,
      accountNameAr: expenseAccount.nameAr,
      debit: data.amount,
      credit: 0,
    },
    {
      accountId: creditAccount.id,
      accountCode: creditAccount.code,
      accountNameAr: creditAccount.nameAr,
      debit: 0,
      credit: data.amount,
    },
  ];

  const journalEntryId = await createJournalEntry({
    date: Timestamp.fromDate(data.date),
    description: data.description,
    lines,
    sourceType: 'expense',
    sourceId: null,
    createdBy: getAdminUid(),
  });

  // Create the expense document
  const expenseId = await addDocument(COLLECTION, {
    date: Timestamp.fromDate(data.date),
    accountId: data.accountId,
    accountCode: data.accountCode,
    amount: data.amount,
    paymentMethod: data.paymentMethod,
    description: data.description,
    receiptImageUrl,
    receiptImagePath,
    journalEntryId,
    createdBy: getAdminUid(),
    createdAt: Timestamp.now(),
  });

  return expenseId;
}

export async function getExpenses(): Promise<Expense[]> {
  return queryDocuments<Expense>(COLLECTION, [orderBy('date', 'desc')]);
}

export async function getExpensesByDateRange(from: Date, to: Date): Promise<Expense[]> {
  return queryDocuments<Expense>(COLLECTION, [
    where('date', '>=', Timestamp.fromDate(from)),
    where('date', '<=', Timestamp.fromDate(to)),
    orderBy('date', 'desc'),
  ]);
}

export async function updateExpense(
  id: string,
  data: {
    date: Date;
    accountId: string;
    accountCode: string;
    amount: number;
    paymentMethod: 'cash' | 'bank_transfer';
    description: string;
    receiptImage?: File;
    removeReceipt?: boolean;
  }
): Promise<void> {
  const existing = await getDocument<Expense>(COLLECTION, id);
  if (!existing) throw new Error('EXPENSE_NOT_FOUND');

  let receiptImageUrl = existing.receiptImageUrl;
  let receiptImagePath = existing.receiptImagePath;

  // Handle receipt changes
  if (data.removeReceipt || data.receiptImage) {
    // Delete old receipt if exists
    if (existing.receiptImagePath) {
      try {
        await deleteObject(ref(storage, existing.receiptImagePath));
      } catch { /* ignore if already deleted */ }
    }
    receiptImageUrl = null;
    receiptImagePath = null;
  }

  // Upload new receipt if provided
  if (data.receiptImage) {
    const path = `tenants/${getTenantId()}/receipts/${crypto.randomUUID()}_${data.receiptImage.name}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, data.receiptImage);
    receiptImageUrl = await getDownloadURL(storageRef);
    receiptImagePath = path;
  }

  // Look up accounts for journal entry
  const expenseAccount = await getAccountByCode(data.accountCode);
  if (!expenseAccount) throw new Error('EXPENSE_ACCOUNT_NOT_FOUND');

  const creditAccountCode = data.paymentMethod === 'cash' ? '1001' : '1002';
  const creditAccount = await getAccountByCode(creditAccountCode);
  if (!creditAccount) throw new Error('CREDIT_ACCOUNT_NOT_FOUND');

  // Update journal entry
  const lines: JournalLine[] = [
    {
      accountId: expenseAccount.id,
      accountCode: expenseAccount.code,
      accountNameAr: expenseAccount.nameAr,
      debit: data.amount,
      credit: 0,
    },
    {
      accountId: creditAccount.id,
      accountCode: creditAccount.code,
      accountNameAr: creditAccount.nameAr,
      debit: 0,
      credit: data.amount,
    },
  ];

  await updateJournalEntry(existing.journalEntryId, {
    date: Timestamp.fromDate(data.date),
    description: data.description,
    lines,
  });

  // Update expense document
  await updateDocument(COLLECTION, id, {
    date: Timestamp.fromDate(data.date),
    accountId: data.accountId,
    accountCode: data.accountCode,
    amount: data.amount,
    paymentMethod: data.paymentMethod,
    description: data.description,
    receiptImageUrl,
    receiptImagePath,
  });
}

export async function deleteExpense(id: string): Promise<void> {
  const existing = await getDocument<Expense>(COLLECTION, id);
  if (!existing) throw new Error('EXPENSE_NOT_FOUND');

  // Delete receipt from storage
  if (existing.receiptImagePath) {
    try {
      await deleteObject(ref(storage, existing.receiptImagePath));
    } catch { /* ignore if already deleted */ }
  }

  // Delete journal entry
  await deleteJournalEntry(existing.journalEntryId);

  // Delete expense
  await deleteDocument(COLLECTION, id);
}
