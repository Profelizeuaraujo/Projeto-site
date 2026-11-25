import React, { useRef } from 'react';
import {
  ArrowRight,
  BrainCircuit,
  Globe,
  Layers,
  Server,
  Share2,
  ShieldCheck,
} from 'lucide-react';
import type { ServiceItem } from '../types/site';

function ServiceIcon({
  name,
  accentColor,
}: {
  name: ServiceItem['iconName'];
  accentColor: string;
}) {
  const props = { className: 'h-5 w-5', style: { color: accentColor } };
  switch (name) {
    case 'globe':
      return <Globe {...props} />;
    case 'layers':
      return <Layers {...props} />;
    case 'brain':
      return <BrainCircuit {...props} />;
    case 'shield':
      return <ShieldCheck {...props} />;
    case 'server':
      return <Server {...props} />;
    case 'share':
      return <Share2 {...props} />;
  }
}

export const ServiceCard = React.memo(function ServiceCard({
  service,
  accentColor,
  onSelect,
}: {
  service: ServiceItem;
  accentColor: string;
  onSelect: (service: ServiceItem) => void;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const clientX = e.clientX;
    const clientY = e.clientY;
    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      el.style.setProperty('--mx', `${x.toFixed(1)}%`);
      el.style.setProperty('--my', `${y.toFixed(1)}%`);
      rafRef.current = null;
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className="group relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-white/10 bg-[#0B1526]/85 p-6 transition-[transform,border-color] duration-200 hover:-translate-y-1 hover:border-white/25"
    >
      <div
        aria-hidden="true"
        className="service-card-spotlight pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#050B14]">
            <ServiceIcon name={service.iconName} accentColor={accentColor} />
          </div>
          <span className="font-mono text-xs font-medium tabular-nums text-slate-500">
            {service.number}
          </span>
        </div>

        <h3 className="font-display mt-5 text-lg font-semibold tracking-tight text-slate-100">
          {service.number}. {service.title}
        </h3>
        <p className="mt-2.5 text-sm leading-relaxed text-slate-400">
          {service.shortDesc}
        </p>
      </div>

      <div className="relative z-10 mt-6 border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={() => onSelect(service)}
          className="inline-flex items-center gap-2 text-sm font-medium whitespace-nowrap transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ color: accentColor }}
        >
          <span>Conhecer serviço</span>
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
});
