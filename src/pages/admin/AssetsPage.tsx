import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { getAssets, createAsset, updateAsset, deleteAsset } from '@/services/assetService';
import { assetSchema, type AssetInput } from '@/lib/validators';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import type { Asset } from '@/types';

export default function AssetsPage() {
  const { t } = useTranslation();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<AssetInput>({
    resolver: zodResolver(assetSchema) as never,
  });

  const loadAssets = async () => {
    try {
      const data = await getAssets();
      setAssets(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAssets(); }, []);

  const openCreateForm = () => {
    setEditingAsset(null);
    reset({
      name: '',
      category: '',
      purchaseDate: undefined,
      purchaseValue: undefined,
      currentValue: undefined,
      paymentMethod: 'cash',
    });
    setShowForm(true);
  };

  const openEditForm = (asset: Asset) => {
    setEditingAsset(asset);
    const purchaseDate = asset.purchaseDate && typeof asset.purchaseDate === 'object' && 'toDate' in asset.purchaseDate
      ? asset.purchaseDate.toDate()
      : new Date();
    const dateStr = purchaseDate.toISOString().split('T')[0];
    setValue('name', asset.name);
    setValue('category', asset.category);
    setValue('purchaseDate', new Date(dateStr));
    setValue('purchaseValue', asset.purchaseValue);
    setValue('currentValue', asset.currentValue);
    setValue('paymentMethod', asset.paymentMethod);
    setShowForm(true);
  };

  const onSubmit = async (data: AssetInput) => {
    setSaving(true);
    try {
      if (editingAsset) {
        await updateAsset(editingAsset.id, {
          name: data.name,
          category: data.category,
          purchaseDate: new Date(data.purchaseDate),
          purchaseValue: data.purchaseValue,
          currentValue: data.currentValue,
          paymentMethod: data.paymentMethod as 'cash' | 'bank_transfer',
        });
      } else {
        await createAsset({
          name: data.name,
          category: data.category,
          purchaseDate: new Date(data.purchaseDate),
          purchaseValue: data.purchaseValue,
          currentValue: data.currentValue,
          paymentMethod: data.paymentMethod as 'cash' | 'bank_transfer',
        });
      }
      reset();
      setShowForm(false);
      setEditingAsset(null);
      loadAssets();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAsset(deleteTarget.id);
      setDeleteTarget(null);
      loadAssets();
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (timestamp: { toDate?: () => Date }) => {
    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
      return timestamp.toDate!().toLocaleDateString();
    }
    return '-';
  };

  if (loading) return <div className="p-6">{t('common.loading')}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('accounting.assets')}</h1>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
        >
          <Plus className="h-4 w-4" />
          {t('accounting.addAsset')}
        </button>
      </div>

      {/* Add/Edit Asset Form */}
      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="border rounded-lg p-4 mb-6 space-y-3">
          <h2 className="text-lg font-semibold mb-2">
            {editingAsset ? t('accounting.editAsset') : t('accounting.addAsset')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t('accounting.assetName')}</label>
              <input
                {...register('name')}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
              />
              {errors.name && <p className="text-xs text-destructive mt-1">{t('validation.required')}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('accounting.assetCategory')}</label>
              <input
                {...register('category')}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
              />
              {errors.category && <p className="text-xs text-destructive mt-1">{t('validation.required')}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('accounting.purchaseDate')}</label>
              <input
                type="date"
                {...register('purchaseDate')}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                dir="ltr"
              />
              {errors.purchaseDate && <p className="text-xs text-destructive mt-1">{t('validation.required')}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('accounting.purchaseValue')} ({t('common.sar')})</label>
              <input
                type="number"
                step="0.01"
                {...register('purchaseValue', { valueAsNumber: true })}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                dir="ltr"
              />
              {errors.purchaseValue && <p className="text-xs text-destructive mt-1">{t('validation.positiveNumber')}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('accounting.currentValue')} ({t('common.sar')})</label>
              <input
                type="number"
                step="0.01"
                {...register('currentValue', { valueAsNumber: true })}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                dir="ltr"
              />
              {errors.currentValue && <p className="text-xs text-destructive mt-1">{t('validation.positiveNumber')}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('invoice.paymentMethod')}</label>
              <select
                {...register('paymentMethod')}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
              >
                <option value="cash">{t('invoice.cash')}</option>
                <option value="bank_transfer">{t('invoice.bankTransfer')}</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-50">
              {t('common.save')}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingAsset(null); reset(); }} className="px-4 py-2 border rounded-md text-sm hover:bg-accent">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      )}

      {/* Assets Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('accounting.assetName')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('accounting.assetCategory')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('accounting.purchaseDate')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('accounting.purchaseValue')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('accounting.currentValue')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('invoice.paymentMethod')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('accounting.assetActions')}</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id} className="border-t">
                <td className="px-4 py-3 text-sm font-medium">{asset.name}</td>
                <td className="px-4 py-3 text-sm">{asset.category}</td>
                <td className="px-4 py-3 text-sm" dir="ltr">{formatDate(asset.purchaseDate)}</td>
                <td className="px-4 py-3 text-sm font-mono" dir="ltr">{asset.purchaseValue.toFixed(2)} {t('common.sar')}</td>
                <td className="px-4 py-3 text-sm font-mono" dir="ltr">{asset.currentValue.toFixed(2)} {t('common.sar')}</td>
                <td className="px-4 py-3 text-sm">
                  {t(asset.paymentMethod === 'cash' ? 'invoice.cash' : 'invoice.bankTransfer')}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditForm(asset)}
                      className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      title={t('accounting.editAsset')}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(asset)}
                      className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title={t('accounting.deleteAsset')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {assets.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">{t('common.noData')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={t('accounting.deleteAsset')}
        description={t('accounting.deleteAssetConfirm')}
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
