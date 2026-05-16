import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { RequireAuth, RequireAdmin, RequireCustomer, RedirectIfAuthenticated } from './guards';

// Layouts
const CustomerLayout = lazy(() => import('@/components/common/CustomerLayout'));
const AdminLayout = lazy(() => import('@/components/common/AdminLayout'));

// Customer pages
const LandingPage = lazy(() => import('@/pages/customer/LandingPage'));
const ServicesPage = lazy(() => import('@/pages/customer/ServicesPage'));
const LoginPage = lazy(() => import('@/pages/customer/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/customer/RegisterPage'));
const ReservationPage = lazy(() => import('@/pages/customer/ReservationPage'));
const ReservationConfirmPage = lazy(() => import('@/pages/customer/ReservationConfirmPage'));
const ProfilePage = lazy(() => import('@/pages/customer/ProfilePage'));

// Admin pages
const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage'));
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const ReservationsPage = lazy(() => import('@/pages/admin/ReservationsPage'));
const ServicesAdminPage = lazy(() => import('@/pages/admin/ServicesPage'));
const CategoriesPage = lazy(() => import('@/pages/admin/CategoriesPage'));
const InvoicesPage = lazy(() => import('@/pages/admin/InvoicesPage'));
const InvoiceEditorPage = lazy(() => import('@/pages/admin/InvoiceEditorPage'));
const SuppliersPage = lazy(() => import('@/pages/admin/SuppliersPage'));
const PurchaseInvoicesPage = lazy(() => import('@/pages/admin/PurchaseInvoicesPage'));
const SupplierStatementPage = lazy(() => import('@/components/admin/SupplierStatementView'));
const SupplierPaymentsPage = lazy(() => import('@/pages/admin/SupplierPaymentsPage'));
const PurchaseEditorPage = lazy(() => import('@/pages/admin/PurchaseEditorPage'));
const AccountsPage = lazy(() => import('@/pages/admin/AccountsPage'));
const JournalEntriesPage = lazy(() => import('@/pages/admin/JournalEntriesPage'));
const ExpensesPage = lazy(() => import('@/pages/admin/ExpensesPage'));
const AssetsPage = lazy(() => import('@/pages/admin/AssetsPage'));
const ReportsPage = lazy(() => import('@/pages/admin/ReportsPage'));
const UsersPage = lazy(() => import('@/pages/admin/UsersPage'));
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage'));

// 404
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <SuspenseWrapper><CustomerLayout /></SuspenseWrapper>,
    children: [
      { index: true, element: <SuspenseWrapper><LandingPage /></SuspenseWrapper> },
      { path: 'services', element: <SuspenseWrapper><ServicesPage /></SuspenseWrapper> },
      {
        path: 'login',
        element: <RedirectIfAuthenticated><SuspenseWrapper><LoginPage /></SuspenseWrapper></RedirectIfAuthenticated>,
      },
      {
        path: 'register',
        element: <RedirectIfAuthenticated><SuspenseWrapper><RegisterPage /></SuspenseWrapper></RedirectIfAuthenticated>,
      },
      {
        path: 'reservation',
        element: <RequireAuth><SuspenseWrapper><ReservationPage /></SuspenseWrapper></RequireAuth>,
      },
      {
        path: 'reservation/confirm',
        element: <RequireAuth><SuspenseWrapper><ReservationConfirmPage /></SuspenseWrapper></RequireAuth>,
      },
      {
        path: 'profile',
        element: <RequireCustomer><SuspenseWrapper><ProfilePage /></SuspenseWrapper></RequireCustomer>,
      },
    ],
  },
  {
    path: '/admin/login',
    element: <RedirectIfAuthenticated><SuspenseWrapper><AdminLoginPage /></SuspenseWrapper></RedirectIfAuthenticated>,
  },
  {
    path: '/admin',
    element: <RequireAdmin><SuspenseWrapper><AdminLayout /></SuspenseWrapper></RequireAdmin>,
    children: [
      { index: true, element: <SuspenseWrapper><DashboardPage /></SuspenseWrapper> },
      { path: 'reservations', element: <SuspenseWrapper><ReservationsPage /></SuspenseWrapper> },
      { path: 'services', element: <SuspenseWrapper><ServicesAdminPage /></SuspenseWrapper> },
      { path: 'categories', element: <SuspenseWrapper><CategoriesPage /></SuspenseWrapper> },
      { path: 'invoices', element: <SuspenseWrapper><InvoicesPage /></SuspenseWrapper> },
      { path: 'invoices/new', element: <SuspenseWrapper><InvoiceEditorPage /></SuspenseWrapper> },
      { path: 'invoices/:id', element: <SuspenseWrapper><InvoiceEditorPage /></SuspenseWrapper> },
      { path: 'suppliers', element: <SuspenseWrapper><SuppliersPage /></SuspenseWrapper> },
      { path: 'supplier-statement', element: <SuspenseWrapper><SupplierStatementPage /></SuspenseWrapper> },
      { path: 'supplier-payments', element: <SuspenseWrapper><SupplierPaymentsPage /></SuspenseWrapper> },
      { path: 'purchases', element: <SuspenseWrapper><PurchaseInvoicesPage /></SuspenseWrapper> },
      { path: 'purchases/new', element: <SuspenseWrapper><PurchaseEditorPage /></SuspenseWrapper> },
      { path: 'purchases/:id', element: <SuspenseWrapper><PurchaseEditorPage /></SuspenseWrapper> },
      { path: 'accounting', element: <SuspenseWrapper><AccountsPage /></SuspenseWrapper> },
      { path: 'expenses', element: <SuspenseWrapper><ExpensesPage /></SuspenseWrapper> },
      { path: 'assets', element: <SuspenseWrapper><AssetsPage /></SuspenseWrapper> },
      { path: 'journal', element: <SuspenseWrapper><JournalEntriesPage /></SuspenseWrapper> },
      { path: 'reports', element: <SuspenseWrapper><ReportsPage /></SuspenseWrapper> },
      { path: 'users', element: <SuspenseWrapper><UsersPage /></SuspenseWrapper> },
      { path: 'settings', element: <SuspenseWrapper><SettingsPage /></SuspenseWrapper> },
    ],
  },
  { path: '*', element: <SuspenseWrapper><NotFoundPage /></SuspenseWrapper> },
]);
