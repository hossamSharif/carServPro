import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { getServices, createService, updateService, deleteService, toggleVisibility } from '@/services/serviceService';
import { getCategories } from '@/services/categoryService';
import ServiceForm from '@/components/admin/ServiceForm';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import type { Service, Category, ServiceOffer } from '@/types';
import type { ServiceInput } from '@/lib/validators';
import { Timestamp } from 'firebase/firestore';

export default function ServicesPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | undefined>();
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [filterCategory, setFilterCategory] = useState('');

  const loadData = async () => {
    try {
      const [svcData, catData] = await Promise.all([getServices(), getCategories()]);
      setServices(svcData);
      setCategories(catData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (data: ServiceInput, imageFile?: File) => {
    const offerData: ServiceOffer | null = data.offer
      ? { type: data.offer.type, value: data.offer.value, expiresAt: Timestamp.fromDate(data.offer.expiresAt) }
      : null;

    if (editingService) {
      await updateService(editingService.id, { ...data, offer: offerData }, imageFile, editingService.imagePath);
    } else {
      await createService({ ...data, offer: offerData }, imageFile);
    }
    setShowForm(false);
    setEditingService(undefined);
    loadData();
  };

  const handleDelete = async () => {
    if (!deletingService) return;
    await deleteService(deletingService.id, deletingService.imagePath);
    setDeletingService(null);
    loadData();
  };

  const handleToggleVisibility = async (svc: Service) => {
    await toggleVisibility(svc.id, svc.hidden);
    loadData();
  };

  const getCategoryName = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? (isAr ? cat.nameAr : cat.nameEn) : '';
  };

  const filtered = filterCategory ? services.filter((s) => s.categoryId === filterCategory) : services;

  if (loading) return <div className="p-6">{t('common.loading')}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('admin.manageServices')}</h1>
        <button
          onClick={() => { setEditingService(undefined); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
        >
          <Plus className="h-4 w-4" />
          {t('admin.addService')}
        </button>
      </div>

      <div className="mb-4">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background text-sm"
        >
          <option value="">{t('customer.allCategories')}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{isAr ? cat.nameAr : cat.nameEn}</option>
          ))}
        </select>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('admin.uploadImage')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{isAr ? 'الاسم' : 'Name'}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('nav.categories')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('invoice.unitPrice')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('common.status')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((svc) => (
              <tr key={svc.id} className="border-t">
                <td className="px-4 py-3">
                  {svc.imageUrl ? (
                    <img src={svc.imageUrl} alt="" className="h-10 w-10 rounded object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted" />
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium">{isAr ? svc.nameAr : svc.nameEn}</div>
                  {svc.offer && (
                    <span className="inline-block mt-1 text-xs bg-gold/15 text-gold px-2 py-0.5 rounded">
                      {svc.offer.type === 'percentage' ? `${svc.offer.value}%` : `${svc.offer.value} ${t('common.sar')}`} {t('customer.discount')}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">{getCategoryName(svc.categoryId)}</td>
                <td className="px-4 py-3 text-sm" dir="ltr">{svc.price.toFixed(2)} {t('common.sar')}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded ${svc.hidden ? 'bg-muted text-muted-foreground' : 'bg-emerald-500/15 text-emerald-400'}`}>
                    {svc.hidden ? t('admin.serviceHidden') : t('admin.serviceVisible')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleToggleVisibility(svc)} className="p-1 hover:bg-accent rounded" title={t('admin.toggleVisibility')}>
                      {svc.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button onClick={() => { setEditingService(svc); setShowForm(true); }} className="p-1 hover:bg-accent rounded">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeletingService(svc)} className="p-1 hover:bg-accent rounded text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{t('common.noData')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <ServiceForm
          service={editingService}
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingService(undefined); }}
        />
      )}

      <ConfirmDialog
        open={!!deletingService}
        onOpenChange={() => setDeletingService(null)}
        title={t('admin.deleteService')}
        description={`${isAr ? deletingService?.nameAr : deletingService?.nameEn}`}
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
