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
import {
  ensureSystemAccounts,
  getAccountByCode,
  getAccountBySupplierId,
} from './accountService';
import {
  createJournalEntry,
  createReversalEntry,
  getJournalEntriesBySource,
} from './journalService';
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

async function createPurchaseJournalEntry(purchase: PurchaseInvoice): Promise<string> {
  const expenseAccount = await getAccountByCode('5100');
  const inputVatAccount = await getAccountByCode('1300');

  let apAccount = purchase.supplierAccountCode
    ? await getAccountByCode(purchase.supplierAccountCode)
    : undefined;
  if (!apAccount) {
    apAccount = (await getAccountBySupplierId(purchase.supplierId)) || (await getAccountByCode('2100'));
  }

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

export async function createPurchaseInvoice(supplierData: {
  supplierId: string;
  supplierName: string;
  supplierVatNumber: string;
  supplierPhone: string;
  supplierAccountCode: string;
}): Promise<string> {
  await ensureSystemAccounts();
  const now = new Date();
  return addDocument(COLLECTION, {
    invoiceNumber: null,
    serialNumber: null,
    status: 'draft',
    supplierId: supplierData.supplierId,
    supplierName: supplierData.supplierName,
    supplierVatNumber: supplierData.supplierVatNumber,
    supplierPhone: supplierData.supplierPhone,
    externalInvoiceRef: '',
    lineItems: [{ description: '', descriptionEn: '', quantity: 1, unitPrice: 0, vatRate: 0.15, vatAmount: 0, lineTotal: 0 }],
    subtotal: 0,
    totalVat: 0,
    grandTotal: 0,
    invoiceDateGregorian: now.toISOString().split('T')[0],
    invoiceDateHijri: getHijriDateString(now),
    supplierAccountCode: supplierData.supplierAccountCode,
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
    'externalInvoiceRef' | 'lineItems' |
    'supplierAccountCode' | 'notes' | 'attachments'>>
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

  const counterRef = getDocRef('counters', 'purchaseInvoiceCounter');
  const purchaseRef = getDocRef(COLLECTION, purchaseId);

  const invoiceNumber = await runTransaction(db, async (transaction) => {
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

  // Auto-post supplier AP journal entry so the balance reflects the invoice.
  const updatedPurchase = await getDocument<PurchaseInvoice>(COLLECTION, purchaseId);
  if (updatedPurchase) {
    await createPurchaseJournalEntry(updatedPurchase);
  }

  return invoiceNumber;
}

export async function cancelPurchaseInvoice(purchaseId: string): Promise<void> {
  const purchase = await getDocument<PurchaseInvoice>(COLLECTION, purchaseId);
  if (!purchase || purchase.status !== 'issued') throw new Error('CANNOT_CANCEL_NON_ISSUED');

  await updateDocument(COLLECTION, purchaseId, {
    status: 'cancelled',
    cancelledAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  const entries = await getJournalEntriesBySource('purchase', purchaseId);
  if (entries.length > 0) {
    await createReversalEntry(entries[0].id, 'purchase_cancellation');
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
    supplierAccountCode: purchase.supplierAccountCode,
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
