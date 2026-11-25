import React, { useState } from 'react';
import { Check, Save, Upload } from 'lucide-react';
import {
  compressImageFile,
  saveAdminIndicators,
  saveAdminSettings,
} from '../../lib/api';
import type { ExperienceIndicator, SiteConfig } from '../../types/site';

const ACCENT_PRESETS = [
  { name: 'Azul Ciano', value: '#0EA5E9' },
  { name: 'Ciano Elétrico', value: '#00D9FF' },
  { name: 'Índigo Técnico', value: '#6366F1' },
  { name: 'Esmeralda', value: '#10B981' },
  { name: 'Âmbar', value: '#F59E0B' },
];

const SECTION_LABELS: { key: keyof SiteConfig['showSections']; label: string }[] = [
  { key: 'about', label: 'Seção Sobre Mim e Trajetória' },
  { key: 'services', label: 'Serviços Especializados (6 pilares)' },
  { key: 'ai', label: 'Destaque em Inteligência Artificial' },
  { key: 'projects', label: 'Portfólio de Projetos' },
  { key: 'process', label: 'Metodologia de Trabalho (4 etapas)' },
  { key: 'differentials', label: 'Diferenciais Competitivos' },
];

export function SettingsView({
  config,
  indicators,
  onConfigSaved,
  onIndicatorsSaved,
  getToken,
}: {
  config: SiteConfig;
  indicators: ExperienceIndicator[];
  onConfigSaved: (next: SiteConfig) => void;
  onIndicatorsSaved: (next: ExperienceIndicator[]) => void;
  getToken: () => Promise<string>;
}) {
  const [draft, setDraft] = useState<SiteConfig>(config);
  const [indDraft, setIndDraft] = useState(
    indicators.map((i) => ({ label: i.label, value: i.value, note: i.note })),
  );
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 720, 0.85);
      setDraft((prev) => ({ ...prev, photoUrl: compressed }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao processar foto.');
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedNotice(false);
    try {
      const token = await getToken();
      const [updatedConfig, updatedIndicators] = await Promise.all([
        saveAdminSettings(token, draft),
        saveAdminIndicators(token, indDraft),
      ]);
      onConfigSaved(updatedConfig);
      onIndicatorsSaved(updatedIndicators);
      setSavedNotice(true);
      window.setTimeout(() => setSavedNotice(false), 3000);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar as configurações.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSaveAll} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-100">
            Configurações do Site e Performance
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Altere textos da página inicial, canais de contato, identidade visual,
            animações e seções visíveis.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-[#050B14] transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: draft.accentColor }}
        >
          {savedNotice ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          <span>
            {saving
              ? 'Salvando alterações...'
              : savedNotice
                ? 'Alterações publicadas'
                : 'Salvar Configurações'}
          </span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-200">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Identity & Hero */}
        <div className="space-y-4 rounded-xl border border-white/10 bg-[#0B1526] p-5 lg:col-span-7">
          <h3 className="font-display text-sm font-semibold text-slate-100">
            Identidade e Conteúdo da Página Inicial
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                Nome da Marca
              </label>
              <input
                type="text"
                value={draft.brandName}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, brandName: e.target.value }))
                }
                className="w-full rounded-lg border border-white/10 bg-[#050B14] px-3 py-2 text-xs text-slate-100 focus:border-sky-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                Subtítulo / Tagline
              </label>
              <input
                type="text"
                value={draft.brandTagline}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, brandTagline: e.target.value }))
                }
                className="w-full rounded-lg border border-white/10 bg-[#050B14] px-3 py-2 text-xs text-slate-100 focus:border-sky-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Título Principal (Hero)
            </label>
            <input
              type="text"
              value={draft.heroTitle}
              onChange={(e) =>
                setDraft((p) => ({ ...p, heroTitle: e.target.value }))
              }
              className="w-full rounded-lg border border-white/10 bg-[#050B14] px-3 py-2 text-xs text-slate-100 focus:border-sky-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Descrição do Hero
            </label>
            <textarea
              rows={3}
              value={draft.heroSubtitle}
              onChange={(e) =>
                setDraft((p) => ({ ...p, heroSubtitle: e.target.value }))
              }
              className="w-full rounded-lg border border-white/10 bg-[#050B14] px-3 py-2 text-xs text-slate-100 focus:border-sky-400 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <div className="flex items-center gap-3">
              {draft.photoUrl ? (
                <img
                  src={draft.photoUrl}
                  alt="Foto profissional"
                  className="h-11 w-11 rounded-lg border border-white/15 object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-[#050B14] text-[10px] text-slate-500">
                  Foto
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-slate-200">
                  Fotografia Profissional
                </p>
                <p className="text-[11px] text-slate-400">
                  Otimizada automaticamente em WebP para carregamento rápido
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 bg-[#050B14] px-3 py-1.5 text-xs text-slate-200 hover:border-white/30">
                <Upload className="h-3.5 w-3.5" style={{ color: draft.accentColor }} />
                <span>{draft.photoUrl ? 'Trocar foto' : 'Carregar foto'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="sr-only"
                />
              </label>
              {draft.photoUrl && (
                <button
                  type="button"
                  onClick={() => setDraft((p) => ({ ...p, photoUrl: '' }))}
                  className="text-xs text-slate-400 hover:text-rose-400"
                >
                  Remover
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Performance & Visual Settings */}
        <div className="space-y-5 rounded-xl border border-white/10 bg-[#0B1526] p-5 lg:col-span-5">
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-100">
              Cor de Destaque e Performance
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Ajuste recursos gráficos para equilibrar estética e leveza.
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs text-slate-400">Cor de Destaque (10% Accent)</p>
            <div className="flex flex-wrap gap-2">
              {ACCENT_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() =>
                    setDraft((p) => ({ ...p, accentColor: preset.value }))
                  }
                  className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                    draft.accentColor === preset.value
                      ? 'border-white/40 bg-white/10 text-white'
                      : 'border-white/10 bg-[#050B14] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: preset.value }}
                  />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 border-t border-white/10 pt-4">
            <p className="text-xs font-medium text-slate-300">
              Controles de Performance Gráfica
            </p>
            {[
              {
                key: 'enableParticles' as const,
                label: 'Rede de partículas no fundo (Canvas 2D)',
              },
              {
                key: 'enable3dVisual' as const,
                label: 'Animação contínua da esfera neural 3D no Hero',
              },
              {
                key: 'enableScrollReveal' as const,
                label: 'Transições suaves ao rolar (IntersectionObserver único)',
              },
            ].map((toggle) => (
              <label
                key={toggle.key}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#050B14] px-3 py-2.5 text-xs text-slate-300"
              >
                <span>{toggle.label}</span>
                <input
                  type="checkbox"
                  checked={draft[toggle.key]}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, [toggle.key]: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-white/20 bg-[#0B1526]"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Contact Channels */}
        <div className="space-y-4 rounded-xl border border-white/10 bg-[#0B1526] p-5 lg:col-span-6">
          <h3 className="font-display text-sm font-semibold text-slate-100">
            Canais de Contato e Redes Sociais
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                E-mail Comercial
              </label>
              <input
                type="email"
                value={draft.email}
                onChange={(e) => setDraft((p) => ({ ...p, email: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-[#050B14] px-3 py-2 text-xs text-slate-100 focus:border-sky-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                Telefone (Exibição)
              </label>
              <input
                type="text"
                value={draft.phoneDisplay}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, phoneDisplay: e.target.value }))
                }
                className="w-full rounded-lg border border-white/10 bg-[#050B14] px-3 py-2 text-xs text-slate-100 focus:border-sky-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                WhatsApp (DDI+DDD+Número)
              </label>
              <input
                type="text"
                value={draft.whatsappNumber}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, whatsappNumber: e.target.value }))
                }
                className="w-full rounded-lg border border-white/10 bg-[#050B14] px-3 py-2 text-xs font-mono text-slate-100 focus:border-sky-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                Localização / Atendimento
              </label>
              <input
                type="text"
                value={draft.location}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, location: e.target.value }))
                }
                className="w-full rounded-lg border border-white/10 bg-[#050B14] px-3 py-2 text-xs text-slate-100 focus:border-sky-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                URL do LinkedIn
              </label>
              <input
                type="url"
                value={draft.linkedinUrl}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, linkedinUrl: e.target.value }))
                }
                className="w-full rounded-lg border border-white/10 bg-[#050B14] px-3 py-2 text-xs text-slate-100 focus:border-sky-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                URL do Instagram
              </label>
              <input
                type="url"
                value={draft.instagramUrl}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, instagramUrl: e.target.value }))
                }
                className="w-full rounded-lg border border-white/10 bg-[#050B14] px-3 py-2 text-xs text-slate-100 focus:border-sky-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section Visibility */}
        <div className="space-y-3 rounded-xl border border-white/10 bg-[#0B1526] p-5 lg:col-span-6">
          <h3 className="font-display text-sm font-semibold text-slate-100">
            Seções Visíveis no Site Público
          </h3>
          <p className="text-xs text-slate-400">
            Ative ou oculte blocos inteiros da landing page conforme sua estratégia.
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {SECTION_LABELS.map((sec) => (
              <label
                key={sec.key}
                className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#050B14] px-3 py-2.5 text-xs text-slate-300"
              >
                <span className="truncate">{sec.label}</span>
                <input
                  type="checkbox"
                  checked={draft.showSections[sec.key]}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      showSections: {
                        ...p.showSections,
                        [sec.key]: e.target.checked,
                      },
                    }))
                  }
                  className="h-4 w-4 shrink-0 rounded border-white/20 bg-[#0B1526]"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Experience Indicators Editor */}
        <div className="space-y-3 rounded-xl border border-white/10 bg-[#0B1526] p-5 lg:col-span-12">
          <h3 className="font-display text-sm font-semibold text-slate-100">
            Indicadores de Experiência (Seção Sobre Mim)
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {indDraft.map((ind, idx) => (
              <div
                key={idx}
                className="grid gap-2 rounded-lg border border-white/10 bg-[#050B14] p-3 sm:grid-cols-3"
              >
                <input
                  type="text"
                  value={ind.value}
                  onChange={(e) => {
                    const val = e.target.value;
                    setIndDraft((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, value: val } : item,
                      ),
                    );
                  }}
                  placeholder="Destaque"
                  className="rounded-md border border-white/10 bg-[#0B1526] px-2.5 py-1.5 text-xs font-semibold text-sky-400 focus:border-sky-400 focus:outline-none"
                />
                <input
                  type="text"
                  value={ind.label}
                  onChange={(e) => {
                    const val = e.target.value;
                    setIndDraft((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, label: val } : item,
                      ),
                    );
                  }}
                  placeholder="Título"
                  className="rounded-md border border-white/10 bg-[#0B1526] px-2.5 py-1.5 text-xs text-slate-100 focus:border-sky-400 focus:outline-none"
                />
                <input
                  type="text"
                  value={ind.note}
                  onChange={(e) => {
                    const val = e.target.value;
                    setIndDraft((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, note: val } : item,
                      ),
                    );
                  }}
                  placeholder="Descrição"
                  className="rounded-md border border-white/10 bg-[#0B1526] px-2.5 py-1.5 text-xs text-slate-400 focus:border-sky-400 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </form>
  );
}
