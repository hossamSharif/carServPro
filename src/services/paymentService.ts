import {
  addDocument,
  queryDocuments,
  updateDocument,
  getDocument,
  where,
  Timestamp,
} from './firestore';
import { useAuthStore } from '@/stores/authStore';
import type { Payment, PaymentMethod, Invoice } from '@/types';

const COLLECTION = 'payments';

export async function recordPayment(
  invoiceId: string,
  amount: number,
  method: PaymentMethod
): Promise<string> {
  const adminUid = useAuthStore.getState().user?.uid || '';

  const paymentId = await addDocument(COLLECTION, {
    invoiceId,
    amount,
    method,
    status: 'success',
    gatewayProvider: null,
    gatewayTransactionId: null,
    gatewayResponse: null,
    recordedBy: adminUid,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // Update invoice payment status
  const invoice = await getDocument<Invoice>('invoices', invoiceId);
  if (invoice) {
    // Sum all successful payments
    const payments = await getPaymentsByInvoice(invoiceId);
    const totalPaid = payments.reduce((sum, p) => sum + (p.status === 'success' ? p.amount : 0), 0) + amount;

    const paymentStatus = totalPaid >= invoice.grandTotal ? 'paid' : 'partially_paid';
    await updateDocument('invoices', invoiceId, {
      paymentStatus,
      updatedAt: Timestamp.now(),
    });
  }

  return paymentId;
}

export async function getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
  return queryDocuments<Payment>(COLLECTION, [where('invoiceId', '==', invoiceId)]);
}
