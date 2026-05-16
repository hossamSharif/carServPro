import {
  queryDocuments,
  deleteDocument,
  where,
  getCollectionRef,
} from '../firestore';
import { getDocs } from 'firebase/firestore';
import type { JournalEntry, Account } from '@/types';

// Legacy sourceType strings from the old purchase-coupled model. Kept here as
// string literals so the shared JournalEntry union can drop them without
// breaking the reset helper.
const LEGACY_PURCHASE_SOURCE_TYPES = [
  'purchase',
  'purchase_cancellation',
  'purchase_payment',
  'purchase_payment_reversal',
] as const;

export interface ResetSummary {
  purchasePayments: number;
  purchaseInvoices: number;
  legacyJournalEntries: number;
  supplierApAccounts: number;
  suppliers: number;
  supplierPayments: number;
}

async function deleteAllInCollection(collectionName: string): Promise<number> {
  const snap = await getDocs(getCollectionRef(collectionName));
  let count = 0;
  for (const doc of snap.docs) {
    await deleteDocument(collectionName, doc.id);
    count += 1;
  }
  return count;
}

export async function resetPurchaseData(): Promise<ResetSummary> {
  const summary: ResetSummary = {
    purchasePayments: 0,
    purchaseInvoices: 0,
    legacyJournalEntries: 0,
    supplierApAccounts: 0,
    suppliers: 0,
    supplierPayments: 0,
  };

  // 1. Legacy invoice-scoped payments (old collection).
  summary.purchasePayments = await deleteAllInCollection('purchasePayments');

  // 2. New supplier payments (wipe so the clean slate applies to both models).
  summary.supplierPayments = await deleteAllInCollection('supplierPayments');

  // 3. Purchase invoices themselves.
  summary.purchaseInvoices = await deleteAllInCollection('purchaseInvoices');

  // 4. Journal entries whose sourceType is a legacy purchase variant.
  //    Firestore doesn't support OR across fields, so run one query per type.
  for (const sourceType of LEGACY_PURCHASE_SOURCE_TYPES) {
    const entries = await queryDocuments<JournalEntry>('journalEntries', [
      where('sourceType', '==', sourceType),
    ]);
    for (const entry of entries) {
      await deleteDocument('journalEntries', entry.id);
      summary.legacyJournalEntries += 1;
    }
  }

  // 5. Supplier AP sub-accounts — every account doc carrying a supplierId is a
  //    per-supplier AP account. The generic 2100 and other system accounts
  //    (1001, 1002, 1300, 5001) have no supplierId and stay.
  const allAccounts = await queryDocuments<Account>('accounts', []);
  for (const account of allAccounts) {
    if (account.supplierId) {
      await deleteDocument('accounts', account.id);
      summary.supplierApAccounts += 1;
    }
  }

  // 6. Suppliers themselves.
  summary.suppliers = await deleteAllInCollection('suppliers');

  return summary;
}
