import {
  getDocument,
  updateDocument,
  queryDocuments,
  orderBy,
  Timestamp,
} from './firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { userRegistrationSchema } from '@/lib/validators';
import { getCustomerReservations } from './reservationService';
import type { User, Reservation } from '@/types';

const COLLECTION = 'users';

export async function getUserProfile(userId: string): Promise<User | null> {
  return getDocument<User>(COLLECTION, userId);
}

export async function updateProfile(
  userId: string,
  data: { fullName?: string; phone?: string }
): Promise<void> {
  // Validate only the fields being updated using the userRegistration schema
  if (data.fullName !== undefined) {
    const nameResult = userRegistrationSchema.shape.fullName.safeParse(data.fullName);
    if (!nameResult.success) {
      throw new Error(nameResult.error.issues[0].message);
    }
  }

  if (data.phone !== undefined) {
    const phoneResult = userRegistrationSchema.shape.phone.safeParse(data.phone);
    if (!phoneResult.success) {
      throw new Error(phoneResult.error.issues[0].message);
    }
  }

  await updateDocument(COLLECTION, userId, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function getAllUsers(): Promise<User[]> {
  return queryDocuments<User>(COLLECTION, [orderBy('createdAt', 'desc')]);
}

export async function getUserWithReservations(
  userId: string
): Promise<{ user: User | null; reservations: Reservation[] }> {
  const [user, reservations] = await Promise.all([
    getUserProfile(userId),
    getCustomerReservations(userId),
  ]);

  return { user, reservations };
}

export async function searchUsers(query: string): Promise<User[]> {
  // Firestore doesn't support full-text search, so fetch all users and filter client-side
  const allUsers = await getAllUsers();
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) return allUsers;

  return allUsers.filter(
    (user) =>
      user.fullName.toLowerCase().includes(lowerQuery) ||
      user.email.toLowerCase().includes(lowerQuery) ||
      user.phone.includes(lowerQuery)
  );
}

export async function deactivateUser(userId: string): Promise<void> {
  const functions = getFunctions();
  const deactivate = httpsCallable<{ targetUid: string }, void>(functions, 'deactivateUser');
  await deactivate({ targetUid: userId });
}
