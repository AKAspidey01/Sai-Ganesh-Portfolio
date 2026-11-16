import { useRef } from 'react';
import { gsap } from '../../lib/gsap';
import { useMotion } from '../../hooks/useMotion';
import type { SocialLink as Social } from '../../data/portfolio';
import { PixelGrid } from './PixelGrid';

/**
 * Hover / focus / touch: black pixels fill the square, then the label turns
 * white. Each link owns its timeline so items never interfere.
 */
export function SocialLink({ social }: { social: Social }) {
  const ref = useRef<HTMLAnchorElement>(null);

  useMotion(ref, (env, onCleanup) => {
    const el = ref.current;
    if (env.reduce || !el) {
      el?.classList.add('social--static');
      onCleanup(() => el?.classList.remove('social--static'));
      return;
    }
    const tl = gsap
      .timeline({ paused: true })
      .fromTo(
        el.querySelectorAll('.pf__cell'),
        { scale: 0, autoAlpha: 0 },
        { scale: 1.02, autoAlpha: 1, duration: 0.22, ease: 'power2.out', stagger: { amount: env.desktop ? 0.28 : 0.18, from: 'random' } },
        0,
      )
      .to(el.querySelector('.social__label'), { color: '#ffffff', duration: 0.2 }, 0.22);

    const on = () => tl.timeScale(1).play();
    const off = () => tl.timeScale(1.4).reverse();
    const events: Array<[string, () => void]> = [
      ['pointerenter', on],
      ['pointerleave', off],
      ['focus', on],
      ['blur', off],
      ['touchstart', on],
      ['touchend', off],
      ['touchcancel', off],
    ];
    events.forEach(([type, fn]) => el.addEventListener(type, fn, { passive: true }));
    onCleanup(() => events.forEach(([type, fn]) => el.removeEventListener(type, fn)));
  });

  const external = social.href.startsWith('http');
  return (
    <a
      ref={ref}
      className="social"
      href={social.href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      <PixelGrid cols={10} rows={5} className="social__pixels" />
      <span className="social__label">{social.label}</span>
      {external && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  );
}
