import {
  addDocument,
  getDocument,
  queryDocuments,
  updateDocument,
  deleteDocument,
  orderBy,
  Timestamp,
} from './firestore';
import { useAuthStore } from '@/stores/authStore';
import { createJournalEntry, deleteJournalEntry } from './journalService';
import { getAccountByCode } from './accountService';
import type { Asset, JournalLine } from '@/types';

const COLLECTION = 'assets';

function getAdminUid(): string {
  return useAuthStore.getState().user?.uid || '';
}

async function buildAssetJournalLines(
  purchaseValue: number,
  paymentMethod: 'cash' | 'bank_transfer'
): Promise<JournalLine[]> {
  const fixedAssetsAccount = await getAccountByCode('1200');
  if (!fixedAssetsAccount) throw new Error('FIXED_ASSETS_ACCOUNT_NOT_FOUND');

  const creditAccountCode = paymentMethod === 'cash' ? '1001' : '1002';
  const creditAccount = await getAccountByCode(creditAccountCode);
  if (!creditAccount) throw new Error('CREDIT_ACCOUNT_NOT_FOUND');

  return [
    {
      accountId: fixedAssetsAccount.id,
      accountCode: fixedAssetsAccount.code,
      accountNameAr: fixedAssetsAccount.nameAr,
      debit: purchaseValue,
      credit: 0,
    },
    {
      accountId: creditAccount.id,
      accountCode: creditAccount.code,
      accountNameAr: creditAccount.nameAr,
      debit: 0,
      credit: purchaseValue,
    },
  ];
}

export async function createAsset(data: {
  name: string;
  category: string;
  purchaseDate: Date;
  purchaseValue: number;
  currentValue: number;
  paymentMethod: 'cash' | 'bank_transfer';
}): Promise<string> {
  const lines = await buildAssetJournalLines(data.purchaseValue, data.paymentMethod);

  const journalEntryId = await createJournalEntry({
    date: Timestamp.fromDate(data.purchaseDate),
    description: `شراء أصل: ${data.name}`,
    lines,
    sourceType: 'asset',
    sourceId: null,
    createdBy: getAdminUid(),
  });

  const assetId = await addDocument(COLLECTION, {
    name: data.name,
    category: data.category,
    purchaseDate: Timestamp.fromDate(data.purchaseDate),
    purchaseValue: data.purchaseValue,
    currentValue: data.currentValue,
    paymentMethod: data.paymentMethod,
    journalEntryId,
    createdBy: getAdminUid(),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  return assetId;
}

export async function getAssets(): Promise<Asset[]> {
  return queryDocuments<Asset>(COLLECTION, [orderBy('createdAt', 'desc')]);
}

export async function getAssetById(id: string): Promise<Asset | null> {
  return getDocument<Asset>(COLLECTION, id);
}

export async function updateAsset(
  id: string,
  data: Partial<{
    name: string;
    category: string;
    purchaseDate: Date;
    purchaseValue: number;
    currentValue: number;
    paymentMethod: 'cash' | 'bank_transfer';
  }>
): Promise<void> {
  const existing = await getAssetById(id);
  if (!existing) throw new Error('ASSET_NOT_FOUND');

  const purchaseValueChanged = data.purchaseValue !== undefined && data.purchaseValue !== existing.purchaseValue;
  const paymentMethodChanged = data.paymentMethod !== undefined && data.paymentMethod !== existing.paymentMethod;

  // If purchase value or payment method changed, recreate the journal entry
  if (purchaseValueChanged || paymentMethodChanged) {
    // Delete old journal entry
    if (existing.journalEntryId) {
      await deleteJournalEntry(existing.journalEntryId);
    }

    const newPurchaseValue = data.purchaseValue ?? existing.purchaseValue;
    const newPaymentMethod = data.paymentMethod ?? existing.paymentMethod;
    const newName = data.name ?? existing.name;
    const newPurchaseDate = data.purchaseDate
      ? Timestamp.fromDate(data.purchaseDate)
      : existing.purchaseDate;

    const lines = await buildAssetJournalLines(newPurchaseValue, newPaymentMethod);

    const journalEntryId = await createJournalEntry({
      date: newPurchaseDate,
      description: `شراء أصل: ${newName}`,
      lines,
      sourceType: 'asset',
      sourceId: id,
      createdBy: getAdminUid(),
    });

    const updateData: Record<string, unknown> = {
      ...buildUpdateFields(data),
      journalEntryId,
      updatedAt: Timestamp.now(),
    };

    await updateDocument(COLLECTION, id, updateData);
  } else {
    // Only non-accounting fields changed (name, category, currentValue)
    // Update journal entry description if name changed
    if (data.name && data.name !== existing.name && existing.journalEntryId) {
      const { updateJournalEntry } = await import('./journalService');
      await updateJournalEntry(existing.journalEntryId, {
        description: `شراء أصل: ${data.name}`,
      });
    }

    await updateDocument(COLLECTION, id, {
      ...buildUpdateFields(data),
      updatedAt: Timestamp.now(),
    });
  }
}

function buildUpdateFields(data: Partial<{
  name: string;
  category: string;
  purchaseDate: Date;
  purchaseValue: number;
  currentValue: number;
  paymentMethod: 'cash' | 'bank_transfer';
}>): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  if (data.name !== undefined) fields.name = data.name;
  if (data.category !== undefined) fields.category = data.category;
  if (data.purchaseDate !== undefined) fields.purchaseDate = Timestamp.fromDate(data.purchaseDate);
  if (data.purchaseValue !== undefined) fields.purchaseValue = data.purchaseValue;
  if (data.currentValue !== undefined) fields.currentValue = data.currentValue;
  if (data.paymentMethod !== undefined) fields.paymentMethod = data.paymentMethod;
  return fields;
}

export async function deleteAsset(id: string): Promise<void> {
  const existing = await getAssetById(id);
  if (!existing) throw new Error('ASSET_NOT_FOUND');

  // Delete the linked journal entry
  if (existing.journalEntryId) {
    await deleteJournalEntry(existing.journalEntryId);
  }

  await deleteDocument(COLLECTION, id);
}
