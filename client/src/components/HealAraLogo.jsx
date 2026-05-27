import React from 'react';

const CSS = `
  @keyframes cometSpin {
    from { stroke-dashoffset: 428; }
    to   { stroke-dashoffset: 0; }
  }
  @keyframes breathe {
    0%, 100% { opacity: 0.5; transform: scale(1); transform-origin: 105px 105px; }
    50%       { opacity: 0;   transform: scale(1.55); transform-origin: 105px 105px; }
  }
  @keyframes spinB {
    from { transform: rotate(0deg);   }
    to   { transform: rotate(360deg); }
  }
  @keyframes spinM {
    from { transform: rotate(120deg); }
    to   { transform: rotate(480deg); }
  }
  @keyframes spinN {
    from { transform: rotate(240deg); }
    to   { transform: rotate(600deg); }
  }
  .ha-comet-b {
    fill: none; stroke: #0D9488; stroke-width: 2;
    stroke-dasharray: 28 400; stroke-linecap: round;
    animation: cometSpin 5s linear infinite;
  }
  .ha-comet-m {
    fill: none; stroke: #2DD4BF; stroke-width: 2;
    stroke-dasharray: 22 400; stroke-linecap: round;
    animation: cometSpin 8s linear infinite;
  }
  .ha-comet-n {
    fill: none; stroke: #5EEAD4; stroke-width: 2;
    stroke-dasharray: 18 400; stroke-linecap: round;
    animation: cometSpin 11s linear infinite reverse;
  }
  .ha-breathe {
    animation: breathe 3s ease-in-out infinite;
    transform-origin: 105px 105px;
  }
  .ha-spin-b {
    animation: spinB 5s linear infinite;
    transform-origin: 105px 105px;
  }
  .ha-spin-m {
    animation: spinM 8s linear infinite;
    transform-origin: 105px 105px;
  }
  .ha-spin-n {
    animation: spinN 11s linear infinite reverse;
    transform-origin: 105px 105px;
  }
`;

function OrbitMark({ sizePx = 210 }) {
  return (
    <svg
      width={sizePx}
      height={sizePx}
      viewBox="0 0 210 210"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <style>{CSS}</style>

      {/* ── Static orbital rings ── */}
      {/* Body orbit r=64 */}
      <ellipse cx="105" cy="105" rx="64" ry="64" fill="none" stroke="#CCFBF1" strokeWidth="1" />
      {/* Mind orbit r=48 */}
      <ellipse cx="105" cy="105" rx="48" ry="48" fill="none" stroke="#CCFBF1" strokeWidth="1" />
      {/* Nutrition orbit r=82 */}
      <ellipse cx="105" cy="105" rx="82" ry="82" fill="none" stroke="#CCFBF1" strokeWidth="1" />

      {/* ── Comet trails ── */}
      <ellipse className="ha-comet-b" cx="105" cy="105" rx="64" ry="64" />
      <ellipse className="ha-comet-m" cx="105" cy="105" rx="48" ry="48" />
      <ellipse className="ha-comet-n" cx="105" cy="105" rx="82" ry="82" />

      {/* ── Breathing ring ── */}
      <circle className="ha-breathe" cx="105" cy="105" r="18" fill="none" stroke="#0D9488" strokeWidth="1.5" />

      {/* ── Solid core ── */}
      <circle cx="105" cy="105" r="14" fill="#0D9488" />
      <text
        x="105" y="105"
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontFamily="'Inter', sans-serif"
        fontSize="13"
        fontWeight="700"
      >H</text>

      {/* ── Planet dots ── */}

      {/* BODY — r=64, 5s */}
      <g className="ha-spin-b">
        <circle cx="41" cy="105" r="7" fill="#0D9488" />
        <text
          x="41" y="105"
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontFamily="'Inter', sans-serif"
          fontSize="6"
          fontWeight="700"
        >B</text>
      </g>

      {/* MIND — r=48, 8s, starts 120deg */}
      <g className="ha-spin-m">
        <circle cx="57" cy="105" r="6" fill="#2DD4BF" />
        <text
          x="57" y="105"
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontFamily="'Inter', sans-serif"
          fontSize="5"
          fontWeight="700"
        >M</text>
      </g>

      {/* NUTRITION — r=82, 11s reverse, starts 240deg */}
      <g className="ha-spin-n">
        <circle cx="23" cy="105" r="6" fill="#5EEAD4" />
        <text
          x="23" y="105"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#0F766E"
          fontFamily="'Inter', sans-serif"
          fontSize="5"
          fontWeight="700"
        >N</text>
      </g>
    </svg>
  );
}

export default function HealAraLogo({ size = 'md', showWordmark = false }) {
  const sizePx = size === 'sm' ? 40 : size === 'lg' ? 210 : 120;

  if (!showWordmark) {
    return <OrbitMark sizePx={sizePx} />;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
      <OrbitMark sizePx={sizePx} />

      {/* Vertical rule */}
      <div style={{ width: 1, height: 150, background: '#E2E8F0', flexShrink: 0 }} />

      {/* Wordmark */}
      <div>
        <div style={{ lineHeight: 1 }}>
          <span
            style={{
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
              fontSize: size === 'lg' ? 64 : 36,
              fontWeight: 100,
              color: '#0F172A',
              letterSpacing: size === 'lg' ? -4 : -2,
              display: 'block',
              lineHeight: 1,
            }}
          >
            Heal
          </span>
          <span
            style={{
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
              fontSize: size === 'lg' ? 64 : 36,
              fontWeight: 100,
              color: '#0D9488',
              letterSpacing: size === 'lg' ? -4 : -2,
              display: 'block',
              lineHeight: 1,
            }}
          >
            Ara
          </span>
        </div>
        <p
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: '#94A3B8',
            letterSpacing: 4,
            marginTop: 14,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          MIND · BODY · NUTRITION · AI
        </p>
      </div>
    </div>
  );
}
