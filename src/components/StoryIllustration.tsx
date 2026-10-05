/** Custom illustration: citizen geo-tagged capture → optimized municipal cleanup → independent verification. */
export function StoryIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 400" className={className} role="img" aria-label="A citizen captures geo-tagged evidence of a garbage point, a municipal crew cleans it, and a ground verifier confirms the clean street.">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e3f1ec" />
          <stop offset="1" stopColor="#f7faf8" />
        </linearGradient>
        <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5f6670" />
          <stop offset="1" stopColor="#434951" />
        </linearGradient>
        <filter id="sh" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0f172a" floodOpacity=".18" />
        </filter>
      </defs>
      <rect width="1200" height="400" fill="url(#sky)" />
      {/* skyline */}
      <g opacity=".9">
        {[
          [0, 120, 90, '#d9e6df'], [92, 90, 70, '#cfe0d7'], [165, 140, 110, '#e4ece5'], [278, 100, 80, '#d3e2da'], [360, 130, 95, '#dde9e2'],
          [458, 110, 70, '#d0e0d8'], [530, 150, 120, '#e2ebe5'], [652, 95, 85, '#d5e4dc'], [740, 135, 100, '#dfe9e3'], [842, 115, 80, '#cfdfd6'],
          [924, 145, 110, '#e2ece6'], [1036, 105, 80, '#d4e3db'], [1118, 130, 82, '#dde8e1'],
        ].map(([x, h, w, c], i) => (
          <g key={i}>
            <rect x={x as number} y={250 - (h as number)} width={w as number} height={h as number} fill={c as string} />
            {Array.from({ length: Math.floor((h as number) / 28) }).map((_, j) => (
              <rect key={j} x={(x as number) + 12} y={250 - (h as number) + 14 + j * 26} width={(w as number) - 24} height="8" rx="2" fill="#fff" opacity=".55" />
            ))}
          </g>
        ))}
      </g>
      {/* wall + footpath + road */}
      <rect y="232" width="1200" height="40" fill="#efe7d6" />
      <rect y="232" width="1200" height="5" fill="#ddd0b6" />
      <rect y="272" width="1200" height="22" fill="#c8bda8" />
      <rect y="294" width="1200" height="106" fill="url(#road)" />
      {[40, 200, 360, 520, 680, 840, 1000, 1160].map((x) => (
        <rect key={x} x={x} y="346" width="70" height="6" rx="3" fill="#f3efe4" opacity=".8" />
      ))}

      {/* PANEL 1 — garbage + phone */}
      <g>
        <ellipse cx="170" cy="290" rx="120" ry="16" fill="#6b5236" opacity=".35" />
        {[
          [110, 272, 30, 22, '#23252a'], [150, 266, 34, 26, '#1f3550'], [190, 272, 30, 22, '#e8e6df'], [230, 276, 26, 18, '#2f6a3a'],
          [130, 250, 26, 20, '#cf6c8a'], [170, 244, 30, 22, '#2a2c31'], [205, 252, 24, 18, '#d9d2c3'], [160, 228, 22, 16, '#1d3a63'],
        ].map(([x, y, rx, ry, c], i) => (
          <g key={i}>
            <ellipse cx={x as number} cy={y as number} rx={rx as number} ry={ry as number} fill={c as string} />
            <ellipse cx={(x as number) - 8} cy={(y as number) - 6} rx={(rx as number) / 3} ry={(ry as number) / 4} fill="#fff" opacity=".18" />
          </g>
        ))}
        {[[70, 300], [95, 315], [250, 305], [280, 296], [60, 285], [300, 318]].map(([x, y], i) => (
          <rect key={i} x={x} y={y} width="12" height="6" rx="1.5" fill={i % 2 ? '#f2b134' : '#eef3f6'} transform={`rotate(${i * 37} ${x} ${y})`} />
        ))}
        {/* phone */}
        <g filter="url(#sh)" transform="translate(255 60) rotate(8)">
          <rect width="128" height="236" rx="20" fill="#13161c" />
          <rect x="7" y="9" width="114" height="218" rx="14" fill="#2a3138" />
          <rect x="7" y="9" width="114" height="150" rx="14" fill="#7a8a80" />
          <ellipse cx="62" cy="120" rx="44" ry="18" fill="#3a3d43" />
          <ellipse cx="50" cy="110" rx="16" ry="12" fill="#1f3550" />
          <ellipse cx="74" cy="112" rx="15" ry="11" fill="#e8e6df" />
          <ellipse cx="62" cy="100" rx="13" ry="10" fill="#cf6c8a" />
          <rect x="14" y="16" width="40" height="13" rx="4" fill="#16a34a" />
          <text x="34" y="26" fontSize="8" fontWeight="700" fill="#fff" textAnchor="middle" fontFamily="Inter">GPS ON</text>
          <circle cx="104" cy="22" r="4" fill="#ef4444" />
          <rect x="14" y="166" width="100" height="8" rx="3" fill="#80d2b9" />
          <rect x="14" y="179" width="72" height="6" rx="3" fill="#8592a8" />
          <rect x="14" y="190" width="84" height="6" rx="3" fill="#8592a8" />
          <circle cx="64" cy="212" r="10" fill="#fff" />
          <g transform="translate(55 34)">
            <path d="M9 0a9 9 0 0 1 9 9c0 7-9 16-9 16S0 16 0 9a9 9 0 0 1 9-9z" fill="#dc2626" />
            <circle cx="9" cy="9" r="3.5" fill="#fff" />
          </g>
        </g>
        <g transform="translate(36 40)">
          <rect width="190" height="54" rx="14" fill="#fff" filter="url(#sh)" />
          <text x="16" y="23" fontSize="11" fontWeight="800" fill="#176556" fontFamily="Inter" letterSpacing="1">GEO-TAGGED · WARD 12</text>
          <text x="16" y="41" fontSize="11" fill="#515c73" fontFamily="ui-monospace,monospace">16.8505° N, 74.6493° E</text>
        </g>
      </g>

      {/* PANEL 2 — route + truck */}
      <g>
        {/* truck */}
        <g transform="translate(500 228)" filter="url(#sh)">
          <rect x="0" y="0" width="170" height="70" rx="10" fill="#1b7e68" />
          <rect x="0" y="0" width="170" height="14" rx="7" fill="#176556" />
          <text x="85" y="46" textAnchor="middle" fontSize="20" fontWeight="800" fill="#fff" fontFamily="Plus Jakarta Sans, Inter" letterSpacing="2">SMKC</text>
          <path d="M170 18 h42 l26 26 v26 h-68 z" fill="#e7f5ef" />
          <path d="M178 24 h30 l18 18 h-48 z" fill="#9fd8c6" />
          <rect x="170" y="54" width="68" height="16" fill="#176556" />
          <circle cx="40" cy="74" r="14" fill="#1f2430" /><circle cx="40" cy="74" r="6" fill="#b0b9c8" />
          <circle cx="200" cy="74" r="14" fill="#1f2430" /><circle cx="200" cy="74" r="6" fill="#b0b9c8" />
        </g>
        {/* crew */}
        {[[770, 250], [800, 256]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <circle cx="10" cy="0" r="8" fill="#7c5a43" />
            <rect x="2" y="9" width="16" height="26" rx="6" fill="#f59e0b" />
            <rect x="2" y="16" width="16" height="3" fill="#fde68a" />
            <rect x="4" y="34" width="5" height="12" fill="#334155" /><rect x="11" y="34" width="5" height="12" fill="#334155" />
          </g>
        ))}
        <line x1="830" y1="262" x2="852" y2="300" stroke="#8a6d4b" strokeWidth="3" />
        <path d="M842 298 l22 6 -4 6 -22 -6z" fill="#a3a3a3" />
      </g>

      {/* PANEL 3 — clean + verified */}
      <g>
        <ellipse cx="1030" cy="292" rx="110" ry="12" fill="#6b5236" opacity=".12" />
        <g transform="translate(1110 214)">
          <path d="M0 8 h46 l-5 64 h-36 z" fill="#2f7d4f" />
          <rect x="-3" y="0" width="52" height="10" rx="3" fill="#256640" />
          <text x="23" y="44" textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff" fontFamily="Inter">SMKC</text>
        </g>
        {/* verifier */}
        <g transform="translate(950 186)">
          <circle cx="16" cy="0" r="11" fill="#8b6a52" />
          <rect x="3" y="13" width="26" height="44" rx="9" fill="#155146" />
          <rect x="6" y="56" width="8" height="34" fill="#1f2430" /><rect x="18" y="56" width="8" height="34" fill="#1f2430" />
          <rect x="26" y="18" width="18" height="6" rx="3" fill="#155146" transform="rotate(-30 26 18)" />
          <rect x="38" y="-6" width="16" height="26" rx="3" fill="#13161c" />
        </g>
        <g transform="translate(940 64)" filter="url(#sh)">
          <rect width="216" height="76" rx="16" fill="#fff" />
          <circle cx="36" cy="38" r="20" fill="#16a34a" />
          <path d="M26 38 l7 7 14 -15" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          <text x="66" y="34" fontSize="13" fontWeight="800" fill="#14532d" fontFamily="Inter">VERIFIED RESOLVED</text>
          <text x="66" y="53" fontSize="10.5" fill="#515c73" fontFamily="Inter">Fresh GPS photo · 14 m from site</text>
        </g>
      </g>

      {/* step labels */}
      {[
        [170, '1 · Citizen captures geo-tagged evidence'],
        [640, '2 · Municipal cleanup'],
        [1040, '3 · Independent ground verification'],
      ].map(([x, l]) => (
        <g key={l as string} transform={`translate(${x} 372)`}>
          <rect x="-150" y="-17" width="300" height="30" rx="15" fill="#0b2621" opacity=".82" />
          <text textAnchor="middle" y="3" fontSize="12.5" fontWeight="700" fill="#fff" fontFamily="Inter">{l}</text>
        </g>
      ))}
    </svg>
  );
}
