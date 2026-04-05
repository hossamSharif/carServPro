import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();

export const setAdminRole = functions.https.onCall(async (data, context) => {
  // Validate caller is admin
  if (!context.auth?.token?.role || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can set roles');
  }

  const { targetUid, role, tenantId } = data;

  if (!targetUid || !role || !tenantId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  if (!['admin', 'customer', 'moderator'].includes(role)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid role');
  }

  // Ensure same tenant
  if (context.auth.token.tenantId !== tenantId) {
    throw new functions.https.HttpsError('permission-denied', 'Cross-tenant operation not allowed');
  }

  // Self-demotion guard
  if (targetUid === context.auth.uid && role !== 'admin') {
    throw new functions.https.HttpsError('failed-precondition', 'Cannot demote yourself');
  }

  // Set custom claims on target user
  await admin.auth().setCustomUserClaims(targetUid, { tenantId, role });

  // Update Firestore user doc
  await db.doc(`tenants/${tenantId}/users/${targetUid}`).update({ role });

  return { success: true };
});

export const inviteAdmin = functions.https.onCall(async (data, context) => {
  // Validate caller is admin
  if (!context.auth?.token?.role || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can invite admins');
  }

  const { email, fullName, phone, tenantId, role } = data;
  const targetRole = role || 'admin';

  if (!email || !fullName || !tenantId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  if (!['admin', 'moderator'].includes(targetRole)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid role for invitation');
  }

  // Ensure same tenant
  if (context.auth.token.tenantId !== tenantId) {
    throw new functions.https.HttpsError('permission-denied', 'Cross-tenant operation not allowed');
  }

  try {
    // Create Firebase Auth user with random temp password
    const tempPassword = require('crypto').randomBytes(16).toString('hex');
    const userRecord = await admin.auth().createUser({
      email,
      password: tempPassword,
      displayName: fullName,
    });

    const uid = userRecord.uid;

    // Set custom claims
    await admin.auth().setCustomUserClaims(uid, { tenantId, role: targetRole });

    // Create Firestore user doc
    await db.doc(`tenants/${tenantId}/users/${uid}`).set({
      uid,
      email,
      fullName,
      phone: phone || '',
      role: targetRole,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      active: true,
      reservationCount: 0,
    });

    // Generate password reset link
    const resetLink = await admin.auth().generatePasswordResetLink(email);

    console.log(`${targetRole} invited: ${email} (uid: ${uid}), reset link generated`);

    return { success: true, uid, resetLink };
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === 'auth/email-already-exists') {
      throw new functions.https.HttpsError('already-exists', 'A user with this email already exists');
    }
    console.error('Error inviting admin:', error);
    throw new functions.https.HttpsError('internal', err.message || 'Failed to invite admin');
  }
});

export const deactivateUser = functions.https.onCall(async (data, context) => {
  if (!context.auth?.token?.role || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can deactivate users');
  }

  const { targetUid } = data;
  const tenantId = context.auth.token.tenantId;

  if (!targetUid) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing targetUid');
  }

  // Disable Firebase Auth account
  await admin.auth().updateUser(targetUid, { disabled: true });

  // Update Firestore user doc
  await db.doc(`tenants/${tenantId}/users/${targetUid}`).update({
    active: false,
  });

  return { success: true };
});
