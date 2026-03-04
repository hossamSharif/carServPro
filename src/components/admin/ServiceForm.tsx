import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { serviceSchema, type ServiceInput, type ServiceFormInput } from '@/lib/validators';
import type { Service, Category } from '@/types';

interface ServiceFormProps {
  service?: Service;
  categories: Category[];
  onSubmit: (data: ServiceInput, imageFile?: File) => Promise<void>;
  onCancel: () => void;
}

export default function ServiceForm({ service, categories, onSubmit, onCancel }: ServiceFormProps) {
  const { t, i18n } = useTranslation();
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [imagePreview, setImagePreview] = useState<string>(service?.imageUrl || '');
  const isAr = i18n.language === 'ar';

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<ServiceFormInput>({
    resolver: zodResolver(serviceSchema) as never,
    defaultValues: service
      ? {
          nameAr: service.nameAr,
          nameEn: service.nameEn,
          descriptionAr: service.descriptionAr,
          descriptionEn: service.descriptionEn,
          categoryId: service.categoryId,
          price: service.price,
          hidden: service.hidden,
          offer: service.offer
            ? { type: service.offer.type, value: service.offer.value, expiresAt: service.offer.expiresAt.toDate() }
            : null,
        }
      : { nameAr: '', nameEn: '', descriptionAr: '', descriptionEn: '', categoryId: '', price: 0, hidden: false, offer: null },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleFormSubmit = async (data: ServiceFormInput) => {
    await onSubmit(data as ServiceInput, imageFile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-background rounded-lg border shadow-lg p-6 w-full max-w-lg mx-4 my-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">
          {service ? t('admin.editService') : t('admin.addService')}
        </h2>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">الاسم (عربي)</label>
              <input {...register('nameAr')} className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
              {errors.nameAr && <p className="mt-1 text-sm text-destructive">{t(errors.nameAr.message!)}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Name (English)</label>
              <input {...register('nameEn')} dir="ltr" className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
              {errors.nameEn && <p className="mt-1 text-sm text-destructive">{t(errors.nameEn.message!)}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">الوصف (عربي)</label>
            <textarea {...register('descriptionAr')} rows={2} className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description (English)</label>
            <textarea {...register('descriptionEn')} rows={2} dir="ltr" className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('nav.categories')}</label>
              <select {...register('categoryId')} className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">{t('common.filter')}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {isAr ? cat.nameAr : cat.nameEn}
                  </option>
                ))}
              </select>
              {errors.categoryId && <p className="mt-1 text-sm text-destructive">{t(errors.categoryId.message!)}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('invoice.unitPrice')} ({t('common.sar')})</label>
              <input type="number" step="0.01" {...register('price', { valueAsNumber: true })} dir="ltr" className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
              {errors.price && <p className="mt-1 text-sm text-destructive">{t(errors.price.message!)}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.uploadImage')}</label>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="w-full text-sm" />
            {imagePreview && (
              <img src={imagePreview} alt="Preview" className="mt-2 h-24 w-24 object-cover rounded-md" />
            )}
          </div>

          <div className="flex items-center gap-2">
            <Controller
              name="hidden"
              control={control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="h-4 w-4"
                />
              )}
            />
            <label className="text-sm">{t('admin.serviceHidden')}</label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border rounded-md hover:bg-accent">
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
