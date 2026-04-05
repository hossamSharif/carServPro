import { getDocument, queryDocuments, where } from './firestore';
import type { ScheduleConfig, SlotBooking } from '@/types';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export async function getScheduleConfig(): Promise<ScheduleConfig | null> {
  return getDocument<ScheduleConfig>('settings', 'scheduleConfig');
}

export async function getAvailableSlots(date: string): Promise<Array<{ time: string; remaining: number }>> {
  const config = await getScheduleConfig();
  if (!config) return [];

  const dateObj = new Date(date);
  const dayName = DAYS[dateObj.getDay()];
  const daySchedule = config.workingHours[dayName];

  if (!daySchedule || !daySchedule.isOpen) return [];

  // Check blocked dates
  if (config.blockedDates.includes(date)) return [];

  // Generate time slots
  const slots: string[] = [];
  const [openH, openM] = daySchedule.openTime.split(':').map(Number);
  const [closeH, closeM] = daySchedule.closeTime.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  for (let m = openMinutes; m + config.slotDurationMinutes <= closeMinutes; m += config.slotDurationMinutes) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }

  // Get existing bookings for this date
  const bookings = await queryDocuments<SlotBooking>('slotBookings', [
    where('date', '==', date),
  ]);

  const bookingMap = new Map<string, SlotBooking>();
  for (const b of bookings) {
    bookingMap.set(b.slotTime, b);
  }

  return slots.map((time) => {
    const booking = bookingMap.get(time);
    const currentBookings = booking?.currentBookings || 0;
    const remaining = config.maxBookingsPerSlot - currentBookings;
    return { time, remaining: Math.max(0, remaining) };
  }).filter((s) => s.remaining > 0);
}

export async function isSlotAvailable(date: string, time: string): Promise<boolean> {
  const slots = await getAvailableSlots(date);
  return slots.some((s) => s.time === time && s.remaining > 0);
}
