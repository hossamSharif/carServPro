import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  type DocumentData,
  type QueryConstraint,
  type DocumentReference,
  type CollectionReference,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { useAuthStore } from '@/stores/authStore';

function getTenantId(): string {
  const tenantId = useAuthStore.getState().tenantId || import.meta.env.VITE_TENANT_ID;
  if (!tenantId) throw new Error('No tenant ID available');
  return tenantId;
}

function tenantPath(collectionName: string): string {
  return `tenants/${getTenantId()}/${collectionName}`;
}

export function getDocRef(collectionName: string, docId: string): DocumentReference {
  return doc(db, tenantPath(collectionName), docId);
}

export function getCollectionRef(collectionName: string): CollectionReference {
  return collection(db, tenantPath(collectionName));
}

export async function addDocument<T extends DocumentData>(collectionName: string, data: T): Promise<string> {
  const ref = await addDoc(getCollectionRef(collectionName), data);
  return ref.id;
}

export async function getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
  const snap = await getDoc(getDocRef(collectionName, docId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as T;
}

export async function updateDocument(collectionName: string, docId: string, data: Partial<DocumentData>): Promise<void> {
  await updateDoc(getDocRef(collectionName, docId), data);
}

export async function deleteDocument(collectionName: string, docId: string): Promise<void> {
  await deleteDoc(getDocRef(collectionName, docId));
}

export async function queryDocuments<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const q = query(getCollectionRef(collectionName), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
}

export function onSnapshotListener<T>(
  collectionName: string,
  constraints: QueryConstraint[],
  callback: (data: T[]) => void
): Unsubscribe {
  const q = query(getCollectionRef(collectionName), ...constraints);
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
    callback(data);
  });
}

// Re-export query helpers for convenience
export { where, orderBy, limit, doc, collection, getDoc, getDocs, updateDoc, onSnapshot, query };
export { Timestamp, serverTimestamp } from 'firebase/firestore';
export { runTransaction, writeBatch } from 'firebase/firestore';
export { db };
