import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

interface PictureCoinProps {
  front: string;
  back: string;
  frontAlt: string;
  backAlt?: string;
  /** Brand-gradient rim (footer variant). */
  ring?: boolean;
  loading?: 'eager' | 'lazy';
  className?: string;
}

const EDGE_LAYERS = [-2, -1, 0, 1, 2];

/**
 * One physical object with two faces — never a crossfade.
 *
 *  .coin        → travel layer (x / y / scale; scroll-driven moves)
 *  .coin__stage → perspective
 *  .coin__spin  → entrance spins (load / footer)
 *  .coin__body  → flip that chooses the face (scroll / hover / tap)
 *
 * Separate layers let several animations own different transforms without
 * fighting over the same property.
 *
 * When motion is allowed and WebGL works, a three.js coin (coin3d.ts) is drawn
 * on top and the CSS layers become invisible "rigs": GSAP still animates them
 * and the 3D coin copies their pose every frame. Otherwise this CSS coin is
 * what visitors see.
 */
export const PictureCoin = forwardRef<HTMLDivElement, PictureCoinProps>(function PictureCoin(
  { front, back, frontAlt, backAlt = '', ring = false, loading = 'eager', className = '' },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => rootRef.current as HTMLDivElement);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let dispose: (() => void) | null = null;
    let cancelled = false;
    // Create the WebGL context only when the coin is about to be seen.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        import('./coin3d')
          .then(({ mountCoin3D }) => {
            if (!cancelled) dispose = mountCoin3D({ root, front, back, ring });
          })
          .catch(() => {
            /* chunk failed to load: keep the CSS coin */
          });
      },
      { rootMargin: '600px 0px' },
    );
    io.observe(root);
    return () => {
      cancelled = true;
      io.disconnect();
      dispose?.();
    };
  }, [front, back, ring]);

  return (
    <div ref={rootRef} className={`coin ${ring ? 'coin--ring' : ''} ${className}`}>
      <div className="coin__stage">
        <div className="coin__spin">
          <div className="coin__body">
            {EDGE_LAYERS.map((z) => (
              <span key={z} className="coin__edge" style={{ ['--z' as string]: `${z}px` }} aria-hidden="true" />
            ))}
            <span className="coin__face coin__face--front">
              <img src={front} alt={frontAlt} width={640} height={640} loading={loading} decoding="async" draggable={false} />
            </span>
            <span className="coin__face coin__face--back" aria-hidden={backAlt ? undefined : true}>
              <img src={back} alt={backAlt} width={640} height={640} loading={loading} decoding="async" draggable={false} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
