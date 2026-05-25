import React from 'react';
import './brand-logo.css';

export default function BrandLogo({ className = '', style = {} }) {
  return (
    <div className={`scene ${className}`} style={style}>
      <div className="stage">
        <svg viewBox="0 0 210 210">
          {/* THREE CLEAN ELLIPTICAL PATHS — no fills, just graceful lines */}
          {/* Path B — tilted ~15deg, medium radius */}
          <ellipse cx="105" cy="105" rx="64" ry="64" className="arc path-b" />

          {/* Path M — slightly smaller, tilted opposite */}
          <ellipse cx="105" cy="105" rx="48" ry="48" className="arc path-m" />

          {/* Path N — largest, gentle tilt */}
          <ellipse cx="105" cy="105" rx="80" ry="80" className="arc path-n" />

          {/* COMET TRAILS — same paths, animated dash */}
          <ellipse cx="105" cy="105" rx="64" ry="64" className="comet-b" />
          <ellipse cx="105" cy="105" rx="48" ry="48" className="comet-m" />
          <ellipse cx="105" cy="105" rx="80" ry="80" className="comet-n" />

          {/* CORE breathe ring */}
          <circle cx="105" cy="105" r="20" className="core-ring" />

          {/* CORE solid */}
          <circle cx="105" cy="105" r="18" className="core" />
          <text x="105" y="105" className="plett" fontSize="16">H</text>

          {/* BODY planet */}
          <g className="planet-wrap pb">
            <g transform="translate(105,41)">
              <circle r="11" fill="#0D9488" />
              <text y="0" className="plett">B</text>
              <text y="-17" className="plabel">Body</text>
            </g>
          </g>

          {/* MIND planet */}
          <g className="planet-wrap pm">
            <g transform="translate(105,57)">
              <circle r="10" fill="#2DD4BF" />
              <text y="0" className="plett" fill="#0f172a">M</text>
              <text y="-16" className="plabel">Mind</text>
            </g>
          </g>

          {/* NUTRITION planet */}
          <g className="planet-wrap pn">
            <g transform="translate(105,25)">
              <circle r="10" fill="#5EEAD4" />
              <text y="0" className="plett" fill="#0f172a">N</text>
              <text y="-16" className="plabel">Nutrition</text>
            </g>
          </g>
        </svg>
      </div>

      <div className="rule"></div>

      <div className="wm">
        <div className="wm-heal">Heal</div>
        <div className="wm-ara">Ara</div>
        <div className="wm-tag">MIND &nbsp;·&nbsp; BODY &nbsp;·&nbsp; NUTRITION &nbsp;·&nbsp; AI</div>
      </div>
    </div>
  );
}
