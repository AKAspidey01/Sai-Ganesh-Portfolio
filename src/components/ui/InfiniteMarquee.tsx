import { useRef, useState, type ReactNode } from 'react';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { useMotion } from '../../hooks/useMotion';

interface InfiniteMarqueeProps<T> {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  label: string;
  /** Cruising speed in px/s on desktop (mobile runs at 70%). */
  speed?: number;
}

/** Per-tile damped spring: under-damped on purpose so tiles wobble like rubber. */
interface Spring {
  k: number; // stiffness
  d: number; // damping
  skew: number;
  skewV: number;
  stretch: number;
  stretchV: number;
}

/**
 * Elastic, wavy, endless marquee.
 *
 *  - One gsap.ticker loop owns everything, so the row, wave and rubber stay in sync.
 *  - The row cruises slowly; each tile rides a travelling sine wave
 *    (lifts, dips and leans with the wave's slope).
 *  - Page scroll and drag/swipe push the row. Its velocity then eases back
 *    to cruising, while per-tile springs make the tiles lean, stretch and wobble
 *    like rubber before settling.
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

      const cfg = env.desktop
        ? { speed, amp: 16, tilt: 0.6, maxSkew: 10, waveSpeed: 0.9 }
        : { speed: speed * 0.7, amp: 10, tilt: 0.45, maxSkew: 6, waveSpeed: 0.8 };
      const { clamp, wrap } = gsap.utils;

      /* ---------- layout (re-measured on every ScrollTrigger refresh) ---------- */
      let period = 1; // width of one group, including its trailing gap
      let centers: number[] = [];
      let waveK = 0; // wave number (radians per px)
      const measure = () => {
        period = Math.max(1, group.offsetWidth);
        centers = cells.map((c) => c.offsetLeft + c.offsetWidth / 2);
        waveK = (Math.PI * 2) / Math.max(720, root.clientWidth * 0.85);
      };
      measure();
      ScrollTrigger.addEventListener('refresh', measure);
      onCleanup(() => ScrollTrigger.removeEventListener('refresh', measure));

      /* ---------- state ---------- */
      const state = { x: 0, v: 0, kick: 0, t: 0, dragging: false, active: false, started: false };
      const drive = { speed: 0, wave: 0 }; // both ramp up when the section first arrives
      const toSpeed = gsap.quickTo(drive, 'speed', { duration: 1.4, ease: 'power2.inOut' });
      const springs: Spring[] = cells.map((_, i) => {
        const k = 130 + (i % 5) * 14; // slightly different stiffness → tiles wobble out of phase
        return { k, d: 2 * 0.32 * Math.sqrt(k), skew: 0, skewV: 0, stretch: 0, stretchV: 0 };
      });

      /* ---------- frame loop ---------- */
      const tick = (_time: number, deltaMs: number) => {
        if (!state.active || pausedRef.current) return;
        const dt = Math.min(deltaMs / 1000, 1 / 30);
        state.t += dt;

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

        // Deviation from calm cruising drives the rubber and the wave height.
        const dev = state.v - cruise;
        const energy = Math.min(Math.abs(dev) / 600, 1);
        const amp = cfg.amp * drive.wave * (1 + energy * 0.6);
        const skewTarget = clamp(-cfg.maxSkew, cfg.maxSkew, dev * 0.012);
        const stretchTarget = energy * 0.07;

        for (let i = 0; i < cells.length; i++) {
          const s = springs[i];
          s.skewV += (s.k * (skewTarget - s.skew) - s.d * s.skewV) * dt;
          s.skew += s.skewV * dt;
          s.stretchV += (s.k * (stretchTarget - s.stretch) - s.d * s.stretchV) * dt;
          s.stretch += s.stretchV * dt;

          const phase = (centers[i] + state.x) * waveK - state.t * cfg.waveSpeed;
          const y = Math.sin(phase) * amp;
          const lean = Math.atan(Math.cos(phase) * amp * waveK) * (180 / Math.PI) * cfg.tilt;
          const sx = 1 + s.stretch;
          const sy = 1 - s.stretch * 0.5;
          cells[i].style.transform =
            `translate3d(0,${y.toFixed(2)}px,0) rotate(${lean.toFixed(3)}deg) ` +
            `skewX(${s.skew.toFixed(3)}deg) scale(${sx.toFixed(4)},${sy.toFixed(4)})`;
        }
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
          toSpeed(cfg.speed);
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
      const slow = () => state.started && toSpeed(cfg.speed * 0.3);
      const resume = () => state.started && toSpeed(cfg.speed);
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
        cells.forEach((c) => (c.style.transform = ''));
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
