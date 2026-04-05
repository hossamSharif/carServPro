import type { ReservationStatus, AccountType } from '@/types';

export const STATUS_COLORS: Record<ReservationStatus, string> = {
  pending: 'bg-yellow-500/15 text-yellow-400',
  confirmed: 'bg-blue-500/15 text-blue-400',
  in_progress: 'bg-orange-500/15 text-orange-400',
  completed: 'bg-emerald-500/15 text-emerald-400',
  cancelled: 'bg-red-500/15 text-red-400',
};

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-500/15 text-yellow-400',
  issued: 'bg-emerald-500/15 text-emerald-400',
  cancelled: 'bg-red-500/15 text-red-400',
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  unpaid: 'bg-gray-500/15 text-gray-400',
  paid: 'bg-emerald-500/15 text-emerald-400',
  partially_paid: 'bg-yellow-500/15 text-yellow-400',
  refunded: 'bg-red-500/15 text-red-400',
};

export const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  asset: 'bg-blue-500/15 text-blue-400',
  liability: 'bg-red-500/15 text-red-400',
  equity: 'bg-purple-500/15 text-purple-400',
  revenue: 'bg-emerald-500/15 text-emerald-400',
  expense: 'bg-orange-500/15 text-orange-400',
};

export const JOURNAL_SOURCE_COLORS: Record<string, string> = {
  invoice: 'bg-blue-500/15 text-blue-400',
  invoice_cancellation: 'bg-red-500/15 text-red-400',
  expense: 'bg-orange-500/15 text-orange-400',
  asset: 'bg-purple-500/15 text-purple-400',
  manual: 'bg-gray-500/15 text-gray-400',
  purchase: 'bg-cyan-500/15 text-cyan-400',
  purchase_cancellation: 'bg-red-500/15 text-red-400',
  purchase_payment: 'bg-emerald-500/15 text-emerald-400',
};
