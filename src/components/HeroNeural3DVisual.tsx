import React, { useEffect, useRef } from 'react';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return [14, 165, 233];
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const HeroNeural3DVisual = React.memo(function HeroNeural3DVisual({
  accentColor = '#0EA5E9',
  enabled = true,
}: {
  accentColor?: string;
  enabled?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced =
      !enabled ||
      (typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

    const [r, g, b] = hexToRgb(accentColor);
    const logicalSize = 420;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = logicalSize * dpr;
    canvas.height = logicalSize * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const total = 40;
    const nodes = Array.from({ length: total }, (_, i) => ({
      phi: Math.acos(1 - (2 * (i + 0.5)) / total),
      theta: Math.PI * (1 + Math.sqrt(5)) * i,
      r: 132,
      pulse: (i / total) * Math.PI * 2,
    }));

    const maxConnDistSq = 82 * 82;
    let angleY = 0;
    let angleX = 0.24;
    let animId = 0;
    let inViewport = true;

    const renderFrame = () => {
      if (!inViewport || document.hidden) return;
      ctx.clearRect(0, 0, logicalSize, logicalSize);
      const cx = logicalSize / 2;
      const cy = logicalSize / 2;

      if (!prefersReduced) {
        angleY += 0.004;
        const targetX = 0.24 + pointerRef.current.y * 0.2;
        angleX += (targetX - angleX) * 0.05;
      }

      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 165);
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.22)`);
      grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.08)`);
      grad.addColorStop(1, 'rgba(5, 11, 20, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 165, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.16)`;
      ctx.lineWidth = 1;
      for (let ring = 0; ring < 2; ring++) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ring === 0 ? angleY * 0.35 : -angleY * 0.3 + 1.15);
        ctx.scale(1, 0.42);
        ctx.beginPath();
        ctx.arc(0, 0, 156 + ring * 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const offsetTheta = angleY + pointerRef.current.x * 0.32;

      const projected = nodes.map((n) => {
        const sinPhi = Math.sin(n.phi);
        const angle = n.theta + offsetTheta;
        const x0 = n.r * sinPhi * Math.cos(angle);
        const y0 = n.r * Math.cos(n.phi);
        const z0 = n.r * sinPhi * Math.sin(angle);
        const y1 = y0 * cosX - z0 * sinX;
        const z1 = y0 * sinX + z0 * cosX;
        const perspective = 360 / (360 - z1);
        return {
          x: cx + x0 * perspective,
          y: cy + y1 * perspective,
          z: z1,
          scale: perspective,
          pulse: n.pulse + angleY * 3.5,
        };
      });

      ctx.lineWidth = 0.85;
      for (let i = 0; i < projected.length; i++) {
        const a = projected[i];
        for (let j = i + 1; j < projected.length; j++) {
          const bNode = projected[j];
          const dx = a.x - bNode.x;
          const dy = a.y - bNode.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < maxConnDistSq) {
            const dist = Math.sqrt(distSq);
            const alpha = Math.min(
              0.5,
              ((82 - dist) / 82) * 0.4 * ((a.scale + bNode.scale) / 2),
            );
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(bNode.x, bNode.y);
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
            ctx.stroke();
          }
        }
      }

      projected.sort((a, bNode) => a.z - bNode.z);
      for (const p of projected) {
        const glow = 0.55 + Math.sin(p.pulse) * 0.3;
        const radius = Math.max(1.8, 3.0 * p.scale);
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${(0.16 * glow).toFixed(3)})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = p.z > 0 ? accentColor : `rgba(${r}, ${g}, ${b}, 0.55)`;
        ctx.fill();
      }

      if (!prefersReduced) {
        animId = window.requestAnimationFrame(renderFrame);
      }
    };

    const observer =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            ([entry]) => {
              inViewport = entry.isIntersecting;
              if (inViewport && !prefersReduced && !animId) {
                animId = window.requestAnimationFrame(renderFrame);
              } else if (!inViewport && animId) {
                window.cancelAnimationFrame(animId);
                animId = 0;
              }
            },
            { threshold: 0.05 },
          )
        : null;

    const handleVisibility = () => {
      if (!document.hidden && inViewport && !prefersReduced && !animId) {
        animId = window.requestAnimationFrame(renderFrame);
      } else if (document.hidden && animId) {
        window.cancelAnimationFrame(animId);
        animId = 0;
      }
    };

    observer?.observe(container);
    document.addEventListener('visibilitychange', handleVisibility);
    renderFrame();

    return () => {
      observer?.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
      if (animId) window.cancelAnimationFrame(animId);
    };
  }, [accentColor, enabled]);

  return (
    <div
      ref={containerRef}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        pointerRef.current = {
          x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
          y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
        };
      }}
      onMouseLeave={() => {
        pointerRef.current = { x: 0, y: 0 };
      }}
      className="relative flex h-full min-h-[340px] w-full items-center justify-center rounded-2xl border border-white/10 bg-[#0B1526]/80 p-6 sm:min-h-[420px]"
    >
      <canvas
        ref={canvasRef}
        aria-label="Visualização interativa de rede neural e processamento de dados"
        className="h-[300px] w-[300px] sm:h-[380px] sm:w-[380px]"
      />
      <div className="pointer-events-none absolute bottom-5 left-6 right-6 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-400">
        <span>Engenharia de Software &amp; IA</span>
        <span className="font-mono text-[11px] text-slate-500">Arquitetura Modular</span>
      </div>
    </div>
  );
});
