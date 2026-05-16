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
import { useAuthStore } from '@/stores/authStore';
import {
  getAccountByCode,
  getAccountBySupplierId,
  ensureSystemAccounts,
} from './accountService';
import { createJournalEntry, createReversalEntry } from './journalService';
import type {
  SupplierPayment,
  SupplierPaymentType,
} from '@/types/purchase';
import type { JournalLine, Account } from '@/types';
import type { QueryConstraint } from 'firebase/firestore';

const COLLECTION = 'supplierPayments';

function getAdminUid(): string {
  return useAuthStore.getState().user?.uid || '';
}

async function resolveApAccount(
  supplierId: string,
  supplierAccountCode: string | undefined,
): Promise<Account> {
  let apAccount: Account | undefined = supplierAccountCode
    ? await getAccountByCode(supplierAccountCode)
    : undefined;
  if (!apAccount) {
    apAccount = (await getAccountBySupplierId(supplierId)) || (await getAccountByCode('2100'));
  }
  if (!apAccount) throw new Error('MISSING_SUPPLIER_AP_ACCOUNT');
  return apAccount;
}

async function resolveCashAccount(method: 'cash' | 'bank_transfer'): Promise<Account> {
  const code = method === 'cash' ? '1001' : '1002';
  const account = await getAccountByCode(code);
  if (!account) throw new Error('MISSING_SYSTEM_ACCOUNTS');
  return account;
}

function buildLines(
  type: SupplierPaymentType,
  amount: number,
  apAccount: Account,
  cashAccount: Account,
): JournalLine[] {
  // type === 'payment'  => we pay the supplier: Dr AP (reduce what we owe), Cr Cash/Bank
  // type === 'receipt'  => supplier refunds us: Dr Cash/Bank, Cr AP (increase what we owe / decrease overpayment)
  const apLine: JournalLine = {
    accountId: apAccount.id,
    accountCode: apAccount.code,
    accountNameAr: apAccount.nameAr,
    debit: type === 'payment' ? amount : 0,
    credit: type === 'receipt' ? amount : 0,
  };
  const cashLine: JournalLine = {
    accountId: cashAccount.id,
    accountCode: cashAccount.code,
    accountNameAr: cashAccount.nameAr,
    debit: type === 'receipt' ? amount : 0,
    credit: type === 'payment' ? amount : 0,
  };
  return [apLine, cashLine];
}

function buildDescription(
  type: SupplierPaymentType,
  supplierName: string,
  notes: string,
): string {
  const prefix = type === 'payment' ? 'دفعة للمورد' : 'استلام من المورد';
  const base = `${prefix} - ${supplierName}`;
  return notes ? `${base} - ${notes}` : base;
}

export interface CreateSupplierPaymentInput {
  supplierId: string;
  supplierName: string;
  supplierAccountCode: string;
  type: SupplierPaymentType;
  amount: number;
  method: 'cash' | 'bank_transfer';
  date: Date;
  notes: string;
}

export async function createSupplierPayment(input: CreateSupplierPaymentInput): Promise<string> {
  if (!input.amount || input.amount <= 0) throw new Error('INVALID_AMOUNT');
  await ensureSystemAccounts();

  const apAccount = await resolveApAccount(input.supplierId, input.supplierAccountCode);
  const cashAccount = await resolveCashAccount(input.method);

  const lines = buildLines(input.type, input.amount, apAccount, cashAccount);
  const entryDate = Timestamp.fromDate(input.date);

  const journalEntryId = await createJournalEntry({
    date: entryDate,
    description: buildDescription(input.type, input.supplierName, input.notes),
    lines,
    sourceType: 'supplier_payment',
    sourceId: null,
    createdBy: getAdminUid(),
  });

  return addDocument(COLLECTION, {
    supplierId: input.supplierId,
    supplierName: input.supplierName,
    supplierAccountCode: apAccount.code,
    type: input.type,
    amount: input.amount,
    method: input.method,
    date: entryDate,
    notes: input.notes,
    journalEntryId,
    createdBy: getAdminUid(),
    createdAt: Timestamp.now(),
  });
}

export interface UpdateSupplierPaymentInput {
  type: SupplierPaymentType;
  amount: number;
  method: 'cash' | 'bank_transfer';
  date: Date;
  notes: string;
}

export async function updateSupplierPayment(
  id: string,
  updates: UpdateSupplierPaymentInput,
): Promise<void> {
  if (!updates.amount || updates.amount <= 0) throw new Error('INVALID_AMOUNT');
  const existing = await getDocument<SupplierPayment>(COLLECTION, id);
  if (!existing) throw new Error('PAYMENT_NOT_FOUND');

  await ensureSystemAccounts();

  if (existing.journalEntryId) {
    await createReversalEntry(existing.journalEntryId, 'supplier_payment_reversal');
  }

  const apAccount = await resolveApAccount(existing.supplierId, existing.supplierAccountCode);
  const cashAccount = await resolveCashAccount(updates.method);
  const lines = buildLines(updates.type, updates.amount, apAccount, cashAccount);
  const entryDate = Timestamp.fromDate(updates.date);

  const journalEntryId = await createJournalEntry({
    date: entryDate,
    description: buildDescription(updates.type, existing.supplierName, updates.notes),
    lines,
    sourceType: 'supplier_payment',
    sourceId: null,
    createdBy: getAdminUid(),
  });

  await updateDocument(COLLECTION, id, {
    type: updates.type,
    amount: updates.amount,
    method: updates.method,
    date: entryDate,
    notes: updates.notes,
    journalEntryId,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteSupplierPayment(id: string): Promise<void> {
  const existing = await getDocument<SupplierPayment>(COLLECTION, id);
  if (!existing) throw new Error('PAYMENT_NOT_FOUND');

  if (existing.journalEntryId) {
    await createReversalEntry(existing.journalEntryId, 'supplier_payment_reversal');
  }
  await deleteDocument(COLLECTION, id);
}

export interface SupplierPaymentFilters {
  supplierId?: string;
  from?: Date;
  to?: Date;
  type?: SupplierPaymentType;
}

export async function getSupplierPayments(
  filters: SupplierPaymentFilters = {},
): Promise<SupplierPayment[]> {
  const constraints: QueryConstraint[] = [];
  if (filters.supplierId) constraints.push(where('supplierId', '==', filters.supplierId));
  if (filters.type) constraints.push(where('type', '==', filters.type));
  if (filters.from) constraints.push(where('date', '>=', Timestamp.fromDate(filters.from)));
  if (filters.to) constraints.push(where('date', '<=', Timestamp.fromDate(filters.to)));
  constraints.push(orderBy('date', 'desc'));
  return queryDocuments<SupplierPayment>(COLLECTION, constraints);
}

export async function getSupplierPaymentById(id: string): Promise<SupplierPayment | null> {
  return getDocument<SupplierPayment>(COLLECTION, id);
}
