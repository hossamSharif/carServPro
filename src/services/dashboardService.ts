import {
  queryDocuments,
  where,
  orderBy,
  limit as fbLimit,
  Timestamp,
} from './firestore';
import type { Reservation, JournalEntry } from '@/types';

const RESERVATIONS = 'reservations';
const JOURNAL_ENTRIES = 'journalEntries';

export async function getTodayReservationCount(): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const reservations = await queryDocuments<Reservation>(RESERVATIONS, [
    where('date', '==', today),
  ]);
  return reservations.length;
}

export async function getPendingReservationCount(): Promise<number> {
  const reservations = await queryDocuments<Reservation>(RESERVATIONS, [
    where('status', '==', 'pending'),
  ]);
  return reservations.length;
}

export async function getMonthlyRevenue(year: number, month: number): Promise<number> {
  // month is 0-indexed (from Date.getMonth())
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const entries = await queryDocuments<JournalEntry>(JOURNAL_ENTRIES, [
    where('date', '>=', Timestamp.fromDate(startOfMonth)),
    where('date', '<=', Timestamp.fromDate(endOfMonth)),
  ]);

  // Sum revenue: credit side of account 4001
  let revenue = 0;
  for (const entry of entries) {
    for (const line of entry.lines) {
      if (line.accountCode === '4001') {
        revenue += line.credit;
      }
    }
  }

  return revenue;
}

export async function getMonthlyExpenses(year: number, month: number): Promise<number> {
  // month is 0-indexed (from Date.getMonth())
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const entries = await queryDocuments<JournalEntry>(JOURNAL_ENTRIES, [
    where('date', '>=', Timestamp.fromDate(startOfMonth)),
    where('date', '<=', Timestamp.fromDate(endOfMonth)),
  ]);

  // Sum expenses: debit side of 5xxx accounts
  let expenses = 0;
  for (const entry of entries) {
    for (const line of entry.lines) {
      if (line.accountCode.startsWith('5')) {
        expenses += line.debit;
      }
    }
  }

  return expenses;
}

export async function getRecentReservations(count: number): Promise<Reservation[]> {
  return queryDocuments<Reservation>(RESERVATIONS, [
    orderBy('createdAt', 'desc'),
    fbLimit(count),
  ]);
}

export async function getUpcomingAppointments(count: number): Promise<Reservation[]> {
  const today = new Date().toISOString().split('T')[0];
  return queryDocuments<Reservation>(RESERVATIONS, [
    where('status', '==', 'confirmed'),
    where('date', '>=', today),
    orderBy('date', 'asc'),
    fbLimit(count),
  ]);
}
