import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import {
  DEFAULT_CONFIG,
  DEFAULT_INDICATORS_SEED,
  DEFAULT_PROJECTS_SEED,
} from './data/defaults';
import { fetchPublicBootstrap } from './lib/api';
import { PublicSite } from './components/PublicSite';
import type {
  ExperienceIndicator,
  ProjectItem,
  SiteConfig,
} from './types/site';

// Code-split the entire Control Dashboard + Chart.js bundle so the public
// portfolio stays lightweight and fast to load.
const Dashboard = React.lazy(() => import('./components/Dashboard'));

type AppView = 'site' | 'dashboard';

const FALLBACK_PROJECTS: ProjectItem[] = DEFAULT_PROJECTS_SEED.map(
  (item, idx) => ({
    id: -(idx + 1),
    slug: item.slug,
    title: item.title,
    category: item.category,
    isExample: item.isExample,
    image: item.image,
    description: item.description,
    problemSolved: item.problemSolved,
    solutionImplemented: item.solutionImplemented,
    technologies: item.technologies,
    demoUrl: item.demoUrl,
    viewsCount: item.viewsCount,
    createdAt: new Date(0).toISOString(),
  }),
);

const FALLBACK_INDICATORS: ExperienceIndicator[] = DEFAULT_INDICATORS_SEED.map(
  (item, idx) => ({
    id: -(idx + 1),
    sortOrder: item.sortOrder,
    label: item.label,
    value: item.value,
    note: item.note,
  }),
);

function getInitialView(): AppView {
  if (typeof window === 'undefined') return 'site';
  return window.location.hash === '#painel' ? 'dashboard' : 'site';
}

function DashboardLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050B14] px-4 text-slate-300">
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0B1526] px-5 py-3.5 text-sm">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-sky-400" />
        <span>Carregando Painel de Controle...</span>
      </div>
    </div>
  );
}

function AppContent() {
  const [view, setView] = useState<AppView>(getInitialView);
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [projects, setProjects] = useState<ProjectItem[]>(FALLBACK_PROJECTS);
  const [indicators, setIndicators] =
    useState<ExperienceIndicator[]>(FALLBACK_INDICATORS);

  useEffect(() => {
    let active = true;

    fetchPublicBootstrap()
      .then((data) => {
        if (!active) return;
        if (data.settings) setConfig(data.settings);
        if (Array.isArray(data.projects)) setProjects(data.projects);
        if (Array.isArray(data.indicators) && data.indicators.length > 0) {
          setIndicators(data.indicators);
        }
      })
      .catch(() => {
        // Keep seamless default fallback if initial bootstrap request fails
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      setView(window.location.hash === '#painel' ? 'dashboard' : 'site');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    const brand = config.brandName?.trim() || DEFAULT_CONFIG.brandName;
    const tagline = config.brandTagline?.trim() || DEFAULT_CONFIG.brandTagline;
    document.title =
      view === 'dashboard'
        ? `Painel de Controle | ${brand}`
        : `${brand} — ${tagline}`;
  }, [config.brandName, config.brandTagline, view]);

  const handleOpenDashboard = useCallback(() => {
    setView('dashboard');
    if (window.location.hash !== '#painel') {
      window.history.pushState(null, '', '#painel');
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const handleBackToSite = useCallback(() => {
    setView('site');
    if (window.location.hash === '#painel') {
      window.history.pushState(null, '', window.location.pathname + window.location.search);
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  if (view === 'dashboard') {
    return (
      <Suspense fallback={<DashboardLoadingFallback />}>
        <Dashboard
          config={config}
          projects={projects}
          indicators={indicators}
          onConfigSaved={setConfig}
          onProjectsChange={setProjects}
          onIndicatorsSaved={setIndicators}
          onBackToSite={handleBackToSite}
        />
      </Suspense>
    );
  }

  return (
    <PublicSite
      config={config}
      projects={projects}
      indicators={indicators}
      onOpenDashboard={handleOpenDashboard}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
