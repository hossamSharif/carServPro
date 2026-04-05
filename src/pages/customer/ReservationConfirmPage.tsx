import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, MessageCircle } from 'lucide-react';
import { generateWhatsAppLink } from '@/lib/whatsapp';

export default function ReservationConfirmPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const location = useLocation();
  const state = location.state as {
    services?: Array<{ nameAr: string; nameEn: string; quantity: number; serviceId: string; price: number; offerDiscount: number }>;
    date?: string;
    time?: string;
    total?: number;
  } | null;

  if (!state) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Link to="/services" className="text-primary hover:underline">{t('customer.browseServices')}</Link>
      </div>
    );
  }

  const whatsappLink = generateWhatsAppLink(
    '+966500000000',
    '',
    '',
    (state.services || []).map((s) => ({ ...s, offerDiscount: s.offerDiscount || 0 })),
    state.date || '',
    state.time || ''
  );

  return (
    <div className="container mx-auto px-4 py-12 max-w-md text-center">
      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
      <h1 className="text-2xl font-bold mb-2">{t('customer.reservationSuccess')}</h1>

      <div className="mt-6 border rounded-lg p-4 text-start space-y-3">
        <h3 className="font-semibold">{t('customer.reservationDetails')}</h3>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t('common.date')}</span>
          <span dir="ltr">{state.date}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t('common.time')}</span>
          <span dir="ltr">{state.time}</span>
        </div>
        <div className="border-t pt-2">
          {state.services?.map((s, i) => (
            <div key={i} className="flex justify-between text-sm py-1">
              <span>{isAr ? s.nameAr : s.nameEn} x{s.quantity}</span>
              <span>{((s.price - (s.offerDiscount || 0)) * s.quantity).toFixed(2)} {t('common.sar')}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between font-semibold border-t pt-2">
          <span>{t('common.total')}</span>
          <span>{state.total?.toFixed(2)} {t('common.sar')}</span>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 hover:shadow-glow transition-all"
        >
          <MessageCircle className="h-5 w-5" />
          {t('customer.shareWhatsApp')}
        </a>
        <Link to="/services" className="block w-full py-3 border rounded-md hover:bg-accent text-center">
          {t('customer.browseServices')}
        </Link>
      </div>
    </div>
  );
}
