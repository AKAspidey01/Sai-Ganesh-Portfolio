import { useEffect, useRef, useState } from 'react';
import { gsap } from '../../lib/gsap';
import { useMotion } from '../../hooks/useMotion';
import { pixelFormation } from '../../lib/motion';
import { nav, site } from '../../data/portfolio';
import { PixelFormation } from '../ui/PixelFormation';
import { LineReveal } from '../ui/LineReveal';
import { CloseIcon, MenuIcon } from '../ui/Icons';

export function Header() {
  const ref = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  // Page-load entrance: zoom + blur + pixel formation → sharp.
  useMotion(ref, (env) => {
    if (env.reduce || !ref.current) return;
    const pill = ref.current.querySelector('.header__pill-wrap');
    if (pill) pixelFormation(pill, env, { zoom: 1.5, blur: 14, vars: { delay: 0.15 } });
  });

  // Menu overlay: focus management + Escape.
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (open) {
      document.documentElement.classList.add('is-locked');
      gsap.fromTo(menu, { autoAlpha: 0 }, { autoAlpha: 1, duration: reduce ? 0 : 0.35, ease: 'power2.out' });
      gsap.fromTo(
        menu.querySelectorAll('.menu__link'),
        { yPercent: 110 },
        { yPercent: 0, duration: reduce ? 0 : 0.7, ease: 'power4.out', stagger: 0.06, delay: 0.05 },
      );
      menu.querySelector<HTMLElement>('.menu__close')?.focus();
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setOpen(false);
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
    }
    document.documentElement.classList.remove('is-locked');
    gsap.to(menu, { autoAlpha: 0, duration: reduce ? 0 : 0.25 });
    return undefined;
  }, [open]);

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
        hidden={false}
        aria-hidden={!open}
        style={{ visibility: 'hidden', opacity: 0 }}
      >
        <button type="button" className="menu__close" onClick={() => close()} aria-label="Close menu" tabIndex={open ? 0 : -1}>
          <CloseIcon />
        </button>
        <nav aria-label="Primary">
          <ul className="menu__list">
            {nav.map((item) => (
              <li key={item.id} className="menu__item">
                <a href={`#${item.id}`} className="menu__link" tabIndex={open ? 0 : -1} onClick={() => close(false)}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
