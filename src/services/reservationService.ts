import {
  getDocument,
  queryDocuments,
  where,
  orderBy,
  Timestamp,
  runTransaction,
  db,
} from './firestore';
import { doc } from 'firebase/firestore';
import { useAuthStore } from '@/stores/authStore';
import type { Reservation, SlotBooking } from '@/types';
import type { ReservationService } from '@/types';

function getTenantId(): string {
  return useAuthStore.getState().tenantId || import.meta.env.VITE_TENANT_ID;
}

export async function createReservation(data: {
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  services: ReservationService[];
  date: string;
  slotTime: string;
  notes: string;
}): Promise<string> {
  const tenantId = getTenantId();
  const slotDocId = `${data.date}_${data.slotTime.replace(':', '')}`;
  const slotRef = doc(db, `tenants/${tenantId}/slotBookings`, slotDocId);

  const reservationId = await runTransaction(db, async (transaction) => {
    const slotDoc = await transaction.get(slotRef);

    let currentBookings = 0;
    let maxCapacity = 3; // Default

    if (slotDoc.exists()) {
      const slotData = slotDoc.data() as SlotBooking;
      currentBookings = slotData.currentBookings;
      maxCapacity = slotData.maxCapacity;

      if (currentBookings >= maxCapacity) {
        throw new Error('SLOT_FULL');
      }
    }

    // Generate reference number
    const referenceNumber = `RES-${Date.now()}`;

    // Create reservation
    const reservationRef = doc(db, `tenants/${tenantId}/reservations`, crypto.randomUUID());
    const reservationData = {
      ...data,
      referenceNumber,
      status: 'pending' as const,
      invoiceId: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    transaction.set(reservationRef, reservationData);

    // Update or create slot booking
    if (slotDoc.exists()) {
      transaction.update(slotRef, {
        currentBookings: currentBookings + 1,
        reservationIds: [...((slotDoc.data() as SlotBooking)?.reservationIds || []), reservationRef.id],
      });
    } else {
      transaction.set(slotRef, {
        date: data.date,
        slotTime: data.slotTime,
        currentBookings: 1,
        maxCapacity,
        reservationIds: [reservationRef.id],
      });
    }

    return reservationRef.id;
  });

  return reservationId;
}

export async function getCustomerReservations(customerId: string): Promise<Reservation[]> {
  return queryDocuments<Reservation>('reservations', [
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc'),
  ]);
}

export async function getReservationById(id: string): Promise<Reservation | null> {
  return getDocument<Reservation>('reservations', id);
}

export async function getAllReservations(): Promise<Reservation[]> {
  return queryDocuments<Reservation>('reservations', [orderBy('createdAt', 'desc')]);
}

export async function updateReservationStatus(id: string, status: Reservation['status']): Promise<void> {
  const { updateDocument } = await import('./firestore');
  await updateDocument('reservations', id, { status, updatedAt: Timestamp.now() });
}

export async function deleteReservation(id: string): Promise<void> {
  const { deleteDocument } = await import('./firestore');
  await deleteDocument('reservations', id);
}
