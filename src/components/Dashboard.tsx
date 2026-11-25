import React, { useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  FolderKanban,
  Inbox,
  Lock,
  LogOut,
  Menu,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type {
  ExperienceIndicator,
  ProjectItem,
  SiteConfig,
} from '../types/site';
import { AdminsView } from './dashboard/AdminsView';
import { AnalyticsView } from './dashboard/AnalyticsView';
import { LeadsView } from './dashboard/LeadsView';
import { ProjectsView } from './dashboard/ProjectsView';
import { SettingsView } from './dashboard/SettingsView';

type DashboardTab = 'analytics' | 'leads' | 'projects' | 'settings' | 'admins';

const NAV_ITEMS: {
  id: DashboardTab;
  label: string;
  breadcrumb: string;
  icon: typeof BarChart3;
}[] = [
  {
    id: 'analytics',
    label: 'Visão Geral',
    breadcrumb: 'Analytics & Gráficos',
    icon: BarChart3,
  },
  {
    id: 'leads',
    label: 'Leads & Contatos',
    breadcrumb: 'Gestão de Leads',
    icon: Inbox,
  },
  {
    id: 'projects',
    label: 'Portfólio',
    breadcrumb: 'Projetos do Site',
    icon: FolderKanban,
  },
  {
    id: 'settings',
    label: 'Configurações',
    breadcrumb: 'Configurações do Site',
    icon: SlidersHorizontal,
  },
  {
    id: 'admins',
    label: 'Acessos',
    breadcrumb: 'Administradores',
    icon: ShieldCheck,
  },
];

export default function Dashboard({
  config,
  projects,
  indicators,
  onConfigSaved,
  onProjectsChange,
  onIndicatorsSaved,
  onBackToSite,
}: {
  config: SiteConfig;
  projects: ProjectItem[];
  indicators: ExperienceIndicator[];
  onConfigSaved: (next: SiteConfig) => void;
  onProjectsChange: (next: ProjectItem[]) => void;
  onIndicatorsSaved: (next: ExperienceIndicator[]) => void;
  onBackToSite: () => void;
}) {
  const {
    user,
    session,
    isAdmin,
    loading,
    verifyingRole,
    authError,
    signInWithGoogle,
    switchAccount,
    refreshSession,
    logout,
    getToken,
  } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>('analytics');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const accent = config.accentColor || '#0EA5E9';

  if (loading || verifyingRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050B14] px-4 text-slate-300">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0B1526] px-5 py-3.5 text-sm">
          <span
            className="h-2.5 w-2.5 animate-pulse rounded-full"
            style={{ backgroundColor: accent }}
          />
          <span>
            {verifyingRole
              ? 'Validando permissões de administrador...'
              : 'Verificando sessão Firebase...'}
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#050B14] px-4 text-slate-100">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B1526] p-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#050B14]">
            <Lock className="h-5 w-5" style={{ color: accent }} />
          </div>

          <h1 className="font-display mt-5 text-2xl font-bold text-slate-50">
            Acesso Administrativo
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Faça login com uma conta Google autorizada via Firebase para
            gerenciar os gráficos de analytics, leads e configurações de{' '}
            {config.brandName}.
          </p>

          {authError && (
            <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {authError}
            </p>
          )}

          <button
            type="button"
            onClick={signInWithGoogle}
            className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-lg px-4 py-3 text-sm font-semibold text-[#050B14] transition-opacity hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            <span>Entrar com Google</span>
          </button>

          <button
            type="button"
            onClick={onBackToSite}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#050B14] px-4 py-2.5 text-xs font-medium text-slate-300 hover:border-white/25 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Voltar para o site público</span>
          </button>
        </div>
      </div>
    );
  }

  // Strictly block signed-in Firebase users who do NOT hold administrator role
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#050B14] px-4 text-slate-100">
        <div className="w-full max-w-md rounded-2xl border border-rose-500/25 bg-[#0B1526] p-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10">
            <ShieldAlert className="h-5 w-5 text-rose-400" />
          </div>

          <h1 className="font-display mt-5 text-2xl font-bold text-slate-50">
            Acesso Restrito
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            A conta conectada não possui permissão de administrador para acessar
            as configurações do site ou o painel de analytics.
          </p>

          <div className="mt-4 rounded-lg border border-white/10 bg-[#050B14] px-3.5 py-2.5 text-xs">
            <span className="text-slate-500">Conta autenticada:</span>
            <p className="mt-0.5 truncate font-medium text-slate-200">
              {user.email || 'Sem e-mail identificado'}
            </p>
          </div>

          {authError && (
            <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {authError}
            </p>
          )}

          <div className="mt-6 space-y-2.5">
            <button
              type="button"
              onClick={switchAccount}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-[#050B14] transition-opacity hover:opacity-90"
              style={{ backgroundColor: accent }}
            >
              <span>Entrar com outra conta Google</span>
            </button>

            <button
              type="button"
              onClick={refreshSession}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#050B14] px-4 py-2.5 text-xs font-medium text-slate-200 hover:border-white/25 hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Verificar permissão novamente</span>
            </button>

            <button
              type="button"
              onClick={onBackToSite}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-transparent px-4 py-2.5 text-xs font-medium text-slate-400 hover:border-white/20 hover:text-slate-200"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Voltar para o site público</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentNav = NAV_ITEMS.find((i) => i.id === activeTab) || NAV_ITEMS[0];

  return (
    <div className="flex min-h-screen bg-[#050B14] text-slate-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar (256px desktop workspace navigation) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between border-r border-white/10 bg-[#08101E] transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <span className="font-display truncate text-sm font-bold tracking-tight text-slate-100">
              {config.brandName}
            </span>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Fechar menu lateral"
              className="rounded-lg p-1 text-slate-400 hover:text-white lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="space-y-1 p-3" aria-label="Menu do painel">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <Icon
                    className="h-4 w-4 shrink-0"
                    style={active ? { color: accent } : undefined}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3 border-t border-white/10 p-4">
          <div className="flex items-center gap-2.5">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Administrador'}
                referrerPolicy="no-referrer"
                className="h-8 w-8 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-xs font-semibold">
                {(user.displayName || user.email || 'A')[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-xs font-medium text-slate-100">
                  {session?.displayName || user.displayName || 'Administrador'}
                </p>
                <span className="shrink-0 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
                  Admin
                </span>
              </div>
              <p className="truncate text-[11px] text-slate-500">
                {session?.email || user.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#050B14] px-3 py-2 text-xs font-medium text-slate-300 hover:border-white/25 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sair da conta</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Breadcrumb Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-white/10 bg-[#050B14]/90 px-4 py-3.5 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir navegação do painel"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#0B1526] text-slate-200 lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 truncate text-xs text-slate-400">
              <span>Painel</span>
              <span aria-hidden="true">/</span>
              <span className="truncate font-medium text-slate-100">
                {currentNav.breadcrumb}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onBackToSite}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/15 bg-[#0B1526] px-3.5 py-2 text-xs font-semibold whitespace-nowrap text-slate-100 transition-colors hover:border-white/30"
          >
            <ArrowLeft className="h-3.5 w-3.5" style={{ color: accent }} />
            <span>Ver Site Público</span>
          </button>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {activeTab === 'analytics' && (
            <AnalyticsView getToken={getToken} accentColor={accent} />
          )}
          {activeTab === 'leads' && (
            <LeadsView getToken={getToken} accentColor={accent} />
          )}
          {activeTab === 'projects' && (
            <ProjectsView
              projects={projects}
              onProjectsChange={onProjectsChange}
              getToken={getToken}
              accentColor={accent}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsView
              config={config}
              indicators={indicators}
              onConfigSaved={onConfigSaved}
              onIndicatorsSaved={onIndicatorsSaved}
              getToken={getToken}
            />
          )}
          {activeTab === 'admins' && (
            <AdminsView
              getToken={getToken}
              currentUserEmail={session?.email || user.email || ''}
              accentColor={accent}
            />
          )}
        </main>
      </div>
    </div>
  );
}
