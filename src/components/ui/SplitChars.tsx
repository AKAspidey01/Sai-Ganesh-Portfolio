interface SplitCharsProps {
  text: string;
  className?: string;
}

/**
 * Splits text into masked characters for baseline / rolling reveals.
 * Screen readers get the plain string; the split glyphs are aria-hidden.
 */
export function SplitChars({ text, className = '' }: SplitCharsProps) {
  return (
    <span className={`sc ${className}`}>
      <span className="sr-only">{text}</span>
      <span className="sc__chars" aria-hidden="true">
        {Array.from(text).map((ch, i) =>
          ch === ' ' ? (
            <span key={i} className="sc__space" />
          ) : (
            <span key={i} className="sc__mask">
              <span className="sc__char">{ch}</span>
            </span>
          ),
        )}
      </span>
    </span>
  );
}
