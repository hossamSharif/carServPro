import {
  addDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  orderBy,
  Timestamp,
} from './firestore';
import type { Supplier } from '@/types/purchase';

const COLLECTION = 'suppliers';

export async function getSuppliers(): Promise<Supplier[]> {
  return queryDocuments<Supplier>(COLLECTION, [orderBy('nameAr', 'asc')]);
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
  return getDocument<Supplier>(COLLECTION, id);
}

export async function createSupplier(data: {
  nameAr: string;
  nameEn: string;
  phone: string;
  email: string;
  vatNumber: string;
  address: string;
}): Promise<string> {
  return addDocument(COLLECTION, {
    ...data,
    active: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function updateSupplier(
  id: string,
  data: Partial<Pick<Supplier, 'nameAr' | 'nameEn' | 'phone' | 'email' | 'vatNumber' | 'address' | 'active'>>
): Promise<void> {
  await updateDocument(COLLECTION, id, { ...data, updatedAt: Timestamp.now() });
}

export async function deleteSupplier(id: string): Promise<void> {
  await deleteDocument(COLLECTION, id);
}
