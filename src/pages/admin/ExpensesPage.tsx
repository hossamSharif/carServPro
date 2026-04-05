import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Upload, Pencil, Trash2, X } from 'lucide-react';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '@/services/expenseService';
import { getAccountsByType } from '@/services/accountService';
import { expenseSchema, type ExpenseInput } from '@/lib/validators';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import type { Expense, Account } from '@/types';

export default function ExpensesPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [removeReceipt, setRemoveReceipt] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema) as never,
  });

  const loadData = async () => {
    try {
      const [expData, accounts] = await Promise.all([getExpenses(), getAccountsByType('expense')]);
      setExpenses(expData);
      setExpenseAccounts(accounts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openEditForm = (expense: Expense) => {
    setEditingExpense(expense);
    setRemoveReceipt(false);
    setReceiptFile(null);
    const date = expense.date && typeof expense.date === 'object' && 'toDate' in expense.date
      ? expense.date.toDate!()
      : new Date();
    const dateStr = date.toISOString().split('T')[0];
    setValue('date', dateStr as unknown as Date);
    setValue('accountId', expense.accountId);
    setValue('amount', expense.amount);
    setValue('paymentMethod', expense.paymentMethod);
    setValue('description', expense.description);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingExpense(null);
    setRemoveReceipt(false);
    setReceiptFile(null);
    reset();
  };

  const onSubmit = async (data: ExpenseInput) => {
    setSaving(true);
    try {
      const account = expenseAccounts.find((a) => a.id === data.accountId);
      if (editingExpense) {
        await updateExpense(editingExpense.id, {
          date: new Date(data.date),
          accountId: data.accountId,
          accountCode: account?.code || '',
          amount: data.amount,
          paymentMethod: data.paymentMethod as 'cash' | 'bank_transfer',
          description: data.description,
          receiptImage: receiptFile || undefined,
          removeReceipt,
        });
      } else {
        await createExpense({
          date: new Date(data.date),
          accountId: data.accountId,
          accountCode: account?.code || '',
          amount: data.amount,
          paymentMethod: data.paymentMethod as 'cash' | 'bank_transfer',
          description: data.description,
          receiptImage: receiptFile || undefined,
        });
      }
      closeForm();
      loadData();
    } catch (err) {
      console.error('Expense save error:', err);
      alert(err instanceof Error ? err.message : 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingExpense) return;
    setDeleting(true);
    try {
      await deleteExpense(deletingExpense.id);
      setDeletingExpense(null);
      loadData();
    } catch (err) {
      console.error('Expense delete error:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete expense');
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
        <h1 className="text-2xl font-bold">{t('accounting.expenses')}</h1>
        <button
          onClick={() => { if (showForm) closeForm(); else setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
        >
          <Plus className="h-4 w-4" />
          {t('accounting.addExpense')}
        </button>
      </div>

      {/* Expense Form */}
      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="border rounded-lg p-4 mb-6 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">
              {editingExpense ? t('accounting.editExpense') : t('accounting.addExpense')}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.date')}</label>
              <input
                type="date"
                {...register('date')}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                dir="ltr"
              />
              {errors.date && <p className="text-xs text-destructive mt-1">{t('validation.required')}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('accounting.expenseAccount')}</label>
              <select
                {...register('accountId')}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
              >
                <option value="">{t('common.filter')}</option>
                {expenseAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.code} - {isAr ? acc.nameAr : acc.nameEn}
                  </option>
                ))}
              </select>
              {errors.accountId && <p className="text-xs text-destructive mt-1">{t('validation.required')}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.amount')} ({t('common.sar')})</label>
              <input
                type="number"
                step="0.01"
                {...register('amount', { valueAsNumber: true })}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                dir="ltr"
              />
              {errors.amount && <p className="text-xs text-destructive mt-1">{t('validation.positiveNumber')}</p>}
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">{t('invoice.description')}</label>
              <input
                {...register('description')}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
              />
              {errors.description && <p className="text-xs text-destructive mt-1">{t('validation.required')}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('accounting.receipt')}</label>
            {/* Show current receipt in edit mode */}
            {editingExpense?.receiptImageUrl && !removeReceipt && !receiptFile && (
              <div className="flex items-center gap-2 mb-2">
                <a href={editingExpense.receiptImageUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                  {t('common.view')} {t('accounting.receipt')}
                </a>
                <button
                  type="button"
                  onClick={() => setRemoveReceipt(true)}
                  className="flex items-center gap-1 text-xs text-destructive hover:underline"
                >
                  <X className="h-3 w-3" />
                  {t('accounting.removeReceipt')}
                </button>
              </div>
            )}
            <label className="flex items-center gap-2 px-3 py-2 border rounded-md bg-background text-sm cursor-pointer hover:bg-accent w-fit">
              <Upload className="h-4 w-4" />
              {receiptFile ? receiptFile.name : t('accounting.uploadReceipt')}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-50">
              {saving ? t('common.loading') : t('common.save')}
            </button>
            <button type="button" onClick={closeForm} className="px-4 py-2 border rounded-md text-sm hover:bg-accent">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      )}

      {/* Expenses Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('common.date')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('accounting.expenseAccount')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('invoice.description')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('common.amount')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('invoice.paymentMethod')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('accounting.receipt')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id} className="border-t">
                <td className="px-4 py-3 text-sm" dir="ltr">{formatDate(expense.date)}</td>
                <td className="px-4 py-3 text-sm font-mono" dir="ltr">{expense.accountCode}</td>
                <td className="px-4 py-3 text-sm">{expense.description}</td>
                <td className="px-4 py-3 text-sm font-mono" dir="ltr">{expense.amount.toFixed(2)} {t('common.sar')}</td>
                <td className="px-4 py-3 text-sm">
                  {t(expense.paymentMethod === 'cash' ? 'invoice.cash' : 'invoice.bankTransfer')}
                </td>
                <td className="px-4 py-3 text-sm">
                  {expense.receiptImageUrl ? (
                    <a href={expense.receiptImageUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {t('common.view')}
                    </a>
                  ) : '-'}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditForm(expense)}
                      className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      title={t('accounting.editExpense')}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeletingExpense(expense)}
                      className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title={t('accounting.deleteExpense')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">{t('common.noData')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingExpense}
        onOpenChange={(open) => { if (!open) setDeletingExpense(null); }}
        title={t('accounting.deleteExpense')}
        description={t('accounting.deleteExpenseConfirm')}
        confirmLabel={deleting ? t('common.loading') : t('common.delete')}
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
