import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { loginSchema, type LoginInput } from '@/lib/validators';
import { useAuthStore } from '@/stores/authStore';
import logoImg from '@/images/logoediti.png';

export default function AdminLoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      setError('');
      await login(data.email, data.password);
      navigate('/admin');
    } catch {
      setError(t('validation.required'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center flex flex-col items-center">
          <img src={logoImg} alt="Smart Operation" className="h-20 w-20 object-contain mb-3" />
          <h1 className="text-2xl font-bold text-primary">Smart Operation</h1>
          <p className="mt-2 text-muted-foreground">{t('auth.adminLogin')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">{t('auth.email')}</label>
            <input
              type="email"
              {...register('email')}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              dir="ltr"
            />
            {errors.email && <p className="mt-1 text-sm text-destructive">{t(errors.email.message!)}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('auth.password')}</label>
            <input
              type="password"
              {...register('password')}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              dir="ltr"
            />
            {errors.password && <p className="mt-1 text-sm text-destructive">{t(errors.password.message!)}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? t('common.loading') : t('auth.login')}
          </button>
        </form>
      </div>
    </div>
  );
}
