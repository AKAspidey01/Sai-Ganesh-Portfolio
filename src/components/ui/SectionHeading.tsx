import { Fragment, useRef } from 'react';
import { gsap } from '../../lib/gsap';
import { useMotion } from '../../hooks/useMotion';
import { fadeUp, handwriting, scrubFor } from '../../lib/motion';
import type { HeadingPart } from '../../data/portfolio';
import { HandwritingText } from './HandwritingText';

interface SectionHeadingProps {
  parts: HeadingPart[];
  tone?: 'light' | 'dark';
  id?: string;
}

/** Plain words fade up; Pacifico parts write themselves in. Scrubbed. */
export function SectionHeading({ parts, tone = 'light', id }: SectionHeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null);

  useMotion(ref, (env) => {
    const el = ref.current;
    if (env.reduce || !el) return;
    const tl = gsap.timeline({
      scrollTrigger: { trigger: el, start: 'top 90%', end: 'top 58%', scrub: scrubFor(env) },
    });
    tl.add(fadeUp(el.querySelectorAll('.sh__word'), env, { stagger: 0.08 }), 0);
    el.querySelectorAll('.hw').forEach((script) => tl.add(handwriting(script), 0.3));
  });

  return (
    <h2 ref={ref} id={id} className={`section-heading section-heading--${tone}`}>
      {parts.map((part, i) =>
        part.script ? (
          <HandwritingText key={i} text={part.text} className="hw--accent" />
        ) : (
          <Fragment key={i}>
            {part.text.split(/(\s+)/).map((chunk, j) =>
              chunk.trim() ? (
                <span key={j} className="sh__word">
                  {chunk}
                </span>
              ) : (
                <Fragment key={j}>{chunk}</Fragment>
              ),
            )}
          </Fragment>
        ),
      )}
    </h2>
  );
}
