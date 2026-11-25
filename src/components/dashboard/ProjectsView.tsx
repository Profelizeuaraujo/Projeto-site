import React, { useState } from 'react';
import { Edit3, Plus, RotateCcw, Trash2, Upload } from 'lucide-react';
import {
  compressImageFile,
  createAdminProject,
  deleteAdminProject,
  resetAdminProjects,
  updateAdminProject,
} from '../../lib/api';
import type { ProjectCategoryValue, ProjectItem } from '../../types/site';

const CATEGORIES: ProjectCategoryValue[] = [
  'Sites',
  'Sistemas',
  'Inteligência Artificial',
  'Automação',
  'Infraestrutura',
];

const EMPTY_FORM = {
  title: '',
  category: 'Sistemas' as ProjectCategoryValue,
  description: '',
  problemSolved: '',
  solutionImplemented: '',
  technologies: '',
  demoUrl: '',
  image: '',
  isExample: false,
};

export function ProjectsView({
  projects,
  onProjectsChange,
  getToken,
  accentColor,
}: {
  projects: ProjectItem[];
  onProjectsChange: (next: ProjectItem[]) => void;
  getToken: () => Promise<string>;
  accentColor: string;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 960, 0.82);
      setForm((prev) => ({ ...prev, image: compressed }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao processar imagem.');
    }
  };

  const handleEdit = (project: ProjectItem) => {
    setEditingId(project.id);
    setForm({
      title: project.title,
      category: project.category,
      description: project.description,
      problemSolved: project.problemSolved,
      solutionImplemented: project.solutionImplemented,
      technologies: project.technologies.join(', '),
      demoUrl: project.demoUrl || '',
      image: project.image,
      isExample: project.isExample,
    });
    setMessage(null);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError('Preencha o título e a descrição do projeto.');
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    const payload = {
      title: form.title.trim(),
      category: form.category,
      description: form.description.trim(),
      problemSolved: form.problemSolved.trim() || 'Não informado.',
      solutionImplemented: form.solutionImplemented.trim() || 'Não informado.',
      technologies: form.technologies
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      demoUrl: form.demoUrl.trim(),
      image: form.image.trim(),
      isExample: form.isExample,
    };

    try {
      const token = await getToken();
      if (editingId !== null) {
        const updated = await updateAdminProject(token, editingId, payload);
        onProjectsChange(
          projects.map((p) => (p.id === updated.id ? updated : p)),
        );
        setMessage('Projeto atualizado com sucesso.');
      } else {
        const created = await createAdminProject(token, payload);
        onProjectsChange([created, ...projects]);
        setMessage('Projeto publicado no portfólio.');
      }
      setEditingId(null);
      setForm(EMPTY_FORM);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar projeto.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setError(null);
    try {
      const token = await getToken();
      await deleteAdminProject(token, id);
      onProjectsChange(projects.filter((p) => p.id !== id));
      if (editingId === id) handleCancelEdit();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao remover projeto.');
    }
  };

  const handleReset = async () => {
    setError(null);
    try {
      const token = await getToken();
      const restored = await resetAdminProjects(token);
      onProjectsChange(restored);
      setMessage('Projetos demonstrativos padrão restaurados.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao restaurar projetos.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-100">
            Portfólio de Projetos
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Cadastre, edite e organize os projetos exibidos na vitrine pública do site.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#0B1526] px-3 py-2 text-xs font-medium text-slate-300 hover:border-white/25 hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Restaurar exemplos padrão</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-200">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-200">
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-white/10 bg-[#0B1526] p-5 lg:col-span-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-slate-100">
              {editingId !== null ? 'Editar Projeto' : 'Novo Projeto'}
            </h3>
            {editingId !== null && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancelar edição
              </button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Título *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Nome do projeto"
                className="w-full rounded-lg border border-white/10 bg-[#050B14] px-3 py-2 text-xs text-slate-100 focus:border-sky-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-400">Categoria</label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    category: e.target.value as ProjectCategoryValue,
                  }))
                }
                className="w-full rounded-lg border border-white/10 bg-[#050B14] px-3 py-2 text-xs text-slate-100 focus:border-sky-400 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">Descrição *</label>
            <textarea
              rows={2}
              required
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Resumo objetivo da entrega"
              className="w-full rounded-lg border border-white/10 bg-[#050B14] px-3 py-2 text-xs text-slate-100 focus:border-sky-400 focus:outline-none"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                Problema resolvido
              </label>
              <input
                type="text"
                value={form.problemSolved}
                onChange={(e) =>
                  setForm((p) => ({ ...p, problemSolved: e.target.value }))
                }
                placeholder="Qual gargalo foi eliminado?"
                className="w-full rounded-lg border border-white/10 bg-[#050B14] px-3 py-2 text-xs text-slate-100 focus:border-sky-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                Solução implementada
              </label>
              <input
                type="text"
                value={form.solutionImplemented}
                onChange={(e) =>
                  setForm((p) => ({ ...p, solutionImplemented: e.target.value }))
                }
                placeholder="Arquitetura ou abordagem usada"
                className="w-full rounded-lg border border-white/10 bg-[#050B14] px-3 py-2 text-xs text-slate-100 focus:border-sky-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                Tecnologias (separadas por vírgula)
              </label>
              <input
                type="text"
                value={form.technologies}
                onChange={(e) =>
                  setForm((p) => ({ ...p, technologies: e.target.value }))
                }
                placeholder="React, TypeScript, PostgreSQL"
                className="w-full rounded-lg border border-white/10 bg-[#050B14] px-3 py-2 text-xs text-slate-100 focus:border-sky-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                Link de demonstração
              </label>
              <input
                type="text"
                value={form.demoUrl}
                onChange={(e) => setForm((p) => ({ ...p, demoUrl: e.target.value }))}
                placeholder="https://... ou #contato"
                className="w-full rounded-lg border border-white/10 bg-[#050B14] px-3 py-2 text-xs text-slate-100 focus:border-sky-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 bg-[#050B14] px-3 py-1.5 text-xs text-slate-300 hover:border-white/30">
              <Upload className="h-3.5 w-3.5" style={{ color: accentColor }} />
              <span>
                {form.image ? 'Captura otimizada pronta' : 'Enviar captura de tela'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="sr-only"
              />
            </label>

            <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={form.isExample}
                onChange={(e) =>
                  setForm((p) => ({ ...p, isExample: e.target.checked }))
                }
                className="rounded border-white/20 bg-[#050B14]"
              />
              <span>Marcar como exemplo demonstrativo</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-semibold text-[#050B14] transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: accentColor }}
          >
            <Plus className="h-4 w-4" />
            <span>
              {saving
                ? 'Salvando...'
                : editingId !== null
                  ? 'Atualizar Projeto'
                  : 'Adicionar ao Portfólio'}
            </span>
          </button>
        </form>

        {/* List */}
        <div className="rounded-xl border border-white/10 bg-[#0B1526] p-5 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-slate-100">
              Projetos Publicados ({projects.length})
            </h3>
            <span className="font-mono text-xs tabular-nums text-slate-400">
              {projects.reduce((acc, p) => acc + p.viewsCount, 0)} visualizações totais
            </span>
          </div>

          <div className="mt-4 divide-y divide-white/10">
            {projects.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">
                Nenhum projeto cadastrado. Utilize o formulário ao lado para publicar o
                primeiro projeto.
              </p>
            ) : (
              projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-start justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold text-slate-100">
                        {project.title}
                      </span>
                      <span className="text-slate-500">·</span>
                      <span style={{ color: accentColor }}>{project.category}</span>
                      {project.isExample && (
                        <>
                          <span className="text-slate-500">·</span>
                          <span className="text-amber-300/90">Exemplo</span>
                        </>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-slate-400">
                      {project.description}
                    </p>
                    <p className="mt-1 font-mono text-[11px] tabular-nums text-slate-500">
                      {project.viewsCount} visualizações ·{' '}
                      {project.technologies.join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEdit(project)}
                      aria-label={`Editar ${project.title}`}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(project.id)}
                      aria-label={`Remover ${project.title}`}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-rose-500/15 hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
