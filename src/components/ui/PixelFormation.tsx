import type { CSSProperties, ReactNode } from 'react';
import { PixelGrid } from './PixelGrid';

interface PixelFormationProps {
  children: ReactNode;
  cols?: number;
  rows?: number;
  /** Classes for the real, visible element (the thing that forms). */
  contentClassName?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Markup for the pixel-formation effect. Animation is applied by
 * `pixelFormation()` from lib/motion so the caller decides the trigger
 * (page load, scroll scrub, hover…).
 */
export function PixelFormation({ children, cols = 12, rows = 3, contentClassName = '', className = '', style }: PixelFormationProps) {
  return (
    <span className={`pf ${className}`} style={style}>
      <span className={`pf__content ${contentClassName}`}>{children}</span>
      <PixelGrid cols={cols} rows={rows} />
    </span>
  );
}
