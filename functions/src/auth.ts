import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();

export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const uid = user.uid;

  try {
    const pendingDoc = await db.doc(`pendingRegistrations/${uid}`).get();

    if (!pendingDoc.exists) {
      console.warn(`No pending registration found for user ${uid}`);
      return;
    }

    const data = pendingDoc.data()!;
    const tenantId = data.tenantId as string;
    const role = 'customer';

    // Set custom claims
    await admin.auth().setCustomUserClaims(uid, { tenantId, role });

    // Create user profile in tenant
    await db.doc(`tenants/${tenantId}/users/${uid}`).set({
      uid,
      email: user.email || '',
      fullName: data.fullName || '',
      phone: data.phone || '',
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      active: true,
      reservationCount: 0,
    });

    // Delete pending registration
    await db.doc(`pendingRegistrations/${uid}`).delete();

    console.log(`User ${uid} provisioned for tenant ${tenantId} with role ${role}`);
  } catch (error) {
    console.error(`Error provisioning user ${uid}:`, error);
    throw error;
  }
});
