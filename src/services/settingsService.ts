import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { useAuthStore } from '@/stores/authStore';
import { Timestamp } from 'firebase/firestore';
import type { BusinessProfile, ScheduleConfig, PaymentSettings } from '@/types';

function getTenantId(): string {
  return useAuthStore.getState().tenantId || import.meta.env.VITE_TENANT_ID;
}

function settingsDocRef(docName: string) {
  return doc(db, `tenants/${getTenantId()}/settings`, docName);
}

// ── Business Profile ─────────────────────────────────────────────────────────

export async function getBusinessProfile(): Promise<BusinessProfile | null> {
  const snap = await getDoc(settingsDocRef('businessProfile'));
  if (!snap.exists()) return null;
  return snap.data() as BusinessProfile;
}

export async function updateBusinessProfile(
  data: Partial<BusinessProfile> & { logoFile?: File }
): Promise<void> {
  const { logoFile, ...profileData } = data;
  const updateData: Record<string, unknown> = { ...profileData, updatedAt: Timestamp.now() };

  if (logoFile) {
    // Delete old logo if exists
    const currentProfile = await getBusinessProfile();
    if (currentProfile?.logoPath) {
      try {
        await deleteObject(ref(storage, currentProfile.logoPath));
      } catch {
        // Ignore if old logo doesn't exist
      }
    }

    const path = `tenants/${getTenantId()}/settings/logo_${Date.now()}_${logoFile.name}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, logoFile);
    updateData.logoUrl = await getDownloadURL(storageRef);
    updateData.logoPath = path;
  }

  await setDoc(settingsDocRef('businessProfile'), updateData, { merge: true });
}

// ── Schedule Config ──────────────────────────────────────────────────────────

export async function getScheduleConfig(): Promise<ScheduleConfig | null> {
  const snap = await getDoc(settingsDocRef('scheduleConfig'));
  if (!snap.exists()) return null;
  return snap.data() as ScheduleConfig;
}

export async function updateScheduleConfig(data: Partial<ScheduleConfig>): Promise<void> {
  await setDoc(
    settingsDocRef('scheduleConfig'),
    { ...data, updatedAt: Timestamp.now() },
    { merge: true }
  );
}

// ── Payment Settings ─────────────────────────────────────────────────────────

export async function getPaymentSettings(): Promise<PaymentSettings | null> {
  const snap = await getDoc(settingsDocRef('payment'));
  if (!snap.exists()) return null;
  return snap.data() as PaymentSettings;
}

export async function updatePaymentSettings(data: Partial<PaymentSettings>): Promise<void> {
  await setDoc(
    settingsDocRef('payment'),
    { ...data, updatedAt: Timestamp.now() },
    { merge: true }
  );
}
