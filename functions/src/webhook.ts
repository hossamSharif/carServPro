import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();

export const paymentWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    // Verify Moyasar signature
    const signature = req.headers['x-moyasar-signature'] as string;
    const webhookSecret = functions.config().moyasar?.webhook_secret;

    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(req.rawBody || JSON.stringify(req.body))
        .digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }
    }

    const body = req.body;
    const paymentData = body.data;

    if (!paymentData?.metadata?.invoiceId || !paymentData?.metadata?.tenantId) {
      res.status(400).json({ error: 'Missing metadata' });
      return;
    }

    const { invoiceId, tenantId } = paymentData.metadata;
    const gatewayTransactionId = paymentData.id;

    // Idempotency check
    const existingPayments = await db
      .collection(`tenants/${tenantId}/payments`)
      .where('gatewayTransactionId', '==', gatewayTransactionId)
      .get();

    if (!existingPayments.empty) {
      res.status(200).json({ message: 'Already processed' });
      return;
    }

    // Validate invoice
    const invoiceRef = db.doc(`tenants/${tenantId}/invoices/${invoiceId}`);
    const invoiceDoc = await invoiceRef.get();

    if (!invoiceDoc.exists) {
      res.status(400).json({ error: 'Invoice not found' });
      return;
    }

    const invoice = invoiceDoc.data()!;

    // Moyasar amounts are in smallest unit (halalas)
    const paidAmount = paymentData.amount / 100;

    // Create payment document
    await db.collection(`tenants/${tenantId}/payments`).add({
      invoiceId,
      amount: paidAmount,
      method: 'online',
      status: paymentData.status === 'paid' ? 'success' : 'failed',
      gatewayProvider: 'moyasar',
      gatewayTransactionId,
      gatewayResponse: paymentData,
      recordedBy: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update invoice payment status
    if (paymentData.status === 'paid') {
      const newStatus = paidAmount >= invoice.grandTotal ? 'paid' : 'partially_paid';
      await invoiceRef.update({
        paymentStatus: newStatus,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    res.status(200).json({ message: 'Payment processed' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal error' });
  }
});
