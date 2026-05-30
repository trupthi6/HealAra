import React, { useEffect, useState } from 'react';
import BrandLogo from './BrandLogo';
export default function SplashScreen({ onComplete }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Stage 1: Wait for 3.5 seconds (cinematic animations complete and hold)
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 3500);

    // Stage 2: After fade-out transition completes (500ms), unmount
    const unmountTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 4000);

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
          background-image: radial-gradient(circle at center, #ffffff 60%, #f4fbfb 100%);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 1;
          transition: opacity 500ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .splash-fade-out {
          opacity: 0;
          pointer-events: none;
        }

        .splash-logo-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>

      <div className="splash-logo-wrapper">
        <BrandLogo cinematic={true} style={{ transform: 'scale(1.35)', transformOrigin: 'center' }} />
      </div>
    </div>
  );
}
