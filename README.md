# Yardline — landing page sample

A single-page marketing site for a fictional online landscape-design service, built as a
front-end design sample. Visual direction follows the warm, editorial style of modern
home-services brands (cream ground, deep forest green, clay accent, serif display type).

**Everything is self-contained.** No build step, no framework, no image or API
dependencies — all artwork is hand-authored SVG, so the page renders identically offline.

## Run it

```bash
open index.html          # macOS
python3 -m http.server   # or serve the folder and visit localhost:8000
```

## Files

```
index.html            markup and all inline SVG artwork
assets/css/styles.css  design tokens + components (one stylesheet, no preprocessor)
assets/js/main.js      mobile nav, scroll reveal, stat count-up, pricing toggle,
                       before/after slider, FAQ accordion, lead-form validation
```

## What's on the page

- Sticky header with a mobile drawer
- Hero with a rendered-yard illustration and floating detail badges
- Animated stat band (counts up once on scroll into view)
- Four-step process, ordered because the process is sequential
- Four package cards with a standard-lot / large-lot price toggle
- Deliverables section with a site-plan, palette and dusk-rendering mosaic
- Draggable before/after slider (pointer, drag and keyboard via a range input)
- Testimonials, contractor-network band, FAQ accordion
- Lead form with inline validation and a confirmation state (client-side only)
- Footer with link columns and socials

## Notes for review

- **Accessibility:** skip link, labelled controls, `aria-expanded` on the nav and FAQ,
  visible focus rings, and `prefers-reduced-motion` honored throughout.
- **Responsive:** one breakpoint set; grids collapse to a single column at phone width.
- **Typography:** Fraunces (display) + Inter (body) from Google Fonts, each with a real
  fallback stack, so the page still reads correctly if the font host is unavailable.
- **Content is placeholder.** The brand, prices, stats and testimonials are invented for
  the sample and should be replaced with real copy before any production use.
