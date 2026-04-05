import { useRef, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ClipboardList, Search, Sparkles, Shield, CheckCircle2 } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const STEP_ICONS = [ClipboardList, Search, Sparkles, Shield, CheckCircle2];

export default function ProcessSection() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const steps = [
    { num: '01', title: t('process.step1Title'), desc: t('process.step1Desc') },
    { num: '02', title: t('process.step2Title'), desc: t('process.step2Desc') },
    { num: '03', title: t('process.step3Title'), desc: t('process.step3Desc') },
    { num: '04', title: t('process.step4Title'), desc: t('process.step4Desc') },
    { num: '05', title: t('process.step5Title'), desc: t('process.step5Desc') },
  ];

  useLayoutEffect(() => {
    const track = trackRef.current;
    const container = containerRef.current;
    if (!track || !container) return;

    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray<HTMLElement>('.process-step', track);

      gsap.to(panels, {
        xPercent: isAr ? 100 * (panels.length - 1) : -100 * (panels.length - 1),
        ease: 'none',
        scrollTrigger: {
          trigger: container,
          pin: true,
          scrub: 1,
          snap: 1 / (panels.length - 1),
          end: () => `+=${track.scrollWidth}`,
        },
      });
    }, container);

    return () => ctx.revert();
  }, [isAr]);

  return (
    <section ref={containerRef} className="relative overflow-hidden">
      {/* Header — visible above pinned area */}
      <div className="container mx-auto px-4 pt-16 pb-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white">{t('process.title')}</h2>
        <p className="mt-3 text-white/50">{t('process.subtitle')}</p>
      </div>

      {/* Horizontal track */}
      <div ref={trackRef} className="flex h-[60vh] min-h-[400px]">
        {steps.map((step, i) => {
          const Icon = STEP_ICONS[i];
          return (
            <div
              key={step.num}
              className="process-step flex-shrink-0 w-screen flex items-center justify-center px-4"
            >
              <div className="glass-card rounded-2xl p-8 sm:p-12 max-w-lg w-full text-center">
                {/* Step number */}
                <span className="text-primary/30 text-6xl sm:text-7xl font-bold block mb-4">
                  {step.num}
                </span>

                {/* Icon */}
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Icon className="h-8 w-8 text-primary" />
                </div>

                {/* Title */}
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">{step.title}</h3>

                {/* Description */}
                <p className="text-white/50 text-base sm:text-lg">{step.desc}</p>

                {/* Progress dots */}
                <div className="flex items-center justify-center gap-2 mt-8">
                  {steps.map((_, j) => (
                    <div
                      key={j}
                      className={`h-2 rounded-full transition-all ${
                        j === i ? 'w-8 bg-primary' : 'w-2 bg-white/15'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
