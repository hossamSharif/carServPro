import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus, UserMinus, UserX, ShieldCheck } from 'lucide-react';
import { getModeratorUsers, demoteToCustomer } from '@/services/adminService';
import { deactivateUser } from '@/services/userService';
import { useAuthStore } from '@/stores/authStore';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import InviteAdminDialog from './InviteAdminDialog';
import type { User } from '@/types';

export default function ModeratorManagementPanel() {
  const { t } = useTranslation();
  const currentUser = useAuthStore((s) => s.user);
  const tenantId = useAuthStore((s) => s.tenantId);
  const [moderators, setModerators] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [demoteId, setDemoteId] = useState<string | null>(null);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);

  const loadModerators = async () => {
    try {
      const data = await getModeratorUsers();
      setModerators(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadModerators(); }, []);

  const handleDemote = async () => {
    if (!demoteId || !tenantId) return;
    try {
      await demoteToCustomer(demoteId, tenantId);
      loadModerators();
    } finally {
      setDemoteId(null);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateId) return;
    try {
      await deactivateUser(deactivateId);
      loadModerators();
    } finally {
      setDeactivateId(null);
    }
  };

  const formatDate = (timestamp: { toDate?: () => Date }) => {
    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
      return timestamp.toDate!().toLocaleDateString();
    }
    return '-';
  };

  if (loading) return <div className="py-4">{t('common.loading')}</div>;

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setInviteOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
        >
          <UserPlus className="h-4 w-4" />
          {t('admin.inviteModerator')}
        </button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('auth.fullName')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('auth.email')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('auth.phone')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('common.date')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('common.status')}</th>
              <th className="text-start px-4 py-3 text-sm font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {moderators.map((mod) => {
              const isSelf = mod.uid === currentUser?.uid;
              return (
                <tr key={mod.uid} className="border-t">
                  <td className="px-4 py-3 text-sm">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-blue-400" />
                      {mod.fullName}
                      {isSelf && <span className="text-xs text-muted-foreground">({t('common.you') || 'you'})</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground" dir="ltr">{mod.email}</td>
                  <td className="px-4 py-3 text-sm" dir="ltr">{mod.phone}</td>
                  <td className="px-4 py-3 text-sm" dir="ltr">{formatDate(mod.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${mod.active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                      {mod.active ? t('admin.userActive') : t('admin.userInactive')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDemoteId(mod.uid)}
                        disabled={isSelf}
                        title={isSelf ? t('admin.cannotDemoteSelf') : t('admin.demoteToCustomer')}
                        className="flex items-center gap-1 text-xs px-2 py-1 border rounded hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <UserMinus className="h-3 w-3" />
                        {t('admin.demoteToCustomer')}
                      </button>
                      {mod.active && !isSelf && (
                        <button
                          onClick={() => setDeactivateId(mod.uid)}
                          className="flex items-center gap-1 text-xs px-2 py-1 border rounded hover:bg-accent text-destructive"
                        >
                          <UserX className="h-3 w-3" />
                          {t('admin.deactivateUser')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {moderators.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{t('common.noData')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <InviteAdminDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onSuccess={loadModerators}
        role="moderator"
      />

      <ConfirmDialog
        open={!!demoteId}
        onOpenChange={(open) => !open && setDemoteId(null)}
        title={t('admin.demoteToCustomer')}
        description={t('admin.demoteModeratorConfirm')}
        onConfirm={handleDemote}
        destructive
      />

      <ConfirmDialog
        open={!!deactivateId}
        onOpenChange={(open) => !open && setDeactivateId(null)}
        title={t('admin.deactivateUser')}
        description={t('common.confirm')}
        onConfirm={handleDeactivate}
        destructive
      />
    </div>
  );
}
