import { useRef } from 'react';
import { useMotion } from '../../hooks/useMotion';
import { lineReveal, scrubFor } from '../../lib/motion';

interface LineRevealProps {
  /** Where the dot sits; the line grows away from it. */
  dotAt?: 'start' | 'end' | 'none';
  /** load → plays once after `delay`; scroll → scrubbed while it enters; none → parent animates it. */
  trigger?: 'load' | 'scroll' | 'none';
  delay?: number;
  className?: string;
}

export function LineReveal({ dotAt = 'start', trigger = 'scroll', delay = 0, className = '' }: LineRevealProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useMotion(ref, (env) => {
    if (env.reduce || trigger === 'none' || !ref.current) return;
    if (trigger === 'load') {
      lineReveal(ref.current, { delay });
    } else {
      lineReveal(ref.current, {
        scrollTrigger: { trigger: ref.current, start: 'top 92%', end: 'top 60%', scrub: scrubFor(env) },
      });
    }
  });

  return (
    <span ref={ref} aria-hidden="true" className={`lr lr--${dotAt} ${className}`}>
      <span className="lr__line" />
      {dotAt !== 'none' && <span className="lr__dot" />}
    </span>
  );
}
