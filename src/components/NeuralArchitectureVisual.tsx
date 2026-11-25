import React, { useState } from 'react';
import { Lock } from 'lucide-react';

type LayerKey = 'input' | 'processing' | 'governance';

const LAYER_INFO: Record<
  LayerKey,
  { title: string; summary: string; nodes: string[] }
> = {
  input: {
    title: 'Fontes Corporativas',
    summary:
      'Conexão segura com documentos internos, ERPs, CRMs, APIs REST e canais de atendimento.',
    nodes: ['ERPs & CRMs', 'Documentos PDF', 'APIs & Bancos'],
  },
  processing: {
    title: 'Núcleo de IA Aplicada',
    summary:
      'Modelos de linguagem, busca semântica (RAG), classificação e automação contextualizada.',
    nodes: ['Modelos LLM', 'Busca Semântica', 'Automação'],
  },
  governance: {
    title: 'Camada de Governança',
    summary:
      'Controle de acessos por perfil, criptografia em trânsito, conformidade LGPD e trilha de auditoria.',
    nodes: ['Acesso RBAC', 'LGPD', 'Auditoria'],
  },
};

export const NeuralArchitectureVisual = React.memo(function NeuralArchitectureVisual({
  accentColor = '#0EA5E9',
}: {
  accentColor?: string;
}) {
  const [activeLayer, setActiveLayer] = useState<LayerKey>('processing');

  const isInput = activeLayer === 'input';
  const isProc = activeLayer === 'processing';
  const isGov = activeLayer === 'governance';

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0B1526] p-6">
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#050B14] p-4">
        <svg
          viewBox="0 0 460 230"
          className="h-56 w-full sm:h-64"
          role="img"
          aria-label="Diagrama interativo da arquitetura de Inteligência Artificial em três camadas"
        >
          <defs>
            <radialGradient id="aiCoreHalo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.35" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Subtle architectural grid */}
          <g stroke="rgba(148,163,184,0.07)" strokeWidth="1">
            {[40, 115, 190].map((y) => (
              <line key={y} x1="16" y1={y} x2="444" y2={y} />
            ))}
            {[80, 230, 380].map((x) => (
              <line key={x} x1={x} y1="20" x2={x} y2="210" />
            ))}
          </g>

          {/* Connections Input -> Core */}
          {[55, 115, 175].map((y) => (
            <line
              key={`in-${y}`}
              x1="108"
              y1={y}
              x2="195"
              y2="115"
              stroke={isInput || isProc ? accentColor : 'rgba(148,163,184,0.22)'}
              strokeOpacity={isInput || isProc ? 0.7 : 0.4}
              strokeWidth={isInput || isProc ? 1.6 : 1}
              strokeDasharray="4 4"
            />
          ))}

          {/* Connections Core -> Governance */}
          {[55, 115, 175].map((y) => (
            <line
              key={`out-${y}`}
              x1="265"
              y1="115"
              x2="352"
              y2={y}
              stroke={isGov || isProc ? accentColor : 'rgba(148,163,184,0.22)'}
              strokeOpacity={isGov || isProc ? 0.7 : 0.4}
              strokeWidth={isGov || isProc ? 1.6 : 1}
              strokeDasharray="4 4"
            />
          ))}

          {/* Layer 1: Input Nodes */}
          {LAYER_INFO.input.nodes.map((label, idx) => {
            const y = 55 + idx * 60;
            return (
              <g key={label}>
                <rect
                  x="20"
                  y={y - 16}
                  width="88"
                  height="32"
                  rx="6"
                  fill={isInput ? 'rgba(14,165,233,0.16)' : '#0B1526'}
                  stroke={isInput ? accentColor : 'rgba(255,255,255,0.14)'}
                  strokeWidth={isInput ? 1.5 : 1}
                />
                <text
                  x="64"
                  y={y + 4}
                  textAnchor="middle"
                  fill={isInput ? '#F1F5F9' : '#94A3B8'}
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Layer 2: Central Neural Core */}
          <circle cx="230" cy="115" r="56" fill="url(#aiCoreHalo)" />
          <circle
            cx="230"
            cy="115"
            r="38"
            fill={isProc ? 'rgba(14,165,233,0.18)' : '#0B1526'}
            stroke={isProc ? accentColor : 'rgba(255,255,255,0.2)'}
            strokeWidth={isProc ? 2 : 1.2}
          />
          <text
            x="230"
            y="112"
            textAnchor="middle"
            fill="#F1F5F9"
            fontSize="11"
            fontWeight="600"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            Núcleo IA
          </text>
          <text
            x="230"
            y="127"
            textAnchor="middle"
            fill="#94A3B8"
            fontSize="9"
            fontFamily="JetBrains Mono, monospace"
          >
            RAG + APIs
          </text>

          {/* Layer 3: Governance Nodes */}
          {LAYER_INFO.governance.nodes.map((label, idx) => {
            const y = 55 + idx * 60;
            return (
              <g key={label}>
                <rect
                  x="352"
                  y={y - 16}
                  width="88"
                  height="32"
                  rx="6"
                  fill={isGov ? 'rgba(14,165,233,0.16)' : '#0B1526'}
                  stroke={isGov ? accentColor : 'rgba(255,255,255,0.14)'}
                  strokeWidth={isGov ? 1.5 : 1}
                />
                <text
                  x="396"
                  y={y + 4}
                  textAnchor="middle"
                  fill={isGov ? '#F1F5F9' : '#94A3B8'}
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5 text-slate-200">
            <Lock className="h-3.5 w-3.5" style={{ color: accentColor }} />
            Privacidade e Governança de Dados
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Conformidade LGPD
          </span>
        </div>
      </div>

      {/* Interactive Layer Controls */}
      <div className="mt-4 grid grid-cols-3 gap-1.5 rounded-lg bg-[#050B14] p-1 border border-white/10">
        {(
          [
            { key: 'input', label: '1. Dados' },
            { key: 'processing', label: '2. Núcleo IA' },
            { key: 'governance', label: '3. Governança' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveLayer(tab.key)}
            className={`rounded-md px-2.5 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
              activeLayer === tab.key
                ? 'bg-[#0B1526] text-slate-100 border border-white/15'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate-300">
        <strong className="font-semibold text-slate-100">
          {LAYER_INFO[activeLayer].title}:
        </strong>{' '}
        {LAYER_INFO[activeLayer].summary}
      </p>
    </div>
  );
});
