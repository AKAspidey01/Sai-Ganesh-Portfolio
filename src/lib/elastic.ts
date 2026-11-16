/**
 * Shared "rubber wave" for horizontal rows (Skills marquee, Projects, Reviews).
 *
 * Each element rides a travelling sine wave (lifts, dips and leans with the
 * slope) and owns an under-damped spring, so when the row's speed changes
 * the element skews, stretches and wobbles like rubber before settling.
 *
 * The caller owns *how* the row moves (auto-cruise, scroll scrub, drag) and
 * just reports the row offset and its velocity every frame via `step()`.
 * Transforms are written straight to `style.transform`, so the elements
 * passed in must not be animated by anything else.
 */
export interface ElasticWaveConfig {
  /** Wave height (px) when the row is calm. */
  ampRest: number;
  /** Wave height (px) at full energy (fast motion). */
  ampMotion: number;
  /** Share of the wave slope turned into lean (0–1). */
  tilt: number;
  /** How fast the wave itself travels (rad/s). */
  waveSpeed: number;
  /** Max rubber skew (deg). */
  maxSkew: number;
  /** Skew degrees per px/s of velocity. */
  skewPerPx: number;
  /** Max horizontal stretch at full energy (0.07 = 7%). */
  stretch: number;
  /** Velocity (px/s) that counts as full energy. */
  energyAt: number;
}

interface Spring {
  k: number;
  d: number;
  skew: number;
  skewV: number;
  stretch: number;
  stretchV: number;
}

const DAMPING_RATIO = 0.32; // < 1 → overshoots and wobbles

/**
 * Left edge of `el` inside `container`, ignoring transforms. Walks the
 * offsetParent chain because browsers treat *transformed* ancestors (e.g. a
 * <li> GSAP is animating) as offsetParents, so a single offsetLeft can be
 * relative to the wrong box.
 */
function leftWithin(el: HTMLElement, container: HTMLElement): number {
  let left = 0;
  let node: HTMLElement | null = el;
  while (node && node !== container) {
    left += node.offsetLeft;
    node = node.offsetParent as HTMLElement | null;
  }
  return left;
}

export function createElasticWave(els: HTMLElement[], cfg: ElasticWaveConfig) {
  const springs: Spring[] = els.map((_, i) => {
    const k = 130 + (i % 5) * 14; // slightly different stiffness → neighbours wobble out of phase
    return { k, d: 2 * DAMPING_RATIO * Math.sqrt(k), skew: 0, skewV: 0, stretch: 0, stretchV: 0 };
  });
  let centers: number[] = [];
  let waveK = 0;
  let t = 0;

  return {
    /**
     * Cache layout. `track` is the element that gets translated (its
     * untransformed left edge must line up with the visible row's left edge);
     * `viewportWidth` sets the wavelength.
     */
    measure(track: HTMLElement, viewportWidth: number) {
      centers = els.map((el) => leftWithin(el, track) + el.offsetWidth / 2);
      waveK = (Math.PI * 2) / Math.max(720, viewportWidth * 0.85);
    },

    /**
     * @param dt        seconds since last frame
     * @param offset    current row translation (px)
     * @param velocity  row speed relative to "calm" (px/s; sign = direction)
     * @param ampScale  0–1 multiplier for the wave (e.g. ramped in on entrance)
     */
    step(dt: number, offset: number, velocity: number, ampScale = 1) {
      t += dt;
      const energy = Math.min(Math.abs(velocity) / cfg.energyAt, 1);
      const amp = (cfg.ampRest + (cfg.ampMotion - cfg.ampRest) * energy) * ampScale;
      const skewTarget = Math.max(-cfg.maxSkew, Math.min(cfg.maxSkew, velocity * cfg.skewPerPx));
      const stretchTarget = energy * cfg.stretch;

      for (let i = 0; i < els.length; i++) {
        const s = springs[i];
        s.skewV += (s.k * (skewTarget - s.skew) - s.d * s.skewV) * dt;
        s.skew += s.skewV * dt;
        s.stretchV += (s.k * (stretchTarget - s.stretch) - s.d * s.stretchV) * dt;
        s.stretch += s.stretchV * dt;

        const phase = (centers[i] + offset) * waveK - t * cfg.waveSpeed;
        const y = Math.sin(phase) * amp;
        const lean = Math.atan(Math.cos(phase) * amp * waveK) * (180 / Math.PI) * cfg.tilt;
        const sx = 1 + s.stretch;
        const sy = 1 - s.stretch * 0.5;
        els[i].style.transform =
          `translate3d(0,${y.toFixed(2)}px,0) rotate(${lean.toFixed(3)}deg) ` +
          `skewX(${s.skew.toFixed(3)}deg) scale(${sx.toFixed(4)},${sy.toFixed(4)})`;
      }
    },

    reset() {
      els.forEach((el) => (el.style.transform = ''));
    },
  };
}
