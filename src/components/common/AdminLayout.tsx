import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, CalendarDays, Wrench, Tags, FileText,
  Calculator, Users, Settings, LogOut, ChevronRight, ChevronLeft,
  Receipt, BookOpen, DollarSign, Package, BarChart3,
  ShoppingCart, Building2, FileInput,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import LanguageToggle from './LanguageToggle';
import logoImg from '@/images/logoediti.png';

const navItems = [
  { path: '/admin', icon: LayoutDashboard, labelKey: 'nav.dashboard', exact: true },
  { path: '/admin/reservations', icon: CalendarDays, labelKey: 'nav.reservations' },
  { path: '/admin/services', icon: Wrench, labelKey: 'nav.services' },
  { path: '/admin/categories', icon: Tags, labelKey: 'nav.categories' },
  { path: '/admin/invoices', icon: FileText, labelKey: 'nav.invoices' },
  { type: 'group', labelKey: 'nav.purchases', icon: ShoppingCart, children: [
    { path: '/admin/suppliers', icon: Building2, labelKey: 'nav.suppliers' },
    { path: '/admin/purchases', icon: FileInput, labelKey: 'nav.purchaseInvoices' },
  ]},
  { type: 'group', labelKey: 'nav.accounting', icon: Calculator, children: [
    { path: '/admin/accounting', icon: BookOpen, labelKey: 'nav.chartOfAccounts' },
    { path: '/admin/journal', icon: Receipt, labelKey: 'nav.journalEntries' },
    { path: '/admin/expenses', icon: DollarSign, labelKey: 'nav.expenses' },
    { path: '/admin/assets', icon: Package, labelKey: 'nav.assets' },
    { path: '/admin/reports', icon: BarChart3, labelKey: 'nav.reports' },
  ]},
  { path: '/admin/users', icon: Users, labelKey: 'nav.users', adminOnly: true },
  { path: '/admin/settings', icon: Settings, labelKey: 'nav.settings', adminOnly: true },
] as const;

export default function AdminLayout() {
  const { t, i18n } = useTranslation();
  const { logout, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const isRtl = i18n.language === 'ar';

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 start-0 z-40 bg-card border-e border-border/50 flex flex-col transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-border/50">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2 truncate">
              <img src={logoImg} alt="Smart Operation" className="h-8 w-8 object-contain" />
              <span className="font-bold text-gold truncate">Smart Operation</span>
            </div>
          ) : (
            <img src={logoImg} alt="Smart Operation" className="h-8 w-8 object-contain" />
          )}
          <button onClick={toggleSidebar} className="p-1 hover:bg-accent rounded-md">
            {(sidebarCollapsed ? !isRtl : isRtl) ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.filter((item) => !('adminOnly' in item && item.adminOnly) || isAdmin).map((item, idx) => {
            if ('type' in item && item.type === 'group') {
              return (
                <div key={idx} className="mt-2">
                  {!sidebarCollapsed && (
                    <p className="px-4 py-1 text-xs text-muted-foreground uppercase tracking-wider">
                      {t(item.labelKey)}
                    </p>
                  )}
                  {item.children.map((child) => (
                    <Link
                      key={child.path}
                      to={child.path}
                      className={cn(
                        'flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-accent',
                        isActive(child.path) && 'bg-primary/10 text-primary font-medium shadow-glow'
                      )}
                      title={sidebarCollapsed ? t(child.labelKey) : undefined}
                    >
                      <child.icon className="h-5 w-5 shrink-0" />
                      {!sidebarCollapsed && <span>{t(child.labelKey)}</span>}
                    </Link>
                  ))}
                </div>
              );
            }
            const navItem = item as { path: string; icon: React.ComponentType<{ className?: string }>; labelKey: string; exact?: boolean };
            return (
              <Link
                key={navItem.path}
                to={navItem.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-accent',
                  isActive(navItem.path, navItem.exact) && 'bg-primary/10 text-primary font-medium shadow-glow'
                )}
                title={sidebarCollapsed ? t(navItem.labelKey) : undefined}
              >
                <navItem.icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && <span>{t(navItem.labelKey)}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border/50 p-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 text-sm w-full hover:bg-accent rounded-md text-destructive"
            title={sidebarCollapsed ? t('auth.logout') : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!sidebarCollapsed && <span>{t('auth.logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn('flex-1 transition-all duration-300', sidebarCollapsed ? 'ms-16' : 'ms-64')}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-md border-b border-border/50 flex items-center justify-between px-6">
          <h2 className="text-lg font-semibold">{t('admin.dashboard')}</h2>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <span className="text-sm text-muted-foreground">{user?.email}</span>
          </div>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
