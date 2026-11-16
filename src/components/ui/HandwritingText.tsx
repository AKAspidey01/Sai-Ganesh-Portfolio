interface HandwritingTextProps {
  text: string;
  className?: string;
}

/**
 * Pacifico script text. The reveal (`handwriting()` in lib/motion) animates
 * the --hw custom property that drives a soft pen-wipe mask.
 */
export function HandwritingText({ text, className = '' }: HandwritingTextProps) {
  return <span className={`hw ${className}`}>{text}</span>;
}
