import {
  addDocument,
  getCollectionRef,
  updateDocument,
  deleteDocument,
  queryDocuments,
  onSnapshotListener,
  where,
  orderBy,
  Timestamp,
  getDocs,
  query,
} from './firestore';
import type { Category } from '@/types';

const COLLECTION = 'categories';

export async function createCategory(data: { nameAr: string; nameEn: string; sortOrder: number }): Promise<string> {
  return addDocument(COLLECTION, {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function updateCategory(id: string, data: Partial<{ nameAr: string; nameEn: string; sortOrder: number }>): Promise<void> {
  await updateDocument(COLLECTION, id, { ...data, updatedAt: Timestamp.now() });
}

export async function deleteCategory(id: string): Promise<void> {
  // Check for associated services
  const services = await getDocs(
    query(getCollectionRef('services'), where('categoryId', '==', id))
  );
  if (!services.empty) {
    throw new Error('CATEGORY_HAS_SERVICES');
  }
  await deleteDocument(COLLECTION, id);
}

export async function getCategories(): Promise<Category[]> {
  return queryDocuments<Category>(COLLECTION, [orderBy('sortOrder', 'asc')]);
}

export function onCategoriesSnapshot(callback: (categories: Category[]) => void) {
  return onSnapshotListener<Category>(COLLECTION, [orderBy('sortOrder', 'asc')], callback);
}
