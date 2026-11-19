/**
 * Scroll "bend" for horizontal card rows (Projects, Reviews).
 *
 * While the row slides, every card bends like a flexible sheet: its top and
 * bottom edges stay straight and level, its middle is pushed toward the
 * direction of travel, so the left/right sides curve into "(" (moving left)
 * or ")" (moving right). The bend follows the row's speed and eases back to
 * a flat card once it stops.
 *
 * How (GPU-only, nothing repaints per frame):
 * each card gets an aria-hidden overlay made of N horizontal strips; each
 * strip holds a static copy of the card, clipped to its band. A row at
 * height v (0 top … 1 bottom) should shift by `bend × 4v(1 − v)`; every strip
 * gets a shear matrix that hits that curve exactly at its top and bottom
 * edges, so the strips join into a smooth arc. Only strip transforms change
 * per frame, which the compositor handles without repainting.
 * Strips are rendered only for cards on screen (every extra layer costs a
 * little on every frame of the page). At rest those stay drawn but invisible
 * over the real card, so a new scroll gesture doesn't have to draw them first.
 * At rest the real card is shown, so hover, focus and links behave exactly
 * as before.
 *
 * Optional media parallax (desktop Projects): the media inside each card
 * drifts with the card's position in the row. While the cards are bent the
 * drift holds still (moving media inside sheared, clipped strips would force
 * costly GPU passes); once flat it glides back to where it should be.
 */

export interface BendConfig {
  /** Max sideways shift of a card's middle, as a share of its width. */
  maxShare: number;
  /** Row speed (px/s) that gives ~76% of the max bend (tanh curve). */
  speedRef: number;
  /** How quickly the bend follows the speed (1/s); lower = softer. */
  follow: number;
  /** Number of strips per card (more = smoother curve). */
  strips: number;
  /** Media drift range in % of the media width (±), 0 = off. */
  parallax: number;
}

interface BendCard {
  li: HTMLElement;
  face: HTMLElement;
  overlay: HTMLElement;
  strips: HTMLElement[];
  /** Original parallax element and its copies inside the strips. */
  parallax: HTMLElement | null;
  parallaxCopies: HTMLElement[];
  /** Card left edge inside the track (px, untransformed) and width. */
  left: number;
  w: number;
  h: number;
  /** Drift currently shown (%). */
  drift: number;
  /** Strips currently shown in place of the real card. */
  bent: boolean;
  /** Strips rendered (invisibly at rest) because the card is on screen. */
  ready: boolean;
}

/** Below this many px the card counts as flat and the real card is shown. */
const FLAT = 0.35;

