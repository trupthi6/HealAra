import React, { useId } from 'react';
import './brand-logo.css';

export default function BrandLogo({ className = '', style = {}, cinematic = false }) {
  const id = useId();
  const innerPathId = `path-inner-${id}`;
  const middlePathId = `path-middle-${id}`;
  const outerPathId = `path-outer-${id}`;

  return (
    <div className={`scene ${className} ${cinematic ? 'cinematic-scene' : ''}`} style={style}>
      <div className={`stage ${cinematic ? 'cinematic-stage' : ''}`}>
        <svg viewBox="0 0 300 300" className="logo-svg">
          <defs>
            <filter id="glow-heavy" x="-50%" y="-50%" width="200%" height="200%">
               <feGaussianBlur stdDeviation="4" result="blur" />
               <feMerge>
                 <feMergeNode in="blur" />
                 <feMergeNode in="SourceGraphic" />
               </feMerge>
             </filter>
            <filter id="glow-soft" x="-50%" y="-50%" width="200%" height="200%">
               <feGaussianBlur stdDeviation="2.0" result="blur" />
               <feMerge>
                 <feMergeNode in="blur" />
                 <feMergeNode in="SourceGraphic" />
               </feMerge>
             </filter>
            <linearGradient id="core-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0D9488" />
              <stop offset="100%" stopColor="#2DD4BF" />
            </linearGradient>
            <linearGradient id="comet-grad-inner" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0D9488" stopOpacity="1" />
              <stop offset="100%" stopColor="#0D9488" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="comet-grad-middle" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2DD4BF" stopOpacity="1" />
              <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="comet-grad-outer" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5EEAD4" stopOpacity="1" />
              <stop offset="100%" stopColor="#5EEAD4" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* INNER ORBIT (Leaf / Nutrition Node, R=65, bottom-left) */}
          <g transform="rotate(-135 150 150)">
            <g className="orbit-spin inner-spin">
              {/* Main Orbit Ring */}
              <circle cx="150" cy="150" r="65" className="arc path-inner" />
              
              {/* Comet Trail */}
              <path d="M 150 85 A 65 65 0 0 0 104 104" className="comet-trail" stroke="url(#comet-grad-inner)" />
              


              {/* Glowing Leaf Node */}
              <g transform="translate(150, 85)" className="orbit-node">
                <circle r="20" fill="#00F5D4" opacity="0.18" filter="url(#glow-soft)" />
                <circle r="14" fill="#0D9488" filter="url(#glow-soft)" />
                {/* Leaf Outline Icon */}
                <g transform="scale(1.4)">
                  <path d="M -4.5,4.5 C -4.5,0.5 -1,-3.5 4.5,-4.5 C 3.5,1 -0.5,4.5 -4.5,4.5 Z" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M -4.5,4.5 L 2.5,-2.5" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                </g>
              </g>

              {/* Curved Text Path & Orbit Label */}
              <path id={innerPathId} d="M 85,150 a 65,65 0 1,1 130,0 a 65,65 0 1,1 -130,0" fill="none" stroke="none" />
              <text className="orbit-label label-nutrition" dy="-9">
                <textPath href={`#${innerPathId}`} startOffset="14%" textAnchor="middle">NUTRITION</textPath>
              </text>
            </g>
          </g>

          {/* MIDDLE ORBIT (Body Node, R=100, top-left) */}
          <g transform="rotate(-45 150 150)">
            <g className="orbit-spin middle-spin">
              {/* Main Orbit Ring */}
              <circle cx="150" cy="150" r="100" className="arc path-middle" />
              
              {/* Comet Trail */}
              <path d="M 150 50 A 100 100 0 0 0 86 73.4" className="comet-trail" stroke="url(#comet-grad-middle)" />
              


              {/* Glowing Body Node */}
              <g transform="translate(150, 50)" className="orbit-node">
                <circle r="20" fill="#06B6D4" opacity="0.18" filter="url(#glow-soft)" />
                <circle r="14" fill="#06B6D4" filter="url(#glow-soft)" />
                {/* Body Outline Icon */}
                <g transform="scale(1.15) translate(0, -0.6)">
                  <circle cx="0" cy="-5.5" r="1.8" fill="none" stroke="#ffffff" strokeWidth="1.5" />
                  <path d="M -3,-2 C -3.5,-2 -4,-1.5 -4,-1 L -4,3.5 C -4,4.2 -3.5,4.7 -2.8,4.7 L -2,4.7 L -2,9.5 C -2,10 -1.5,10.5 -1,10.5 L -0.3,10.5 L -0.3,5 L 0.3,5 L 0.3,10.5 L 1,10.5 C 1.5,10.5 2,10 2,9.5 L 2,4.7 L 2.8,4.7 C 3.5,4.7 4,4.2 4,3.5 L 4,-1 C 4,-1.5 3.5,-2 3,-2 Z" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </g>

              {/* Curved Text Path & Orbit Label */}
              <path id={middlePathId} d="M 50,150 a 100,100 0 1,1 200,0 a 100,100 0 1,1 -200,0" fill="none" stroke="none" />
              <text className="orbit-label label-body" dy="-9">
                <textPath href={`#${middlePathId}`} startOffset="36%" textAnchor="middle">BODY</textPath>
              </text>
            </g>
          </g>

          {/* OUTER ORBIT (Brain / Mind Node, R=135, right) */}
          <g transform="rotate(90 150 150)">
            <g className="orbit-spin outer-spin">
              {/* Main Orbit Ring */}
              <circle cx="150" cy="150" r="135" className="arc path-outer" />
              
              {/* Comet Trail */}
              <path d="M 150 15 A 135 135 0 0 0 72.6 39.4" className="comet-trail" stroke="url(#comet-grad-outer)" />
              


              {/* Glowing Mind Node */}
              <g transform="translate(150, 15)" className="orbit-node">
                <circle r="20" fill="#84CC16" opacity="0.18" filter="url(#glow-soft)" />
                <circle r="14" fill="#84CC16" filter="url(#glow-soft)" />
                {/* Brain Outline Icon */}
                <g transform="scale(1.4) translate(0, 0.5)">
                  <path d="M -0.5,-5 C -3,-5 -4.5,-3.5 -4.5,-1.5 C -4.5,0.5 -3.2,1 -3.2,3 C -3.2,4.2 -2,4.5 -0.5,4.5" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M 0.5,-5 C 3,-5 4.5,-3.5 4.5,-1.5 C 4.5,0.5 3.2,1 3.2,3 C 3.2,4.2 2,4.5 0.5,4.5" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M 0,-4.5 V 4" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M -2.5,-2.5 C -1.5,-2.5 -1.5,-1.5 -0.5,-1.5" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M -3.5,0.5 C -2.5,0.5 -2.5,-0.5 -0.5,-0.5" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M -2,2 C -1.2,2 -1.2,1.2 -0.5,1.2" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M 2.5,-2.5 C 1.5,-2.5 1.5,-1.5 0.5,-1.5" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M 3.5,0.5 C 2.5,0.5 2.5,-0.5 0.5,-0.5" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M 2,2 C 1.2,2 1.2,1.2 0.5,1.2" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
                </g>
              </g>

              {/* Curved Text Path & Orbit Label */}
              <path id={outerPathId} d="M 15,150 a 135,135 0 1,1 270,0 a 135,135 0 1,1 -270,0" fill="none" stroke="none" />
              <text className="orbit-label label-mind" dy="-9">
                <textPath href={`#${outerPathId}`} startOffset="14%" textAnchor="middle">MIND</textPath>
              </text>
            </g>
          </g>

          {/* CORE breathing ring */}
          <circle cx="150" cy="150" r="38" className="core-ring" />

          {/* CORE solid glowing emblem */}
          <circle cx="150" cy="150" r="32" className="core" />
          <text x="150" y="152" className="core-h">H</text>
        </svg>
      </div>

      <div className={`wm ${cinematic ? 'cinematic-wm' : ''}`}>
        <div className={`wm-logo ${cinematic ? 'cinematic-logo' : ''}`}>
          <span className="wm-heal">Heal</span>
          <span className="wm-ara">Ara</span>
        </div>
        <div className={`wm-tag ${cinematic ? 'cinematic-tagline' : ''}`}>
          MIND &nbsp;·&nbsp; BODY &nbsp;·&nbsp; NUTRITION &nbsp;·&nbsp; AI
        </div>
      </div>
    </div>
  );
}
