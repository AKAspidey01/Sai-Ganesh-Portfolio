import { gsap } from './gsap';
import type { MotionEnv } from '../hooks/useMotion';

/**
 * Reusable animation builders. Each returns a (paused-by-caller or
 * ScrollTrigger-driven) timeline so components only decide *when*, never *how*.
 */

type TlVars = gsap.TimelineVars;

export const scrubFor = (env: MotionEnv, desktop = 0.9, mobile = 0.5) => (env.desktop ? desktop : mobile);

/** Layout position in the document, unaffected by transforms (safe to call mid-animation). */
export function docTop(el: HTMLElement): number {
  let top = 0;
  let node: HTMLElement | null = el;
  while (node) {
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return top;
}

export function docLeft(el: HTMLElement): number {
  let left = 0;
  let node: HTMLElement | null = el;
  while (node) {
    left += node.offsetLeft;
    node = node.offsetParent as HTMLElement | null;
  }
  return left;
}

/**
 * Pixel formation: a grid of cells pops in at random, the real element
 * condenses out of a zoomed / blurred state behind them, then the cells
 * dissolve and leave the sharp final UI.
 * Expects the markup rendered by <PixelFormation />.
 */
export function pixelFormation(
  root: Element,
  env: MotionEnv,
  opts: { zoom?: number; blur?: number; vars?: TlVars } = {},
) {
  const content = root.querySelector('.pf__content');
  const cells = root.querySelectorAll('.pf__cell');
  const zoom = env.desktop ? opts.zoom ?? 1.35 : Math.min(opts.zoom ?? 1.35, 1.15);
  const blur = env.desktop ? opts.blur ?? 10 : 0;

  const from: gsap.TweenVars = { autoAlpha: 0, scale: zoom };
  const to: gsap.TweenVars = { autoAlpha: 1, scale: 1, duration: 0.7, ease: 'power3.out' };
  if (blur) {
    from.filter = `blur(${blur}px)`;
    to.filter = 'blur(0px)';
    to.clearProps = 'filter';
  }

  const tl = gsap.timeline(opts.vars);
  tl.fromTo(
    cells,
    { autoAlpha: 0, scale: 0 },
    { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'power2.out', stagger: { amount: env.desktop ? 0.45 : 0.25, from: 'random' } },
    0,
  )
    .fromTo(content, from, to, 0.3)
    .to(
      cells,
      { autoAlpha: 0, scale: 0.3, duration: 0.3, ease: 'power2.in', stagger: { amount: env.desktop ? 0.4 : 0.2, from: 'random' } },
      0.6,
    );
  return tl;
}

/** Dot establishes first, then the line draws out of it. Expects <LineReveal /> markup. */
export function lineReveal(root: Element, vars?: TlVars) {
  const dot = root.querySelector('.lr__dot');
  const line = root.querySelector('.lr__line');
  const tl = gsap.timeline(vars);
  if (dot) tl.fromTo(dot, { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.35, ease: 'back.out(3)' }, 0);
  tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'power2.inOut' }, dot ? 0.25 : 0);
  return tl;
}

/** Handwriting reveal for Pacifico text: a soft-edged pen mask wipes along the word. */
export function handwriting(el: Element, vars?: TlVars) {
  const tl = gsap.timeline(vars);
  tl.fromTo(el, { '--hw': 0 }, { '--hw': 1, duration: 1.2, ease: 'power1.inOut' }, 0).fromTo(
    el,
    { y: 6, rotate: -1.5 },
    { y: 0, rotate: 0, duration: 1.2, ease: 'power2.out' },
    0,
  );
  return tl;
}

/** Characters rise from their baseline (needs SplitChars masks). */
export function baselineRise(chars: gsap.TweenTarget, vars: gsap.TweenVars = {}) {
  return gsap.fromTo(chars, { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: 'power4.out', stagger: 0.05, ...vars });
}

export function fadeUp(targets: gsap.TweenTarget, env: MotionEnv, vars: gsap.TweenVars = {}) {
  return gsap.fromTo(
    targets,
    { autoAlpha: 0, y: env.desktop ? 40 : 24 },
    { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', ...vars },
  );
}
