---

### SECTION 2 — Animated Stats Bar

**Layout:** Full-width dark strip between hero and services, 4 stat counters inline.

**Visual:** Thin top border with electric-blue glow, counters animate up from 0 when section enters viewport.
```
500+        98%         5 سنوات      4.9 ★
عميل راضٍ  معدل الرضا  خبرة         تقييم العملاء
```

**Animation:** Framer Motion `useInView` + count-up animation using `motionValue`.

---

### SECTION 3 — Services Grid (The main catalog preview)

**Layout:** 2-column grid on desktop, 1-column on mobile. Each card is `glassmorphism` style.

**Card Design:**
```
[Full-bleed image/video thumbnail on top half]
[Bottom half: dark glass panel]
  Category badge (electric blue, small)
  Service name (Arabic, bold white)
  Short description (muted gray, 2 lines)
  Price: "يبدأ من ٢٥٠ ر.س"
  [احجز الخدمة →] button
Glass Card CSS:
cssbackground: rgba(255, 255, 255, 0.04);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.08);
box-shadow: 0 0 40px rgba(37, 99, 235, 0.08);
Animation (Framer Motion):
jsx<motion.div
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-80px" }}
  transition={{ duration: 0.5, delay: index * 0.1 }}
  whileHover={{ 
    y: -8, 
    boxShadow: "0 0 60px rgba(37,99,235,0.25)",
    borderColor: "rgba(37,99,235,0.4)"
  }}
>
```

---

### SECTION 4 — "Our Process" Horizontal Scroll (CINEMATIC)

This is the **most impressive section** — a horizontally-scrolling timeline pinned to the viewport while user scrolls vertically. Each step reveals with the video playing in background.

**Steps:**
```
01 الاستقبال → 02 الفحص → 03 التحضير → 04 التطبيق → 05 التسليم
GSAP Implementation:
jsxuseEffect(() => {
  const ctx = gsap.context(() => {
    const sections = gsap.utils.toArray('.process-step')
    gsap.to(sections, {
      xPercent: -100 * (sections.length - 1),
      ease: 'none',
      scrollTrigger: {
        trigger: '.process-track',
        pin: true,
        scrub: 1,
        snap: 1 / (sections.length - 1),
        end: () => `+=${document.querySelector('.process-track').offsetWidth}`
      }
    })
  })
  return () => ctx.revert()
}, [])