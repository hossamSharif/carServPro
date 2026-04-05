import { useTranslation } from 'react-i18next';
import type { Service } from '@/types';
import { useCartStore } from '@/stores/cartStore';
import { Tag, ShoppingCart, Check } from 'lucide-react';

interface OffersSectionProps {
  services: Service[];
}

export default function OffersSection({ services }: OffersSectionProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { items, addItem } = useCartStore();

  if (services.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>{t('common.noData')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((service) => {
        const offer = service.offer!;
        const isInCart = items.some((i) => i.serviceId === service.id);

        const discountedPrice =
          offer.type === 'percentage'
            ? service.price * (1 - offer.value / 100)
            : service.price - offer.value;

        const discountLabel =
          offer.type === 'percentage'
            ? `${offer.value}%`
            : `${offer.value.toFixed(2)} ${t('common.sar')}`;

        const expiresDate = offer.expiresAt.toDate();
        const formattedExpiry = expiresDate.toLocaleDateString(
          isAr ? 'ar-SA' : 'en-US',
          { year: 'numeric', month: 'short', day: 'numeric' }
        );

        return (
          <div
            key={service.id}
            className="relative border rounded-lg overflow-hidden bg-card hover:shadow-glow transition-shadow"
          >
            {/* Discount badge */}
            <div className="absolute top-3 start-3 z-10 flex items-center gap-1 bg-gold text-background text-xs font-bold px-2.5 py-1 rounded-full">
              <Tag className="h-3 w-3" />
              {t('customer.discount')} {discountLabel}
            </div>

            {/* Image */}
            {service.imageUrl ? (
              <img
                src={service.imageUrl}
                alt={isAr ? service.nameAr : service.nameEn}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-muted flex items-center justify-center text-muted-foreground">
                <ShoppingCart className="h-12 w-12" />
              </div>
            )}

            <div className="p-4">
              <h3 className="font-semibold text-lg">
                {isAr ? service.nameAr : service.nameEn}
              </h3>

              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {isAr ? service.descriptionAr : service.descriptionEn}
              </p>

              {/* Pricing */}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="text-lg font-bold text-primary">
                  {discountedPrice.toFixed(2)} {t('common.sar')}
                </span>
                <span className="text-sm text-muted-foreground line-through">
                  {service.price.toFixed(2)} {t('common.sar')}
                </span>
              </div>

              {/* Expiry */}
              <p className="text-xs text-muted-foreground mt-2">
                {t('customer.offerExpires')}: {formattedExpiry}
              </p>

              {/* Add to Cart */}
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
      })}
    </div>
  );
}
