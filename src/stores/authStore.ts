import { create } from 'zustand';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  registerCustomer,
  loginWithEmail,
  logout as authLogout,
  onAuthStateChanged,
  getCustomClaims,
  forceTokenRefresh,
} from '@/services/auth';

interface AuthState {
  user: FirebaseUser | null;
  role: string | null;
  tenantId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, phone: string) => Promise<void>;
  logout: () => Promise<void>;
  initAuth: () => () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  role: null,
  tenantId: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    await loginWithEmail(email, password);
    // Auth state change listener will update the store
  },

  register: async (email, password, fullName, phone) => {
    await registerCustomer(email, password, fullName, phone);
    // Wait a moment for Cloud Function to set claims, then refresh
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await forceTokenRefresh();
  },

  logout: async () => {
    await authLogout();
    set({ user: null, role: null, tenantId: null, isAuthenticated: false });
  },

  initAuth: () => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const claims = await getCustomClaims();
          set({
            user: firebaseUser,
            role: claims.role || null,
            tenantId: claims.tenantId || null,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          set({ user: firebaseUser, role: null, tenantId: null, isAuthenticated: true, isLoading: false });
        }
      } else {
        set({ user: null, role: null, tenantId: null, isAuthenticated: false, isLoading: false });
      }
    });
    return unsubscribe;
  },
}));
