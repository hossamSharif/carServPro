import {
  addDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  orderBy,
  Timestamp,
  runTransaction,
  db,
  getDocRef,
} from './firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';
import { useAuthStore } from '@/stores/authStore';
import { getAccountByCode, ensureSystemAccounts } from './accountService';
import { createJournalEntry, createReversalEntry, getJournalEntriesBySource } from './journalService';
import { getPurchasePaymentsByInvoice } from './purchasePaymentService';
import { getHijriDateString } from '@/lib/hijri-date';
import type { PurchaseInvoice, PurchaseAttachment } from '@/types/purchase';
import type { JournalLine } from '@/types';

const COLLECTION = 'purchaseInvoices';

function getTenantId(): string {
  return useAuthStore.getState().tenantId || import.meta.env.VITE_TENANT_ID;
}

function getAdminUid(): string {
  return useAuthStore.getState().user?.uid || '';
}

export async function createPurchaseInvoice(supplierData: {
  supplierId: string;
  supplierName: string;
  supplierVatNumber: string;
  supplierPhone: string;
}): Promise<string> {
  await ensureSystemAccounts();
  const now = new Date();
  return addDocument(COLLECTION, {
    invoiceNumber: null,
    serialNumber: null,
    status: 'draft',
    ...supplierData,
    externalInvoiceRef: '',
    lineItems: [{ description: '', descriptionEn: '', quantity: 1, unitPrice: 0, vatRate: 0.15, vatAmount: 0, lineTotal: 0 }],
    subtotal: 0,
    totalVat: 0,
    grandTotal: 0,
    invoiceDateGregorian: now.toISOString().split('T')[0],
    invoiceDateHijri: getHijriDateString(now),
    paymentMethod: 'cash',
    paymentStatus: 'unpaid',
    expenseAccountCode: '5001',
    attachments: [],
    notes: '',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    issuedAt: null,
    cancelledAt: null,
    amendedFromPurchaseId: null,
  } as Omit<PurchaseInvoice, 'id'>);
}

export async function updateDraftPurchase(
  id: string,
  updates: Partial<Pick<PurchaseInvoice,
    'supplierId' | 'supplierName' | 'supplierVatNumber' | 'supplierPhone' |
    'externalInvoiceRef' | 'lineItems' | 'paymentMethod' | 'paymentStatus' |
    'expenseAccountCode' | 'notes' | 'attachments'>>
): Promise<void> {
  const purchase = await getDocument<PurchaseInvoice>(COLLECTION, id);
  if (!purchase || purchase.status !== 'draft') throw new Error('CANNOT_EDIT_NON_DRAFT');

  const data: Record<string, unknown> = { ...updates, updatedAt: Timestamp.now() };
  if (updates.lineItems) {
    const subtotal = updates.lineItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const totalVat = updates.lineItems.reduce((sum, i) => sum + i.vatAmount, 0);
    data.subtotal = subtotal;
    data.totalVat = totalVat;
    data.grandTotal = subtotal + totalVat;
  }

  await updateDocument(COLLECTION, id, data);
}

export async function issuePurchaseInvoice(purchaseId: string): Promise<string> {
  const purchase = await getDocument<PurchaseInvoice>(COLLECTION, purchaseId);
  if (!purchase || purchase.status !== 'draft') throw new Error('CANNOT_ISSUE_NON_DRAFT');

  let invoiceNumber = '';

  const counterRef = getDocRef('counters', 'purchaseInvoiceCounter');
  const purchaseRef = getDocRef(COLLECTION, purchaseId);

  invoiceNumber = await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);
    const currentYear = new Date().getFullYear();
    let lastNumber = 0;
    let lastYear = currentYear;
    let lastSerial = 0;

    if (counterSnap.exists()) {
      const data = counterSnap.data();
      lastYear = data.lastYear;
      lastNumber = data.lastNumber;
      lastSerial = data.lastSerial || 0;
      if (lastYear < currentYear) lastNumber = 0;
    }

    const newNumber = lastNumber + 1;
    const newSerial = lastSerial + 1;
    const paddedNumber = String(newNumber).padStart(4, '0');
    const formattedNumber = `PINV-${currentYear}-${paddedNumber}`;

    transaction.set(counterRef, {
      lastNumber: newNumber,
      lastYear: currentYear,
      lastSerial: newSerial,
      updatedAt: Timestamp.now(),
    });

    transaction.update(purchaseRef, {
      invoiceNumber: formattedNumber,
      serialNumber: newSerial,
      status: 'issued',
      issuedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return formattedNumber;
  });

  // Create journal entry
  const updatedPurchase = await getDocument<PurchaseInvoice>(COLLECTION, purchaseId);
  if (updatedPurchase) {
    await createPurchaseJournalEntry(updatedPurchase);
  }

  return invoiceNumber;
}

