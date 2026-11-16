import { useEffect, useRef, useState } from 'react';
import { gsap } from '../../lib/gsap';
import { useMotion } from '../../hooks/useMotion';
import { site, socials } from '../../data/portfolio';
import { PictureCoin } from '../coin/PictureCoin';
import { RollingText } from '../ui/RollingText';
import { SocialLink } from '../ui/SocialLink';
import { DownloadIcon } from '../ui/Icons';
import portraitBw from '../../assets/portrait-bw-sm.webp';
import portraitColor from '../../assets/portrait-color-sm.webp';

export function Footer() {
  const ref = useRef<HTMLElement>(null);
  const coinRef = useRef<HTMLDivElement>(null);
  const [showColor, setShowColor] = useState(false);
  const canHover = useRef(false);

  useEffect(() => {
    canHover.current = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }, []);

  // Face selection (hover on desktop, tap/keyboard everywhere): rotateX flip.
  useEffect(() => {
    const body = coinRef.current?.querySelector('.coin__body');
    if (!body) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    gsap.to(body, { rotateX: showColor ? 180 : 0, duration: reduce ? 0 : 0.9, ease: 'power3.inOut', overwrite: 'auto' });
  }, [showColor]);

  useMotion(ref, (env) => {
    const root = ref.current;
    const coin = coinRef.current;
    if (env.reduce || !root || !coin) return;

    // Entrance: horizontal flip that settles on the black & white face.
    const spin = coin.querySelector('.coin__spin');
    const back = coin.querySelector('.coin__face--back');
    const cv = root.querySelector('.footer__cv');
    const intro = gsap.timeline({ scrollTrigger: { trigger: root, start: 'top 80%', toggleActions: 'play none none reverse' } });
    intro
      .set(back, { autoAlpha: 0 })
      .fromTo(spin, { rotateY: -540, scale: 0.6, autoAlpha: 0 }, { rotateY: 0, scale: 1, autoAlpha: 1, duration: env.desktop ? 1.6 : 1.1, ease: 'power3.out' })
      .set(back, { autoAlpha: 1 })
      // CV pill slides out from behind the coin, as if tucked under it.
      .fromTo(cv, { xPercent: -100 }, { xPercent: 0, duration: 0.9, ease: 'power4.out' }, '-=0.45');

    // Bottom band rises from below; copyright then slides in from the left.
    const bottom = root.querySelector('.footer__bottom');
    const tl = gsap.timeline({ scrollTrigger: { trigger: bottom, start: 'top 98%', toggleActions: 'play none none reverse' } });
    tl.fromTo(bottom, { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out' })
      .fromTo(root.querySelector('.footer__copy'), { x: env.desktop ? -80 : -30, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.8 }, 0.3)
      .fromTo(root.querySelectorAll('.footer__socials li'), { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.06 }, 0.35);
  });

  return (
    <footer ref={ref} className="footer">
      <div className="footer__card">
        <div className="footer__top">
          <div className="footer__cv-group">
            <button
              type="button"
              className="footer__coin-btn"
              aria-pressed={showColor}
              aria-label={showColor ? 'Show black and white photo' : 'Show colour photo'}
              onClick={() => setShowColor((v) => !v)}
              onPointerEnter={() => canHover.current && setShowColor(true)}
              onPointerLeave={() => canHover.current && setShowColor(false)}
            >
              <PictureCoin
                ref={coinRef}
                ring
                className="footer__coin"
                front={portraitBw}
                back={portraitColor}
                frontAlt="Portrait of Sai Ganesh"
                loading="lazy"
              />
            </button>
            <span className="footer__cv-clip">
              <a className="footer__cv" href={site.cvHref} download>
                <span className="footer__cv-text">
                  Download <em>My CV</em>
                </span>
                <DownloadIcon className="footer__cv-icon" />
              </a>
            </span>
          </div>
          <p className="footer__name">
            <RollingText text={site.footerName} start="top 95%" end="top 55%" />
          </p>
        </div>

        <div className="footer__bottom">
          <p className="footer__copy">
            <span className="footer__rights">ALL RIGHTS RESERVED</span>
            <span className="footer__year">
              © {site.copyrightYear}. {site.fullName.toUpperCase()}
            </span>
          </p>
          <ul className="footer__socials">
            {socials.map((s) => (
              <li key={s.id}>
                <SocialLink social={s} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
