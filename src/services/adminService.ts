import { queryDocuments, where, orderBy } from './firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { User } from '@/types';

const COLLECTION = 'users';

export async function getAdminUsers(): Promise<User[]> {
  return queryDocuments<User>(COLLECTION, [
    where('role', '==', 'admin'),
    orderBy('createdAt', 'desc'),
  ]);
}

export async function getModeratorUsers(): Promise<User[]> {
  return queryDocuments<User>(COLLECTION, [
    where('role', '==', 'moderator'),
    orderBy('createdAt', 'desc'),
  ]);
}

export async function promoteToAdmin(targetUid: string, tenantId: string): Promise<void> {
  const functions = getFunctions();
  const setRole = httpsCallable<{ targetUid: string; role: string; tenantId: string }>(functions, 'setAdminRole');
  await setRole({ targetUid, role: 'admin', tenantId });
}

export async function promoteToModerator(targetUid: string, tenantId: string): Promise<void> {
  const functions = getFunctions();
  const setRole = httpsCallable<{ targetUid: string; role: string; tenantId: string }>(functions, 'setAdminRole');
  await setRole({ targetUid, role: 'moderator', tenantId });
}

export async function demoteToCustomer(targetUid: string, tenantId: string): Promise<void> {
  const functions = getFunctions();
  const setRole = httpsCallable<{ targetUid: string; role: string; tenantId: string }>(functions, 'setAdminRole');
  await setRole({ targetUid, role: 'customer', tenantId });
}

export async function inviteAdmin(data: {
  email: string;
  fullName: string;
  phone: string;
  tenantId: string;
  role?: 'admin' | 'moderator';
}): Promise<{ uid: string; resetLink: string }> {
  const functions = getFunctions();
  const invite = httpsCallable<typeof data, { success: boolean; uid: string; resetLink: string }>(functions, 'inviteAdmin');
  const result = await invite(data);
  return { uid: result.data.uid, resetLink: result.data.resetLink };
}
