import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Edit2, Shield } from 'lucide-react';
import { getAccounts, createAccount, updateAccount, deleteAccount } from '@/services/accountService';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import type { Account, AccountType } from '@/types';
import { cn } from '@/lib/utils';
import { ACCOUNT_TYPE_COLORS } from '@/lib/statusColors';

export default function AccountsPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: '', nameAr: '', nameEn: '', type: 'expense' as AccountType });

  const loadAccounts = async () => {
    try {
      const data = await getAccounts();
      setAccounts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAccounts(); }, []);

  const resetForm = () => {
    setForm({ code: '', nameAr: '', nameEn: '', type: 'expense' });
    setEditingAccount(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAccount) {
      await updateAccount(editingAccount.id, { nameAr: form.nameAr, nameEn: form.nameEn, type: form.type });
    } else {
      await createAccount(form);
    }
    resetForm();
    loadAccounts();
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setForm({ code: account.code, nameAr: account.nameAr, nameEn: account.nameEn, type: account.type });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteAccount(deleteId);
    setDeleteId(null);
    loadAccounts();
  };

  // Group accounts by type
  const accountTypes: AccountType[] = ['asset', 'liability', 'equity', 'revenue', 'expense'];

  if (loading) return <div className="p-6">{t('common.loading')}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('accounting.chartOfAccounts')}</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
        >
          <Plus className="h-4 w-4" />
          {t('accounting.addAccount')}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-4 mb-6 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t('accounting.accountCode')}</label>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                disabled={!!editingAccount}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm disabled:bg-muted"
                dir="ltr"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('accounting.accountName')} (AR)</label>
              <input
                value={form.nameAr}
                onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('accounting.accountName')} (EN)</label>
              <input
                value={form.nameEn}
                onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                dir="ltr"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('accounting.accountType')}</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as AccountType })}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
              >
                {accountTypes.map((type) => (
                  <option key={type} value={type}>{t(`accounting.${type}`)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90">
              {t('common.save')}
            </button>
            <button type="button" onClick={resetForm} className="px-4 py-2 border rounded-md text-sm hover:bg-accent">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      )}

      {/* Accounts Table grouped by type */}
      {accountTypes.map((type) => {
        const typeAccounts = accounts.filter((a) => a.type === type);
        if (typeAccounts.length === 0) return null;
        return (
          <div key={type} className="mb-6">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span className={cn('text-xs px-2 py-0.5 rounded', ACCOUNT_TYPE_COLORS[type])}>
                {t(`accounting.${type}`)}
              </span>
            </h2>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-start px-4 py-2 text-sm font-medium w-24">{t('accounting.accountCode')}</th>
                    <th className="text-start px-4 py-2 text-sm font-medium">{t('accounting.accountName')}</th>
                    <th className="text-start px-4 py-2 text-sm font-medium w-32"></th>
                    <th className="text-start px-4 py-2 text-sm font-medium w-24">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {typeAccounts.map((account) => (
                    <tr key={account.id} className="border-t">
                      <td className="px-4 py-2 text-sm font-mono" dir="ltr">{account.code}</td>
                      <td className="px-4 py-2 text-sm">{isAr ? account.nameAr : account.nameEn}</td>
                      <td className="px-4 py-2">
                        {account.isSystem && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Shield className="h-3 w-3" />
                            {t('accounting.systemAccount')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {!account.isSystem && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleEdit(account)} className="p-1 hover:bg-accent rounded">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button onClick={() => setDeleteId(account.id)} className="p-1 hover:bg-accent rounded text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t('common.delete')}
        description={t('common.confirm')}
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}
