import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  fetchAdminAccess,
  grantAdminAccess,
  revokeAdminAccess,
} from '../../lib/api';
import type { AdminAccessOverview } from '../../types/site';

export function AdminsView({
  getToken,
  currentUserEmail,
  accentColor,
}: {
  getToken: () => Promise<string>;
  currentUserEmail: string;
  accentColor: string;
}) {
  const [overview, setOverview] = useState<AdminAccessOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [busyEmail, setBusyEmail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadAccess = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const data = await fetchAdminAccess(token);
      setOverview(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao carregar controle de acessos.',
      );
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void loadAccess();
  }, [loadAccess]);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = emailInput.trim().toLowerCase();
    if (!cleaned) return;

    setSubmitting(true);
    setError(null);
    setFeedback(null);
    try {
      const token = await getToken();
      const updated = await grantAdminAccess(token, cleaned);
      setOverview(updated);
      setEmailInput('');
      setFeedback(`Acesso administrativo autorizado para ${cleaned}.`);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Erro ao autorizar administrador.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickGrant = async (email: string) => {
    setBusyEmail(email);
    setError(null);
    setFeedback(null);
    try {
      const token = await getToken();
      const updated = await grantAdminAccess(token, email);
      setOverview(updated);
      setFeedback(`Acesso administrativo concedido para ${email}.`);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Erro ao conceder permissão.',
      );
    } finally {
      setBusyEmail(null);
    }
  };

  const handleRevoke = async (email: string) => {
    setBusyEmail(email);
    setError(null);
    setFeedback(null);
    try {
      const token = await getToken();
      const updated = await revokeAdminAccess(token, email);
      setOverview(updated);
      setFeedback(`Acesso administrativo revogado para ${email}.`);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Erro ao revogar permissão.',
      );
    } finally {
      setBusyEmail(null);
    }
  };

  const normalizedCurrent = currentUserEmail.trim().toLowerCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-50">
          Controle de Acesso & Administradores
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Apenas contas Google autorizadas nesta lista podem acessar Analytics,
          Leads, Portfólio e Configurações do site.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
          <span>{error}</span>
        </div>
      )}

      {feedback && (
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Authorize new admin form */}
      <form
        onSubmit={handleGrant}
        className="rounded-xl border border-white/10 bg-[#0B1526] p-5"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
          <UserPlus className="h-4 w-4" style={{ color: accentColor }} />
          <h2>Autorizar Novo Administrador</h2>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Informe o e-mail da conta Google que poderá entrar no Painel de
          Controle. A permissão passa a valer imediatamente no próximo login.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            required
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="nome@empresa.com.br"
            aria-label="E-mail Google do novo administrador"
            className="flex-1 rounded-lg border border-white/10 bg-[#050B14] px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400/60 focus:outline-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-[#050B14] transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: accentColor }}
          >
            <UserPlus className="h-4 w-4" />
            <span>{submitting ? 'Autorizando...' : 'Autorizar E-mail'}</span>
          </button>
        </div>
      </form>

      {/* Authorized admins list */}
      <div className="rounded-xl border border-white/10 bg-[#0B1526]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" style={{ color: accentColor }} />
            <h2 className="text-sm font-semibold text-slate-100">
              Administradores Autorizados
            </h2>
          </div>
          <span className="font-mono text-xs text-slate-400">
            {overview?.authorizedAdmins.length ?? 0} conta(s)
          </span>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-slate-400">
            Carregando administradores...
          </div>
        ) : !overview || overview.authorizedAdmins.length === 0 ? (
          <div className="p-6 text-sm text-slate-400">
            Nenhum administrador configurado.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {overview.authorizedAdmins.map((admin) => {
              const isSelf = admin.email.toLowerCase() === normalizedCurrent;
              const locked = admin.isPrimary || isSelf;
              return (
                <div
                  key={admin.id}
                  className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium text-slate-100">
                        {admin.email}
                      </span>
                      {admin.isPrimary && (
                        <span className="rounded bg-sky-500/15 px-2 py-0.5 text-[11px] font-medium text-sky-300">
                          Admin Principal
                        </span>
                      )}
                      {isSelf && (
                        <span className="rounded bg-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                          Sua conta
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Adicionado por {admin.addedBy === 'system' ? 'configuração inicial' : admin.addedBy}
                    </p>
                  </div>

                  {!locked && (
                    <button
                      type="button"
                      disabled={busyEmail === admin.email}
                      onClick={() => void handleRevoke(admin.email)}
                      className="inline-flex items-center gap-1.5 self-start rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-200 transition-colors hover:bg-rose-500/20 disabled:opacity-50 sm:self-auto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>
                        {busyEmail === admin.email ? 'Revogando...' : 'Revogar'}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Registered Firebase sign-in history */}
      <div className="rounded-xl border border-white/10 bg-[#0B1526]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-300" />
            <h2 className="text-sm font-semibold text-slate-100">
              Contas Registradas via Firebase Auth
            </h2>
          </div>
          <span className="font-mono text-xs text-slate-400">
            {overview?.registeredUsers.length ?? 0} registro(s)
          </span>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-slate-400">Carregando contas...</div>
        ) : !overview || overview.registeredUsers.length === 0 ? (
          <div className="p-6 text-sm text-slate-400">
            Nenhuma conta registrada ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Usuário</th>
                  <th className="px-5 py-3 font-medium">Permissão</th>
                  <th className="px-5 py-3 text-right font-medium">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {overview.registeredUsers.map((u) => {
                  const isSelf = u.email.toLowerCase() === normalizedCurrent;
                  const canRevoke = u.role === 'admin' && !u.isPrimary && !isSelf;
                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-100">
                          {u.displayName || 'Usuário Google'}
                        </p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1.5 rounded bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>
                              {u.isPrimary ? 'Admin Principal' : 'Administrador'}
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded bg-slate-500/15 px-2.5 py-1 text-xs font-medium text-slate-300">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            <span>Acesso bloqueado</span>
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {u.role !== 'admin' ? (
                          <button
                            type="button"
                            disabled={busyEmail === u.email}
                            onClick={() => void handleQuickGrant(u.email)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#050B14] px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-white/30 hover:text-white disabled:opacity-50"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>
                              {busyEmail === u.email
                                ? 'Atualizando...'
                                : 'Tornar Admin'}
                            </span>
                          </button>
                        ) : canRevoke ? (
                          <button
                            type="button"
                            disabled={busyEmail === u.email}
                            onClick={() => void handleRevoke(u.email)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-200 transition-colors hover:bg-rose-500/20 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Revogar</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500">Protegido</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
