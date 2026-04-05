import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useInView } from 'framer-motion';
import { Tag, ShoppingCart, Check, Sparkles } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import type { Service } from '@/types';

interface OffersShowcaseProps {
  services: Service[];
}

function ShimmerCard({ service, index }: { service: Service; index: number }) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { items, addItem } = useCartStore();
  const isInCart = items.some((i) => i.serviceId === service.id);

  const offer = service.offer!;
  const discountedPrice =
    offer.type === 'percentage'
      ? service.price * (1 - offer.value / 100)
      : service.price - offer.value;

  const discountLabel =
    offer.type === 'percentage'
      ? `${offer.value}%`
      : `${offer.value.toFixed(0)} ${t('common.sar')}`;

  const expiresDate = offer.expiresAt.toDate();
  const formattedExpiry = expiresDate.toLocaleDateString(
    isAr ? 'ar-SA' : 'en-US',
    { year: 'numeric', month: 'short', day: 'numeric' }
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.12 }}
      className="relative flex-shrink-0 w-[320px] sm:w-[360px] rounded-xl overflow-hidden group"
    >
      {/* Border beam animation */}
      <div className="absolute inset-0 rounded-xl border-beam" />

      {/* Card content */}
      <div className="relative glass-card rounded-xl overflow-hidden">
        {/* Discount badge */}
        <div className="absolute top-3 start-3 z-10 flex items-center gap-1 shimmer-badge text-xs font-bold px-3 py-1.5 rounded-full">
          <Tag className="h-3 w-3" />
          {t('customer.discount')} {discountLabel}
        </div>

        {/* Image */}
        {service.imageUrl ? (
          <div className="relative h-44 overflow-hidden">
            <img
              src={service.imageUrl}
              alt={isAr ? service.nameAr : service.nameEn}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        ) : (
          <div className="h-44 bg-white/[0.02] flex items-center justify-center">
            <ShoppingCart className="h-12 w-12 text-white/20" />
          </div>
        )}

        <div className="p-5">
          <h3 className="font-bold text-white text-lg">
            {isAr ? service.nameAr : service.nameEn}
          </h3>

          <p className="text-sm text-white/40 mt-1 line-clamp-2">
            {isAr ? service.descriptionAr : service.descriptionEn}
          </p>

          {/* Pricing */}
          <div className="mt-3 flex items-center gap-3">
            <span className="text-xl font-bold text-primary">
              {discountedPrice.toFixed(0)} {t('common.sar')}
            </span>
            <span className="text-sm text-white/30 line-through">
              {service.price.toFixed(0)} {t('common.sar')}
            </span>
          </div>

          {/* Expiry */}
          <p className="text-xs text-white/30 mt-2">
            {t('customer.offerExpires')}: {formattedExpiry}
          </p>

          {/* Button */}
          <button
            onClick={() => !isInCart && addItem(service)}
            disabled={isInCart}
            className={`mt-4 w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              isInCart
                ? 'bg-emerald-500/15 text-emerald-400 cursor-default'
                : 'shimmer-button text-white'
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
    </motion.div>
  );
}

export default function OffersShowcase({ services }: OffersShowcaseProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  if (services.length === 0) return null;

  return (
    <section ref={ref} className="py-16 sm:py-20 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 justify-center mb-10"
        >
          <Sparkles className="h-6 w-6 text-gold" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white">{t('customer.offer')}</h2>
        </motion.div>
      </div>

      {/* Horizontal scrolling container */}
      <div className="flex gap-6 px-4 sm:px-8 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
        {/* Spacer for centering on wide screens */}
        <div className="flex-shrink-0 w-0 lg:w-[calc((100vw-1280px)/2)]" />
        {services.map((service, index) => (
          <ShimmerCard key={service.id} service={service} index={index} />
        ))}
        <div className="flex-shrink-0 w-4" />
      </div>
    </section>
  );
}
