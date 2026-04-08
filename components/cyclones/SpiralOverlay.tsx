import React from 'react';

export default function SpiralOverlay() {
  const arms = 3;
  const turns = 2;
  const pointsPerArm = 100;
  const b = 12; // spiral tightness

  const paths = [];
  for (let i = 0; i < arms; i++) {
    const offset = (i * 2 * Math.PI) / arms;
    let d = '';
    for (let j = 0; j <= pointsPerArm; j++) {
      const theta = (j / pointsPerArm) * turns * 2 * Math.PI;
      const r = b * theta;
      const x = 200 + r * Math.cos(theta + offset);
      const y = 200 + r * Math.sin(theta + offset);
      if (j === 0) d += `M ${x} ${y} `;
      else d += `L ${x} ${y} `;
    }
    paths.push(d);
  }

  return (
    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 20 }}>
      <style>
        {`
          @keyframes spin { 100% { transform: rotate(360deg); } }
          @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.5); opacity: 0.4; } }
          .spiral-container { animation: spin 8s linear infinite; width: 400px; height: 400px; }
          .spiral-center { animation: pulse 1.5s ease-in-out infinite; }
        `}
      </style>
      <svg className="spiral-container" viewBox="0 0 400 400">
        <defs>
          <radialGradient id="spiral-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="30%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </radialGradient>
        </defs>
        {paths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="url(#spiral-grad)" strokeWidth="4" strokeLinecap="round" />
        ))}
        <circle cx="200" cy="200" r="8" fill="#dc2626" className="spiral-center" />
      </svg>
    </div>
  );
}
