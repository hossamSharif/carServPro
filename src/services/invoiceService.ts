import {
  addDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  onSnapshotListener,
  orderBy,
  Timestamp,
  runTransaction,
  db,
  getDocRef,
} from './firestore';
// CF import kept for future use once deployed CF is updated with serialNumber support
// import { getFunctions, httpsCallable } from 'firebase/functions';
import { getReservationById } from './reservationService';
import { createInvoiceJournalEntry, createReversalEntry, getJournalEntriesBySource } from './journalService';
import { encodeTLV } from '@/lib/zatca-qr';
import { getHijriDateString } from '@/lib/hijri-date';
import type { Invoice, InvoiceLineItem, BusinessProfile } from '@/types';

const COLLECTION = 'invoices';

export async function createStandaloneInvoice(): Promise<string> {
  const profile = await getDocument<BusinessProfile>('settings', 'businessProfile');
  if (!profile) throw new Error('BUSINESS_PROFILE_NOT_FOUND');

  const now = new Date();
  return addDocument(COLLECTION, {
    invoiceNumber: null,
    serialNumber: null,
    status: 'draft',
    reservationId: null,
    sellerNameAr: profile.nameAr,
    sellerVatNumber: profile.vatNumber,
    sellerCrNumber: profile.crNumber,
    sellerAddress: profile.address,
    buyerName: '',
    buyerPhone: '',
    buyerEmail: '',
    carSerialNo: '',
    lineItems: [{ description: '', descriptionEn: '', quantity: 1, unitPrice: 0, vatRate: 0.15, vatAmount: 0, lineTotal: 0 }],
    subtotal: 0,
    totalVat: 0,
    grandTotal: 0,
    invoiceDateGregorian: now.toISOString().split('T')[0],
    invoiceDateHijri: getHijriDateString(now),
    paymentMethod: 'cash',
    paymentStatus: 'unpaid',
    invoiceType: 'simplified',
    billingReferenceId: null,
    qrCodeData: '',
    notes: '',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    issuedAt: null,
    cancelledAt: null,
    amendedFromInvoiceId: null,
  } as Omit<Invoice, 'id'>);
}

export async function createFromReservation(reservationId: string): Promise<string> {
  const reservation = await getReservationById(reservationId);
  if (!reservation) throw new Error('RESERVATION_NOT_FOUND');

  // Get business profile
  const profile = await getDocument<BusinessProfile>('settings', 'businessProfile');
  if (!profile) throw new Error('BUSINESS_PROFILE_NOT_FOUND');

  const now = new Date();
  const lineItems: InvoiceLineItem[] = reservation.services.map((s) => {
    const netPrice = s.price - s.offerDiscount;
    const subtotal = netPrice * s.quantity;
    const vatAmount = subtotal * 0.15;
    return {
      description: s.nameAr,
      descriptionEn: s.nameEn,
      quantity: s.quantity,
      unitPrice: netPrice,
      vatRate: 0.15,
      vatAmount,
      lineTotal: subtotal + vatAmount,
    };
  });

  const subtotal = lineItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const totalVat = lineItems.reduce((sum, i) => sum + i.vatAmount, 0);
  const grandTotal = subtotal + totalVat;

  return addDocument(COLLECTION, {
    invoiceNumber: null,
    serialNumber: null,
    status: 'draft',
    reservationId,
    sellerNameAr: profile.nameAr,
    sellerVatNumber: profile.vatNumber,
    sellerCrNumber: profile.crNumber,
    sellerAddress: profile.address,
    buyerName: reservation.customerName,
    buyerPhone: reservation.customerPhone,
    buyerEmail: reservation.customerEmail,
    carSerialNo: '',
    lineItems,
    subtotal,
    totalVat,
    grandTotal,
    invoiceDateGregorian: now.toISOString().split('T')[0],
    invoiceDateHijri: getHijriDateString(now),
    paymentMethod: 'cash',
    paymentStatus: 'unpaid',
    invoiceType: 'simplified',
    billingReferenceId: null,
    qrCodeData: '',
    notes: '',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    issuedAt: null,
    cancelledAt: null,
    amendedFromInvoiceId: null,
  } as Omit<Invoice, 'id'>);
}

export async function updateDraftInvoice(
  invoiceId: string,
  updates: Partial<Pick<Invoice, 'lineItems' | 'buyerName' | 'buyerPhone' | 'buyerEmail' | 'carSerialNo' | 'notes' | 'paymentMethod' | 'paymentStatus'>>
): Promise<void> {
  const invoice = await getDocument<Invoice>(COLLECTION, invoiceId);
  if (!invoice || invoice.status !== 'draft') throw new Error('CANNOT_EDIT_NON_DRAFT');

  // Recalculate totals if line items changed
  const data: Record<string, unknown> = { ...updates, updatedAt: Timestamp.now() };
  if (updates.lineItems) {
    const subtotal = updates.lineItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const totalVat = updates.lineItems.reduce((sum, i) => sum + i.vatAmount, 0);
    data.subtotal = subtotal;
    data.totalVat = totalVat;
    data.grandTotal = subtotal + totalVat;
  }

  await updateDocument(COLLECTION, invoiceId, data);
}

