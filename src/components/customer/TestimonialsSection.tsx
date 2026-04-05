import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface Testimonial {
  name: string;
  text: string;
  rating: number;
}

function TestimonialCard({ item }: { item: Testimonial }) {
  return (
    <div className="glass-card rounded-xl p-6 w-[300px] sm:w-[340px] flex-shrink-0 mx-3">
      {/* Stars */}
      <div className="flex gap-1 mb-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < item.rating ? 'fill-gold text-gold' : 'text-white/15'}`}
          />
        ))}
      </div>

      {/* Text */}
      <p className="text-white/60 text-sm leading-relaxed mb-4">
        &ldquo;{item.text}&rdquo;
      </p>

      {/* Name */}
      <p className="text-white font-medium text-sm">{item.name}</p>
    </div>
  );
}

export default function TestimonialsSection() {
  const { t } = useTranslation();

  const testimonials: Testimonial[] = [
    { name: t('testimonials.t1Name'), text: t('testimonials.t1Text'), rating: 5 },
    { name: t('testimonials.t2Name'), text: t('testimonials.t2Text'), rating: 5 },
    { name: t('testimonials.t3Name'), text: t('testimonials.t3Text'), rating: 5 },
    { name: t('testimonials.t4Name'), text: t('testimonials.t4Text'), rating: 4 },
    { name: t('testimonials.t5Name'), text: t('testimonials.t5Text'), rating: 5 },
    { name: t('testimonials.t6Name'), text: t('testimonials.t6Text'), rating: 5 },
  ];

  // Duplicate for seamless loop
  const items = [...testimonials, ...testimonials];

  return (
    <section className="py-16 sm:py-20 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-4xl font-bold text-white text-center mb-12"
        >
          {t('testimonials.title')}
        </motion.h2>
      </div>

      {/* Marquee row 1 — scrolls left */}
      <div className="marquee mb-6">
        <div className="marquee-track">
          {items.map((item, i) => (
            <TestimonialCard key={`a-${i}`} item={item} />
          ))}
        </div>
      </div>

      {/* Marquee row 2 — scrolls right */}
      <div className="marquee marquee-reverse">
        <div className="marquee-track">
          {[...items].reverse().map((item, i) => (
            <TestimonialCard key={`b-${i}`} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
