import {
  addDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  onSnapshotListener,
  where,
  orderBy,
  Timestamp,
} from './firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';
import { useAuthStore } from '@/stores/authStore';
import type { Service, ServiceOffer } from '@/types';

const COLLECTION = 'services';

function getTenantId(): string {
  return useAuthStore.getState().tenantId || import.meta.env.VITE_TENANT_ID;
}

export async function createService(
  data: {
    nameAr: string;
    nameEn: string;
    descriptionAr: string;
    descriptionEn: string;
    categoryId: string;
    price: number;
    hidden: boolean;
    offer: ServiceOffer | null;
  },
  imageFile?: File
): Promise<string> {
  let imageUrl = '';
  let imagePath = '';

  if (imageFile) {
    const path = `tenants/${getTenantId()}/services/${Date.now()}_${imageFile.name}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, imageFile);
    imageUrl = await getDownloadURL(storageRef);
    imagePath = path;
  }

  return addDocument(COLLECTION, {
    ...data,
    imageUrl,
    imagePath,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function updateService(
  id: string,
  data: Partial<{
    nameAr: string;
    nameEn: string;
    descriptionAr: string;
    descriptionEn: string;
    categoryId: string;
    price: number;
    hidden: boolean;
    offer: ServiceOffer | null;
  }>,
  imageFile?: File,
  oldImagePath?: string
): Promise<void> {
  const updateData: Record<string, unknown> = { ...data, updatedAt: Timestamp.now() };

  if (imageFile) {
    // Delete old image if exists
    if (oldImagePath) {
      try {
        await deleteObject(ref(storage, oldImagePath));
      } catch {
        // Ignore if old image doesn't exist
      }
    }

    const path = `tenants/${getTenantId()}/services/${Date.now()}_${imageFile.name}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, imageFile);
    updateData.imageUrl = await getDownloadURL(storageRef);
    updateData.imagePath = path;
  }

  await updateDocument(COLLECTION, id, updateData);
}

export async function deleteService(id: string, imagePath?: string): Promise<void> {
  if (imagePath) {
    try {
      await deleteObject(ref(storage, imagePath));
    } catch {
      // Ignore
    }
  }
  await deleteDocument(COLLECTION, id);
}

export async function getServices(): Promise<Service[]> {
  return queryDocuments<Service>(COLLECTION, [orderBy('createdAt', 'desc')]);
}

export async function getServicesByCategory(categoryId: string): Promise<Service[]> {
  return queryDocuments<Service>(COLLECTION, [
    where('categoryId', '==', categoryId),
    orderBy('createdAt', 'desc'),
  ]);
}

export async function getVisibleServices(): Promise<Service[]> {
  return queryDocuments<Service>(COLLECTION, [
    where('hidden', '==', false),
    orderBy('createdAt', 'desc'),
  ]);
}

export async function toggleVisibility(id: string, currentHidden: boolean): Promise<void> {
  await updateDocument(COLLECTION, id, { hidden: !currentHidden, updatedAt: Timestamp.now() });
}

export function onServicesSnapshot(callback: (services: Service[]) => void) {
  return onSnapshotListener<Service>(COLLECTION, [orderBy('createdAt', 'desc')], callback);
}
