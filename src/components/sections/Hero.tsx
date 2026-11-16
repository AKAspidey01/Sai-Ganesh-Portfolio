import { useEffect, useRef, useState, type RefObject } from 'react';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { useMotion } from '../../hooks/useMotion';
import { baselineRise, handwriting } from '../../lib/motion';
import { site } from '../../data/portfolio';
import { PictureCoin } from '../coin/PictureCoin';
import { HandwritingText } from '../ui/HandwritingText';
import { SplitChars } from '../ui/SplitChars';
import { PenBadge } from '../ui/Icons';
import portraitBw from '../../assets/portrait-bw.webp';
import portraitColor from '../../assets/portrait-color.webp';

interface HeroProps {
  sectionRef: RefObject<HTMLElement>;
  coinRef: RefObject<HTMLDivElement>;
}

function formatTime(tz: string) {
  const parts = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: tz }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('hour')}:${get('minute')}${get('dayPeriod').toUpperCase()}`;
}

function useClock(tz: string) {
  const [time, setTime] = useState(() => formatTime(tz));
  useEffect(() => {
    const id = window.setInterval(() => setTime(formatTime(tz)), 15_000);
    return () => window.clearInterval(id);
  }, [tz]);
  return time;
}

export function Hero({ sectionRef, coinRef }: HeroProps) {
  const time = useClock(site.timeZone);
  const stageRef = useRef<HTMLDivElement>(null);

  useMotion(sectionRef, (env, onCleanup) => {
    const hero = sectionRef.current;
    const stage = stageRef.current;
    const coin = coinRef.current;
    if (env.reduce || !hero || !stage || !coin) return;

    /* ---------- 1. Load choreography ---------- */
    const rings = hero.querySelectorAll('.hero__ring');
    const spin = coin.querySelector('.coin__spin');
    const hello = hero.querySelector('.hero__hello');
    const chars = hero.querySelectorAll('.hero__name .sc__char');
    const metaIn = hero.querySelectorAll('.orbit-item__in');

    const intro = gsap.timeline({ delay: 0.3 });
    intro
      .fromTo(rings, { scale: 0.82, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1.6, ease: 'expo.out', stagger: 0.12 }, 0)
      .fromTo(
        spin,
        { rotateX: env.desktop ? -120 : -80, y: env.desktop ? -70 : -30, scale: 0.6, autoAlpha: 0 },
        { rotateX: 0, y: 0, scale: 1, autoAlpha: 1, duration: env.desktop ? 1.9 : 1.4, ease: 'back.out(1.25)' },
        0.15,
      )
      .add(handwriting(hello!), 0.95)
      .add(baselineRise(chars, { duration: 1.1, stagger: 0.055 }), 1.05)
      .fromTo(
        metaIn,
        env.desktop ? { autoAlpha: 0, y: 18, filter: 'blur(8px)' } : { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.9, stagger: 0.12, ease: 'power3.out', clearProps: 'filter' },
        1.25,
      );

    /* ---------- 2. Orbit system ----------
       Each label travels along a circle centred on the coin and passing
       through its designed position. Only x/y change — never rotation — so
       labels stay upright and readable like planets seen face-on. */
    const items = Array.from(hero.querySelectorAll<HTMLElement>('.orbit-item'));
    const sweep = (env.desktop ? 7 : 3.5) * (Math.PI / 180);
    const orbits = items.map((item, i) => {
      const geo = { r: 0, a: 0 };
      const measure = () => {
        const cx = coin.offsetLeft + (coin.offsetParent as HTMLElement).offsetLeft + coin.offsetWidth / 2;
        const cy = coin.offsetTop + (coin.offsetParent as HTMLElement).offsetTop + coin.offsetHeight / 2;
        const dx = item.offsetLeft + item.offsetWidth / 2 - cx;
        const dy = item.offsetTop + item.offsetHeight / 2 - cy;
        geo.r = Math.hypot(dx, dy);
        geo.a = Math.atan2(dy, dx);
      };
      measure();
      const setX = gsap.quickSetter(item, 'x', 'px');
      const setY = gsap.quickSetter(item, 'y', 'px');
      const proxy = { d: -sweep };
      const dir = i % 2 ? -1 : 1;
      const tween = gsap.to(proxy, {
        d: sweep,
        duration: 8 + i * 1.7,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        onUpdate: () => {
          const a = geo.a + proxy.d * dir;
          setX(geo.r * (Math.cos(a) - Math.cos(geo.a)));
          setY(geo.r * (Math.sin(a) - Math.sin(geo.a)));
        },
      });
      tween.progress((i * 0.37) % 1);
      return { measure, tween };
    });
    const remeasure = () => orbits.forEach((o) => o.measure());
    ScrollTrigger.addEventListener('refresh', remeasure);
    onCleanup(() => ScrollTrigger.removeEventListener('refresh', remeasure));

    // Pause the planets while the hero is off-screen.
    ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: 'bottom top',
      onToggle: (self) => orbits.forEach((o) => (self.isActive ? o.tween.resume() : o.tween.pause())),
    });

    /* ---------- 3. Dimensional role badge ---------- */
    const badge = hero.querySelector<HTMLElement>('.badge3d');
    if (badge) {
      gsap.to(badge, { y: env.desktop ? -8 : -4, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      if (env.desktop && window.matchMedia('(hover: hover)').matches) {
        const rx = gsap.quickTo(badge, 'rotateX', { duration: 0.8, ease: 'power3.out' });
        const ry = gsap.quickTo(badge, 'rotateY', { duration: 0.8, ease: 'power3.out' });
        const onMove = (e: PointerEvent) => {
          const r = hero.getBoundingClientRect();
          ry(((e.clientX - r.left) / r.width - 0.5) * 26);
          rx(-((e.clientY - r.top) / r.height - 0.5) * 18);
        };
        const onLeave = () => {
          rx(0);
          ry(0);
        };
        hero.addEventListener('pointermove', onMove);
        hero.addEventListener('pointerleave', onLeave);
        onCleanup(() => {
          hero.removeEventListener('pointermove', onMove);
          hero.removeEventListener('pointerleave', onLeave);
        });
      }
    }
  });

  return (
    <section ref={sectionRef} id="top" className="hero" aria-labelledby="hero-title">
      <div className="hero__orbits" aria-hidden="true">
        <span className="hero__ring hero__ring--1" />
        <span className="hero__ring hero__ring--2" />
        <span className="hero__ring hero__ring--3" />
        <span className="hero__ring hero__ring--4" />
      </div>

      <div ref={stageRef} className="hero__stage">
        <p className="orbit-item hero__meta hero__meta--role">
          <span className="orbit-item__in">{site.roleSecondary}</span>
        </p>
        <p className="orbit-item hero__meta hero__meta--loc">
          <span className="orbit-item__in">{site.location}</span>
        </p>
        <p className="orbit-item hero__meta hero__meta--time">
          <span className="orbit-item__in">
            <time aria-label={`Local time ${time} ${site.timeZoneLabel}`}>
              {time} {site.timeZoneLabel}
            </time>
          </span>
        </p>
        <div className="orbit-item hero__badge">
          <span className="orbit-item__in">
            <span className="badge3d">
              <PenBadge className="badge3d__icon" />
              <span className="badge3d__text" data-text={site.roleBadge}>
                {site.roleBadge}
              </span>
            </span>
          </span>
        </div>

        <div className="hero__coin-anchor">
          <PictureCoin
            ref={coinRef}
            className="hero__coin"
            front={portraitBw}
            back={portraitColor}
            frontAlt="Portrait of Sai Ganesh"
            loading="eager"
          />
        </div>
      </div>

      <h1 id="hero-title" className="hero__title">
        <HandwritingText text="Hello , I’m" className="hw--hello hero__hello" />
        <span className="hero__name-mask">
          <SplitChars text={site.heroName} className="hero__name" />
        </span>
      </h1>
    </section>
  );
}
