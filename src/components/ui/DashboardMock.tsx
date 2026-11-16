/** Drawn stand-in for a project cover: a laptop showing a dark finance dashboard. */
export function DashboardMock({ accent = '#d4f53c' }: { accent?: string }) {
  return (
    <svg className="dash-mock" viewBox="0 0 400 260" role="img" aria-label="Dashboard screen preview">
      <defs>
        <linearGradient id="dmScreen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#151517" />
          <stop offset="1" stopColor="#0b0b0c" />
        </linearGradient>
        <linearGradient id="dmBase" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b2b2e" />
          <stop offset="1" stopColor="#0d0d0e" />
        </linearGradient>
      </defs>
      <g transform="translate(46 40) skewY(-6)">
        <rect width="300" height="176" rx="8" fill="#1d1d20" />
        <rect x="6" y="6" width="288" height="164" rx="4" fill="url(#dmScreen)" />
        <rect x="16" y="16" width="34" height="5" rx="2.5" fill="#fff" opacity=".8" />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={74 + i * 34} y="15" width="28" height="7" rx="3.5" fill={i === 0 ? accent : '#2a2a2d'} />
        ))}
        <circle cx="276" cy="18" r="5" fill="#ff8a8a" />
        <text x="16" y="40" fill="#fff" fontSize="9" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700">Dashboard</text>
        <rect x="16" y="50" width="56" height="40" rx="6" fill="#1f1f22" />
        <text x="22" y="74" fill="#fff" fontSize="10" fontFamily="Plus Jakarta Sans, sans-serif">$23.0K</text>
        <rect x="22" y="80" width="40" height="4" rx="2" fill={accent} />
        <rect x="78" y="48" width="52" height="44" rx="7" fill={accent} />
        <rect x="88" y="62" width="20" height="16" rx="4" fill="#0b0b0c" opacity=".85" />
        <rect x="136" y="50" width="52" height="40" rx="6" fill="#1f1f22" />
        <circle cx="168" cy="70" r="11" fill="none" stroke="#2f2f33" strokeWidth="5" />
        <circle cx="168" cy="70" r="11" fill="none" stroke={accent} strokeWidth="5" strokeDasharray="48 70" transform="rotate(-90 168 70)" />
        <rect x="196" y="38" width="88" height="70" rx="6" fill="#1f1f22" />
        <path d="M204 92 C222 88 228 70 244 74 S266 56 278 58" fill="none" stroke={accent} strokeWidth="2" />
        <circle cx="244" cy="74" r="3" fill="#fff" />
        <rect x="16" y="104" width="172" height="58" rx="6" fill="#1a1a1d" />
        {[14, 24, 18, 30, 20, 34, 24, 28].map((h, i) => (
          <rect key={i} x={26 + i * 20} y={154 - h} width="11" height={h} rx="2" fill={i === 5 ? accent : '#333338'} />
        ))}
        <text x="24" y="120" fill="#fff" fontSize="10" fontFamily="Plus Jakarta Sans, sans-serif">$34.2K</text>
        <rect x="196" y="116" width="88" height="46" rx="6" fill="#1a1a1d" />
        <rect x="204" y="126" width="60" height="5" rx="2.5" fill="#333338" />
        <rect x="204" y="138" width="44" height="5" rx="2.5" fill="#333338" />
        <rect x="204" y="150" width="52" height="5" rx="2.5" fill="#333338" />
      </g>
      <path d="M20 232 L380 196 L392 206 L30 246 Z" fill="url(#dmBase)" />
    </svg>
  );
}
