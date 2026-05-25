import React, { useEffect, useState } from 'react';

export default function SplashScreen({ onComplete }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Stage 1: Wait for 2 seconds (logo animation completes and holds)
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2000);

    // Stage 2: After fade-out transition completes (400ms), unmount
    const unmountTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2400);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, [onComplete]);

  return (
    <div className={`splash-container ${fadeOut ? 'splash-fade-out' : ''}`}>
      <style>{`
        /* Splash Screen Container */
        .splash-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: #ffffff;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 1;
          transition: opacity 400ms ease-out;
        }

        .splash-fade-out {
          opacity: 0;
          pointer-events: none;
        }

        /* Swiggy-like Entry Animation */
        .splash-logo-wrapper {
          transform: translateY(20px);
          opacity: 0;
          animation: logoFadeUp 600ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes logoFadeUp {
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* ORBIT LOGO BRANDING STYLES */
        .scene {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 52px;
          padding: 52px 40px;
          background: #ffffff;
          border-radius: 24px;
          flex-wrap: wrap;
          min-height: 300px;
        }

        /* ORBIT STAGE */
        .stage {
          position: relative;
          width: 210px;
          height: 210px;
          flex-shrink: 0;
        }

        .stage svg {
          overflow: visible;
          width: 210px;
          height: 210px;
        }

        /* Pure line arcs - no filled circles, no dark rings */
        .arc {
          fill: none;
          stroke-linecap: round;
        }

        /* Three elliptical paths at different tilts */
        .path-b {
          stroke: #0D9488;
          stroke-width: 1.5;
          opacity: .22;
        }

        .path-m {
          stroke: #0D9488;
          stroke-width: 1.5;
          opacity: .22;
        }

        .path-n {
          stroke: #0D9488;
          stroke-width: 1.5;
          opacity: .22;
        }

        /* Moving dash - the "comet" on each path */
        .comet-b {
          fill: none;
          stroke: #0D9488;
          stroke-width: 2;
          stroke-dasharray: 28 400;
          stroke-linecap: round;
          animation: cometB 5s linear infinite;
        }

        .comet-m {
          fill: none;
          stroke: #2DD4BF;
          stroke-width: 2;
          stroke-dasharray: 22 400;
          stroke-linecap: round;
          animation: cometM 8s linear infinite;
        }

        .comet-n {
          fill: none;
          stroke: #5EEAD4;
          stroke-width: 2;
          stroke-dasharray: 18 400;
          stroke-linecap: round;
          animation: cometN 11s linear infinite reverse;
        }

        @keyframes cometB {
          from { stroke-dashoffset: 428; }
          to   { stroke-dashoffset: 0; }
        }

        @keyframes cometM {
          from { stroke-dashoffset: 428; }
          to   { stroke-dashoffset: 0; }
        }

        @keyframes cometN {
          from { stroke-dashoffset: 428; }
          to   { stroke-dashoffset: 0; }
        }

        /* Planet dots - pure solid circles, no glow rings */
        .planet-wrap {
          transform-origin: 105px 105px;
        }

        .pb { animation: spinB  5s linear infinite; }
        .pm { animation: spinM  8s linear infinite; }
        .pn { animation: spinN 11s linear infinite reverse; }

        @keyframes spinB {
          from { transform: rotate(0deg); }
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

        .planet-dot {
          transition: r .2s;
        }

        /* Core - minimal, just a clean circle with letter */
        .core {
          fill: #0D9488;
        }

        .core-ring {
          fill: none;
          stroke: #0D9488;
          stroke-width: 1;
          opacity: 0;
          transform-origin: 105px 105px;
          animation: breathe 3s ease-in-out infinite;
        }

        @keyframes breathe {
          0%   { opacity: .5; transform: scale(1); }
          50%  { opacity: 0;  transform: scale(1.55); }
          100% { opacity: .5; transform: scale(1); }
        }

        /* WORDMARK */
        .wm {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .wm-heal {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 72px;
          font-weight: 100;
          color: #0f172a;
          letter-spacing: -4px;
          line-height: 1;
        }

        .wm-ara {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 72px;
          font-weight: 100;
          color: #0D9488;
          letter-spacing: -4px;
          line-height: 1.05;
        }

        .wm-tag {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 10px;
          font-weight: 500;
          color: #94a3b8;
          letter-spacing: 4px;
          margin-top: 16px;
        }

        /* Vertical rule */
        .rule {
          width: 1px;
          height: 150px;
          background: #e2e8f0;
          align-self: center;
          flex-shrink: 0;
        }

        /* Label text on planets */
        .plabel {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 9.5px;
          fill: #64748b;
          text-anchor: middle;
          font-weight: 500;
        }

        .plett {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 8px;
          fill: #fff;
          font-weight: 700;
          text-anchor: middle;
          dominant-baseline: middle;
        }
      `}</style>

      <div className="splash-logo-wrapper">
        <div className="scene">
          {/* Orbit Stage */}
          <div className="stage">
            <svg viewBox="0 0 210 210">
              <circle className="core-ring" cx="105" cy="105" r="16" />
              <circle className="core" cx="105" cy="105" r="16" />
              <text className="plett" x="105" y="105">A</text>

              {/* Orbit B (Blood Pressure) */}
              <g transform="rotate(-30 105 105)">
                <ellipse className="arc path-b" cx="105" cy="105" rx="80" ry="56" />
                <ellipse className="comet-b" cx="105" cy="105" rx="80" ry="56" />
              </g>

              {/* Orbit M (Mood) */}
              <g transform="rotate(30 105 105)">
                <ellipse className="arc path-m" cx="105" cy="105" rx="80" ry="56" />
                <ellipse className="comet-m" cx="105" cy="105" rx="80" ry="56" />
              </g>

              {/* Orbit N (Glucose) */}
              <g transform="rotate(90 105 105)">
                <ellipse className="arc path-n" cx="105" cy="105" rx="80" ry="56" />
                <ellipse className="comet-n" cx="105" cy="105" rx="80" ry="56" />
              </g>

              {/* Planet B (Blood Pressure) */}
              <g transform="rotate(-30 105 105) scale(1, 0.7)">
                <g className="planet-wrap pb">
                  <circle className="planet-dot" cx="185" cy="105" r="9" fill="#0D9488" />
                  <text className="plett" x="185" y="105">B</text>
                  <text className="plabel" x="185" y="126">BP</text>
                </g>
              </g>

              {/* Planet M (Mood) */}
              <g transform="rotate(30 105 105) scale(1, 0.7)">
                <g className="planet-wrap pm">
                  <circle className="planet-dot" cx="185" cy="105" r="9" fill="#2DD4BF" />
                  <text className="plett" x="185" y="105">M</text>
                  <text className="plabel" x="185" y="126">Mood</text>
                </g>
              </g>

              {/* Planet N (Glucose) */}
              <g transform="rotate(90 105 105) scale(1, 0.7)">
                <g className="planet-wrap pn">
                  <circle className="planet-dot" cx="185" cy="105" r="9" fill="#5EEAD4" />
                  <text className="plett" x="185" y="105">G</text>
                  <text className="plabel" x="185" y="126">Glucose</text>
                </g>
              </g>
            </svg>
          </div>

          {/* Vertical Divider */}
          <div className="rule"></div>

          {/* Wordmark Branding */}
          <div className="wm">
            <span className="wm-heal">Anti</span>
            <span className="wm-ara">gravity</span>
            <span className="wm-tag">HEALTH INTELLIGENCE PLATFORM</span>
          </div>
        </div>
      </div>
    </div>
  );
}
