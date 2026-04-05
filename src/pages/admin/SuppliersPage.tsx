import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '@/services/supplierService';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import type { Supplier } from '@/types/purchase';

interface SupplierFormData {
  nameAr: string;
  nameEn: string;
  phone: string;
  email: string;
  vatNumber: string;
  address: string;
}

const emptyForm: SupplierFormData = { nameAr: '', nameEn: '', phone: '', email: '', vatNumber: '', address: '' };

export default function SuppliersPage() {
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<SupplierFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setSuppliers(await getSuppliers());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (supplier: Supplier) => {
    setEditingId(supplier.id);
    setForm({
      nameAr: supplier.nameAr,
      nameEn: supplier.nameEn,
      phone: supplier.phone,
      email: supplier.email,
      vatNumber: supplier.vatNumber,
      address: supplier.address,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nameAr.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateSupplier(editingId, form);
      } else {
        await createSupplier(form);
      }
      setDialogOpen(false);
      loadData();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await deleteSupplier(deletingId);
    setDeletingId(null);
    setDeleteDialogOpen(false);
    loadData();
  };

  if (loading) return <div className="p-6">{t('common.loading')}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('purchase.manageSuppliers')}</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-1 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> {t('purchase.addSupplier')}
        </button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('purchase.supplierName')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('purchase.supplierPhone')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('purchase.supplierVat')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('purchase.supplierAddress')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="px-4 py-3 text-sm">
                  <div>{s.nameAr}</div>
                  {s.nameEn && <div className="text-xs text-muted-foreground">{s.nameEn}</div>}
                </td>
                <td className="px-4 py-3 text-sm" dir="ltr">{s.phone}</td>
                <td className="px-4 py-3 text-sm font-mono" dir="ltr">{s.vatNumber || '-'}</td>
                <td className="px-4 py-3 text-sm">{s.address || '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(s)} className="p-1 hover:bg-accent rounded" title={t('purchase.editSupplier')}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { setDeletingId(s.id); setDeleteDialogOpen(true); }}
                      className="p-1 hover:bg-accent rounded text-destructive"
                      title={t('purchase.deleteSupplier')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {suppliers.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">{t('common.noData')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => !saving && setDialogOpen(false)} />
          <div className="relative bg-background rounded-lg border shadow-lg p-6 w-full max-w-lg mx-4">
            <h2 className="text-lg font-semibold mb-4">
              {editingId ? t('purchase.editSupplier') : t('purchase.addSupplier')}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">{t('admin.nameAr')} *</label>
                <input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('admin.nameEn')}</label>
                <input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('purchase.supplierPhone')} *</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('purchase.supplierEmail')}</label>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('purchase.supplierVat')}</label>
                <input value={form.vatNumber} onChange={(e) => setForm({ ...form, vatNumber: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('purchase.supplierAddress')}</label>
                <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDialogOpen(false)} disabled={saving} className="px-4 py-2 text-sm rounded-md border hover:bg-accent disabled:opacity-50">
                {t('common.cancel')}
              </button>
              <button onClick={handleSave} disabled={saving || !form.nameAr.trim()} className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                {saving ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={() => { setDeleteDialogOpen(false); setDeletingId(null); }}
        title={t('purchase.deleteSupplier')}
        description={t('purchase.deleteSupplierConfirm')}
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
