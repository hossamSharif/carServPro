import { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';

function CountUp({ target, suffix = '', decimals = 0 }: { target: number; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) =>
    decimals > 0 ? v.toFixed(decimals) : Math.round(v).toString()
  );
  const [display, setDisplay] = useState(decimals > 0 ? '0.0' : '0');

  useEffect(() => {
    const unsubscribe = rounded.on('change', (v) => setDisplay(v));
    return unsubscribe;
  }, [rounded]);

  useEffect(() => {
    if (inView) {
      animate(count, target, { duration: 2, ease: 'easeOut' });
    }
  }, [inView, count, target]);

  return (
    <span ref={ref}>
      {display}{suffix}
    </span>
  );
}

export default function StatsBar() {
  const { t } = useTranslation();

  const stats = [
    { value: 500, suffix: '+', decimals: 0, label: t('stats.happyClients') },
    { value: 98, suffix: '%', decimals: 0, label: t('stats.satisfactionRate') },
    { value: 5, suffix: ` ${t('stats.years')}`, decimals: 0, label: t('stats.experience') },
    { value: 4.9, suffix: ' ★', decimals: 1, label: t('stats.clientRating') },
  ];

  return (
    <section className="relative border-t border-primary/20">
      {/* Glow line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
      <div className="absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 py-10 sm:py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">
                <CountUp target={stat.value} suffix={stat.suffix} decimals={stat.decimals} />
              </div>
              <div className="text-sm sm:text-base text-white/50">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
