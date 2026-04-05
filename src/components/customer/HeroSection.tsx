import { useRef, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import gsap from 'gsap';
import heroVideo from '@/vid/Hand_polishing_luxury_suv_hood_f4fc3ccc5e.mp4';

export default function HeroSection() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const eyebrowRef = useRef<HTMLSpanElement>(null);
  const title1Ref = useRef<HTMLSpanElement>(null);
  const title2Ref = useRef<HTMLSpanElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const trustRef = useRef<HTMLDivElement>(null);

  const trustItems = [
    t('hero.trustClients'),
    t('hero.trustWarranty'),
    t('hero.trustTeam'),
  ];

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Set initial states
      gsap.set(videoRef.current, { opacity: 0 });
      gsap.set(eyebrowRef.current, { opacity: 0, y: 20 });
      gsap.set([title1Ref.current, title2Ref.current], { opacity: 0, y: 30 });
      gsap.set(subtitleRef.current, { opacity: 0 });
      gsap.set(ctaRef.current?.children ?? [], { opacity: 0, scale: 0.9 });
      gsap.set(trustRef.current, { opacity: 0 });

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // t=0.0s → video fades in from black
      tl.to(videoRef.current, { opacity: 1, duration: 1.2 }, 0);

      // t=0.3s → eyebrow slides up + fades in
      tl.to(eyebrowRef.current, { opacity: 1, y: 0, duration: 0.7 }, 0.3);

      // t=0.5s → H1 line 1 slides up
      tl.to(title1Ref.current, { opacity: 1, y: 0, duration: 0.7 }, 0.5);

      // t=0.7s → H1 line 2 slides up
      tl.to(title2Ref.current, { opacity: 1, y: 0, duration: 0.7 }, 0.7);

      // t=0.9s → subtext fades in
      tl.to(subtitleRef.current, { opacity: 1, duration: 0.6 }, 0.9);

      // t=1.1s → CTA buttons scale in with spring
      tl.to(ctaRef.current?.children ?? [], {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: 'back.out(1.7)',
        stagger: 0.1,
      }, 1.1);

      // t=1.3s → trust row fades in
      tl.to(trustRef.current, { opacity: 1, duration: 0.6 }, 1.3);

      // ∞ → Ken Burns slow zoom on video
      gsap.to(videoRef.current, {
        scale: 1.05,
        duration: 8,
        ease: 'none',
        repeat: -1,
        yoyo: true,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative h-screen min-h-[600px] overflow-hidden bg-black">
      {/* Video background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover will-change-transform"
      >
        <source src={heroVideo} type="video/mp4" />
      </video>

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(10,10,15,1) 100%)',
        }}
      />

      {/* Noise texture */}
      <div className="hero-noise absolute inset-0 overflow-hidden" />

      {/* Content */}
      <div className="relative z-10 flex h-full items-center justify-center">
        <div className="container mx-auto px-4 flex flex-col items-center text-center">
          {/* Eyebrow */}
          <span
            ref={eyebrowRef}
            className="text-primary text-sm sm:text-base font-medium tracking-widest uppercase mb-4"
          >
            {t('hero.eyebrow')}
          </span>

          {/* Title */}
          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold text-white leading-tight">
            <span ref={title1Ref} className="block">
              {t('hero.title1')}
            </span>
            <span ref={title2Ref} className="block">
              {t('hero.title2')}
            </span>
          </h1>

          {/* Subtitle */}
          <p ref={subtitleRef} className="mt-6 text-lg text-white/60 max-w-2xl">
            {t('hero.subtitle')}
          </p>

          {/* CTA Row */}
          <div ref={ctaRef} className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              to="/services"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 hover:shadow-glow transition-all text-lg"
            >
              {t('customer.bookNow')}
              <ArrowIcon className="h-5 w-5" />
            </Link>

            <Link
              to="/services"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-md border border-white/20 text-white font-medium hover:bg-white/5 transition-colors text-lg"
            >
              {t('hero.discoverServices')}
            </Link>
          </div>

          {/* Trust badges */}
          <div ref={trustRef} className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-8">
            {trustItems.map((item) => (
              <div key={item} className="flex items-center gap-2 text-white/50 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
