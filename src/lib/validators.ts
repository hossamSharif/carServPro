import { z } from 'zod';

export const userRegistrationSchema = z.object({
  fullName: z.string().min(2, 'validation.nameMin').max(100, 'validation.nameMax'),
  email: z.string().email('validation.emailInvalid'),
  phone: z.string().regex(/^\+?[0-9]{9,15}$/, 'validation.phoneInvalid'),
  password: z.string().min(6, 'validation.passwordMin'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'validation.passwordMismatch',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('validation.emailInvalid'),
  password: z.string().min(1, 'validation.required'),
});

export const categorySchema = z.object({
  nameAr: z.string().min(2, 'validation.nameMin').max(100, 'validation.nameMax'),
  nameEn: z.string().min(2, 'validation.nameMin').max(100, 'validation.nameMax'),
  sortOrder: z.number().int().nonnegative(),
});

export const serviceOfferSchema = z.object({
  type: z.enum(['percentage', 'fixed']),
  value: z.number().positive('validation.positiveNumber'),
  expiresAt: z.date(),
}).refine((data) => {
  if (data.type === 'percentage') return data.value <= 100;
  return true;
}, { message: 'validation.maxPercentage', path: ['value'] });

export const serviceSchema = z.object({
  nameAr: z.string().min(2).max(200),
  nameEn: z.string().min(2).max(200),
  descriptionAr: z.string().max(1000).default(''),
  descriptionEn: z.string().max(1000).default(''),
  categoryId: z.string().min(1, 'validation.required'),
  price: z.number().positive('validation.positiveNumber'),
  hidden: z.boolean().default(false),
  offer: serviceOfferSchema.nullable().default(null),
});

export const reservationSchema = z.object({
  date: z.string().min(1, 'validation.required'),
  slotTime: z.string().regex(/^\d{2}:\d{2}$/, 'validation.invalidTime'),
  notes: z.string().max(500).default(''),
});

export const invoiceLineItemSchema = z.object({
  description: z.string().min(1),
  descriptionEn: z.string().default(''),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  vatRate: z.number().default(0.15),
});

export const expenseSchema = z.object({
  date: z.coerce.date(),
  accountId: z.string().min(1, 'validation.required'),
  amount: z.number().positive('validation.positiveNumber'),
  paymentMethod: z.enum(['cash', 'bank_transfer']),
  description: z.string().min(2).max(500),
});

export const assetSchema = z.object({
  name: z.string().min(2).max(200),
  category: z.string().min(1),
  purchaseDate: z.coerce.date(),
  purchaseValue: z.number().positive(),
  currentValue: z.number().nonnegative(),
  paymentMethod: z.enum(['cash', 'bank_transfer']),
});

export const businessProfileSchema = z.object({
  nameAr: z.string().min(2).max(200),
  nameEn: z.string().min(2).max(200),
  phone: z.string().regex(/^\+?[0-9]{9,15}$/),
  whatsappNumber: z.string().regex(/^\+?[0-9]{9,15}$/),
  vatNumber: z.string().regex(/^\d{15}$/, 'validation.vatNumberInvalid'),
  crNumber: z.string().min(1),
  address: z.string().min(1),
});

export const scheduleConfigSchema = z.object({
  slotDurationMinutes: z.number().int().positive(),
  maxBookingsPerSlot: z.number().int().positive(),
});

export const manualJournalEntrySchema = z.object({
  date: z.date(),
  description: z.string().min(2),
  lines: z.array(z.object({
    accountId: z.string().min(1),
    debit: z.number().nonnegative(),
    credit: z.number().nonnegative(),
  })).min(2),
}).refine((data) => {
  const totalDebits = data.lines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredits = data.lines.reduce((sum, l) => sum + l.credit, 0);
  return Math.abs(totalDebits - totalCredits) < 0.01;
}, { message: 'validation.journalUnbalanced' });

// Type inference helpers
export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type ServiceInput = z.output<typeof serviceSchema>;
export type ServiceFormInput = z.input<typeof serviceSchema>;
export type ReservationInput = z.infer<typeof reservationSchema>;
export type InvoiceLineItemInput = z.infer<typeof invoiceLineItemSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type AssetInput = z.infer<typeof assetSchema>;
export type BusinessProfileInput = z.infer<typeof businessProfileSchema>;
export type ScheduleConfigInput = z.infer<typeof scheduleConfigSchema>;
export type ManualJournalEntryInput = z.infer<typeof manualJournalEntrySchema>;
