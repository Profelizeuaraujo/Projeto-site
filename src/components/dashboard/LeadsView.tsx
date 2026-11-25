import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageCircle, Search, Trash2 } from 'lucide-react';
import { deleteAdminLead, fetchAdminLeads, patchAdminLead } from '../../lib/api';
import type { LeadItem, LeadStatus } from '../../types/site';

const STATUS_META: Record<LeadStatus, { label: string; colorClass: string }> = {
  novo: { label: 'Novo', colorClass: 'text-sky-400' },
  em_analise: { label: 'Em Análise', colorClass: 'text-amber-400' },
  proposta: { label: 'Proposta Enviada', colorClass: 'text-indigo-400' },
  convertido: { label: 'Convertido', colorClass: 'text-emerald-400' },
  arquivado: { label: 'Arquivado', colorClass: 'text-slate-500' },
};

export function LeadsView({
  getToken,
  accentColor,
}: {
  getToken: () => Promise<string>;
  accentColor: string;
}) {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | LeadStatus>('todos');
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const rows = await fetchAdminLeads(token);
      setLeads(rows);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Falha ao carregar lista de leads.',
      );
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (statusFilter !== 'todos' && l.status !== statusFilter) return false;
      if (!q) return true;
      return (
        l.nome.toLowerCase().includes(q) ||
        l.empresa.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.servico.toLowerCase().includes(q)
      );
    });
  }, [leads, search, statusFilter]);

  const handleStatusChange = async (id: number, status: LeadStatus) => {
    try {
      const token = await getToken();
      const updated = await patchAdminLead(token, id, { status });
      setLeads((prev) => prev.map((item) => (item.id === id ? updated : item)));
      if (selectedLead?.id === id) setSelectedLead(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar status.');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedLead) return;
    setSavingNotes(true);
    try {
      const token = await getToken();
      const updated = await patchAdminLead(token, selectedLead.id, {
        notes: notesDraft,
      });
      setLeads((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      setSelectedLead(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar anotações.');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const token = await getToken();
      await deleteAdminLead(token, id);
      setLeads((prev) => prev.filter((item) => item.id !== id));
      if (selectedLead?.id === id) setSelectedLead(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao remover lead.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-100">
            Gestão de Leads e Solicitações
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            {leads.length} registros captados pelo formulário de contato do site
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, empresa ou serviço..."
              className="w-64 rounded-lg border border-white/10 bg-[#050B14] py-2 pl-8 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-sky-400 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'todos' | LeadStatus)
            }
            aria-label="Filtrar por status"
            className="rounded-lg border border-white/10 bg-[#050B14] px-3 py-2 text-xs text-slate-200 focus:border-sky-400 focus:outline-none"
          >
            <option value="todos">Todos os status</option>
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-200">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Table */}
        <div
          className={`rounded-xl border border-white/10 bg-[#0B1526] p-5 ${
            selectedLead ? 'lg:col-span-7' : 'lg:col-span-12'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="py-2.5 pr-4 font-medium">Contato</th>
                  <th className="py-2.5 pr-4 font-medium">Serviço</th>
                  <th className="py-2.5 pr-4 font-medium">Status</th>
                  <th className="py-2.5 pr-4 font-medium">Data</th>
                  <th className="py-2.5 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Carregando leads...
                    </td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Nenhum lead encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => {
                        setSelectedLead(lead);
                        setNotesDraft(lead.notes);
                      }}
                      className={`cursor-pointer transition-colors hover:bg-white/[0.03] ${
                        selectedLead?.id === lead.id ? 'bg-white/[0.04]' : ''
                      }`}
                    >
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-slate-100">{lead.nome}</p>
                        <p className="text-[11px] text-slate-400">
                          {lead.empresa ? `${lead.empresa} · ` : ''}
                          {lead.email}
                        </p>
                      </td>
                      <td className="py-3 pr-4 text-slate-300">{lead.servico}</td>
                      <td
                        className="py-3 pr-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={lead.status}
                          onChange={(e) =>
                            handleStatusChange(lead.id, e.target.value as LeadStatus)
                          }
                          className={`rounded-md border border-white/10 bg-[#050B14] px-2 py-1 text-xs font-medium focus:border-sky-400 focus:outline-none ${
                            STATUS_META[lead.status]?.colorClass || 'text-slate-200'
                          }`}
                        >
                          {Object.entries(STATUS_META).map(([key, meta]) => (
                            <option
                              key={key}
                              value={key}
                              className="bg-[#050B14] text-slate-100"
                            >
                              {meta.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 pr-4 font-mono tabular-nums text-slate-400">
                        {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td
                        className="py-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => handleDelete(lead.id)}
                          aria-label={`Remover lead ${lead.nome}`}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-rose-500/15 hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Lead Details Panel */}
        {selectedLead && (
          <div className="rounded-xl border border-white/10 bg-[#0B1526] p-5 lg:col-span-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-[11px] text-slate-400">
                  Lead #{selectedLead.id} ·{' '}
                  {new Date(selectedLead.createdAt).toLocaleString('pt-BR')}
                </p>
                <h3 className="font-display mt-1 text-lg font-bold text-slate-100">
                  {selectedLead.nome}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedLead.empresa || 'Empresa não informada'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Fechar
              </button>
            </div>

            <div className="mt-4 space-y-2 border-y border-white/10 py-4 text-xs text-slate-300">
              <p>
                <span className="text-slate-500">E-mail: </span>
                {selectedLead.email}
              </p>
              <p>
                <span className="text-slate-500">Telefone: </span>
                <span className="tabular-nums">
                  {selectedLead.telefone || 'Não informado'}
                </span>
              </p>
              <p>
                <span className="text-slate-500">Serviço: </span>
                <span className="font-medium text-slate-100">
                  {selectedLead.servico}
                </span>
              </p>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-200">
                Descrição do Briefing
              </p>
              <p className="mt-1.5 rounded-lg border border-white/10 bg-[#050B14] p-3 text-xs leading-relaxed text-slate-300">
                {selectedLead.descricao}
              </p>
            </div>

            <div className="mt-4">
              <label
                htmlFor="lead-notes"
                className="block text-xs font-semibold text-slate-200"
              >
                Notas Internas de Atendimento
              </label>
              <textarea
                id="lead-notes"
                rows={3}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Registre observações, escopo inicial ou próximos passos..."
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#050B14] p-3 text-xs text-slate-100 placeholder-slate-500 focus:border-sky-400 focus:outline-none"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-[#050B14] disabled:opacity-50"
                  style={{ backgroundColor: accentColor }}
                >
                  {savingNotes ? 'Salvando...' : 'Salvar notas'}
                </button>

                {selectedLead.telefone && (
                  <a
                    href={`https://wa.me/${selectedLead.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Olá ${selectedLead.nome}, recebi sua solicitação sobre ${selectedLead.servico}. Podemos conversar?`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#050B14] px-3 py-2 text-xs font-medium text-slate-200 hover:border-white/30"
                  >
                    <MessageCircle className="h-3.5 w-3.5" style={{ color: accentColor }} />
                    <span>Responder no WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
