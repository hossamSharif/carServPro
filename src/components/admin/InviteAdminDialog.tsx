import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { inviteAdminSchema, type InviteAdminInput } from '@/lib/validators';
import { inviteAdmin } from '@/services/adminService';
import { useAuthStore } from '@/stores/authStore';

interface InviteAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  role?: 'admin' | 'moderator';
}

export default function InviteAdminDialog({ open, onOpenChange, onSuccess, role = 'admin' }: InviteAdminDialogProps) {
  const { t } = useTranslation();
  const tenantId = useAuthStore((s) => s.tenantId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isModerator = role === 'moderator';
  const titleKey = isModerator ? 'admin.inviteModerator' : 'admin.inviteAdmin';
  const descKey = isModerator ? 'admin.inviteModeratorDesc' : 'admin.inviteAdminDesc';
  const successKey = isModerator ? 'admin.inviteModeratorSuccess' : 'admin.inviteSuccess';

  const { register, handleSubmit, formState: { errors }, reset } = useForm<InviteAdminInput>({
    resolver: zodResolver(inviteAdminSchema),
  });

  const onSubmit = async (data: InviteAdminInput) => {
    if (!tenantId) return;
    setLoading(true);
    setError('');
    try {
      await inviteAdmin({ ...data, tenantId, role });
      setSuccess(true);
      reset();
      onSuccess();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Failed to invite');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setSuccess(false);
    setError('');
    reset();
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />

      <div className="relative bg-background rounded-lg border shadow-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t(titleKey)}</h2>
          <button onClick={handleClose} disabled={loading} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">{t(descKey)}</p>

        {success ? (
          <div className="p-3 rounded-md bg-emerald-500/15 text-emerald-400 text-sm mb-4">
            {t(successKey)}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t('auth.fullName')}</label>
              <input
                {...register('fullName')}
                className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.fullName && <p className="text-xs text-destructive mt-1">{t(errors.fullName.message!)}</p>}
            </div>

            <div>
              <label className="text-sm font-medium">{t('auth.email')}</label>
              <input
                {...register('email')}
                type="email"
                dir="ltr"
                className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.email && <p className="text-xs text-destructive mt-1">{t(errors.email.message!)}</p>}
            </div>

            <div>
              <label className="text-sm font-medium">{t('auth.phone')}</label>
              <input
                {...register('phone')}
                dir="ltr"
                className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.phone && <p className="text-xs text-destructive mt-1">{t(errors.phone.message!)}</p>}
            </div>

            {error && (
              <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-sm rounded-md border hover:bg-accent transition-colors disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? t('common.loading') : t(titleKey)}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
