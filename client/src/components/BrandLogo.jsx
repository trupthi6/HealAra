import React from 'react';
import './brand-logo.css';

export default function BrandLogo({ className = '', style = {} }) {
  return (
    <div className={`scene ${className}`} style={style}>
      {/* ORBIT STAGE */}
      <div className="stage">
        <svg viewBox="0 0 210 210">
          <circle className="core-ring" cx="105" cy="105" r="28" />

          <ellipse className="arc path-b" cx="105" cy="105" rx="90" ry="36" transform="rotate(-30 105 105)" />
          <ellipse className="arc path-m" cx="105" cy="105" rx="90" ry="36" transform="rotate(30 105 105)" />
          <ellipse className="arc path-n" cx="105" cy="105" rx="90" ry="36" transform="rotate(90 105 105)" />

          <ellipse className="arc comet-b" cx="105" cy="105" rx="90" ry="36" transform="rotate(-30 105 105)" />
          <ellipse className="arc comet-m" cx="105" cy="105" rx="90" ry="36" transform="rotate(30 105 105)" />
          <ellipse className="arc comet-n" cx="105" cy="105" rx="90" ry="36" transform="rotate(90 105 105)" />

          <g className="planet-wrap pb">
            <circle className="planet-dot" cx="195" cy="105" r="6" fill="#0D9488" />
          </g>
          <g className="planet-wrap pm">
            <circle className="planet-dot" cx="195" cy="105" r="5" fill="#2DD4BF" />
          </g>
          <g className="planet-wrap pn">
            <circle className="planet-dot" cx="195" cy="105" r="4" fill="#5EEAD4" />
          </g>

          <circle className="core" cx="105" cy="105" r="22" />
          <text className="plett" x="105" y="105">H</text>
        </svg>
      </div>

      {/* VERTICAL RULE */}
      <div className="rule"></div>

      {/* WORDMARK */}
      <div className="wm">
        <div className="wm-heal">Heal</div>
        <div className="wm-ara">Ara</div>
        <div className="wm-tag">HEALTH INTELLIGENCE</div>
      </div>
    </div>
  );
}
