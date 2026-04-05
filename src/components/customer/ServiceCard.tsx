import { useTranslation } from 'react-i18next';
import { ShoppingCart, Check } from 'lucide-react';
import type { Service } from '@/types';
import { useCartStore } from '@/stores/cartStore';

interface ServiceCardProps {
  service: Service;
}

export default function ServiceCard({ service }: ServiceCardProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { items, addItem } = useCartStore();
  const isInCart = items.some((i) => i.serviceId === service.id);

  const hasActiveOffer = service.offer && service.offer.expiresAt.toDate() > new Date();
  const discountedPrice = hasActiveOffer
    ? service.offer!.type === 'percentage'
      ? service.price * (1 - service.offer!.value / 100)
      : service.price - service.offer!.value
    : service.price;

  return (
    <div className="border rounded-lg overflow-hidden bg-card hover:shadow-glow transition-shadow">
      {service.imageUrl ? (
        <img src={service.imageUrl} alt={isAr ? service.nameAr : service.nameEn} className="w-full h-48 object-cover" />
      ) : (
        <div className="w-full h-48 bg-muted flex items-center justify-center text-muted-foreground">
          <ShoppingCart className="h-12 w-12" />
        </div>
      )}

      <div className="p-4">
        <h3 className="font-semibold text-lg">{isAr ? service.nameAr : service.nameEn}</h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {isAr ? service.descriptionAr : service.descriptionEn}
        </p>

        <div className="mt-3 flex items-center gap-2">
          {hasActiveOffer ? (
            <>
              <span className="text-lg font-bold text-primary">{discountedPrice.toFixed(2)} {t('common.sar')}</span>
              <span className="text-sm text-muted-foreground line-through">{service.price.toFixed(2)}</span>
              <span className="text-xs bg-gold/15 text-gold px-2 py-0.5 rounded">
                {service.offer!.type === 'percentage' ? `${service.offer!.value}%` : `${service.offer!.value} ${t('common.sar')}`}
              </span>
            </>
          ) : (
            <span className="text-lg font-bold text-primary">{service.price.toFixed(2)} {t('common.sar')}</span>
          )}
        </div>

        <button
          onClick={() => !isInCart && addItem(service)}
          disabled={isInCart}
          className={`mt-3 w-full py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            isInCart
              ? 'bg-emerald-500/15 text-emerald-400 cursor-default'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {isInCart ? (
            <>
              <Check className="h-4 w-4" />
              {t('customer.inCart')}
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" />
              {t('customer.addToCart')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
