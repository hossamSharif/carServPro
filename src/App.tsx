import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { DirectionProvider } from '@radix-ui/react-direction';
import { router } from '@/routes';
import { useDirection } from '@/hooks/useDirection';
import { useAuthStore } from '@/stores/authStore';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import '@/i18n/config';

export default function App() {
  const direction = useDirection();
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    const unsubscribe = initAuth();
    return unsubscribe;
  }, [initAuth]);

  return (
    <ErrorBoundary>
      <DirectionProvider dir={direction}>
        <RouterProvider router={router} />
      </DirectionProvider>
    </ErrorBoundary>
  );
}
