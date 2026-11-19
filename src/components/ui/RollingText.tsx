import { useRef } from 'react';
import { gsap } from '../../lib/gsap';
import { useMotion } from '../../hooks/useMotion';
import { scrubFor } from '../../lib/motion';
import { SplitChars } from './SplitChars';

interface RollingTextProps {
  text: string;
  className?: string;
  /** ScrollTrigger start/end for the scrub. */
  start?: string;
  end?: string;
}

/**
 * Letters roll up out of their own baseline mask: each glyph rotates on its
 * bottom edge while rising, staggered left → right, scrubbed by scroll.
 */
export function RollingText({ text, className = '', start = 'top 92%', end = 'top 45%' }: RollingTextProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useMotion(ref, (env) => {
    const el = ref.current;
    if (env.reduce || !el) return;
    gsap.fromTo(
      el.querySelectorAll('.sc__char'),
      { yPercent: 115, rotateX: env.desktop ? -95 : -60, transformOrigin: '50% 100% -0.2em' },
      {
        yPercent: 0,
        rotateX: 0,
        ease: 'power2.out',
        stagger: 0.07,
        // clamp(): on tall screens the page can't scroll far enough to reach the
        // end point (e.g. the footer), so cap it at the max scroll to always finish.
        scrollTrigger: { trigger: el, start: `clamp(${start})`, end: `clamp(${end})`, scrub: scrubFor(env, 1, 0.6) },
      },
    );
  });

  return (
    <span ref={ref} className={`rolling ${className}`}>
      <SplitChars text={text} />
    </span>
  );
}
