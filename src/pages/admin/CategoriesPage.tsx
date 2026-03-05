import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/services/categoryService';
import CategoryForm from '@/components/admin/CategoryForm';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import type { Category } from '@/types';
import type { CategoryInput } from '@/lib/validators';

export default function CategoriesPage() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);

  const handleSubmit = async (data: CategoryInput) => {
    if (editingCategory) {
      await updateCategory(editingCategory.id, data);
    } else {
      await createCategory(data);
    }
    setShowForm(false);
    setEditingCategory(undefined);
    loadCategories();
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      setError('');
      await deleteCategory(deletingId);
      setDeletingId(null);
      loadCategories();
    } catch (e: unknown) {
      if ((e as Error).message === 'CATEGORY_HAS_SERVICES') {
        setError(t('admin.categoryHasServices'));
      }
      setDeletingId(null);
    }
  };

  if (loading) return <div className="p-6">{t('common.loading')}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('admin.manageCategories')}</h1>
        <button
          onClick={() => { setEditingCategory(undefined); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
        >
          <Plus className="h-4 w-4" />
          {t('admin.addCategory')}
        </button>
      </div>

      {error && <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>}

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-start px-4 py-3 text-sm font-medium">#</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('admin.nameAr')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('admin.nameEn')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-t">
                <td className="px-4 py-3 text-sm">{cat.sortOrder}</td>
                <td className="px-4 py-3 text-sm font-medium">{cat.nameAr}</td>
                <td className="px-4 py-3 text-sm" dir="ltr">{cat.nameEn}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditingCategory(cat); setShowForm(true); }}
                      className="p-1 hover:bg-accent rounded"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeletingId(cat.id)}
                      className="p-1 hover:bg-accent rounded text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">{t('common.noData')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <CategoryForm
          category={editingCategory}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingCategory(undefined); }}
        />
      )}

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={() => setDeletingId(null)}
        title={t('admin.deleteCategory')}
        description={t('admin.deleteCategoryConfirm')}
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
