import { forwardRef } from 'react';

interface PictureCoinProps {
  front: string;
  back: string;
  frontAlt: string;
  backAlt?: string;
  /** Gradient ring around both faces (footer variant). */
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
 *  .coin__spin  → entrance spins (load / footer flip)
 *  .coin__body  → flip that chooses the face (scroll / hover / tap)
 *
 * Separate layers let several animations own different transforms without
 * fighting over the same property.
 */
export const PictureCoin = forwardRef<HTMLDivElement, PictureCoinProps>(function PictureCoin(
  { front, back, frontAlt, backAlt = '', ring = false, loading = 'eager', className = '' },
  ref,
) {
  return (
    <div ref={ref} className={`coin ${ring ? 'coin--ring' : ''} ${className}`}>
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
