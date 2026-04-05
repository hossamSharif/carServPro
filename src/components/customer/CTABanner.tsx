import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CTABanner() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Blurred background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'linear-gradient(135deg, hsl(217 91% 20%), hsl(240 20% 8%))',
        }}
      />
      <div className="absolute inset-0 backdrop-blur-sm bg-black/40" />

      {/* Decorative glow orbs */}
      <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4"
        >
          {t('cta.title')}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-white/50 text-lg max-w-xl mx-auto mb-10"
        >
          {t('cta.subtitle')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative inline-block"
        >
          {/* Pulsing glow ring */}
          <div className="absolute inset-0 rounded-xl bg-primary/40 animate-ping opacity-20" />
          <div className="absolute -inset-1 rounded-xl bg-primary/20 blur-md" />

          <Link
            to="/services"
            className="relative inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 transition-all hover:shadow-[0_0_40px_rgba(37,99,235,0.4)]"
          >
            {t('cta.button')}
            <ArrowIcon className="h-5 w-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
