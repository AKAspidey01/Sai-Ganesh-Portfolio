import type { RefObject } from 'react';
import { gsap } from '../lib/gsap';
import { docTop, docLeft } from '../lib/motion';
import { useMotion } from './useMotion';

/**
 * Hero → About coin transition.
 * One continuous, scroll-scrubbed physical move: the coin flips left ↔ right
 * (rotateY; B&W face → colour face), travels down and lands centred in the About
 * slot. Scroll position *is* the progress, so stopping, slowing or scrolling
 * back all behave naturally.
 *
 * Targets are measured from layout (offsetTop chain), never from the
 * transformed box, so refreshes mid-animation stay correct.
 */
export function useCoinJourney(
  heroRef: RefObject<HTMLElement>,
  coinRef: RefObject<HTMLDivElement>,
  slotRef: RefObject<HTMLDivElement>,
  rootRef: RefObject<HTMLElement>,
) {
  useMotion(rootRef, (env) => {
    const hero = heroRef.current;
    const coin = coinRef.current;
    const slot = slotRef.current;
    if (env.reduce || !hero || !coin || !slot) return;

    const body = coin.querySelector('.coin__body');
    const dx = () => docLeft(slot) + slot.offsetWidth / 2 - (docLeft(coin) + coin.offsetWidth / 2);
    const dy = () => docTop(slot) + slot.offsetHeight / 2 - (docTop(coin) + coin.offsetHeight / 2);
    const scale = () => slot.offsetWidth / coin.offsetWidth;

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        endTrigger: slot,
        end: 'center center',
        scrub: env.desktop ? 1.1 : 0.6,
        invalidateOnRefresh: true,
      },
    });

    // Left ↔ right flip around the vertical axis (CSS rotateY), B&W → colour.
    tl.to(coin, { x: dx, y: dy, scale, duration: 1, ease: 'power1.inOut' }, 0).to(
      body,
      { rotateY: 180, duration: 1, ease: 'sine.inOut' },
      0,
    );

    if (env.desktop) {
      // Lift toward the viewer mid-flight, then settle.
      tl.to(coin.querySelector('.coin__stage'), { scale: 1.08, duration: 0.5, ease: 'sine.out' }, 0).to(
        coin.querySelector('.coin__stage'),
        { scale: 1, duration: 0.5, ease: 'sine.in' },
        0.5,
      );
    }
  });
}
