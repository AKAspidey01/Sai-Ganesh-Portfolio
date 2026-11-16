import { useRef, type ReactNode } from 'react';
import { gsap } from '../../lib/gsap';
import { useMotion } from '../../hooks/useMotion';
import { scrubFor } from '../../lib/motion';

interface HorizontalPinnedGalleryProps<T> {
  /** Closest ancestor that pins while the track travels. Resolved from the DOM
   *  because a parent's ref isn't attached yet when this child's effect runs. */
  pinSelector?: string;
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T, index: number) => ReactNode;
  label: string;
  className?: string;
}

/**
 * Shared by Projects and Reviews.
 * Vertical scroll → section pins → track translates horizontally (scrubbed,
 * reversible) → last item reaches the edge → section unpins.
 * Reduced motion falls back to a native, swipeable horizontal list.
 */
export function HorizontalPinnedGallery<T>({ pinSelector = 'section', items, getKey, renderItem, label, className = '' }: HorizontalPinnedGalleryProps<T>) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);

  useMotion(
    viewportRef,
    (env, onCleanup) => {
      const viewport = viewportRef.current;
      const track = trackRef.current;
      const pin = viewport?.closest<HTMLElement>(pinSelector);
      if (!viewport || !track || !pin) return;

      if (env.reduce) {
        viewport.classList.add('hpg--native');
        onCleanup(() => viewport.classList.remove('hpg--native'));
        return;
      }

      const cards = track.querySelectorAll('.hpg__item');
      const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);

      // Cards rise in as the section arrives (before the pin engages).
      gsap.fromTo(
        cards,
        { autoAlpha: 0, y: env.desktop ? 90 : 40 },
        {
          autoAlpha: 1,
          y: 0,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: { trigger: viewport, start: 'top 98%', end: 'top 55%', scrub: scrubFor(env) },
        },
      );

      const travel = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: pin,
          start: () => (pin.offsetHeight > window.innerHeight ? 'bottom bottom' : 'top top'),
          end: () => `+=${distance()}`,
          pin: true,
          scrub: env.desktop ? 1 : 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Desktop: media drifts inside each card while the track moves.
      if (env.desktop) {
        track.querySelectorAll<HTMLElement>('.hpg__parallax').forEach((media) => {
          gsap.fromTo(
            media,
            { xPercent: -6 },
            {
              xPercent: 6,
              ease: 'none',
              scrollTrigger: {
                trigger: media.closest('.hpg__item'),
                containerAnimation: travel,
                start: 'left right',
                end: 'right left',
                scrub: true,
              },
            },
          );
        });
      }
    },
    [items.length],
  );

  return (
    <div ref={viewportRef} className={`hpg ${className}`} role="region" aria-label={label} tabIndex={-1}>
      <ul ref={trackRef} className="hpg__track">
        {items.map((item, i) => (
          <li key={getKey(item)} className="hpg__item">
            {renderItem(item, i)}
          </li>
        ))}
      </ul>
    </div>
  );
}
