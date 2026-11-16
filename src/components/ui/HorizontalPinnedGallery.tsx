import { useRef, type ReactNode } from 'react';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { useMotion } from '../../hooks/useMotion';
import { scrubFor } from '../../lib/motion';
import { createElasticWave } from '../../lib/elastic';

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
 * Cards get the shared elastic wave (lib/elastic), driven by the track's
 * real velocity, so they ride, lean, stretch and wobble as the row slides.
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

      const cards = track.querySelectorAll<HTMLElement>('.hpg__item');
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
          // A touch more catch-up lag than before → the track glides instead of tracking the wheel 1:1.
          scrub: env.desktop ? 1.4 : 0.9,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      /* ---------- Elastic layer ----------
         Scroll still owns the position (scrub). Every frame we read where the
         track actually is, derive its velocity, and feed that to the shared
         rubber wave: cards ride the wave, lean/stretch with the slide, then
         wobble and settle once scrolling stops. Applied to the card inside
         each <li> so it never fights the rise-in tween on the <li>. */
      const faces = Array.from(cards)
        .map((li) => li.firstElementChild)
        .filter((el): el is HTMLElement => el instanceof HTMLElement);
      const wave = createElasticWave(
        faces,
        env.desktop
          ? { ampRest: 4, ampMotion: 20, tilt: 0.55, waveSpeed: 0.7, maxSkew: 9, skewPerPx: 0.011, stretch: 0.06, energyAt: 900 }
          : { ampRest: 2, ampMotion: 12, tilt: 0.45, waveSpeed: 0.6, maxSkew: 6, skewPerPx: 0.009, stretch: 0.05, energyAt: 800 },
      );
      const measure = () => wave.measure(track, viewport.clientWidth);
      measure();
      ScrollTrigger.addEventListener('refresh', measure);

      let visible = false;
      let lastX = Number(gsap.getProperty(track, 'x')) || 0;
      let velocity = 0;
      const tick = (_time: number, deltaMs: number) => {
        if (!visible || deltaMs <= 0) return;
        const dt = Math.min(deltaMs / 1000, 1 / 30);
        const x = Number(gsap.getProperty(track, 'x')) || 0;
        const raw = gsap.utils.clamp(-4000, 4000, (x - lastX) / dt);
        lastX = x;
        velocity += (raw - velocity) * (1 - Math.exp(-dt * 12)); // smooth frame-to-frame noise
        wave.step(dt, x, velocity);
      };
      gsap.ticker.add(tick);

      // Only spend frames while the row is on screen (works while pinned, too).
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        lastX = Number(gsap.getProperty(track, 'x')) || 0;
      }, { rootMargin: '120px 0px' });
      io.observe(viewport);

      // Keyboard: tabbing to an off-screen card scrolls the page to where the
      // scrub brings that card into view (the row itself never scrolls sideways).
      const onFocusIn = (e: FocusEvent) => {
        const st = travel.scrollTrigger;
        const item = (e.target as HTMLElement).closest<HTMLElement>('.hpg__item');
        const d = distance();
        if (!st || !item || !d) return;
        // Item position inside the (translated) track, measured transform-aware.
        const inTrack = item.getBoundingClientRect().left - track.getBoundingClientRect().left;
        const want = gsap.utils.clamp(0, d, inTrack - viewport.clientWidth * 0.1);
        window.scrollTo({ top: st.start + (want / d) * (st.end - st.start) });
      };
      viewport.addEventListener('focusin', onFocusIn);

      onCleanup(() => {
        gsap.ticker.remove(tick);
        io.disconnect();
        ScrollTrigger.removeEventListener('refresh', measure);
        viewport.removeEventListener('focusin', onFocusIn);
        wave.reset();
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
