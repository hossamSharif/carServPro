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
import {
  createSupplierApAccount,
  updateSupplierApAccountName,
  getAccountBySupplierId,
  ensureSystemAccounts,
} from './accountService';
import type { Supplier } from '@/types/purchase';
import type { JournalEntry } from '@/types';

const COLLECTION = 'suppliers';

export type DeleteSupplierBlockReason =
  | 'has_purchase_invoices'
  | 'has_supplier_payments'
  | 'has_legacy_purchase_payments'
  | 'has_ap_balance';

export class SupplierInUseError extends Error {
  constructor(public readonly reasons: DeleteSupplierBlockReason[], public readonly details: {
    purchaseInvoices: number;
    supplierPayments: number;
    legacyPurchasePayments: number;
    apBalance: number;
  }) {
    super(`SUPPLIER_IN_USE:${reasons.join(',')}`);
    this.name = 'SupplierInUseError';
  }
}

export async function getSuppliers(): Promise<Supplier[]> {
  return queryDocuments<Supplier>(COLLECTION, [orderBy('nameAr', 'asc')]);
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
  return getDocument<Supplier>(COLLECTION, id);
}

export async function createSupplier(data: {
  nameAr: string;
  nameEn: string;
  phone: string;
  email: string;
  vatNumber: string;
  address: string;
}): Promise<string> {
  await ensureSystemAccounts();

  const supplierId = await addDocument(COLLECTION, {
    ...data,
    active: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // Auto-create AP sub-account for this supplier
  const { code } = await createSupplierApAccount(supplierId, data.nameAr, data.nameEn);
  await updateDocument(COLLECTION, supplierId, { apAccountCode: code });

  return supplierId;
}

export async function updateSupplier(
  id: string,
  data: Partial<Pick<Supplier, 'nameAr' | 'nameEn' | 'phone' | 'email' | 'vatNumber' | 'address' | 'active'>>
): Promise<void> {
  await updateDocument(COLLECTION, id, { ...data, updatedAt: Timestamp.now() });

  // Sync AP account name if supplier name changed
  if (data.nameAr || data.nameEn) {
    const supplier = await getDocument<Supplier>(COLLECTION, id);
    if (supplier) {
      await updateSupplierApAccountName(
        id,
        data.nameAr || supplier.nameAr,
        data.nameEn || supplier.nameEn
      );
    }
  }
}

export async function deleteSupplier(id: string): Promise<void> {
  // Refuse deletion when the supplier is still referenced by any operational document,
  // or when its AP sub-account holds a non-zero balance. Hard-deleting a referenced
  // supplier leaves orphan invoices/payments/journal entries that no longer appear in
  // any picker (root cause of the disappearing-supplier incident).
  const [invoices, payments, legacyPayments, apAccount] = await Promise.all([
    queryDocuments<{ id: string }>('purchaseInvoices', [where('supplierId', '==', id)]),
    queryDocuments<{ id: string }>('supplierPayments', [where('supplierId', '==', id)]),
    queryDocuments<{ id: string }>('purchasePayments', [where('supplierId', '==', id)]),
    getAccountBySupplierId(id),
  ]);

  let apBalance = 0;
  if (apAccount) {
    const entries = await queryDocuments<JournalEntry>('journalEntries', []);
    for (const entry of entries) {
      for (const line of entry.lines) {
        if (line.accountId === apAccount.id) {
          apBalance += (line.credit || 0) - (line.debit || 0);
        }
      }
    }
  }

  const reasons: DeleteSupplierBlockReason[] = [];
  if (invoices.length > 0) reasons.push('has_purchase_invoices');
  if (payments.length > 0) reasons.push('has_supplier_payments');
  if (legacyPayments.length > 0) reasons.push('has_legacy_purchase_payments');
  if (Math.abs(apBalance) > 0.01) reasons.push('has_ap_balance');

  if (reasons.length > 0) {
    throw new SupplierInUseError(reasons, {
      purchaseInvoices: invoices.length,
      supplierPayments: payments.length,
      legacyPurchasePayments: legacyPayments.length,
      apBalance,
    });
  }

  // Safe to delete: cascade-remove the supplier's AP sub-account so we don't leave
  // a dangling per-supplier liability account in the chart of accounts.
  if (apAccount) {
    await deleteDocument('accounts', apAccount.id);
  }
  await deleteDocument(COLLECTION, id);
}

/**
 * Migration: ensure all existing suppliers have AP sub-accounts.
 * Safe to call multiple times (idempotent).
 *
 * In-flight lock: React 18 StrictMode invokes effects twice in dev, which previously
 * raced two passes of this migration and created duplicate AP sub-accounts (e.g. 2101
 * and 2102 for the same supplierId). The shared promise collapses concurrent callers
 * onto a single execution.
 */
let ensureSupplierApAccountsInflight: Promise<number> | null = null;

export async function ensureSupplierApAccounts(): Promise<number> {
  if (ensureSupplierApAccountsInflight) return ensureSupplierApAccountsInflight;
  ensureSupplierApAccountsInflight = (async () => {
    try {
      await ensureSystemAccounts();
      const suppliers = await getSuppliers();
      let created = 0;

      for (const supplier of suppliers) {
        // Re-check the supplier doc inside the loop so a sibling migration pass that
        // already populated apAccountCode is respected even if our snapshot was stale.
        const fresh = await getDocument<Supplier>(COLLECTION, supplier.id);
        if (fresh?.apAccountCode) continue;

        const existing = await getAccountBySupplierId(supplier.id);
        if (existing) {
          await updateDocument(COLLECTION, supplier.id, {
            apAccountCode: existing.code,
            updatedAt: Timestamp.now(),
          });
        } else {
          const { code } = await createSupplierApAccount(supplier.id, supplier.nameAr, supplier.nameEn);
          await updateDocument(COLLECTION, supplier.id, {
            apAccountCode: code,
            updatedAt: Timestamp.now(),
          });
          created++;
        }
      }

      return created;
    } finally {
      ensureSupplierApAccountsInflight = null;
    }
  })();
  return ensureSupplierApAccountsInflight;
}
