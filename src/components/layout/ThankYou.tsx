import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from '../../lib/gsap';
import { baselineRise, handwriting } from '../../lib/motion';
import { thankYou } from '../../data/portfolio';
import { PictureCoin } from '../coin/PictureCoin';
import { SplitChars } from '../ui/SplitChars';
import { HandwritingText } from '../ui/HandwritingText';
import portraitBw from '../../assets/portrait-bw.webp';
import portraitColor from '../../assets/portrait-color.webp';

interface ThankYouProps {
  /** Called when the visitor leaves (button / Esc) or the timer runs out. */
  onDone: () => void;
  duration?: number;
}

/**
 * Full-screen "thank you" after the contact form is sent: the 3D coin floats
 * above the heading, the script line writes itself in, the confirmation
 * badge pops, then `onDone` fires after `duration` ms.
 */
export function ThankYou({ onDone, duration = thankYou.duration }: ThankYouProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const gid = useId().replace(/:/g, '');

  // Page behaviour: lock scroll, take focus, Esc to leave, auto-finish.
  useEffect(() => {
    const html = document.documentElement;
    html.style.setProperty('--sbw', `${window.innerWidth - html.clientWidth}px`);
    html.classList.add('is-locked');
    backRef.current?.focus({ preventScroll: true });
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      doneRef.current();
    };
    const timer = window.setTimeout(finish, duration);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
      if (e.key === 'Tab') {
        e.preventDefault(); // the back button is the only control
        backRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
      html.classList.remove('is-locked');
    };
  }, [duration]);

  // Entrance choreography (skipped for reduced motion: CSS shows the final state).
  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      const spin = root.querySelector('.coin__spin');
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo(root, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: 'power1.out' }, 0)
        .fromTo('.ty__floor', { scaleX: 0.2, autoAlpha: 0 }, { scaleX: 1, autoAlpha: 1, duration: 1.1 }, 0.1)
        .fromTo(
          spin,
          { rotateY: -340, rotateX: 0, scale: 0.55, autoAlpha: 0 },
          { rotateY: 20, rotateX: 6, scale: 1, autoAlpha: 1, duration: 1.3, ease: 'power3.out' },
          0.1,
        )
        .add(baselineRise(root.querySelectorAll('.ty__heading .sc__char'), { duration: 0.8, stagger: 0.04 }), 0.35)
        .add(handwriting(root.querySelector('.ty__script')!), 0.7)
        .fromTo('.ty__swoosh path', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut' }, 1.05)
        .fromTo('.ty__msg', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 1.0)
        .fromTo('.ty__check', { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' }, 1.25)
        .fromTo('.ty__check-mark', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.35, ease: 'power2.out' }, 1.45)
        .fromTo('.ty__pixel', { autoAlpha: 0 }, { autoAlpha: (_i: number, el: Element) => Number((el as HTMLElement).dataset.o ?? 0.5), duration: 0.4, stagger: { each: 0.04, from: 'random' } }, 0.6);
      // Gentle float + sway once it has landed (the 3D coin copies these). Turned to the
      // right, away from the 3D coin's key light (upper left), so the photo never glares.
      gsap.to(spin, { y: -10, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.4 });
      gsap.to(spin, { rotateY: 10, duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.4 });
    }, root);
    return () => ctx.revert();
  }, []);

  return createPortal(
    <div ref={rootRef} className="ty" role="dialog" aria-modal="true" aria-labelledby="ty-title" aria-describedby="ty-msg">
      <div className="ty__bg" aria-hidden="true">
        <span className="ty__arc ty__arc--1" />
        <span className="ty__arc ty__arc--2" />
        <span className="ty__arc ty__arc--3" />
        <span className="ty__dots ty__dots--l" />
        <span className="ty__dots ty__dots--r" />
      </div>

      <header className="ty__top">
        <span className="ty__brand">{thankYou.brand}</span>
        <button ref={backRef} type="button" className="ty__back" onClick={() => doneRef.current()}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 12H4M10 6l-6 6 6 6" />
          </svg>
          <span>{thankYou.back}</span>
        </button>
      </header>

      <div className="ty__body">
        <div className="ty__coin-wrap">
          {/* decorative pixels around the coin */}
          <span className="ty__pixels ty__pixels--l" aria-hidden="true">
            {[0.5, 0.25, 0.7, 0.35, 0.15].map((o, i) => (
              <span key={i} className="ty__pixel" data-o={o} style={{ opacity: o }} />
            ))}
          </span>
          <span className="ty__pixels ty__pixels--r" aria-hidden="true">
            {[0.45, 0.2, 0.6].map((o, i) => (
              <span key={i} className="ty__pixel" data-o={o} style={{ opacity: o }} />
            ))}
          </span>
          <PictureCoin className="ty__coin" front={portraitBw} back={portraitColor} frontAlt="Portrait of Sai Ganesh" />
        </div>

        <h2 id="ty-title" className="ty__title">
          <SplitChars text={thankYou.title} className="ty__heading" />
          <span className="ty__script-wrap">
            <HandwritingText text={thankYou.script} className="ty__script" />
            <svg className="ty__swoosh" viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id={`${gid}-sw`} x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
                  <stop offset=".35" stopColor="#c9b5ff" />
                  <stop offset="1" stopColor="#8f6bff" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <path d="M4 19 C 80 9, 190 4, 296 7" stroke={`url(#${gid}-sw)`} strokeWidth="3" strokeLinecap="round" fill="none" pathLength={1} strokeDasharray="1" />
            </svg>
          </span>
        </h2>

        <p id="ty-msg" className="ty__msg">
          {thankYou.message}
        </p>

        <span className="ty__check" aria-hidden="true">
          <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
            <rect x="4" y="4" width="40" height="40" rx="11" stroke="#fff" strokeOpacity=".85" strokeWidth="1.8" />
            <path className="ty__check-mark" d="M15 24.5l6 6 12-13" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" />
          </svg>
        </span>

        <div className="ty__floor" aria-hidden="true">
          <span className="ty__floor-ring" />
          <span className="ty__floor-beam" />
          <span className="ty__floor-line" />
        </div>
      </div>
    </div>,
    document.body,
  );
}
