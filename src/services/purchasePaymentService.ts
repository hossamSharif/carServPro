import {
  addDocument,
  getDocument,
  queryDocuments,
  updateDocument,
  where,
  orderBy,
  Timestamp,
} from './firestore';
import { useAuthStore } from '@/stores/authStore';
import { getAccountByCode } from './accountService';
import { createJournalEntry } from './journalService';
import type { PurchasePayment } from '@/types/purchase';
import type { PurchaseInvoice } from '@/types/purchase';
import type { JournalLine } from '@/types';

const COLLECTION = 'purchasePayments';

function getAdminUid(): string {
  return useAuthStore.getState().user?.uid || '';
}

export async function recordPurchasePayment(data: {
  purchaseInvoiceId: string;
  supplierId: string;
  amount: number;
  method: 'cash' | 'bank_transfer';
  notes: string;
  invoiceNumber: string | null;
  supplierName: string;
}): Promise<string> {
  // Create journal entry: Dr AP, Cr Cash/Bank
  const apAccount = await getAccountByCode('2100');
  const creditAccountCode = data.method === 'cash' ? '1001' : '1002';
  const creditAccount = await getAccountByCode(creditAccountCode);

  if (!apAccount || !creditAccount) throw new Error('MISSING_SYSTEM_ACCOUNTS');

  const lines: JournalLine[] = [
    {
      accountId: apAccount.id,
      accountCode: apAccount.code,
      accountNameAr: apAccount.nameAr,
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
    date: Timestamp.now(),
    description: `دفعة فاتورة مشتريات ${data.invoiceNumber || data.purchaseInvoiceId} - ${data.supplierName}`,
    lines,
    sourceType: 'purchase_payment',
    sourceId: data.purchaseInvoiceId,
    createdBy: getAdminUid(),
  });

  const paymentId = await addDocument(COLLECTION, {
    purchaseInvoiceId: data.purchaseInvoiceId,
    supplierId: data.supplierId,
    amount: data.amount,
    method: data.method,
    journalEntryId,
    notes: data.notes,
    recordedBy: getAdminUid(),
    createdAt: Timestamp.now(),
  });

  // Update invoice payment status
  await updatePurchasePaymentStatus(data.purchaseInvoiceId);

  return paymentId;
}

export async function getPurchasePaymentsByInvoice(purchaseInvoiceId: string): Promise<PurchasePayment[]> {
  return queryDocuments<PurchasePayment>(COLLECTION, [
    where('purchaseInvoiceId', '==', purchaseInvoiceId),
    orderBy('createdAt', 'desc'),
  ]);
}

export async function getPurchasePaymentsBySupplier(supplierId: string): Promise<PurchasePayment[]> {
  return queryDocuments<PurchasePayment>(COLLECTION, [
    where('supplierId', '==', supplierId),
    orderBy('createdAt', 'desc'),
  ]);
}

async function updatePurchasePaymentStatus(purchaseInvoiceId: string): Promise<void> {
  const purchase = await getDocument<PurchaseInvoice>('purchaseInvoices', purchaseInvoiceId);
  if (!purchase) return;

  const payments = await getPurchasePaymentsByInvoice(purchaseInvoiceId);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  let paymentStatus: 'unpaid' | 'paid' | 'partially_paid';
  if (totalPaid >= purchase.grandTotal - 0.01) {
    paymentStatus = 'paid';
  } else if (totalPaid > 0) {
    paymentStatus = 'partially_paid';
  } else {
    paymentStatus = 'unpaid';
  }

  await updateDocument('purchaseInvoices', purchaseInvoiceId, {
    paymentStatus,
    updatedAt: Timestamp.now(),
  });
}
