import React, { useState } from 'react';
import type { ProjectCategoryValue } from '../types/site';

export const ProjectArtwork = React.memo(function ProjectArtwork({
  image,
  title,
  category,
  accentColor = '#0EA5E9',
  className = 'h-48 w-full',
}: {
  image?: string;
  title: string;
  category: ProjectCategoryValue;
  accentColor?: string;
  className?: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  if (image && !imgFailed) {
    return (
      <div className={`relative overflow-hidden bg-[#050B14] ${className}`}>
        <img
          src={image}
          alt={title}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B1526]/90 via-transparent to-transparent" />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-[#071120] flex items-center justify-center ${className}`}
    >
      <svg
        viewBox="0 0 400 220"
        className="h-full w-full"
        role="img"
        aria-label={`Ilustração técnica para ${title}`}
      >
        <defs>
          <linearGradient id={`grad-${category}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.18" />
            <stop offset="100%" stopColor="#050B14" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        <rect width="400" height="220" fill={`url(#grad-${category})`} />

        {/* Subtle technical grid */}
        <g stroke="rgba(148,163,184,0.08)" strokeWidth="1">
          {[44, 88, 132, 176].map((y) => (
            <line key={y} x1="0" y1={y} x2="400" y2={y} />
          ))}
          {[80, 160, 240, 320].map((x) => (
            <line key={x} x1={x} y1="0" x2={x} y2="220" />
          ))}
        </g>

        {category === 'Sistemas' && (
          <g>
            <rect x="44" y="34" width="312" height="152" rx="10" fill="#050B14" stroke="rgba(255,255,255,0.12)" />
            <rect x="60" y="54" width="84" height="44" rx="6" fill="#0B1526" stroke="rgba(255,255,255,0.08)" />
            <rect x="156" y="54" width="84" height="44" rx="6" fill="#0B1526" stroke="rgba(255,255,255,0.08)" />
            <rect x="252" y="54" width="88" height="44" rx="6" fill="#0B1526" stroke={accentColor} strokeOpacity="0.45" />
            {[116, 138, 160].map((y, idx) => (
              <rect
                key={y}
                x="60"
                y={y}
                width={210 - idx * 36}
                height="12"
                rx="4"
                fill={idx === 0 ? accentColor : 'rgba(148,163,184,0.2)'}
                fillOpacity={idx === 0 ? 0.5 : 1}
              />
            ))}
          </g>
        )}

        {category === 'Inteligência Artificial' && (
          <g>
            <circle cx="200" cy="110" r="42" fill="#050B14" stroke={accentColor} strokeWidth="1.5" strokeOpacity="0.7" />
            <circle cx="200" cy="110" r="18" fill={accentColor} fillOpacity="0.22" />
            {[
              [82, 60],
              [82, 160],
              [318, 60],
              [318, 160],
            ].map(([x, y], i) => (
              <g key={i}>
                <line x1={x} y1={y} x2="200" y2="110" stroke={accentColor} strokeOpacity="0.38" strokeDasharray="4 4" />
                <circle cx={x} cy={y} r="10" fill="#050B14" stroke="rgba(255,255,255,0.22)" />
              </g>
            ))}
          </g>
        )}

        {category === 'Infraestrutura' && (
          <g>
            {[74, 156, 238].map((x, idx) => (
              <g key={x}>
                <rect
                  x={x}
                  y="52"
                  width="66"
                  height="116"
                  rx="8"
                  fill="#050B14"
                  stroke={idx === 1 ? accentColor : 'rgba(255,255,255,0.14)'}
                />
                {[74, 98, 122, 146].map((y) => (
                  <line
                    key={y}
                    x1={x + 12}
                    y1={y}
                    x2={x + 54}
                    y2={y}
                    stroke={idx === 1 ? accentColor : 'rgba(148,163,184,0.35)'}
                    strokeWidth="2"
                  />
                ))}
              </g>
            ))}
          </g>
        )}

        {category === 'Automação' && (
          <g>
            {[64, 166, 268].map((x, idx) => (
              <g key={x}>
                <rect
                  x={x}
                  y="82"
                  width="68"
                  height="56"
                  rx="8"
                  fill="#050B14"
                  stroke={idx === 1 ? accentColor : 'rgba(255,255,255,0.16)'}
                />
                {idx < 2 && (
                  <line
                    x1={x + 68}
                    y1="110"
                    x2={x + 102}
                    y2="110"
                    stroke={accentColor}
                    strokeWidth="2"
                  />
                )}
              </g>
            ))}
          </g>
        )}

        {category === 'Sites' && (
          <g>
            <rect x="52" y="34" width="296" height="152" rx="10" fill="#050B14" stroke="rgba(255,255,255,0.14)" />
            <line x1="52" y1="62" x2="348" y2="62" stroke="rgba(255,255,255,0.08)" />
            <rect x="74" y="82" width="128" height="14" rx="4" fill={accentColor} fillOpacity="0.65" />
            <rect x="74" y="106" width="108" height="8" rx="3" fill="rgba(148,163,184,0.3)" />
            <rect x="74" y="122" width="90" height="8" rx="3" fill="rgba(148,163,184,0.2)" />
            <rect x="226" y="78" width="100" height="84" rx="8" fill="#0B1526" stroke={accentColor} strokeOpacity="0.3" />
          </g>
        )}
      </svg>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B1526] via-transparent to-transparent" />
    </div>
  );
});
