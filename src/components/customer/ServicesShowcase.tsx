import { useRef, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ShoppingCart, Check } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCartStore } from '@/stores/cartStore';
import type { Service, Category } from '@/types';

gsap.registerPlugin(ScrollTrigger);

interface ServicesShowcaseProps {
  categories: Category[];
  services: Service[];
}

function GlassServiceCard({ service }: { service: Service }) {
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
    <div className="glass-card glass-card-hover rounded-xl overflow-hidden group cursor-pointer">
      {/* Image */}
      {service.imageUrl ? (
        <div className="relative h-36 overflow-hidden">
          <img
            src={service.imageUrl}
            alt={isAr ? service.nameAr : service.nameEn}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
      ) : (
        <div className="h-36 bg-white/[0.02] flex items-center justify-center">
          <ShoppingCart className="h-8 w-8 text-white/20" />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
          {isAr ? service.nameAr.split(' ')[0] : service.nameEn.split(' ')[0]}
        </span>

        <h3 className="font-bold text-white text-lg mt-3">
          {isAr ? service.nameAr : service.nameEn}
        </h3>

        <p className="text-sm text-white/40 mt-1 line-clamp-2">
          {isAr ? service.descriptionAr : service.descriptionEn}
        </p>

        <div className="mt-3 flex items-center gap-2">
          {hasActiveOffer ? (
            <>
              <span className="text-lg font-bold text-primary">
                {discountedPrice.toFixed(0)} {t('common.sar')}
              </span>
              <span className="text-sm text-white/30 line-through">
                {service.price.toFixed(0)}
              </span>
            </>
          ) : (
            <span className="text-lg font-bold text-primary">
              {service.price.toFixed(0)} {t('common.sar')}
            </span>
          )}
        </div>

        <button
          onClick={() => !isInCart && addItem(service)}
          disabled={isInCart}
          className={`mt-4 w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            isInCart
              ? 'bg-emerald-500/15 text-emerald-400 cursor-default'
              : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white'
          }`}
        >
          {isInCart ? (
            <>
              <Check className="h-4 w-4" />
              {t('customer.inCart')}
            </>
          ) : (
            <>
              {t('process.bookService')}
              {isAr ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function ServicesShowcase({ categories, services }: ServicesShowcaseProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const sectionRef = useRef<HTMLElement>(null);

  const servicesByCategory = categories
    .map((cat) => ({
      category: cat,
      services: services.filter((s) => s.categoryId === cat.id).slice(0, 4),
    }))
    .filter((group) => group.services.length > 0);

  useLayoutEffect(() => {
    if (!sectionRef.current || servicesByCategory.length === 0) return;

    const ctx = gsap.context(() => {
      // Animate section title
      gsap.from('.services-title', {
        opacity: 0,
        y: 20,
        duration: 0.5,
        scrollTrigger: {
          trigger: '.services-title',
          start: 'top 85%',
          once: true,
        },
      });

      // Animate each card with stagger
      gsap.utils.toArray<HTMLElement>('.service-card-anim').forEach((card, i) => {
        gsap.from(card, {
          opacity: 0,
          y: 40,
          duration: 0.5,
          delay: i * 0.1,
          scrollTrigger: {
            trigger: card,
            start: 'top 90%',
            once: true,
          },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [servicesByCategory.length]);

  if (servicesByCategory.length === 0) return null;

  return (
    <section ref={sectionRef} className="py-16 sm:py-20">
      <div className="container mx-auto px-4">
        <div className="services-title text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">{t('nav.services')}</h2>
        </div>

        {servicesByCategory.map(({ category, services: catServices }) => (
          <div key={category.id} className="mb-14">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white/80">
                {isAr ? category.nameAr : category.nameEn}
              </h3>
              <Link
                to="/services"
                className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                {t('common.view')}
                {isAr ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {catServices.map((service) => (
                <div key={service.id} className="service-card-anim w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] xl:w-[calc(25%-0.75rem)]">
                  <GlassServiceCard service={service} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
