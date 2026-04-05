import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

const TENANT_ID = import.meta.env.VITE_TENANT_ID;

export async function registerCustomer(email: string, password: string, fullName: string, phone: string) {
  // Write pending registration doc before creating auth user
  // so the Cloud Function trigger can read it
  const tempId = crypto.randomUUID();
  await setDoc(doc(db, 'pendingRegistrations', tempId), {
    email,
    fullName,
    phone,
    tenantId: TENANT_ID,
    createdAt: Timestamp.now(),
  });

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;

  // Move pending registration to use actual UID
  await setDoc(doc(db, 'pendingRegistrations', uid), {
    email,
    fullName,
    phone,
    tenantId: TENANT_ID,
    createdAt: Timestamp.now(),
  });

  return credential.user;
}

export async function loginWithEmail(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function logout() {
  await signOut(auth);
}

export function onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
  return firebaseOnAuthStateChanged(auth, callback);
}

export async function forceTokenRefresh() {
  const user = auth.currentUser;
  if (user) {
    await user.getIdToken(true);
  }
}

export async function getCustomClaims(): Promise<{ tenantId?: string; role?: string }> {
  const user = auth.currentUser;
  if (!user) return {};
  const tokenResult = await user.getIdTokenResult();
  return {
    tenantId: tokenResult.claims.tenantId as string | undefined,
    role: tokenResult.claims.role as string | undefined,
  };
}
