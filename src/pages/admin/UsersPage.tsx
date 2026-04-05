import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, UserX, ChevronDown, ChevronUp, User, ShieldPlus, ShieldCheck } from 'lucide-react';
import { getAllUsers, searchUsers, deactivateUser } from '@/services/userService';
import { promoteToAdmin, promoteToModerator } from '@/services/adminService';
import { getCustomerReservations } from '@/services/reservationService';
import { useAuthStore } from '@/stores/authStore';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import AdminManagementPanel from '@/components/admin/AdminManagementPanel';
import ModeratorManagementPanel from '@/components/admin/ModeratorManagementPanel';
import type { User as UserType, Reservation } from '@/types';
import { cn } from '@/lib/utils';
import { STATUS_COLORS } from '@/lib/statusColors';

type Tab = 'customers' | 'admins' | 'moderators';

export default function UsersPage() {
  const { t } = useTranslation();
  const tenantId = useAuthStore((s) => s.tenantId);
  const [activeTab, setActiveTab] = useState<Tab>('customers');
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [userReservations, setUserReservations] = useState<Reservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [promoteId, setPromoteId] = useState<string | null>(null);
  const [promoteModId, setPromoteModId] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      const data = await getAllUsers();
      // Filter to only show customers (no role or role === 'customer')
      setUsers(data.filter((u) => !u.role || u.role === 'customer'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadUsers();
      return;
    }
    setLoading(true);
    try {
      const results = await searchUsers(searchQuery);
      setUsers(results.filter((u) => !u.role || u.role === 'customer'));
    } finally {
      setLoading(false);
    }
  };

  const handleExpandUser = async (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }
    setExpandedUserId(userId);
    setLoadingReservations(true);
    try {
      const reservations = await getCustomerReservations(userId);
      setUserReservations(reservations);
    } finally {
      setLoadingReservations(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateId) return;
    try {
      await deactivateUser(deactivateId);
      loadUsers();
    } finally {
      setDeactivateId(null);
    }
  };

  const handlePromote = async () => {
    if (!promoteId || !tenantId) return;
    try {
      await promoteToAdmin(promoteId, tenantId);
      loadUsers();
    } finally {
      setPromoteId(null);
    }
  };

  const handlePromoteMod = async () => {
    if (!promoteModId || !tenantId) return;
    try {
      await promoteToModerator(promoteModId, tenantId);
      loadUsers();
    } finally {
      setPromoteModId(null);
    }
  };

  const formatDate = (timestamp: { toDate?: () => Date }) => {
    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
      return timestamp.toDate!().toLocaleDateString();
    }
    return '-';
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('admin.manageUsers')}</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        <button
          onClick={() => setActiveTab('customers')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === 'customers'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          {t('admin.tabCustomers')}
        </button>
        <button
          onClick={() => setActiveTab('admins')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === 'admins'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          {t('admin.tabAdmins')}
        </button>
        <button
          onClick={() => setActiveTab('moderators')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === 'moderators'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          {t('admin.tabModerators')}
        </button>
      </div>

      {activeTab === 'admins' ? (
        <AdminManagementPanel />
      ) : activeTab === 'moderators' ? (
        <ModeratorManagementPanel />
      ) : (
        <>
          {/* Search Bar */}
          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={t('common.search')}
                className="w-full ps-10 pe-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button onClick={handleSearch} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90">
              {t('common.search')}
            </button>
          </div>

          {loading ? (
            <div className="py-4">{t('common.loading')}</div>
          ) : (
            /* Users Table */
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="w-8"></th>
                    <th className="text-start px-4 py-3 text-sm font-medium">{t('auth.fullName')}</th>
                    <th className="text-start px-4 py-3 text-sm font-medium">{t('auth.email')}</th>
                    <th className="text-start px-4 py-3 text-sm font-medium">{t('auth.phone')}</th>
                    <th className="text-start px-4 py-3 text-sm font-medium">{t('common.date')}</th>
                    <th className="text-start px-4 py-3 text-sm font-medium">{t('common.status')}</th>
                    <th className="text-start px-4 py-3 text-sm font-medium">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.uid} className="border-t group">
                      <td colSpan={7} className="p-0">
                        <div
                          className="flex items-center cursor-pointer hover:bg-accent/50 px-4 py-3"
                          onClick={() => handleExpandUser(user.uid)}
                        >
                          <div className="w-8 flex-shrink-0">
                            {expandedUserId === user.uid ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 grid grid-cols-6 gap-4 items-center">
                            <span className="text-sm flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {user.fullName}
                            </span>
                            <span className="text-sm text-muted-foreground" dir="ltr">{user.email}</span>
                            <span className="text-sm" dir="ltr">{user.phone}</span>
                            <span className="text-sm" dir="ltr">{formatDate(user.createdAt)}</span>
                            <span>
                              <span className={cn('text-xs px-2 py-0.5 rounded', user.active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400')}>
                                {user.active ? t('admin.userActive') : t('admin.userInactive')}
                              </span>
                            </span>
                            <span className="flex gap-2">
                              {user.active && (
                                <>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setPromoteId(user.uid); }}
                                    className="flex items-center gap-1 text-xs px-2 py-1 border rounded hover:bg-accent"
                                  >
                                    <ShieldPlus className="h-3 w-3" />
                                    {t('admin.promoteToAdmin')}
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setPromoteModId(user.uid); }}
                                    className="flex items-center gap-1 text-xs px-2 py-1 border rounded hover:bg-accent"
                                  >
                                    <ShieldCheck className="h-3 w-3" />
                                    {t('admin.promoteToModerator')}
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setDeactivateId(user.uid); }}
                                    className="flex items-center gap-1 text-xs px-2 py-1 border rounded hover:bg-accent text-destructive"
                                  >
                                    <UserX className="h-3 w-3" />
                                    {t('admin.deactivateUser')}
                                  </button>
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        {expandedUserId === user.uid && (
                          <div className="bg-muted/30 px-12 py-4">
                            <h4 className="text-sm font-medium mb-2">{t('nav.reservations')}</h4>
                            {loadingReservations ? (
                              <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
                            ) : userReservations.length === 0 ? (
                              <p className="text-sm text-muted-foreground">{t('customer.noReservations')}</p>
                            ) : (
                              <table className="w-full">
                                <thead>
                                  <tr className="text-xs text-muted-foreground">
                                    <th className="text-start py-1">{t('customer.referenceNumber')}</th>
                                    <th className="text-start py-1">{t('common.date')}</th>
                                    <th className="text-start py-1">{t('common.status')}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {userReservations.map((res) => (
                                    <tr key={res.id} className="text-sm">
                                      <td className="py-1 font-mono" dir="ltr">{res.referenceNumber}</td>
                                      <td className="py-1" dir="ltr">{res.date} {res.slotTime}</td>
                                      <td className="py-1">
                                        <span className={cn('text-xs px-2 py-0.5 rounded', STATUS_COLORS[res.status])}>
                                          {t(`status.${res.status}`)}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">{t('common.noData')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <ConfirmDialog
            open={!!deactivateId}
            onOpenChange={(open) => !open && setDeactivateId(null)}
            title={t('admin.deactivateUser')}
            description={t('common.confirm')}
            onConfirm={handleDeactivate}
            destructive
          />

          <ConfirmDialog
            open={!!promoteId}
            onOpenChange={(open) => !open && setPromoteId(null)}
            title={t('admin.promoteToAdmin')}
            description={t('admin.promoteConfirm')}
            onConfirm={handlePromote}
          />

          <ConfirmDialog
            open={!!promoteModId}
            onOpenChange={(open) => !open && setPromoteModId(null)}
            title={t('admin.promoteToModerator')}
            description={t('admin.promoteModeratorConfirm')}
            onConfirm={handlePromoteMod}
          />
        </>
      )}
    </div>
  );
}
