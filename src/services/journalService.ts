import {
  addDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  where,
  orderBy,
  Timestamp,
} from './firestore';
import { useAuthStore } from '@/stores/authStore';
import { getAccountByCode } from './accountService';
import type { JournalEntry, JournalLine, Invoice } from '@/types';

const COLLECTION = 'journalEntries';

function getAdminUid(): string {
  return useAuthStore.getState().user?.uid || '';
}

export async function createJournalEntry(entry: Omit<JournalEntry, 'id' | 'createdAt'>): Promise<string> {
  // Validate double-entry
  const totalDebits = entry.lines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredits = entry.lines.reduce((sum, l) => sum + l.credit, 0);
  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    throw new Error('UNBALANCED_ENTRY');
  }

  return addDocument(COLLECTION, {
    ...entry,
    createdAt: Timestamp.now(),
  });
}

export async function createInvoiceJournalEntry(invoice: Invoice): Promise<string> {
  const cashAccount = await getAccountByCode('1001');
  const receivableAccount = await getAccountByCode('1100');
  const revenueAccount = await getAccountByCode('4001');
  const vatAccount = await getAccountByCode('2001');

  if (!revenueAccount || !vatAccount) throw new Error('MISSING_SYSTEM_ACCOUNTS');

  const debitAccount = invoice.paymentMethod === 'cash' ? cashAccount : receivableAccount;
  if (!debitAccount) throw new Error('MISSING_SYSTEM_ACCOUNTS');

  const lines: JournalLine[] = [
    {
      accountId: debitAccount.id,
      accountCode: debitAccount.code,
      accountNameAr: debitAccount.nameAr,
      debit: invoice.grandTotal,
      credit: 0,
    },
    {
      accountId: revenueAccount.id,
      accountCode: revenueAccount.code,
      accountNameAr: revenueAccount.nameAr,
      debit: 0,
      credit: invoice.subtotal,
    },
    {
      accountId: vatAccount.id,
      accountCode: vatAccount.code,
      accountNameAr: vatAccount.nameAr,
      debit: 0,
      credit: invoice.totalVat,
    },
  ];

  return createJournalEntry({
    date: Timestamp.now(),
    description: `فاتورة ${invoice.invoiceNumber || invoice.id}`,
    lines,
    sourceType: 'invoice',
    sourceId: invoice.id,
    createdBy: getAdminUid(),
  });
}

export async function createReversalEntry(originalEntryId: string, sourceType?: JournalEntry['sourceType']): Promise<string> {
  // Find the original entry by ID
  const original = await queryDocuments<JournalEntry>(COLLECTION, []);
  const entry = original.find((e) => e.id === originalEntryId);
  if (!entry) throw new Error('ORIGINAL_ENTRY_NOT_FOUND');

  const reversedLines: JournalLine[] = entry.lines.map((l) => ({
    ...l,
    debit: l.credit,
    credit: l.debit,
  }));

  // Determine the reversal sourceType
  const reversalSourceType = sourceType || 'invoice_cancellation';

  return createJournalEntry({
    date: Timestamp.now(),
    description: `عكس: ${entry.description}`,
    lines: reversedLines,
    sourceType: reversalSourceType,
    sourceId: entry.sourceId,
    createdBy: getAdminUid(),
  });
}

export async function updateJournalEntry(
  id: string,
  data: Partial<Pick<JournalEntry, 'date' | 'description' | 'lines'>>
): Promise<void> {
  if (data.lines) {
    const totalDebits = data.lines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredits = data.lines.reduce((sum, l) => sum + l.credit, 0);
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      throw new Error('UNBALANCED_ENTRY');
    }
  }
  await updateDocument(COLLECTION, id, data);
}

export async function deleteJournalEntry(id: string): Promise<void> {
  await deleteDocument(COLLECTION, id);
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  return queryDocuments<JournalEntry>(COLLECTION, [orderBy('createdAt', 'desc')]);
}

export async function getJournalEntriesBySource(sourceType: string, sourceId: string): Promise<JournalEntry[]> {
  return queryDocuments<JournalEntry>(COLLECTION, [
    where('sourceType', '==', sourceType),
    where('sourceId', '==', sourceId),
  ]);
}
