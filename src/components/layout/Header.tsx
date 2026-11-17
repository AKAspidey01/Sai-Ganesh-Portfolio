import { useEffect, useRef, useState } from 'react';
import { gsap } from '../../lib/gsap';
import { useMotion } from '../../hooks/useMotion';
import { pixelFormation } from '../../lib/motion';
import { nav, site } from '../../data/portfolio';
import { PixelFormation } from '../ui/PixelFormation';
import { LineReveal } from '../ui/LineReveal';
import { CloseIcon, MenuIcon } from '../ui/Icons';

/** Two stacked copies of the label, split into letters, for the hover roll. */
function RollLabel({ text }: { text: string }) {
  const chars = Array.from(text);
  return (
    <span className="menu__roll">
      <span className="sr-only">{text}</span>
      {(['top', 'bottom'] as const).map((pos) => (
        <span key={pos} className={`menu__line menu__line--${pos}`} aria-hidden="true">
          {chars.map((ch, i) => (
            <span key={i} className="menu__char" style={{ ['--i' as string]: i }}>
              {ch === ' ' ? ' ' : ch}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

export function Header() {
  const ref = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuTl = useRef<gsap.core.Timeline | null>(null);
  const openRef = useRef(false);
  const [open, setOpen] = useState(false);

  // Page-load entrance: zoom + blur + pixel formation → sharp.
  useMotion(ref, (env) => {
    if (env.reduce || !ref.current) return;
    const pill = ref.current.querySelector('.header__pill-wrap');
    if (pill) pixelFormation(pill, env, { zoom: 1.5, blur: 14, vars: { delay: 0.15 } });
  });

  /* Menu choreography: ONE paused timeline. Opening plays it forward,
     closing reverses it (a little faster). Because it's the same timeline,
     toggling mid-animation just turns it around: never a jump or a fight. */
  useMotion(menuRef, (env) => {
    const menu = menuRef.current;
    if (!menu) return;
    const layers = menu.querySelectorAll('.menu__bg');
    const links = menu.querySelectorAll('.menu__link');
    const closeBtn = menu.querySelector<HTMLElement>('.menu__close');

    const tl = gsap.timeline({ paused: true });
    if (env.reduce) {
      tl.set(menu, { visibility: 'visible' }, 0)
        .set(layers, { scaleY: 1 }, 0)
        .fromTo(menu, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power1.out' }, 0);
    } else {
      tl.set(menu, { autoAlpha: 1 }, 0)
        // Curtain: brand-gradient sheet leads, the dark sheet follows it down.
        .fromTo(layers, { scaleY: 0 }, { scaleY: 1, duration: env.desktop ? 0.9 : 0.75, ease: 'expo.inOut', stagger: 0.1 }, 0)
        // Links rise out of their masks with a slight tilt that straightens.
        .fromTo(
          links,
          { yPercent: 120, rotate: 4 },
          { yPercent: 0, rotate: 0, duration: 1, ease: 'expo.out', stagger: 0.07 },
          env.desktop ? 0.5 : 0.42,
        )
        .fromTo(closeBtn, { opacity: 0, scale: 0.4, rotate: -120 }, { opacity: 1, scale: 1, rotate: 0, duration: 0.8, ease: 'back.out(1.7)' }, 0.55);
    }
    // Focus the close button once the overlay is visible (only when opening).
    tl.call(() => {
      if (openRef.current) closeBtn?.focus({ preventScroll: true });
    }, [], 0.05);

    if (openRef.current) tl.progress(1); // rebuilt while open (breakpoint change)
    menuTl.current = tl;
  });

  // Drive the timeline + scroll lock + keyboard handling from `open`.
  useEffect(() => {
    openRef.current = open;
    const html = document.documentElement;
    if (open) {
      // Measure the scrollbar before hiding it; CSS pads by this much (no sideways jump).
      html.style.setProperty('--sbw', `${window.innerWidth - html.clientWidth}px`);
    }
    html.classList.toggle('is-locked', open);
    const tl = menuTl.current;
    if (tl) {
      if (open) tl.timeScale(1).play();
      else tl.timeScale(1.5).reverse();
    }
    const menu = menuRef.current;
    if (!open || !menu) return undefined;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (e.key === 'Tab') {
        const focusables = menu.querySelectorAll<HTMLElement>('a, button');
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => () => document.documentElement.classList.remove('is-locked'), []);

  const close = (focusToggle = true) => {
    setOpen(false);
    if (focusToggle) toggleRef.current?.focus();
  };

  return (
    <header ref={ref} className="header">
      <LineReveal dotAt="end" trigger="load" delay={0.9} className="header__line header__line--left" />
      <PixelFormation cols={16} rows={3} className="header__pill-wrap" contentClassName="header__pill">
        <button
          ref={toggleRef}
          type="button"
          className="header__menu"
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen(true)}
        >
          <MenuIcon />
          <span>MENU</span>
        </button>
        <a href="#top" className="header__logo" aria-label={`${site.fullName} — home`}>
          {site.initials}
        </a>
        <a href="#contact" className="header__cta">
          <span>LET’S TALK</span>
        </a>
      </PixelFormation>
      <LineReveal dotAt="start" trigger="load" delay={0.9} className="header__line header__line--right" />

      <div
        ref={menuRef}
        id="site-menu"
        className="menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        aria-hidden={!open}
        style={{ visibility: 'hidden', opacity: 0 }}
      >
        <span className="menu__bg menu__bg--accent" aria-hidden="true" />
        <span className="menu__bg menu__bg--main" aria-hidden="true" />
        <button type="button" className="menu__close" onClick={() => close()} aria-label="Close menu" tabIndex={open ? 0 : -1}>
          <CloseIcon />
        </button>
        <nav className="menu__nav" aria-label="Primary">
          <ul className="menu__list">
            {nav.map((item, i) => (
              <li key={item.id} className="menu__item">
                <a href={`#${item.id}`} className="menu__link" tabIndex={open ? 0 : -1} onClick={() => close(false)}>
                  <span className="menu__num" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <RollLabel text={item.label} />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
