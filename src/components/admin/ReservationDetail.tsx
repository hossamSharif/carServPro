import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { Reservation } from '@/types';
import { cn } from '@/lib/utils';
import { STATUS_COLORS } from '@/lib/statusColors';

interface ReservationDetailProps {
  reservation: Reservation;
}

export default function ReservationDetail({ reservation }: ReservationDetailProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{t('customer.reservationDetails')}</h3>
        <span className={cn('text-xs px-2 py-1 rounded', STATUS_COLORS[reservation.status])}>
          {t(`status.${reservation.status}`)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-muted-foreground">{t('customer.referenceNumber')}</span>
          <p className="font-mono" dir="ltr">{reservation.referenceNumber}</p>
        </div>
        <div>
          <span className="text-muted-foreground">{t('auth.fullName')}</span>
          <p>{reservation.customerName}</p>
        </div>
        <div>
          <span className="text-muted-foreground">{t('common.date')}</span>
          <p dir="ltr">{reservation.date}</p>
        </div>
        <div>
          <span className="text-muted-foreground">{t('common.time')}</span>
          <p dir="ltr">{reservation.slotTime}</p>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">{t('nav.services')}</h4>
        <div className="border rounded">
          {reservation.services.map((s, i) => (
            <div key={i} className="flex justify-between p-2 text-sm border-b last:border-b-0">
              <span>{isAr ? s.nameAr : s.nameEn} x{s.quantity}</span>
              <span>{((s.price - s.offerDiscount) * s.quantity).toFixed(2)} {t('common.sar')}</span>
            </div>
          ))}
        </div>
      </div>

      {reservation.notes && (
        <div>
          <span className="text-sm text-muted-foreground">{t('invoice.notes')}</span>
          <p className="text-sm mt-1">{reservation.notes}</p>
        </div>
      )}

      {reservation.invoiceId && (
        <Link to={`/admin/invoices/${reservation.invoiceId}`} className="text-sm text-primary hover:underline">
          {t('invoice.invoice')} →
        </Link>
      )}
    </div>
  );
}
