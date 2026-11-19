import { useEffect, useRef, useState, type RefObject } from 'react';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { useMotion } from '../../hooks/useMotion';
import { baselineRise, handwriting } from '../../lib/motion';
import { site } from '../../data/portfolio';
import { PictureCoin } from '../coin/PictureCoin';
import { HandwritingText } from '../ui/HandwritingText';
import { SplitChars } from '../ui/SplitChars';
import uxPenIcon from '../../assets/icon-ux-pen.webp';
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
        { rotateY: env.desktop ? -120 : -80, y: env.desktop ? -70 : -30, scale: 0.6, autoAlpha: 0 },
        { rotateY: 0, y: 0, scale: 1, autoAlpha: 1, duration: env.desktop ? 1.9 : 1.4, ease: 'back.out(1.25)' },
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
       Each label is a planet on a circle centred on the coin, passing through
       its designed position. Only x/y change (never rotation), so the text
       stays upright and readable.
       - Idle: each label loops round a small ellipse lying along its orbit
         (a swing along the orbit plus a little in/out), so it never comes to
         a dead stop the way a back-and-forth sway does.
       - Scroll: the whole system revolves the same way (scrubbed, so it eases
         to a stop and reverses on scroll-up).
       Everything is placed from ONE ticker callback per frame, and the labels
       are GPU layers (hero.css), so sub-pixel motion stays smooth. */
    const items = Array.from(hero.querySelectorAll<HTMLElement>('.orbit-item'));
    const DEG = Math.PI / 180;
    const swing = (env.desktop ? 6 : 3) * DEG; // along the orbit
    const bob = env.desktop ? 10 : 5; // px, in / out
    const revolve = (env.desktop ? 55 : 35) * DEG;
    const scroll = { p: 0 };
    // Near a screen edge the motion eases off (tanh) instead of hitting a hard stop.
    const soft = (x: number, lo: number, hi: number) => (x < 0 ? lo * Math.tanh(x / Math.min(lo, -1e-6)) : hi * Math.tanh(x / Math.max(hi, 1e-6)));
    const orbits = items.map((item, i) => {
      const geo = { r: 0, a: 0, lo: 0, hi: 0 };
      const measure = () => {
        // Horizontal room before the label would leave the screen (8px margin).
        geo.lo = Math.min(0, 8 - item.offsetLeft);
        geo.hi = Math.max(0, stage.clientWidth - 8 - (item.offsetLeft + item.offsetWidth));
        const cx = coin.offsetLeft + (coin.offsetParent as HTMLElement).offsetLeft + coin.offsetWidth / 2;
        const cy = coin.offsetTop + (coin.offsetParent as HTMLElement).offsetTop + coin.offsetHeight / 2;
        const dx = item.offsetLeft + item.offsetWidth / 2 - cx;
        const dy = item.offsetTop + item.offsetHeight / 2 - cy;
        geo.r = Math.hypot(dx, dy);
        geo.a = Math.atan2(dy, dx);
      };
      measure();
      return {
        geo,
        measure,
        setX: gsap.quickSetter(item, 'x', 'px'),
        setY: gsap.quickSetter(item, 'y', 'px'),
        period: 9 + i * 1.9, // seconds per idle loop
        phase: i * 2.1,
        dir: i % 2 ? -1 : 1,
      };
    });

    let idle = 0; // seconds of idle drift; only advances while the hero is on screen
    let onScreen = true;
    const place = () => {
      for (const o of orbits) {
        const t = (idle / o.period) * Math.PI * 2 + o.phase;
        const a = o.geo.a + scroll.p * revolve + Math.sin(t) * swing * o.dir;
        const r = o.geo.r + Math.cos(t) * bob;
        o.setX(soft(r * Math.cos(a) - o.geo.r * Math.cos(o.geo.a), o.geo.lo, o.geo.hi));
        o.setY(r * Math.sin(a) - o.geo.r * Math.sin(o.geo.a));
      }
    };
    const tick = (_time: number, deltaMs: number) => {
      if (!onScreen) return;
      idle += Math.min(deltaMs, 100) / 1000; // no leap after a stalled frame / background tab
      place();
    };
    gsap.ticker.add(tick);
    onCleanup(() => gsap.ticker.remove(tick));
    place();

    const remeasure = () => {
      orbits.forEach((o) => o.measure());
      place();
    };
    ScrollTrigger.addEventListener('refresh', remeasure);
    onCleanup(() => ScrollTrigger.removeEventListener('refresh', remeasure));

    // Scroll revolves the whole system; the ticker above applies it.
    gsap.to(scroll, {
      p: 1,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: env.desktop ? 1 : 0.6 },
    });

    // Stop all orbit work while the hero is fully off-screen.
    ScrollTrigger.create({
      trigger: hero,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => (onScreen = self.isActive),
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
              <img className="badge3d__icon" src={uxPenIcon} alt="" width={160} height={160} decoding="async" />
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
