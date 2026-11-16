import type { RefObject } from 'react';
import { gsap, useGSAP } from '../lib/gsap';

/**
 * One responsive animation entry point for every component.
 *
 *  desktop → full experience (3D, blur, long travel, parallax)
 *  mobile  → same choreography, lighter (less depth, no blur, shorter travel)
 *  reduce  → prefers-reduced-motion: components return early and CSS keeps
 *            everything in its final, readable state.
 *
 * Everything created inside `setup` is reverted automatically on unmount,
 * on breakpoint change and on HMR (gsap.matchMedia + useGSAP context), so
 * ScrollTriggers never duplicate.
 */
export const MEDIA = {
  desktop: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
  mobile: '(max-width: 1023.98px) and (prefers-reduced-motion: no-preference)',
  reduce: '(prefers-reduced-motion: reduce)',
} as const;

export interface MotionEnv {
  desktop: boolean;
  mobile: boolean;
  reduce: boolean;
}

export type MotionSetup = (env: MotionEnv, onCleanup: (fn: () => void) => void) => void;

export function useMotion(
  scope: RefObject<HTMLElement | null>,
  setup: MotionSetup,
  dependencies: unknown[] = [],
) {
  useGSAP(
    () => {
      if (!scope.current) return;
      const mm = gsap.matchMedia();
      mm.add(
        MEDIA,
        (ctx) => {
          const env = ctx.conditions as unknown as MotionEnv;
          const disposers: Array<() => void> = [];
          setup(env, (fn) => disposers.push(fn));
          return () => disposers.forEach((d) => d());
        },
        scope.current,
      );
      return () => mm.revert();
    },
    { scope, dependencies },
  );
}
