# A. Sai Ganesh — Portfolio

React + TypeScript + Vite + GSAP (ScrollTrigger). Built from the Figma reference.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build → dist/
```

## Before you ship

| What | Where |
| --- | --- |
| Beatrice Headline web licence (trial files are included now) | `public/fonts/` — see README there |
| Official tool logos (Figma, React, VS Code, Framer…) | `public/icons/`, then set `logo` in `src/data/portfolio.ts` |
| Real project covers, links, extra reviews (`// placeholder` items) | `src/data/portfolio.ts` |
| Social URLs | `src/data/portfolio.ts` → `socials` |
| Form backend (currently opens the visitor's mail app) | `src/components/ui/ContactForm.tsx` → `handleSubmit` |

## Structure

```
src/
  data/portfolio.ts          all content (projects, reviews, KPIs, tools, skills, socials, contact)
  lib/gsap.ts                plugin registration + defaults
  lib/motion.ts              reusable builders: pixelFormation, lineReveal, handwriting, baselineRise, fadeUp
  hooks/useMotion.ts         gsap.matchMedia wrapper → desktop / mobile / reduced-motion
  hooks/useCoinJourney.ts    scroll-scrubbed Hero → About coin flight
  components/
    coin/PictureCoin.tsx     two-faced 3D coin (travel / stage / spin / body layers)
    layout/Header, Footer
    sections/Hero, About, Projects, Skills, Reviews, Contact
    ui/  SectionPill, SectionHeading, HandwritingText, SplitChars, RollingText,
         PixelFormation, PixelGrid, LineReveal, KPIBlock, HorizontalPinnedGallery,
         InfiniteMarquee, SkillProgress, ProjectCard, ReviewCard, ToolTile,
         ContactForm, SocialLink, DashboardMock, Icons
  styles/                    tokens, base, primitives, one file per section
```

## Motion notes

- Every animation goes through `useMotion`, so triggers are created inside a
  `gsap.matchMedia` context and are reverted on unmount, breakpoint change and HMR.
- **Desktop** gets full depth, blur, parallax and long travel. **Mobile** keeps the
  same choreography with less depth, no blur and shorter distances.
- **prefers-reduced-motion**: no scrubbing or 3D; content renders in its final
  state, galleries become native swipe rows, the marquee becomes a static grid,
  and a static colour portrait sits in the About slot.
- Projects and Reviews share `HorizontalPinnedGallery` — add items to the data file
  and the pin length recalculates automatically.
- The coin's travel target is measured from layout (`offsetTop` chain), not the
  transformed box, so resizes mid-scroll stay accurate.
- No smooth-scroll library: native scrolling + ScrollTrigger scrub already gives a
  smooth result without scroll-jacking. If you add Lenis later, wire it with
  `lenis.on('scroll', ScrollTrigger.update)` and drive it from `gsap.ticker`.
