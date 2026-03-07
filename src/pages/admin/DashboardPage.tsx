import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import {
  getTodayReservationCount,
  getPendingReservationCount,
  getMonthlyRevenue,
  getMonthlyExpenses,
  getRecentReservations,
  getUpcomingAppointments,
} from '@/services/dashboardService';
import KPICard from '@/components/admin/KPICard';
import BalanceWidgets from '@/components/admin/BalanceWidgets';
import type { Reservation } from '@/types';
import { cn } from '@/lib/utils';
import { STATUS_COLORS } from '@/lib/statusColors';

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const [todayCount, setTodayCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    Promise.all([
      getTodayReservationCount(),
      getPendingReservationCount(),
      getMonthlyRevenue(now.getFullYear(), now.getMonth()),
      getMonthlyExpenses(now.getFullYear(), now.getMonth()),
      getRecentReservations(10),
      getUpcomingAppointments(5),
    ]).then(([today, pending, revenue, expenses, recent, upcoming]) => {
      setTodayCount(today);
      setPendingCount(pending);
      setMonthlyRevenue(revenue);
      setMonthlyExpenses(expenses);
      setRecentReservations(recent);
      setUpcomingAppointments(upcoming);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6">{t('common.loading')}</div>;

  const netProfit = monthlyRevenue - monthlyExpenses;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('admin.dashboard')}</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <KPICard icon={CalendarDays} label={t('admin.todayReservations')} value={todayCount} />
        <KPICard icon={Clock} label={t('admin.pendingReservations')} value={pendingCount} color="yellow" />
        <KPICard icon={TrendingUp} label={t('admin.monthlyRevenue')} value={`${monthlyRevenue.toFixed(0)} ${t('common.sar')}`} color="green" />
        <KPICard icon={TrendingDown} label={t('admin.monthlyExpenses')} value={`${monthlyExpenses.toFixed(0)} ${t('common.sar')}`} color="red" />
        <KPICard icon={DollarSign} label={t('admin.netProfit')} value={`${netProfit.toFixed(0)} ${t('common.sar')}`} color={netProfit >= 0 ? 'green' : 'red'} />
      </div>

      {/* Balance Widgets */}
      <div className="mb-8">
        <BalanceWidgets />
      </div>

      {/* Recent Reservations & Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reservations */}
        <div className="border rounded-lg">
          <div className="px-4 py-3 border-b bg-muted/50 flex items-center justify-between">
            <h2 className="font-semibold">{t('admin.recentReservations')}</h2>
            <Link to="/admin/reservations" className="text-sm text-primary hover:underline">
              {t('common.view')}
            </Link>
          </div>
          <div className="divide-y">
            {recentReservations.map((res) => (
              <div key={res.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <span className="text-sm font-mono" dir="ltr">{res.referenceNumber}</span>
                  <span className="text-sm text-muted-foreground ms-2">{res.customerName || res.customerEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground" dir="ltr">{res.date}</span>
                  <span className={cn('text-xs px-2 py-0.5 rounded', STATUS_COLORS[res.status])}>
                    {t(`status.${res.status}`)}
                  </span>
                </div>
              </div>
            ))}
            {recentReservations.length === 0 && (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">{t('common.noData')}</div>
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="border rounded-lg">
          <div className="px-4 py-3 border-b bg-muted/50">
            <h2 className="font-semibold">{t('admin.upcomingAppointments')}</h2>
          </div>
          <div className="divide-y">
            {upcomingAppointments.map((res) => (
              <div key={res.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{res.customerName}</span>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground" dir="ltr">
                    <CalendarDays className="h-3 w-3" />
                    {res.date} {res.slotTime}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {res.services.map((s) => i18n.language === 'ar' ? s.nameAr : s.nameEn).join(i18n.language === 'ar' ? '، ' : ', ')}
                </p>
              </div>
            ))}
            {upcomingAppointments.length === 0 && (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">{t('common.noData')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
