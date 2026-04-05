import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getVisibleServices } from '@/services/serviceService';
import { getCategories } from '@/services/categoryService';
import HeroSection from '@/components/customer/HeroSection';
import StatsBar from '@/components/customer/StatsBar';
import ServicesShowcase from '@/components/customer/ServicesShowcase';
import ProcessSection from '@/components/customer/ProcessSection';
import OffersShowcase from '@/components/customer/OffersShowcase';
import TestimonialsSection from '@/components/customer/TestimonialsSection';
import CTABanner from '@/components/customer/CTABanner';
import type { Service, Category } from '@/types';

export default function LandingPage() {
  const { t } = useTranslation();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getVisibleServices(), getCategories()])
      .then(([svc, cat]) => { setServices(svc); setCategories(cat); })
      .finally(() => setLoading(false));
  }, []);

  const servicesWithOffers = services.filter(
    (s) => s.offer && s.offer.expiresAt.toDate() > new Date()
  );

  return (
    <div>
      {/* Section 1 — Cinematic Hero */}
      <HeroSection />

      {/* Section 2 — Animated Stats Bar */}
      <StatsBar />

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">{t('common.loading')}</div>
      ) : (
        <>
          {/* Section 3 — Active Offers / Promotions */}
          {servicesWithOffers.length > 0 && (
            <OffersShowcase services={servicesWithOffers} />
          )}

          {/* Section 4 — Services Grid (Glassmorphism) */}
          <ServicesShowcase categories={categories} services={services} />

          {/* Section 5 — Our Process (Horizontal Scroll) */}
          <ProcessSection />
        </>
      )}

      {/* Section 7 — Testimonials Marquee */}
      <TestimonialsSection />

      {/* Section 8 — CTA / Book Now Banner */}
      <CTABanner />
    </div>
  );
}