export function createBend(faces: HTMLElement[], cfg: BendConfig) {
  const n = cfg.strips;
  const cards: BendCard[] = faces.map((face) => {
    const li = face.parentElement as HTMLElement;
    const overlay = document.createElement('div');
    overlay.className = 'bend';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.inert = true;
    const strips: HTMLElement[] = [];
    const parallaxCopies: HTMLElement[] = [];
    for (let i = 0; i < n; i++) {
      const strip = document.createElement('div');
      strip.className = 'bend__strip';
      const copy = face.cloneNode(true) as HTMLElement;
      copy.removeAttribute('id');
      copy.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
      copy.classList.add('bend__copy');
      const p = copy.querySelector<HTMLElement>('.hpg__parallax');
      if (p) parallaxCopies.push(p);
      strip.append(copy);
      strips.push(strip);
    }
    overlay.append(...strips);
    li.append(overlay);
    return { li, face, overlay, strips, parallax: face.querySelector<HTMLElement>('.hpg__parallax'), parallaxCopies, left: 0, w: 0, h: 0, drift: 0, bent: false, ready: false };
  });

  let maxBend = 0;
  let bend = 0;
  let viewportW = 0;
  const useDrift = cfg.parallax > 0 && cards.some((c) => c.parallax);

  const driftCss = (d: number) => `translate3d(${d.toFixed(3)}%,0,0)`;

  const setReady = (c: BendCard, state: boolean) => {
    if (state === c.ready) return;
    c.ready = state;
    c.li.classList.toggle('is-bend-ready', state);
  };

  const setBent = (c: BendCard, state: boolean) => {
    if (state === c.bent) return;
    c.bent = state;
    if (!state) c.strips.forEach((strip) => (strip.style.transform = '')); // line up exactly with the real card again
    if (state && useDrift) {
      // Copies take the drift the real card shows right now; both hold it while bent.
      // 2D on purpose: a 3D transform would make each copy its own layer inside the sheared strip.
      const t = `translate(${c.drift.toFixed(3)}%,0)`;
      c.parallaxCopies.forEach((p) => (p.style.transform = t));
    }
    c.li.classList.toggle('is-bending', state);
  };

  /** Drift for a card at track offset `x`: −range at the right edge → +range at the left edge. */
  const driftTarget = (c: BendCard, x: number) => {
    const progress = (viewportW - (c.left + x)) / (viewportW + c.w);
    return -cfg.parallax + 2 * cfg.parallax * Math.min(1, Math.max(0, progress));
  };

  return {
    /**
     * Size strips and copies in px from the real card (call on refresh/resize).
     * `track` is the translated row, `trackX` its current translation.
     */
    measure(track: HTMLElement, viewportWidth: number, trackX: number) {
      viewportW = viewportWidth;
      const trackLeft = track.getBoundingClientRect().left - trackX;
      cards.forEach((c) => {
        const w = c.face.offsetWidth;
        const h = c.face.offsetHeight;
        c.w = w;
        c.h = h;
        c.left = c.face.getBoundingClientRect().left - trackLeft - trackX;
        c.overlay.style.width = `${w}px`;
        c.overlay.style.height = `${h}px`;
        c.overlay.style.left = `${c.face.offsetLeft}px`;
        c.overlay.style.top = `${c.face.offsetTop}px`;
        // The strips redraw the card's outline (copies have none, see gallery.css).
        const cs = getComputedStyle(c.face);
        c.overlay.style.setProperty('--bend-bw', cs.borderLeftWidth);
        c.overlay.style.setProperty('--bend-border', cs.borderLeftColor);
        c.overlay.style.setProperty('--bend-r', cs.borderTopLeftRadius);
        const band = h / n;
        c.strips.forEach((strip, i) => {
          strip.style.top = `${i * band}px`;
          // +1px overlap hides hairline seams between neighbouring strips.
          strip.style.height = `${band + (i < n - 1 ? 1 : 0)}px`;
          const copy = strip.firstElementChild as HTMLElement;
          copy.style.width = `${w}px`;
          copy.style.height = `${h}px`;
          copy.style.top = `${-i * band}px`;
        });
      });
      maxBend = (faces[0]?.offsetWidth ?? 0) * cfg.maxShare;
    },

    /** Put the media drift where it belongs right away (first frame, after refresh). */
    snapDrift(trackX: number) {
      if (!useDrift) return;
      cards.forEach((c) => {
        if (!c.parallax) return;
        c.drift = driftTarget(c, trackX);
        c.parallax.style.transform = driftCss(c.drift);
      });
    },

    /**
     * @param velocity row speed in px/s (negative = moving left)
     * @param trackX   current row translation (px), for the media drift
     */
    step(dt: number, velocity: number, trackX: number) {
      const target = maxBend * Math.tanh(velocity / cfg.speedRef);
      bend += (target - bend) * (1 - Math.exp(-dt * cfg.follow));
      const reach = Math.abs(bend) + 40;
      const onScreen = (c: BendCard) => {
        const x = c.left + trackX;
        return x + c.w > -reach && x < viewportW + reach;
      };
      if (Math.abs(bend) < FLAT && Math.abs(target) < FLAT) {
        for (const c of cards) {
          setBent(c, false);
          setReady(c, onScreen(c));
        }
        if (useDrift) {
          const k = 1 - Math.exp(-dt * 9);
          for (const c of cards) {
            if (!c.parallax) continue;
            const next = c.drift + (driftTarget(c, trackX) - c.drift) * k;
            if (Math.abs(next - c.drift) < 0.0005) continue;
            c.drift = next;
            c.parallax.style.transform = driftCss(next);
          }
        }
        return;
      }
      for (const c of cards) {
        const visible = onScreen(c);
        setReady(c, visible);
        setBent(c, visible);
        if (!visible) continue;
        const band = c.h / n;
        for (let i = 0; i < n; i++) {
          const v0 = i / n;
          const v1 = (i + 1) / n;
          const x0 = bend * 4 * v0 * (1 - v0);
          const x1 = bend * 4 * v1 * (1 - v1);
          // Shear about the strip's top-left: x' = x + shear·y + x0, so the
          // strip's top edge sits at x0 and its bottom edge at x1.
          const shear = band ? (x1 - x0) / band : 0;
          c.strips[i].style.transform = `matrix(1,0,${shear.toFixed(5)},1,${x0.toFixed(2)},0)`;
        }
      }
    },

    reset() {
      bend = 0;
      for (const c of cards) {
        setBent(c, false);
        setReady(c, false);
      }
    },

    destroy() {
      for (const c of cards) {
        setBent(c, false);
        setReady(c, false);
      }
      cards.forEach((c) => {
        c.overlay.remove();
        if (c.parallax) c.parallax.style.transform = '';
      });
    },
  };
}
