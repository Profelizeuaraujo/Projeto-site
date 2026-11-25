import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  type ChartOptions,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Download, RefreshCw } from 'lucide-react';
import { fetchAdminAnalytics } from '../../lib/api';
import type { AnalyticsDashboardData } from '../../types/site';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const PERIOD_OPTIONS = [
  { days: 7, label: '7 dias' },
  { days: 30, label: '30 dias' },
  { days: 90, label: '90 dias' },
];

const EVENT_LABELS: Record<string, string> = {
  page_view: 'Visita à página',
  service_view: 'Serviço visualizado',
  project_view: 'Projeto visualizado',
  whatsapp_click: 'Clique no WhatsApp',
  lead_submit: 'Lead enviado',
  cta_click: 'Clique em CTA',
};

const PALETTE = [
  '#0EA5E9',
  '#38BDF8',
  '#6366F1',
  '#10B981',
  '#F59E0B',
  '#EC4899',
];

export function AnalyticsView({
  getToken,
  accentColor,
}: {
  getToken: () => Promise<string>;
  accentColor: string;
}) {
  const [days, setDays] = useState(30);
  const [seriesMode, setSeriesMode] = useState<'all' | 'visits' | 'leads'>('all');
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetchAdminAnalytics(token, days);
      setData(res);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Não foi possível carregar os dados.',
      );
    } finally {
      setLoading(false);
    }
  }, [getToken, days]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleExportCsv = () => {
    if (!data) return;
    const rows = [
      ['Data', 'Visitas', 'Interacoes', 'Leads'],
      ...data.timeline.labels.map((label, idx) => [
        label,
        String(data.timeline.visits[idx] ?? 0),
        String(data.timeline.interactions[idx] ?? 0),
        String(data.timeline.leads[idx] ?? 0),
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${days}d.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Chart 1: Visits, Interactions & Leads over time
  const lineData = useMemo(() => {
    if (!data) return null;
    const datasets = [];
    if (seriesMode === 'all' || seriesMode === 'visits') {
      datasets.push({
        label: 'Visitas',
        data: data.timeline.visits,
        borderColor: accentColor,
        backgroundColor: `${accentColor}26`,
        fill: true,
        tension: 0.35,
        pointRadius: 2.5,
        pointHoverRadius: 5,
        borderWidth: 2,
      });
    }
    if (seriesMode === 'all') {
      datasets.push({
        label: 'Interações',
        data: data.timeline.interactions,
        borderColor: '#6366F1',
        backgroundColor: 'rgba(99, 102, 241, 0.12)',
        fill: false,
        tension: 0.35,
        pointRadius: 2,
        pointHoverRadius: 5,
        borderWidth: 2,
      });
    }
    if (seriesMode === 'all' || seriesMode === 'leads') {
      datasets.push({
        label: 'Leads',
        data: data.timeline.leads,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.18)',
        fill: seriesMode === 'leads',
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 6,
        borderWidth: 2,
      });
    }
    return {
      labels: data.timeline.labels,
      datasets,
    };
  }, [data, seriesMode, accentColor]);

  const lineOptions: ChartOptions<'line'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            color: '#94A3B8',
            boxWidth: 10,
            usePointStyle: true,
            font: { family: 'DM Sans, sans-serif', size: 12 },
          },
        },
        tooltip: {
          backgroundColor: '#050B14',
          borderColor: 'rgba(255,255,255,0.12)',
          borderWidth: 1,
          titleColor: '#F1F5F9',
          bodyColor: '#CBD5E1',
          padding: 10,
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(148,163,184,0.08)' },
          ticks: {
            color: '#64748B',
            font: { family: 'JetBrains Mono, monospace', size: 11 },
            maxTicksLimit: 10,
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(148,163,184,0.08)' },
          ticks: {
            color: '#64748B',
            precision: 0,
            font: { family: 'JetBrains Mono, monospace', size: 11 },
          },
        },
      },
    }),
    [],
  );

  // Chart 2: Service Demand Doughnut
  const doughnutData = useMemo(() => {
    if (!data) return null;
    const labels = data.serviceDemand.map((s) => s.label);
    const values = data.serviceDemand.map((s) => s.views + s.leads * 3);
    const hasValues = values.some((v) => v > 0);
    return {
      labels,
      datasets: [
        {
          data: hasValues ? values : labels.map(() => 1),
          backgroundColor: PALETTE,
          borderColor: '#0B1526',
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    };
  }, [data]);

  const doughnutOptions: ChartOptions<'doughnut'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '64%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#94A3B8',
            boxWidth: 10,
            padding: 12,
            usePointStyle: true,
            font: { family: 'DM Sans, sans-serif', size: 11 },
          },
        },
        tooltip: {
          backgroundColor: '#050B14',
          borderColor: 'rgba(255,255,255,0.12)',
          borderWidth: 1,
          titleColor: '#F1F5F9',
          bodyColor: '#CBD5E1',
          padding: 10,
        },
      },
    }),
    [],
  );

  // Chart 3: Portfolio Category Engagement Bar
  const categoryBarData = useMemo(() => {
    if (!data) return null;
    return {
      labels: data.categoryEngagement.map((c) => c.category),
      datasets: [
        {
          label: 'Visualizações',
          data: data.categoryEngagement.map((c) => c.views),
          backgroundColor: accentColor,
          borderRadius: 6,
          maxBarThickness: 32,
        },
        {
          label: 'Projetos Ativos',
          data: data.categoryEngagement.map((c) => c.projects * 10),
          backgroundColor: 'rgba(99, 102, 241, 0.7)',
          borderRadius: 6,
          maxBarThickness: 32,
        },
      ],
    };
  }, [data, accentColor]);

  const categoryBarOptions: ChartOptions<'bar'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            color: '#94A3B8',
            boxWidth: 10,
            usePointStyle: true,
            font: { family: 'DM Sans, sans-serif', size: 11 },
          },
        },
        tooltip: {
          backgroundColor: '#050B14',
          borderColor: 'rgba(255,255,255,0.12)',
          borderWidth: 1,
          callbacks: {
            label: (ctx) => {
              if (ctx.datasetIndex === 1) {
                return `Projetos ativos: ${Math.round(Number(ctx.raw) / 10)}`;
              }
              return `Visualizações: ${ctx.raw}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: '#94A3B8',
            font: { family: 'DM Sans, sans-serif', size: 11 },
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(148,163,184,0.08)' },
          ticks: {
            color: '#64748B',
            font: { family: 'JetBrains Mono, monospace', size: 11 },
          },
        },
      },
    }),
    [],
  );

  // Chart 4: Conversion Funnel Horizontal Bar
  const funnelBarData = useMemo(() => {
    if (!data) return null;
    return {
      labels: data.funnel.map((f) => f.stage),
      datasets: [
        {
          label: 'Eventos',
          data: data.funnel.map((f) => f.count),
          backgroundColor: [
            accentColor,
            '#38BDF8',
            '#6366F1',
            '#10B981',
            '#F59E0B',
          ],
          borderRadius: 6,
          barThickness: 20,
        },
      ],
    };
  }, [data, accentColor]);

  const funnelBarOptions: ChartOptions<'bar'> = useMemo(
    () => ({
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#050B14',
          borderColor: 'rgba(255,255,255,0.12)',
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: 'rgba(148,163,184,0.08)' },
          ticks: {
            color: '#64748B',
            precision: 0,
            font: { family: 'JetBrains Mono, monospace', size: 11 },
          },
        },
        y: {
          grid: { display: false },
          ticks: {
            color: '#CBD5E1',
            font: { family: 'DM Sans, sans-serif', size: 12 },
          },
        },
      },
    }),
    [],
  );

  return (
    <div className="space-y-6">
      {/* Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-100">
            Visão Geral e Métricas Dinâmicas
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Acompanhe acessos, demanda por serviço, engajamento do portfólio e conversão de
            leads.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-white/10 bg-[#050B14] p-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                type="button"
                onClick={() => setDays(opt.days)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  days === opt.days
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={loadAnalytics}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#0B1526] px-3 py-2 text-xs font-medium text-slate-200 whitespace-nowrap hover:border-white/25 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!data}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#0B1526] px-3 py-2 text-xs font-medium text-slate-200 whitespace-nowrap hover:border-white/25 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: `Visitas (${days}d)`,
            value: data ? String(data.kpis.totalVisits) : '—',
            sub: data
              ? `${data.kpis.serviceViews} visualizações de serviços`
              : 'Carregando...',
          },
          {
            label: `Leads Recebidos (${days}d)`,
            value: data ? String(data.kpis.totalLeads) : '—',
            sub: data
              ? `${data.kpis.whatsappClicks} cliques no WhatsApp`
              : 'Carregando...',
          },
          {
            label: 'Taxa de Conversão',
            value: data ? `${data.kpis.conversionRate.toFixed(1)}%` : '—',
            sub: 'Leads por visita no período',
          },
          {
            label: 'Projetos no Portfólio',
            value: data ? String(data.kpis.totalProjects) : '—',
            sub: 'Publicados na vitrine do site',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-white/10 bg-[#0B1526] p-5"
          >
            <p className="text-xs font-medium text-slate-400">{kpi.label}</p>
            <p className="font-mono mt-2 text-2xl font-bold tabular-nums text-slate-50">
              {kpi.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Main Chart Row: Line Chart (8 cols) + Doughnut (4 cols) */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-white/10 bg-[#0B1526] p-5 lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-sm font-semibold text-slate-100">
                Evolução de Acessos, Interações e Leads
              </h3>
              <p className="text-xs text-slate-400">
                Série temporal dos últimos {days} dias
              </p>
            </div>

            <div className="inline-flex rounded-lg border border-white/10 bg-[#050B14] p-0.5 text-xs">
              {(
                [
                  { id: 'all', label: 'Todos' },
                  { id: 'visits', label: 'Visitas' },
                  { id: 'leads', label: 'Leads' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSeriesMode(m.id)}
                  className={`rounded-md px-2.5 py-1 font-medium whitespace-nowrap ${
                    seriesMode === m.id
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 h-72 w-full">
            {loading && !lineData ? (
              <div className="h-full w-full animate-pulse rounded-lg bg-white/5" />
            ) : lineData ? (
              <Line data={lineData} options={lineOptions} />
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0B1526] p-5 lg:col-span-4">
          <h3 className="font-display text-sm font-semibold text-slate-100">
            Demanda por Serviço
          </h3>
          <p className="text-xs text-slate-400">
            Índice ponderado de interesse e solicitações
          </p>
          <div className="mt-4 h-72 w-full">
            {loading && !doughnutData ? (
              <div className="h-full w-full animate-pulse rounded-lg bg-white/5" />
            ) : doughnutData ? (
              <Doughnut data={doughnutData} options={doughnutOptions} />
            ) : null}
          </div>
        </div>
      </div>

      {/* Second Chart Row: Category Engagement + Conversion Funnel */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-white/10 bg-[#0B1526] p-5 lg:col-span-6">
          <h3 className="font-display text-sm font-semibold text-slate-100">
            Portfólio por Categoria e Visualizações
          </h3>
          <p className="text-xs text-slate-400">
            Comparativo entre projetos cadastrados e visualizações registradas
          </p>
          <div className="mt-4 h-64 w-full">
            {loading && !categoryBarData ? (
              <div className="h-full w-full animate-pulse rounded-lg bg-white/5" />
            ) : categoryBarData ? (
              <Bar data={categoryBarData} options={categoryBarOptions} />
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0B1526] p-5 lg:col-span-6">
          <h3 className="font-display text-sm font-semibold text-slate-100">
            Funil de Engajamento e Conversão
          </h3>
          <p className="text-xs text-slate-400">
            Jornada do visitante desde o acesso até o envio de contato
          </p>
          <div className="mt-4 h-64 w-full">
            {loading && !funnelBarData ? (
              <div className="h-full w-full animate-pulse rounded-lg bg-white/5" />
            ) : funnelBarData ? (
              <Bar data={funnelBarData} options={funnelBarOptions} />
            ) : null}
          </div>
        </div>
      </div>

      {/* Recent Interactions Table */}
      <div className="rounded-xl border border-white/10 bg-[#0B1526] p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-100">
              Atividade Recente no Site
            </h3>
            <p className="text-xs text-slate-400">
              Últimos eventos registrados em tempo real
            </p>
          </div>
          {data && (
            <span className="font-mono text-xs tabular-nums text-slate-400">
              {data.deviceSplit
                .map((d) => `${d.device}: ${d.count}`)
                .join(' · ')}
            </span>
          )}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[540px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="py-2.5 pr-4 font-medium">Evento</th>
                <th className="py-2.5 pr-4 font-medium">Alvo / Serviço</th>
                <th className="py-2.5 pr-4 font-medium">Categoria</th>
                <th className="py-2.5 pr-4 font-medium">Dispositivo</th>
                <th className="py-2.5 text-right font-medium">Data e Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data && data.recentEvents.length > 0 ? (
                data.recentEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 pr-4 font-medium text-slate-200">
                      {EVENT_LABELS[ev.eventType] || ev.eventType}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-300">
                      {ev.target || '—'}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-400">
                      {ev.category || '—'}
                    </td>
                    <td className="py-2.5 pr-4 capitalize text-slate-400">
                      {ev.device}
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-slate-400">
                      {new Date(ev.createdAt).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    {loading
                      ? 'Carregando eventos...'
                      : 'Nenhum evento registrado neste período.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
