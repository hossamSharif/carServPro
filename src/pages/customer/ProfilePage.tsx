import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getUserProfile, updateProfile } from '@/services/userService';
import { getCustomerReservations } from '@/services/reservationService';
import ReservationCard from '@/components/customer/ReservationCard';
import type { User, Reservation } from '@/types';

const profileSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string().regex(/^\+?[0-9]{9,15}$/),
});

type ProfileInput = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (!user?.uid) return;
    Promise.all([getUserProfile(user.uid), getCustomerReservations(user.uid)])
      .then(([prof, res]) => {
        setProfile(prof);
        setReservations(res);
        if (prof) {
          reset({ fullName: prof.fullName, phone: prof.phone });
        }
      })
      .finally(() => setLoading(false));
  }, [user?.uid, reset]);

  const onSubmit = async (data: ProfileInput) => {
    if (!user?.uid) return;
    setSaving(true);
    setSaved(false);
    try {
      await updateProfile(user.uid, data);
      setProfile((prev) => prev ? { ...prev, ...data } : prev);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container mx-auto px-4 py-8">{t('common.loading')}</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">{t('nav.profile')}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="border rounded-lg p-6 mb-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('auth.email')}</label>
            <input
              type="email"
              value={profile?.email || user?.email || ''}
              disabled
              className="w-full px-3 py-2 border rounded-md bg-muted text-sm"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('auth.fullName')}</label>
            <input
              {...register('fullName')}
              className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.fullName && (
              <p className="text-sm text-destructive mt-1">{t('validation.nameMin')}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('auth.phone')}</label>
            <input
              {...register('phone')}
              className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              dir="ltr"
            />
            {errors.phone && (
              <p className="text-sm text-destructive mt-1">{t('validation.phoneInvalid')}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 text-sm"
            >
              <Save className="h-4 w-4" />
              {t('common.save')}
            </button>
            {saved && (
              <span className="text-sm text-emerald-400">
                {t('common.save')} ✓
              </span>
            )}
          </div>
        </div>
      </form>

      <h2 className="text-xl font-bold mb-4">{t('customer.myReservations')}</h2>
      {reservations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          {t('customer.noReservations')}
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((res) => (
            <ReservationCard key={res.id} reservation={res} />
          ))}
        </div>
      )}
    </div>
  );
}
