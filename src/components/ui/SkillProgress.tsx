import { useRef } from 'react';
import { gsap } from '../../lib/gsap';
import { useMotion } from '../../hooks/useMotion';
import { scrubFor } from '../../lib/motion';
import type { Proficiency } from '../../data/portfolio';

/**
 * Staggered, scrubbed sequence per skill:
 * heading → bar reveals → bar fills while the number counts 0 → target.
 * Fill and number are driven by the same tween so they can't drift apart.
 */
export function SkillProgress({ items }: { items: Proficiency[] }) {
  const ref = useRef<HTMLUListElement>(null);

  useMotion(
    ref,
    (env) => {
      const list = ref.current;
      if (env.reduce || !list) return;

      const tl = gsap.timeline({
        scrollTrigger: { trigger: list, start: 'top 88%', end: 'bottom 62%', scrub: scrubFor(env, 1, 0.6) },
      });

      list.querySelectorAll<HTMLElement>('.skill').forEach((row, i) => {
        const fill = row.querySelector<HTMLElement>('.skill__fill');
        const pct = row.querySelector<HTMLElement>('.skill__pct');
        const track = row.querySelector<HTMLElement>('.skill__track');
        const target = Number(row.dataset.value ?? 0);
        if (!fill || !pct || !track) return;

        const proxy = { v: 0 };
        const render = () => {
          fill.style.transform = `scaleX(${proxy.v / 100})`;
          pct.textContent = `${Math.round(proxy.v)}%`;
        };
        render();

        const at = i * 0.55;
        tl.fromTo(row.querySelectorAll('.skill__head > *'), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.05 }, at)
          .fromTo(track, { scaleX: 0 }, { scaleX: 1, duration: 0.35, ease: 'power2.inOut' }, at + 0.15)
          .to(proxy, { v: target, duration: 0.6, ease: 'power1.inOut', onUpdate: render }, at + 0.4);
      });
    },
    [items.length],
  );

  return (
    <ul ref={ref} className="skills-progress">
      {items.map((s) => (
        <li key={s.id} className="skill" data-value={s.value}>
          <div className="skill__head">
            <span className="skill__label" id={`skill-${s.id}`}>
              {s.label}
            </span>
            <span className="skill__pct">{s.value}%</span>
          </div>
          <div
            className="skill__track"
            role="progressbar"
            aria-labelledby={`skill-${s.id}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={s.value}
          >
            <span className="skill__fill" style={{ transform: `scaleX(${s.value / 100})` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