export async function issueInvoice(invoiceId: string): Promise<string> {
  const invoice = await getDocument<Invoice>(COLLECTION, invoiceId);
  if (!invoice || invoice.status !== 'draft') throw new Error('CANNOT_ISSUE_NON_DRAFT');

  // Generate ZATCA QR code (must happen before status changes to 'issued'
  // because security rules block updates to issued invoices)
  const now = new Date();
  const profile = await getDocument<BusinessProfile>('settings', 'businessProfile');
  const qrCodeData = encodeTLV(
    profile?.nameAr || '',
    profile?.vatNumber || '',
    now.toISOString(),
    invoice.grandTotal.toFixed(2),
    invoice.totalVat.toFixed(2)
  );

  let invoiceNumber = '';

  // Issue invoice + assign serial via client-side transaction
  // (operates on draft → issued, which security rules allow)
  const counterRef = getDocRef('counters', 'invoiceCounter');
  const invoiceRef = getDocRef(COLLECTION, invoiceId);

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
    const formattedNumber = `INV-${currentYear}-${paddedNumber}`;

    transaction.set(counterRef, {
      lastNumber: newNumber,
      lastYear: currentYear,
      lastSerial: newSerial,
      updatedAt: Timestamp.now(),
    });

    transaction.update(invoiceRef, {
      invoiceNumber: formattedNumber,
      serialNumber: newSerial,
      status: 'issued',
      issuedAt: Timestamp.now(),
      qrCodeData,
      updatedAt: Timestamp.now(),
    });

    return formattedNumber;
  });

  // Create journal entry
  const updatedInvoice = await getDocument<Invoice>(COLLECTION, invoiceId);
  if (updatedInvoice) {
    await createInvoiceJournalEntry(updatedInvoice);
  }

  // Update reservation with invoice reference
  if (invoice.reservationId) {
    await updateDocument('reservations', invoice.reservationId, {
      invoiceId,
      updatedAt: Timestamp.now(),
    });
  }

  return invoiceNumber;
}

export async function cancelInvoice(invoiceId: string): Promise<void> {
  const invoice = await getDocument<Invoice>(COLLECTION, invoiceId);
  if (!invoice || invoice.status !== 'issued') throw new Error('CANNOT_CANCEL_NON_ISSUED');

  await updateDocument(COLLECTION, invoiceId, {
    status: 'cancelled',
    paymentStatus: 'refunded',
    invoiceType: 'creditNote',
    billingReferenceId: invoice.invoiceNumber,
    cancelledAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // Create reverse journal entry
  const journalEntries = await getJournalEntriesBySource('invoice', invoiceId);
  if (journalEntries.length > 0) {
    await createReversalEntry(journalEntries[0].id);
  }
}

export async function deleteDraftInvoice(invoiceId: string): Promise<void> {
  const invoice = await getDocument<Invoice>(COLLECTION, invoiceId);
  if (!invoice || invoice.status !== 'draft') throw new Error('CANNOT_DELETE_NON_DRAFT');
  await deleteDocument(COLLECTION, invoiceId);
}

export async function getInvoices(): Promise<Invoice[]> {
  return queryDocuments<Invoice>(COLLECTION, [orderBy('createdAt', 'desc')]);
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  return getDocument<Invoice>(COLLECTION, id);
}

export function onInvoicesSnapshot(callback: (invoices: Invoice[]) => void) {
  return onSnapshotListener<Invoice>(COLLECTION, [orderBy('createdAt', 'desc')], callback);
}

export async function cloneIssuedInvoiceToDraft(invoiceId: string): Promise<string> {
  const invoice = await getDocument<Invoice>(COLLECTION, invoiceId);
  if (!invoice || invoice.status !== 'issued') throw new Error('CANNOT_EDIT_NON_ISSUED');

  // Cancel the original invoice (sets status='cancelled' + creates reversal journal entry)
  await cancelInvoice(invoiceId);

  // Create a new draft with cloned data
  const now = new Date();
  return addDocument(COLLECTION, {
    invoiceNumber: null,
    serialNumber: null,
    status: 'draft',
    reservationId: invoice.reservationId,
    sellerNameAr: invoice.sellerNameAr,
    sellerVatNumber: invoice.sellerVatNumber,
    sellerCrNumber: invoice.sellerCrNumber,
    sellerAddress: invoice.sellerAddress,
    buyerName: invoice.buyerName,
    buyerPhone: invoice.buyerPhone,
    buyerEmail: invoice.buyerEmail,
    carSerialNo: invoice.carSerialNo,
    lineItems: invoice.lineItems,
    subtotal: invoice.subtotal,
    totalVat: invoice.totalVat,
    grandTotal: invoice.grandTotal,
    invoiceDateGregorian: now.toISOString().split('T')[0],
    invoiceDateHijri: getHijriDateString(now),
    paymentMethod: invoice.paymentMethod,
    paymentStatus: 'unpaid',
    invoiceType: 'simplified',
    billingReferenceId: null,
    qrCodeData: '',
    notes: invoice.notes,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    issuedAt: null,
    cancelledAt: null,
    amendedFromInvoiceId: invoiceId,
  } as Omit<Invoice, 'id'>);
}
