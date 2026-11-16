interface PixelGridProps {
  cols: number;
  rows: number;
  className?: string;
}

/** Decorative grid of cells used by every pixel-formation effect. */
export function PixelGrid({ cols, rows, className = '' }: PixelGridProps) {
  return (
    <span
      aria-hidden="true"
      className={`pf__grid ${className}`}
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
    >
      {Array.from({ length: cols * rows }, (_, i) => (
        <span key={i} className="pf__cell" />
      ))}
    </span>
  );
}
