import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { categorySchema, type CategoryInput } from '@/lib/validators';
import type { Category } from '@/types';

interface CategoryFormProps {
  category?: Category;
  onSubmit: (data: CategoryInput) => Promise<void>;
  onCancel: () => void;
}

export default function CategoryForm({ category, onSubmit, onCancel }: CategoryFormProps) {
  const { t } = useTranslation();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: category
      ? { nameAr: category.nameAr, nameEn: category.nameEn, sortOrder: category.sortOrder }
      : { nameAr: '', nameEn: '', sortOrder: 0 },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-background rounded-lg border shadow-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold mb-4">
          {category ? t('admin.editCategory') : t('admin.addCategory')}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('accounting.accountName')} (عربي)
            </label>
            <input
              {...register('nameAr')}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.nameAr && <p className="mt-1 text-sm text-destructive">{t(errors.nameAr.message!)}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('accounting.accountName')} (English)
            </label>
            <input
              {...register('nameEn')}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              dir="ltr"
            />
            {errors.nameEn && <p className="mt-1 text-sm text-destructive">{t(errors.nameEn.message!)}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('common.status')}
            </label>
            <input
              type="number"
              {...register('sortOrder', { valueAsNumber: true })}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              dir="ltr"
            />
            {errors.sortOrder && <p className="mt-1 text-sm text-destructive">{t(errors.sortOrder.message!)}</p>}
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
