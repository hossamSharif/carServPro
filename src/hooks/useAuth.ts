import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const { user, role, tenantId, isLoading, isAuthenticated, login, register, logout } = useAuthStore();

  return {
    user,
    role,
    tenantId,
    isLoading,
    isAuthenticated,
    isAdmin: role === 'admin',
    isModerator: role === 'moderator',
    isStaff: role === 'admin' || role === 'moderator',
    isCustomer: role === 'customer',
    login,
    register,
    logout,
  };
}
