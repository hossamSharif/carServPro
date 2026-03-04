import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { loginSchema, type LoginInput } from '@/lib/validators';
import { useAuthStore } from '@/stores/authStore';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const [error, setError] = useState('');

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      setError('');
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch {
      setError(t('validation.required'));
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-sm">
      <h1 className="text-2xl font-bold text-center mb-6">{t('auth.loginTitle')}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>}

        <div>
          <label className="block text-sm font-medium mb-1">{t('auth.email')}</label>
          <input type="email" {...register('email')} dir="ltr" className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
          {errors.email && <p className="mt-1 text-sm text-destructive">{t(errors.email.message!)}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t('auth.password')}</label>
          <input type="password" {...register('password')} dir="ltr" className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
          {errors.password && <p className="mt-1 text-sm text-destructive">{t(errors.password.message!)}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50">
          {isSubmitting ? t('common.loading') : t('auth.login')}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="text-primary hover:underline">{t('auth.register')}</Link>
      </p>
    </div>
  );
}
