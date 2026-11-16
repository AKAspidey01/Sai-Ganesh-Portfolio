import { useRef, useState, type ReactNode } from 'react';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { useMotion } from '../../hooks/useMotion';

interface InfiniteMarqueeProps<T> {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  label: string;
  /** Pixels per second on desktop (mobile runs at 70%). */
  speed?: number;
}

/**
 * Automatic, seamless marquee (not scroll-driven).
 * Two identical groups; each carries its trailing gap as padding so a
 * -50% translate lands exactly where it started → no visible jump.
 * Items first rise in with a stagger, then the loop starts.
 */
export function InfiniteMarquee<T>({ items, getKey, renderItem, label, speed = 55 }: InfiniteMarqueeProps<T>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const loopRef = useRef<gsap.core.Tween | null>(null);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  useMotion(
    rootRef,
    (env, onCleanup) => {
      const root = rootRef.current;
      const track = trackRef.current;
      if (!root || !track) return;
      if (env.reduce) {
        root.classList.add('marquee--static');
        onCleanup(() => root.classList.remove('marquee--static'));
        return;
      }

      const group = track.querySelector<HTMLElement>('.marquee__group');
      const cells = track.querySelectorAll('.marquee__item');
      const startLoop = () => {
        if (!group) return;
        loopRef.current = gsap.to(track, {
          xPercent: -50,
          ease: 'none',
          duration: group.offsetWidth / (env.desktop ? speed : speed * 0.7),
          repeat: -1,
          paused: pausedRef.current,
        });
      };

      const intro = gsap.fromTo(
        cells,
        { autoAlpha: 0, y: env.desktop ? 70 : 36 },
        { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: { amount: 0.9 }, paused: true, onComplete: startLoop },
      );
      ScrollTrigger.create({ trigger: root, start: 'top 85%', once: true, onEnter: () => intro.play() });

      // Don't spend frames on an off-screen loop.
      ScrollTrigger.create({
        trigger: root,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => {
          const loop = loopRef.current;
          if (!loop || pausedRef.current) return;
          if (self.isActive) loop.resume();
          else loop.pause();
        },
      });

      if (env.desktop) {
        const slow = () => loopRef.current && gsap.to(loopRef.current, { timeScale: 0.2, duration: 0.6, overwrite: true });
        const resume = () => loopRef.current && gsap.to(loopRef.current, { timeScale: 1, duration: 0.6, overwrite: true });
        root.addEventListener('pointerenter', slow);
        root.addEventListener('pointerleave', resume);
        onCleanup(() => {
          root.removeEventListener('pointerenter', slow);
          root.removeEventListener('pointerleave', resume);
        });
      }
      onCleanup(() => {
        loopRef.current?.kill();
        loopRef.current = null;
      });
    },
    [items.length],
  );

  const togglePause = () => {
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
    if (next) loopRef.current?.pause();
    else loopRef.current?.resume();
  };

  const group = (hidden: boolean) => (
    <ul className="marquee__group" aria-hidden={hidden || undefined}>
      {items.map((item) => (
        <li key={getKey(item)} className="marquee__item">
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );

  return (
    <div ref={rootRef} className="marquee" role="region" aria-label={label}>
      <div ref={trackRef} className="marquee__track">
        {group(false)}
        {group(true)}
      </div>
      <button type="button" className="marquee__toggle" onClick={togglePause} aria-pressed={paused}>
        {paused ? 'Play tools marquee' : 'Pause tools marquee'}
      </button>
    </div>
  );
}
