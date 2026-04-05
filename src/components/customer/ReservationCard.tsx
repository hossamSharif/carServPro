import { useTranslation } from 'react-i18next';
import type { Reservation } from '@/types';
import { cn } from '@/lib/utils';
import { Calendar, Clock } from 'lucide-react';
import { STATUS_COLORS } from '@/lib/statusColors';

interface ReservationCardProps {
  reservation: Reservation;
}

export default function ReservationCard({ reservation }: ReservationCardProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const totalAmount = reservation.services.reduce(
    (sum, svc) => sum + (svc.price - svc.offerDiscount) * svc.quantity,
    0
  );

  return (
    <div className="border rounded-lg bg-card p-4 hover:shadow-sm transition-shadow">
      {/* Header: reference number + status */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-mono text-muted-foreground" dir="ltr">
          #{reservation.referenceNumber}
        </span>
        <span
          className={cn(
            'text-xs px-2.5 py-1 rounded-full font-medium',
            STATUS_COLORS[reservation.status]
          )}
        >
          {t(`status.${reservation.status}`)}
        </span>
      </div>

      {/* Date and time */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4" />
          <span dir="ltr">{reservation.date}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          <span dir="ltr">{reservation.slotTime}</span>
        </div>
      </div>

      {/* Services list */}
      <div className="border-t pt-3 space-y-2">
        {reservation.services.map((svc, index) => {
          const lineTotal = (svc.price - svc.offerDiscount) * svc.quantity;
          return (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span>{isAr ? svc.nameAr : svc.nameEn}</span>
                {svc.quantity > 1 && (
                  <span className="text-xs text-muted-foreground">
                    x{svc.quantity}
                  </span>
                )}
              </div>
              <span className="font-medium" dir="ltr">
                {lineTotal.toFixed(2)} {t('common.sar')}
              </span>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="border-t mt-3 pt-3 flex items-center justify-between">
        <span className="font-semibold text-sm">{t('common.total')}</span>
        <span className="font-bold text-primary" dir="ltr">
          {totalAmount.toFixed(2)} {t('common.sar')}
        </span>
      </div>
    </div>
  );
}
