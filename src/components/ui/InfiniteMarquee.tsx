import { useRef, useState, type ReactNode } from 'react';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { useMotion } from '../../hooks/useMotion';
import { createElasticWave } from '../../lib/elastic';

interface InfiniteMarqueeProps<T> {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  label: string;
  /** Cruising speed in px/s on desktop (mobile runs at 70%). */
  speed?: number;
}

/**
 * Elastic, wavy, endless marquee.
 *
 *  - One gsap.ticker loop drives the row; the shared elastic wave
 *    (lib/elastic) makes tiles ride a sine wave and wobble like rubber.
 *  - The row cruises slowly. Page scroll and drag/swipe push it, then its
 *    velocity eases back to cruising.
 *  - Two identical groups + modulo wrap → seamless loop with no jump.
 *  - Reduced motion: a static, wrapped grid.
 */
export function InfiniteMarquee<T>({ items, getKey, renderItem, label, speed = 34 }: InfiniteMarqueeProps<T>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
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
      const cells = Array.from(track.querySelectorAll<HTMLElement>('.marquee__item'));
      if (!group || !cells.length) return;

      const cruiseSpeed = env.desktop ? speed : speed * 0.7;
      const wave = createElasticWave(
        cells,
        env.desktop
          ? { ampRest: 16, ampMotion: 25.6, tilt: 0.6, waveSpeed: 0.9, maxSkew: 10, skewPerPx: 0.012, stretch: 0.07, energyAt: 600 }
          : { ampRest: 10, ampMotion: 16, tilt: 0.45, waveSpeed: 0.8, maxSkew: 6, skewPerPx: 0.012, stretch: 0.07, energyAt: 600 },
      );
      const { clamp, wrap } = gsap.utils;

      /* ---------- layout (re-measured on every ScrollTrigger refresh) ---------- */
      let period = 1; // width of one group, including its trailing gap
      const measure = () => {
        period = Math.max(1, group.offsetWidth);
        wave.measure(track, root.clientWidth);
      };
      measure();
      ScrollTrigger.addEventListener('refresh', measure);
      onCleanup(() => ScrollTrigger.removeEventListener('refresh', measure));

      /* ---------- state ---------- */
      const state = { x: 0, v: 0, kick: 0, dragging: false, active: false, started: false };
      const drive = { speed: 0, wave: 0 }; // both ramp up when the section first arrives
      const toSpeed = gsap.quickTo(drive, 'speed', { duration: 1.4, ease: 'power2.inOut' });

      /* ---------- frame loop ---------- */
      const tick = (_time: number, deltaMs: number) => {
        if (!state.active || pausedRef.current) return;
        const dt = Math.min(deltaMs / 1000, 1 / 30);

        const cruise = -drive.speed; // leftwards
        state.kick *= Math.exp(-dt * 2.2);
        if (state.dragging) {
          // Holding still mid-drag lets the energy bleed away.
          state.v *= Math.exp(-dt * 6);
        } else {
          const target = cruise + state.kick;
          state.v += (target - state.v) * (1 - Math.exp(-dt * 2.4));
          state.x += state.v * dt;
        }
        state.x = wrap(-period, 0, state.x);
        track.style.transform = `translate3d(${state.x.toFixed(2)}px,0,0)`;
        wave.step(dt, state.x, state.v - cruise, drive.wave);
      };
      gsap.ticker.add(tick);

      /* ---------- visibility + scroll push ---------- */
      const watch = ScrollTrigger.create({
        trigger: root,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => (state.active = self.isActive),
        onUpdate: (self) => {
          // Scrolling down pushes the row along; scrolling up briefly pulls it back.
          state.kick = clamp(-1400, 1400, state.kick * 0.5 - self.getVelocity() * 0.35);
        },
      });
      state.active = watch.isActive;

      /* ---------- entrance: tiles bounce up, the wave and the cruise ease in ---------- */
      const tiles = cells.map((c) => c.firstElementChild).filter((el): el is Element => !!el);
      const intro = gsap.fromTo(
        tiles,
        { autoAlpha: 0, y: env.desktop ? 80 : 40, scale: 0.9 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 1.4, ease: 'elastic.out(1, 0.6)', stagger: { amount: 0.8 }, paused: true },
      );
      ScrollTrigger.create({
        trigger: root,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          state.started = true;
          intro.play();
          gsap.to(drive, { wave: 1, duration: 2.2, ease: 'power2.inOut' });
          toSpeed(cruiseSpeed);
        },
      });

      /* ---------- drag / swipe with momentum ---------- */
      let lastX = 0;
      let lastT = 0;
      const onDown = (e: PointerEvent) => {
        if (e.button !== 0 || pausedRef.current) return;
        if ((e.target as HTMLElement).closest('.marquee__toggle')) return;
        state.dragging = true;
        lastX = e.clientX;
        lastT = e.timeStamp;
        root.setPointerCapture(e.pointerId);
        root.classList.add('is-dragging');
      };
      const onMove = (e: PointerEvent) => {
        if (!state.dragging) return;
        const dx = e.clientX - lastX;
        const dtMs = Math.max(e.timeStamp - lastT, 1);
        state.x += dx;
        state.v = state.v * 0.6 + ((dx / dtMs) * 1000) * 0.4;
        lastX = e.clientX;
        lastT = e.timeStamp;
      };
      const onUp = () => {
        if (!state.dragging) return;
        state.dragging = false;
        state.v = clamp(-2400, 2400, state.v); // fling, then ease back to cruising
        root.classList.remove('is-dragging');
      };
      root.addEventListener('pointerdown', onDown);
      root.addEventListener('pointermove', onMove);
      root.addEventListener('pointerup', onUp);
      root.addEventListener('pointercancel', onUp);

      // Desktop: hovering slows the cruise right down so tools can be read.
      const slow = () => state.started && toSpeed(cruiseSpeed * 0.3);
      const resume = () => state.started && toSpeed(cruiseSpeed);
      if (env.desktop) {
        root.addEventListener('pointerenter', slow);
        root.addEventListener('pointerleave', resume);
      }

      onCleanup(() => {
        gsap.ticker.remove(tick);
        root.removeEventListener('pointerdown', onDown);
        root.removeEventListener('pointermove', onMove);
        root.removeEventListener('pointerup', onUp);
        root.removeEventListener('pointercancel', onUp);
        root.removeEventListener('pointerenter', slow);
        root.removeEventListener('pointerleave', resume);
        root.classList.remove('is-dragging');
        track.style.transform = '';
        wave.reset();
      });
    },
    [items.length],
  );

  const togglePause = () => {
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
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
