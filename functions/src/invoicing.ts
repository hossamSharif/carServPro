import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();

export const generateInvoiceNumber = functions.https.onCall(async (data, context) => {
  if (!context.auth?.token?.role || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can issue invoices');
  }

  const { invoiceId } = data;
  const tenantId = context.auth.token.tenantId as string;

  if (!invoiceId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing invoiceId');
  }

  const counterRef = db.doc(`tenants/${tenantId}/counters/invoiceCounter`);
  const invoiceRef = db.doc(`tenants/${tenantId}/invoices/${invoiceId}`);

  const result = await db.runTransaction(async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    const invoiceDoc = await transaction.get(invoiceRef);

    if (!invoiceDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Invoice not found');
    }

    if (invoiceDoc.data()?.status !== 'draft') {
      throw new functions.https.HttpsError('failed-precondition', 'Invoice is not a draft');
    }

    const currentYear = new Date().getFullYear();
    let lastNumber = 0;
    let lastYear = currentYear;
    let lastSerial = 0;

    if (counterDoc.exists) {
      const counterData = counterDoc.data()!;
      lastYear = counterData.lastYear;
      lastNumber = counterData.lastNumber;
      lastSerial = counterData.lastSerial || 0;

      // Reset invoice number on year change (serial never resets)
      if (lastYear < currentYear) {
        lastNumber = 0;
      }
    }

    const newNumber = lastNumber + 1;
    const newSerial = lastSerial + 1;
    const paddedNumber = String(newNumber).padStart(4, '0');
    const formattedNumber = `INV-${currentYear}-${paddedNumber}`;

    // Update counter
    transaction.set(counterRef, {
      lastNumber: newNumber,
      lastYear: currentYear,
      lastSerial: newSerial,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update invoice
    transaction.update(invoiceRef, {
      invoiceNumber: formattedNumber,
      serialNumber: newSerial,
      status: 'issued',
      issuedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { invoiceNumber: formattedNumber, serialNumber: newSerial };
  });

  return result;
});
