import { useRef } from 'react';
import { useMotion } from '../../hooks/useMotion';
import { pixelFormation, scrubFor } from '../../lib/motion';
import { PixelFormation } from './PixelFormation';

interface SectionPillProps {
  label: string;
  tone?: 'light' | 'dark';
}

/** Shared section label. Scroll-scrubbed pixel formation + zoom → sharp. */
export function SectionPill({ label, tone = 'light' }: SectionPillProps) {
  const ref = useRef<HTMLDivElement>(null);

  useMotion(ref, (env) => {
    if (env.reduce || !ref.current) return;
    pixelFormation(ref.current, env, {
      zoom: 1.6,
      vars: { scrollTrigger: { trigger: ref.current, start: 'top 94%', end: 'top 66%', scrub: scrubFor(env) } },
    });
  });

  return (
    <div ref={ref} className={`section-pill-wrap section-pill-wrap--${tone}`}>
      <PixelFormation cols={10} rows={3} contentClassName={`section-pill section-pill--${tone}`}>
        <span className="section-pill__dot" aria-hidden="true" />
        {label}
      </PixelFormation>
    </div>
  );
}
