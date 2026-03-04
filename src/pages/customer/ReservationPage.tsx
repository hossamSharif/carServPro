import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useAuth } from '@/hooks/useAuth';
import { createReservation } from '@/services/reservationService';
import TimeSlotPicker from '@/components/customer/TimeSlotPicker';
import { cn } from '@/lib/utils';

const STEPS = ['reviewCart', 'selectDateTime', 'addNotes', 'confirmAndBook'];

export default function ReservationPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, getSubtotal, clearCart } = useCartStore();

  const [step, setStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">{t('customer.cartEmpty')}</p>
      </div>
    );
  }

  const handleConfirm = async () => {
    if (!user) return;
    setSubmitting(true);
    setError('');

    try {
      const services = items.map((item) => ({
        serviceId: item.serviceId,
        nameAr: item.nameAr,
        nameEn: item.nameEn,
        price: item.price,
        quantity: item.quantity,
        offerDiscount: item.offerDiscount,
      }));

      await createReservation({
        customerId: user.uid,
        customerName: user.displayName || user.email || '',
        customerPhone: '',
        customerEmail: user.email || '',
        services,
        date: selectedDate,
        slotTime: selectedTime,
        notes,
      });

      const total = getSubtotal();
      clearCart();
      navigate('/reservation/confirm', {
        state: { services, date: selectedDate, time: selectedTime, total },
      });
    } catch (e: unknown) {
      if ((e as Error).message === 'SLOT_FULL') {
        setError(t('customer.slotTaken'));
        setStep(1);
        setSelectedTime('');
      } else {
        setError((e as Error).message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Steps */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              'h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium',
              i <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && <div className="w-8 h-0.5 bg-muted" />}
          </div>
        ))}
      </div>

      <h2 className="text-xl font-semibold mb-6">
        {t(`customer.${STEPS[step]}`)}
      </h2>

      {error && <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>}

      {/* Step 1: Review Cart */}
      {step === 0 && (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.serviceId} className="flex justify-between items-center p-3 border rounded-lg">
              <div>
                <span className="font-medium">{isAr ? item.nameAr : item.nameEn}</span>
                <span className="text-sm text-muted-foreground ms-2">x{item.quantity}</span>
              </div>
              <span className="font-medium">{((item.price - item.offerDiscount) * item.quantity).toFixed(2)} {t('common.sar')}</span>
            </div>
          ))}
          <div className="flex justify-between text-lg font-semibold pt-2 border-t">
            <span>{t('customer.subtotal')}</span>
            <span>{getSubtotal().toFixed(2)} {t('common.sar')}</span>
          </div>
          <button onClick={() => setStep(1)} className="w-full py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
            {t('common.next')}
          </button>
        </div>
      )}

      {/* Step 2: Date & Time */}
      {step === 1 && (
        <div className="space-y-6">
          <TimeSlotPicker
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onDateChange={(d) => { setSelectedDate(d); setSelectedTime(''); }}
            onTimeChange={setSelectedTime}
          />
          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="flex-1 py-3 border rounded-md hover:bg-accent">
              {t('common.back')}
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={!selectedDate || !selectedTime}
              className="flex-1 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Notes */}
      {step === 2 && (
        <div className="space-y-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('customer.reservationNotes')}
            rows={4}
            className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 border rounded-md hover:bg-accent">
              {t('common.back')}
            </button>
            <button onClick={() => setStep(3)} className="flex-1 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
              {t('common.next')}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('common.date')}</span>
              <span dir="ltr">{selectedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('common.time')}</span>
              <span dir="ltr">{selectedTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('common.total')}</span>
              <span className="font-semibold">{getSubtotal().toFixed(2)} {t('common.sar')}</span>
            </div>
            {notes && (
              <div>
                <span className="text-muted-foreground">{t('invoice.notes')}</span>
                <p className="text-sm mt-1">{notes}</p>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-3 border rounded-md hover:bg-accent">
              {t('common.back')}
            </button>
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="flex-1 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? t('common.loading') : t('customer.confirmReservation')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
