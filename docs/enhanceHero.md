**Layout:** Full screen `100vh`, video fills entire background, dark overlay `rgba(0,0,0,0.55)`, content centered.

**Visual Treatment:**
- Background: looping `.mp4` / `.webm` video (orbital polisher on dark car)
- Overlay: gradient from `rgba(0,0,0,0.7)` at top to `rgba(0,0,0,0.3)` at center to `rgba(10,10,15,1)` at bottom (so it bleeds into next section seamlessly)
- A subtle animated **noise texture** on top of the overlay using a CSS pseudo-element for film grain feel

**Content (centered, RTL when Arabic):**
```
[Eyebrow tag]  حماية احترافية لسيارتك  (small, electric-blue, letter-spaced)
[H1]           اجعل سيارتك تتألق
               بحماية استثنائية          (huge, 72–96px, white, Tajawal Bold)
[Subtext]      تغليف PPF • طلاء سيراميكي • تظليل زجاج (muted, 18px)
[CTA Row]      [احجز الآن →]   [اكتشف خدماتنا]   (primary + ghost buttons)
[Trust row]    ✓ 500+ عميل  ✓ ضمان سنتين  ✓ فريق معتمد  (small, muted)
```