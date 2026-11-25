import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  requireAdmin,
  requireAuth,
  type AuthRequest,
} from './src/middleware/auth.ts';
import {
  createLead,
  createProject,
  deleteLead,
  deleteProject,
  getAnalyticsDashboardData,
  getSiteSettings,
  grantAdminByEmail,
  listAdminAccessOverview,
  listIndicators,
  listLeads,
  listProjects,
  recordAnalyticsEvent,
  replaceIndicators,
  resetDefaultProjects,
  revokeAdminByEmail,
  updateLead,
  updateProject,
  updateSiteSettings,
} from './src/db/repository.ts';
import type {
  AnalyticsEventType,
  LeadStatus,
  ProjectCategoryValue,
} from './src/types/site.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

const ALLOWED_CATEGORIES: ProjectCategoryValue[] = [
  'Sites',
  'Sistemas',
  'Inteligência Artificial',
  'Automação',
  'Infraestrutura',
];

const ALLOWED_STATUSES: LeadStatus[] = [
  'novo',
  'em_analise',
  'proposta',
  'convertido',
  'arquivado',
];

const ALLOWED_EVENT_TYPES: AnalyticsEventType[] = [
  'page_view',
  'service_view',
  'project_view',
  'whatsapp_click',
  'lead_submit',
  'cta_click',
];

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '4mb' }));

  // =========================================================================
  // PUBLIC API ROUTES (Site visitors)
  // =========================================================================

  app.get('/api/public/bootstrap', async (_req, res) => {
    try {
      const [settings, projects, indicators] = await Promise.all([
        getSiteSettings(),
        listProjects(),
        listIndicators(),
      ]);
      res.setHeader('Cache-Control', 'no-cache');
      res.json({ settings, projects, indicators });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao carregar dados do site.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/public/leads', async (req, res) => {
    try {
      const { nome, empresa, email, telefone, servico, descricao, device } =
        req.body || {};

      if (typeof nome !== 'string' || !nome.trim()) {
        return res.status(400).json({ error: 'Informe seu nome.' });
      }
      if (typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: 'Informe um e-mail válido.' });
      }
      if (typeof descricao !== 'string' || !descricao.trim()) {
        return res.status(400).json({ error: 'Descreva brevemente o projeto.' });
      }
      if (typeof servico !== 'string' || !servico.trim()) {
        return res.status(400).json({ error: 'Selecione um serviço.' });
      }

      const lead = await createLead({
        nome,
        empresa: typeof empresa === 'string' ? empresa : '',
        email,
        telefone: typeof telefone === 'string' ? telefone : '',
        servico,
        descricao,
        device: typeof device === 'string' ? device : 'desktop',
      });

      res.status(201).json(lead);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao registrar contato.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/public/analytics', async (req, res) => {
    try {
      const { eventType, target, category, device } = req.body || {};
      if (!ALLOWED_EVENT_TYPES.includes(eventType)) {
        return res.status(400).json({ error: 'Tipo de evento inválido.' });
      }
      await recordAnalyticsEvent({
        eventType,
        target: typeof target === 'string' ? target : '',
        category: typeof category === 'string' ? category : '',
        device: typeof device === 'string' ? device : 'desktop',
      });
      res.status(202).json({ ok: true });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao registrar evento.';
      res.status(500).json({ error: message });
    }
  });

  // =========================================================================
  // AUTH SESSION ROUTE (Verifies Firebase token & returns current RBAC role)
  // =========================================================================

  app.get('/api/auth/session', requireAuth, (req: AuthRequest, res) => {
    const dbUser = req.dbUser;
    if (!dbUser) {
      return res.status(401).json({ error: 'Sessão não encontrada.' });
    }
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      uid: dbUser.uid,
      email: dbUser.email,
      displayName: dbUser.displayName || req.user?.name || dbUser.email,
      picture: req.user?.picture || '',
      role: dbUser.role,
      isAdmin: dbUser.isAdmin,
      isPrimaryAdmin: dbUser.isPrimaryAdmin,
    });
  });

  // =========================================================================
  // PROTECTED ADMIN DASHBOARD ROUTES (Firebase Auth + Admin Role required)
  // =========================================================================

  app.get('/api/admin/me', requireAdmin, (req: AuthRequest, res) => {
    const dbUser = req.dbUser;
    res.json({
      uid: dbUser?.uid,
      email: dbUser?.email,
      name: dbUser?.displayName || req.user?.name || dbUser?.email,
      picture: req.user?.picture || '',
      role: dbUser?.role || 'admin',
      isAdmin: true,
      isPrimaryAdmin: Boolean(dbUser?.isPrimaryAdmin),
    });
  });

  app.get('/api/admin/access', requireAdmin, async (_req: AuthRequest, res) => {
    try {
      const overview = await listAdminAccessOverview();
      res.setHeader('Cache-Control', 'no-store');
      res.json(overview);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Erro ao carregar controle de acessos.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/admin/access', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { email } = req.body || {};
      if (typeof email !== 'string' || !email.trim()) {
        return res
          .status(400)
          .json({ error: 'Informe o e-mail Google do novo administrador.' });
      }
      const overview = await grantAdminByEmail(
        email,
        req.dbUser?.email || 'admin',
      );
      res.status(201).json(overview);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Erro ao autorizar administrador.';
      const status = message.includes('válido') ? 400 : 500;
      res.status(status).json({ error: message });
    }
  });

  app.delete(
    '/api/admin/access/:email',
    requireAdmin,
    async (req: AuthRequest, res) => {
      try {
        const email = String(req.params.email || '').trim();
        const overview = await revokeAdminByEmail(
          email,
          req.dbUser?.email || '',
        );
        res.json(overview);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : 'Erro ao revogar acesso de administrador.';
        const status =
          message.includes('principal') ||
          message.includes('próprio') ||
          message.includes('inválido')
            ? 400
            : 500;
        res.status(status).json({ error: message });
      }
    },
  );

  app.get('/api/admin/analytics', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const daysParam = Number(req.query.days) || 30;
      const data = await getAnalyticsDashboardData(daysParam);
      res.json(data);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao carregar analytics.';
      res.status(500).json({ error: message });
    }
  });

  app.put('/api/admin/settings', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const updated = await updateSiteSettings(req.body || {});
      res.json(updated);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao salvar configurações.';
      res.status(500).json({ error: message });
    }
  });

  app.put('/api/admin/indicators', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { indicators } = req.body || {};
      if (!Array.isArray(indicators)) {
        return res.status(400).json({ error: 'Lista de indicadores inválida.' });
      }
      const cleaned = indicators
        .filter((i) => i && typeof i.label === 'string' && typeof i.value === 'string')
        .map((i) => ({
          label: i.label,
          value: i.value,
          note: typeof i.note === 'string' ? i.note : '',
        }));
      const saved = await replaceIndicators(cleaned);
      res.json(saved);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao salvar indicadores.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/admin/projects', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const {
        title,
        category,
        isExample,
        image,
        description,
        problemSolved,
        solutionImplemented,
        technologies,
        demoUrl,
      } = req.body || {};

      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ error: 'Informe o título do projeto.' });
      }
      if (typeof description !== 'string' || !description.trim()) {
        return res.status(400).json({ error: 'Informe a descrição do projeto.' });
      }
      const safeCategory: ProjectCategoryValue = ALLOWED_CATEGORIES.includes(category)
        ? category
        : 'Sistemas';

      const created = await createProject({
        title,
        category: safeCategory,
        isExample: Boolean(isExample),
        image: typeof image === 'string' ? image : '',
        description,
        problemSolved: typeof problemSolved === 'string' ? problemSolved : '',
        solutionImplemented:
          typeof solutionImplemented === 'string' ? solutionImplemented : '',
        technologies: Array.isArray(technologies) ? technologies : [],
        demoUrl: typeof demoUrl === 'string' ? demoUrl : '',
      });
      res.status(201).json(created);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao criar projeto.';
      res.status(500).json({ error: message });
    }
  });

  app.put('/api/admin/projects/:id', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'ID de projeto inválido.' });
      }
      const body = req.body || {};
      if (body.category && !ALLOWED_CATEGORIES.includes(body.category)) {
        return res.status(400).json({ error: 'Categoria inválida.' });
      }
      const updated = await updateProject(id, body);
      if (!updated) {
        return res.status(404).json({ error: 'Projeto não encontrado.' });
      }
      res.json(updated);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao atualizar projeto.';
      res.status(500).json({ error: message });
    }
  });

  app.delete('/api/admin/projects/:id', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'ID de projeto inválido.' });
      }
      const removed = await deleteProject(id);
      if (!removed) {
        return res.status(404).json({ error: 'Projeto não encontrado.' });
      }
      res.json({ ok: true });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao remover projeto.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/admin/projects/reset', requireAdmin, async (_req: AuthRequest, res) => {
    try {
      const projects = await resetDefaultProjects();
      res.json(projects);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao restaurar projetos.';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/admin/leads', requireAdmin, async (_req: AuthRequest, res) => {
    try {
      const leads = await listLeads();
      res.json(leads);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao carregar leads.';
      res.status(500).json({ error: message });
    }
  });

  app.patch('/api/admin/leads/:id', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'ID de lead inválido.' });
      }
      const { status, notes } = req.body || {};
      if (status !== undefined && !ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({ error: 'Status de lead inválido.' });
      }
      const updated = await updateLead(id, {
        status,
        notes: typeof notes === 'string' ? notes : undefined,
      });
      if (!updated) {
        return res.status(404).json({ error: 'Lead não encontrado.' });
      }
      res.json(updated);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao atualizar lead.';
      res.status(500).json({ error: message });
    }
  });

  app.delete('/api/admin/leads/:id', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'ID de lead inválido.' });
      }
      const removed = await deleteLead(id);
      if (!removed) {
        return res.status(404).json({ error: 'Lead não encontrado.' });
      }
      res.json({ ok: true });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao remover lead.';
      res.status(500).json({ error: message });
    }
  });

  // =========================================================================
  // VITE / STATIC SPA SERVING
  // =========================================================================

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
