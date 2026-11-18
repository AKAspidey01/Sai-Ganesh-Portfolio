import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export const MenuIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...base} {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const CloseIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" width="22" height="22" {...base} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const ArrowUpRight = (p: IconProps) => (
  <svg viewBox="0 0 24 24" width="24" height="24" {...base} strokeWidth={2} {...p}>
    <path d="M7 17L17 7M8 7h9v9" />
  </svg>
);

export const PhoneIcon = (p: IconProps) => (
  <svg viewBox="0 0 32 32" width="32" height="32" {...base} strokeWidth={1.5} {...p}>
    <path d="M11.2 4.5l2.6 5.6c.3.7.1 1.5-.5 2l-2 1.7a16 16 0 0 0 7 7l1.7-2c.5-.6 1.3-.8 2-.5l5.6 2.6c.8.4 1.2 1.2 1 2l-.8 3.2c-.2.9-1 1.5-1.9 1.5C14.1 27.6 4.4 17.9 4.4 6.1c0-.9.6-1.7 1.5-1.9L9.1 3.4c.8-.2 1.7.2 2.1 1.1z" />
  </svg>
);

export const MailIcon = (p: IconProps) => (
  <svg viewBox="0 0 32 32" width="32" height="32" {...base} strokeWidth={1.5} {...p}>
    <rect x="3.5" y="6.5" width="25" height="19" rx="2.5" />
    <path d="M4.5 8l11.5 9 11.5-9" />
  </svg>
);

export const MailSmallIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" width="14" height="14" {...base} {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3.5 6.5L12 13l8.5-6.5" />
  </svg>
);

export const ChevronDown = (p: IconProps) => (
  <svg viewBox="0 0 24 24" width="12" height="12" {...base} strokeWidth={2} {...p}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const DownloadIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" width="22" height="22" {...base} strokeWidth={1.6} {...p}>
    <path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" />
  </svg>
);

export const StarIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...p}>
    <path
      fill="currentColor"
      d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z"
    />
  </svg>
);