async function createPurchaseJournalEntry(purchase: PurchaseInvoice): Promise<string> {
  const expenseAccount = await getAccountByCode(purchase.expenseAccountCode);
  const inputVatAccount = await getAccountByCode('1300');
  const apAccount = await getAccountByCode('2100');

  if (!expenseAccount || !inputVatAccount || !apAccount) throw new Error('MISSING_SYSTEM_ACCOUNTS');

  const lines: JournalLine[] = [
    {
      accountId: expenseAccount.id,
      accountCode: expenseAccount.code,
      accountNameAr: expenseAccount.nameAr,
      debit: purchase.subtotal,
      credit: 0,
    },
    {
      accountId: inputVatAccount.id,
      accountCode: inputVatAccount.code,
      accountNameAr: inputVatAccount.nameAr,
      debit: purchase.totalVat,
      credit: 0,
    },
    {
      accountId: apAccount.id,
      accountCode: apAccount.code,
      accountNameAr: apAccount.nameAr,
      debit: 0,
      credit: purchase.grandTotal,
    },
  ];

  return createJournalEntry({
    date: Timestamp.now(),
    description: `فاتورة مشتريات ${purchase.invoiceNumber || purchase.id}`,
    lines,
    sourceType: 'purchase',
    sourceId: purchase.id,
    createdBy: getAdminUid(),
  });
}

export async function cancelPurchaseInvoice(purchaseId: string): Promise<void> {
  const purchase = await getDocument<PurchaseInvoice>(COLLECTION, purchaseId);
  if (!purchase || purchase.status !== 'issued') throw new Error('CANNOT_CANCEL_NON_ISSUED');

  await updateDocument(COLLECTION, purchaseId, {
    status: 'cancelled',
    paymentStatus: 'refunded',
    cancelledAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // Reverse the purchase journal entry
  const journalEntries = await getJournalEntriesBySource('purchase', purchaseId);
  if (journalEntries.length > 0) {
    await createReversalEntry(journalEntries[0].id, 'purchase_cancellation');
  }

  // Reverse all payment journal entries
  const payments = await getPurchasePaymentsByInvoice(purchaseId);
  for (const payment of payments) {
    if (payment.journalEntryId) {
      await createReversalEntry(payment.journalEntryId, 'purchase_cancellation');
    }
  }
}

export async function deleteDraftPurchase(purchaseId: string): Promise<void> {
  const purchase = await getDocument<PurchaseInvoice>(COLLECTION, purchaseId);
  if (!purchase || purchase.status !== 'draft') throw new Error('CANNOT_DELETE_NON_DRAFT');

  // Delete attachments from storage
  for (const att of purchase.attachments) {
    try {
      await deleteObject(ref(storage, att.path));
    } catch { /* ignore */ }
  }

  await deleteDocument(COLLECTION, purchaseId);
}

export async function cloneIssuedPurchaseToDraft(purchaseId: string): Promise<string> {
  const purchase = await getDocument<PurchaseInvoice>(COLLECTION, purchaseId);
  if (!purchase || purchase.status !== 'issued') throw new Error('CANNOT_EDIT_NON_ISSUED');

  await cancelPurchaseInvoice(purchaseId);

  const now = new Date();
  return addDocument(COLLECTION, {
    invoiceNumber: null,
    serialNumber: null,
    status: 'draft',
    supplierId: purchase.supplierId,
    supplierName: purchase.supplierName,
    supplierVatNumber: purchase.supplierVatNumber,
    supplierPhone: purchase.supplierPhone,
    externalInvoiceRef: purchase.externalInvoiceRef,
    lineItems: purchase.lineItems,
    subtotal: purchase.subtotal,
    totalVat: purchase.totalVat,
    grandTotal: purchase.grandTotal,
    invoiceDateGregorian: now.toISOString().split('T')[0],
    invoiceDateHijri: getHijriDateString(now),
    paymentMethod: purchase.paymentMethod,
    paymentStatus: 'unpaid',
    expenseAccountCode: purchase.expenseAccountCode,
    attachments: purchase.attachments,
    notes: purchase.notes,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    issuedAt: null,
    cancelledAt: null,
    amendedFromPurchaseId: purchaseId,
  } as Omit<PurchaseInvoice, 'id'>);
}

export async function getPurchaseInvoices(): Promise<PurchaseInvoice[]> {
  return queryDocuments<PurchaseInvoice>(COLLECTION, [orderBy('createdAt', 'desc')]);
}

export async function getPurchaseById(id: string): Promise<PurchaseInvoice | null> {
  return getDocument<PurchaseInvoice>(COLLECTION, id);
}

export async function uploadPurchaseAttachment(purchaseId: string, file: File): Promise<PurchaseAttachment> {
  const path = `tenants/${getTenantId()}/purchases/${purchaseId}/${crypto.randomUUID()}_${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { name: file.name, url, path };
}

export async function removePurchaseAttachment(attachment: PurchaseAttachment): Promise<void> {
  try {
    await deleteObject(ref(storage, attachment.path));
  } catch { /* ignore */ }
}
