import { useRef, type RefObject } from 'react';
import { gsap } from '../../lib/gsap';
import { useMotion } from '../../hooks/useMotion';
import { scrubFor } from '../../lib/motion';
import { headings, kpis } from '../../data/portfolio';
import { SectionPill } from '../ui/SectionPill';
import { SectionHeading } from '../ui/SectionHeading';
import { LineReveal } from '../ui/LineReveal';
import { KPIBlock } from '../ui/KPIBlock';
import portraitColor from '../../assets/portrait-color.webp';

interface AboutProps {
  /** Where the hero coin lands (measured by the coin journey in App). */
  slotRef: RefObject<HTMLDivElement>;
}

export function About({ slotRef }: AboutProps) {
  const fieldRef = useRef<HTMLDivElement>(null);

  useMotion(fieldRef, (env) => {
    const field = fieldRef.current;
    if (env.reduce || !field) return;

    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      scrollTrigger: { trigger: field, start: 'top 88%', end: 'center 52%', scrub: scrubFor(env, 1, 0.6) },
    });

    // Divider draws out of the coin toward both edges.
    tl.fromTo(field.querySelectorAll('.lr__line'), { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'power2.inOut' }, 0);

    field.querySelectorAll<HTMLElement>('.kpi').forEach((kpi, i) => {
      const fromLeft = kpi.classList.contains('kpi--top-left') || kpi.classList.contains('kpi--bottom-left');
      const at = 0.15 + i * 0.12;
      // Emerges from the centre of its own block, drifting out from the coin.
      tl.fromTo(
        kpi,
        { autoAlpha: 0, scale: env.desktop ? 0.6 : 0.8, x: (fromLeft ? 1 : -1) * (env.desktop ? 90 : 24) },
        { autoAlpha: 1, scale: 1, x: 0, duration: 0.9 },
        at,
      )
        .fromTo(kpi.querySelectorAll('.sc__char'), { yPercent: 110, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.7, stagger: 0.06 }, at + 0.2)
        .fromTo(kpi.querySelector('.kpi__label'), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.6 }, at + 0.45);
    });
  });

  return (
    <section id="about" className="section section--light about" aria-labelledby="about-title">
      <div className="container">
        <SectionPill label={headings.about.pill} />
        <SectionHeading id="about-title" parts={headings.about.parts} />

        <div ref={fieldRef} className="kpi-field">
          <LineReveal dotAt="none" trigger="none" className="kpi-field__line kpi-field__line--left" />
          <LineReveal dotAt="none" trigger="none" className="kpi-field__line kpi-field__line--right" />
          {kpis.map((kpi) => (
            <KPIBlock key={kpi.id} kpi={kpi} />
          ))}
          <div ref={slotRef} className="kpi-field__slot">
            {/* Shown only for reduced motion; otherwise the hero coin lands here. */}
            <img className="kpi-field__static" src={portraitColor} alt="" width={640} height={640} loading="lazy" decoding="async" />
          </div>
        </div>
      </div>
    </section>
  );
}
