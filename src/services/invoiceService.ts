import {
  addDocument,
  getDocument,
  updateDocument,
  queryDocuments,
  onSnapshotListener,
  orderBy,
  Timestamp,
} from './firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getReservationById } from './reservationService';
import { createInvoiceJournalEntry, createReversalEntry, getJournalEntriesBySource } from './journalService';
import { encodeTLV } from '@/lib/zatca-qr';
import { getHijriDateString } from '@/lib/hijri-date';
import type { Invoice, InvoiceLineItem, BusinessProfile } from '@/types';

const COLLECTION = 'invoices';

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
    status: 'draft',
    reservationId,
    sellerNameAr: profile.nameAr,
    sellerVatNumber: profile.vatNumber,
    sellerCrNumber: profile.crNumber,
    sellerAddress: profile.address,
    buyerName: reservation.customerName,
    buyerPhone: reservation.customerPhone,
    buyerEmail: reservation.customerEmail,
    lineItems,
    subtotal,
    totalVat,
    grandTotal,
    invoiceDateGregorian: now.toISOString().split('T')[0],
    invoiceDateHijri: getHijriDateString(now),
    paymentMethod: 'cash',
    paymentStatus: 'unpaid',
    invoiceType: 'simplified',
    qrCodeData: '',
    notes: '',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    issuedAt: null,
    cancelledAt: null,
  } as Omit<Invoice, 'id'>);
}

export async function updateDraftInvoice(
  invoiceId: string,
  updates: Partial<Pick<Invoice, 'lineItems' | 'buyerName' | 'buyerPhone' | 'buyerEmail' | 'notes' | 'paymentMethod'>>
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

  let invoiceNumber: string;

  try {
    // Save QR code while still in draft (before CF changes status)
    await updateDocument(COLLECTION, invoiceId, {
      qrCodeData,
      updatedAt: Timestamp.now(),
    });

    // Call Cloud Function for sequential numbering (also sets status to 'issued')
    const functions = getFunctions();
    const generateNumber = httpsCallable<{ invoiceId: string }, { invoiceNumber: string }>(functions, 'generateInvoiceNumber');
    const result = await generateNumber({ invoiceId });
    invoiceNumber = result.data.invoiceNumber;
  } catch {
    // Fallback: generate invoice number client-side when Cloud Functions unavailable
    const year = new Date().getFullYear();
    const ts = Date.now().toString().slice(-4);
    invoiceNumber = `INV-${year}-${ts}`;

    await updateDocument(COLLECTION, invoiceId, {
      invoiceNumber,
      status: 'issued',
      issuedAt: Timestamp.now(),
      qrCodeData,
      updatedAt: Timestamp.now(),
    });
  }

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
    cancelledAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // Create reverse journal entry
  const journalEntries = await getJournalEntriesBySource('invoice', invoiceId);
  if (journalEntries.length > 0) {
    await createReversalEntry(journalEntries[0].id);
  }
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
