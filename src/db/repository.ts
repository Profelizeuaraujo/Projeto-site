import { asc, desc, eq, gte, sql } from 'drizzle-orm';
import { db } from './index.ts';
import {
  analyticsEvents,
  authorizedAdmins,
  contactLeads,
  experienceIndicators,
  portfolioProjects,
  siteSettings,
  users,
} from './schema.ts';
import {
  DEFAULT_CONFIG,
  DEFAULT_INDICATORS_SEED,
  DEFAULT_PROJECTS_SEED,
  SERVICES_DATA,
} from '../data/defaults.ts';
import type {
  AdminAccessOverview,
  AnalyticsDashboardData,
  AnalyticsEventType,
  ExperienceIndicator,
  LeadItem,
  LeadStatus,
  ProjectCategoryValue,
  ProjectItem,
  SiteConfig,
  UserRole,
} from '../types/site.ts';

let seedPromise: Promise<void> | null = null;

const PRIMARY_ADMIN_EMAIL = 'prof.elizeuaraujo@gmail.com';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isPrimaryAdminEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  return Boolean(normalized && normalized === PRIMARY_ADMIN_EMAIL);
}

async function ensureBootstrapAdmins(): Promise<void> {
  await db
    .insert(authorizedAdmins)
    .values({
      email: PRIMARY_ADMIN_EMAIL,
      addedBy: 'system',
    })
    .onConflictDoNothing();
}

export interface SyncedUserRecord {
  id: number;
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  isAdmin: boolean;
  isPrimaryAdmin: boolean;
}

export async function syncAuthenticatedUser(
  uid: string,
  rawEmail: string,
  displayName = '',
  emailVerified = false,
): Promise<SyncedUserRecord> {
  try {
    await ensureBootstrapAdmins();
    const email = normalizeEmail(rawEmail);
    const primary = Boolean(email && emailVerified && isPrimaryAdminEmail(email));

    let allowlisted = primary;
    if (!allowlisted && email && emailVerified) {
      const match = await db
        .select({ id: authorizedAdmins.id })
        .from(authorizedAdmins)
        .where(eq(authorizedAdmins.email, email))
        .limit(1);
      allowlisted = match.length > 0;
    }

    const resolvedRole: UserRole = allowlisted ? 'admin' : 'viewer';

    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: displayName.trim(),
        role: resolvedRole,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName: displayName.trim(),
          role: resolvedRole,
        },
      })
      .returning();

    const row = result[0];
    return {
      id: row.id,
      uid: row.uid,
      email: row.email,
      displayName: row.displayName,
      role: row.role === 'admin' ? 'admin' : 'viewer',
      isAdmin: row.role === 'admin',
      isPrimaryAdmin: primary,
    };
  } catch (error) {
    console.error('Database query failed in syncAuthenticatedUser:', error);
    throw new Error('Falha ao validar perfil e permissões do usuário.', {
      cause: error,
    });
  }
}

export async function listAdminAccessOverview(): Promise<AdminAccessOverview> {
  try {
    await ensureBootstrapAdmins();
    const [adminsRows, userRows] = await Promise.all([
      db
        .select()
        .from(authorizedAdmins)
        .orderBy(asc(authorizedAdmins.createdAt)),
      db.select().from(users).orderBy(desc(users.createdAt)),
    ]);

    return {
      authorizedAdmins: adminsRows.map((row) => ({
        id: row.id,
        email: row.email,
        addedBy: row.addedBy,
        isPrimary: isPrimaryAdminEmail(row.email),
        createdAt: row.createdAt.toISOString(),
      })),
      registeredUsers: userRows.map((row) => ({
        id: row.id,
        uid: row.uid,
        email: row.email,
        displayName: row.displayName,
        role: row.role === 'admin' ? 'admin' : 'viewer',
        isPrimary: isPrimaryAdminEmail(row.email),
        createdAt: row.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error('Database query failed in listAdminAccessOverview:', error);
    throw new Error('Falha ao carregar lista de administradores.', {
      cause: error,
    });
  }
}

export async function grantAdminByEmail(
  rawEmail: string,
  addedByEmail: string,
): Promise<AdminAccessOverview> {
  const email = normalizeEmail(rawEmail);
  if (!EMAIL_REGEX.test(email)) {
    throw new Error('Informe um endereço de e-mail válido.');
  }

  try {
    await ensureBootstrapAdmins();
    await db
      .insert(authorizedAdmins)
      .values({
        email,
        addedBy: normalizeEmail(addedByEmail) || 'admin',
      })
      .onConflictDoNothing();

    await db
      .update(users)
      .set({ role: 'admin' })
      .where(sql`lower(${users.email}) = ${email}`);

    return listAdminAccessOverview();
  } catch (error) {
    console.error('Database query failed in grantAdminByEmail:', error);
    throw new Error('Falha ao autorizar administrador.', { cause: error });
  }
}

export async function revokeAdminByEmail(
  rawEmail: string,
  actingEmail: string,
): Promise<AdminAccessOverview> {
  const email = normalizeEmail(rawEmail);
  if (!email) {
    throw new Error('E-mail inválido.');
  }
  if (isPrimaryAdminEmail(email)) {
    throw new Error('O administrador principal não pode ser removido.');
  }
  if (email === normalizeEmail(actingEmail)) {
    throw new Error('Você não pode revogar o seu próprio acesso administrativo.');
  }

  try {
    await db
      .delete(authorizedAdmins)
      .where(eq(authorizedAdmins.email, email));

    await db
      .update(users)
      .set({ role: 'viewer' })
      .where(sql`lower(${users.email}) = ${email}`);

    return listAdminAccessOverview();
  } catch (error) {
    console.error('Database query failed in revokeAdminByEmail:', error);
    throw new Error('Falha ao revogar acesso de administrador.', {
      cause: error,
    });
  }
}

export async function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runInitialSeed().catch((err) => {
      seedPromise = null;
      throw err;
    });
  }
  return seedPromise;
}

async function runInitialSeed(): Promise<void> {
  // 1. Site settings
  const existingSettings = await db
    .select({ id: siteSettings.id })
    .from(siteSettings)
    .where(eq(siteSettings.key, 'default'))
    .limit(1);

  if (existingSettings.length === 0) {
    await db
      .insert(siteSettings)
      .values({
        key: 'default',
        brandName: DEFAULT_CONFIG.brandName,
        brandTagline: DEFAULT_CONFIG.brandTagline,
        heroTitle: DEFAULT_CONFIG.heroTitle,
        heroSubtitle: DEFAULT_CONFIG.heroSubtitle,
        email: DEFAULT_CONFIG.email,
        phoneDisplay: DEFAULT_CONFIG.phoneDisplay,
        whatsappNumber: DEFAULT_CONFIG.whatsappNumber,
        linkedinUrl: DEFAULT_CONFIG.linkedinUrl,
        instagramUrl: DEFAULT_CONFIG.instagramUrl,
        location: DEFAULT_CONFIG.location,
        photoUrl: DEFAULT_CONFIG.photoUrl,
        accentColor: DEFAULT_CONFIG.accentColor,
        enableParticles: DEFAULT_CONFIG.enableParticles,
        enable3dVisual: DEFAULT_CONFIG.enable3dVisual,
        enableScrollReveal: DEFAULT_CONFIG.enableScrollReveal,
        showSections: DEFAULT_CONFIG.showSections,
      })
      .onConflictDoNothing();
  }

  // 2. Portfolio projects
  const existingProjects = await db
    .select({ id: portfolioProjects.id })
    .from(portfolioProjects)
    .limit(1);

  if (existingProjects.length === 0) {
    await db
      .insert(portfolioProjects)
      .values(DEFAULT_PROJECTS_SEED)
      .onConflictDoNothing();
  }

  // 3. Experience indicators
  const existingIndicators = await db
    .select({ id: experienceIndicators.id })
    .from(experienceIndicators)
    .limit(1);

  if (existingIndicators.length === 0) {
    await db.insert(experienceIndicators).values(DEFAULT_INDICATORS_SEED);
  }

  // 4. Initial analytics baseline events (last 14 days) so Chart.js starts populated
  const existingEvents = await db
    .select({ id: analyticsEvents.id })
    .from(analyticsEvents)
    .limit(1);

  if (existingEvents.length === 0) {
    const now = Date.now();
    const dayMs = 86_400_000;
    const serviceTitles = SERVICES_DATA.map((s) => s.title);
    const projectCategories = ['Sistemas', 'Inteligência Artificial', 'Sites', 'Automação', 'Infraestrutura'];
    const devices = ['desktop', 'desktop', 'desktop', 'mobile', 'mobile', 'tablet'];

    const baselineRows: {
      eventType: string;
      target: string;
      category: string;
      device: string;
      createdAt: Date;
    }[] = [];

    for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
      const visitsForDay = 6 + ((14 - dayOffset) % 5) * 2;
      for (let v = 0; v < visitsForDay; v++) {
        const ts = new Date(now - dayOffset * dayMs + v * 1_800_000);
        baselineRows.push({
          eventType: 'page_view',
          target: 'home',
          category: 'Acesso',
          device: devices[(dayOffset + v) % devices.length],
          createdAt: ts,
        });
      }

      const svcViews = 2 + (dayOffset % 3);
      for (let s = 0; s < svcViews; s++) {
        const svc = serviceTitles[(dayOffset + s) % serviceTitles.length];
        baselineRows.push({
          eventType: 'service_view',
          target: svc,
          category: 'Serviços',
          device: devices[(dayOffset + s) % devices.length],
          createdAt: new Date(now - dayOffset * dayMs + (s + 1) * 3_200_000),
        });
      }

      const projViews = 1 + (dayOffset % 3);
      for (let p = 0; p < projViews; p++) {
        const cat = projectCategories[(dayOffset + p) % projectCategories.length];
        baselineRows.push({
          eventType: 'project_view',
          target: DEFAULT_PROJECTS_SEED[(dayOffset + p) % DEFAULT_PROJECTS_SEED.length].slug,
          category: cat,
          device: devices[p % devices.length],
          createdAt: new Date(now - dayOffset * dayMs + (p + 2) * 3_600_000),
        });
      }

      if (dayOffset % 2 === 0) {
        baselineRows.push({
          eventType: 'whatsapp_click',
          target: 'contato_whatsapp',
          category: 'Conversão',
          device: dayOffset % 4 === 0 ? 'mobile' : 'desktop',
          createdAt: new Date(now - dayOffset * dayMs + 14_400_000),
        });
      }
    }

    await db.insert(analyticsEvents).values(baselineRows);
  }

  // 5. Initial demonstration leads (clearly flagged as Exemplo)
  const existingLeads = await db
    .select({ id: contactLeads.id })
    .from(contactLeads)
    .limit(1);

  if (existingLeads.length === 0) {
    const now = Date.now();
    const dayMs = 86_400_000;
    const demoLeads = [
      {
        nome: 'Contato Demonstrativo 01',
        empresa: 'Empresa Exemplo — Indústria',
        email: 'exemplo1@organizacao.com.br',
        telefone: '(65) 99999-0001',
        servico: 'Desenvolvimento de Sistemas',
        descricao:
          'Exemplo de solicitação para substituir planilhas operacionais por painel web com controle de permissões.',
        status: 'proposta',
        notes: 'Registro demonstrativo inicial — pode ser removido a qualquer momento.',
        createdAt: new Date(now - 6 * dayMs),
      },
      {
        nome: 'Contato Demonstrativo 02',
        empresa: 'Empresa Exemplo — Serviços B2B',
        email: 'exemplo2@organizacao.com.br',
        telefone: '(65) 99999-0002',
        servico: 'Inteligência Artificial',
        descricao:
          'Exemplo de briefing para assistente corporativo integrado a manuais internos com governança LGPD.',
        status: 'em_analise',
        notes: 'Registro demonstrativo inicial — pode ser removido a qualquer momento.',
        createdAt: new Date(now - 3 * dayMs),
      },
      {
        nome: 'Contato Demonstrativo 03',
        empresa: 'Empresa Exemplo — Tecnologia',
        email: 'exemplo3@organizacao.com.br',
        telefone: '(65) 99999-0003',
        servico: 'Desenvolvimento de Sites',
        descricao:
          'Exemplo de demanda para portal institucional de alta performance com foco em Core Web Vitals.',
        status: 'novo',
        notes: 'Registro demonstrativo inicial — pode ser removido a qualquer momento.',
        createdAt: new Date(now - 1 * dayMs),
      },
    ];

    await db.insert(contactLeads).values(demoLeads);

    await db.insert(analyticsEvents).values(
      demoLeads.map((l) => ({
        eventType: 'lead_submit',
        target: l.servico,
        category: 'Conversão',
        device: 'desktop',
        createdAt: l.createdAt,
      })),
    );
  }
}

export async function getSiteSettings(): Promise<SiteConfig> {
  try {
    await ensureSeeded();
    const rows = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, 'default'))
      .limit(1);

    if (rows.length === 0) return DEFAULT_CONFIG;
    const row = rows[0];
    return {
      brandName: row.brandName,
      brandTagline: row.brandTagline,
      heroTitle: row.heroTitle,
      heroSubtitle: row.heroSubtitle,
      email: row.email,
      phoneDisplay: row.phoneDisplay,
      whatsappNumber: row.whatsappNumber,
      linkedinUrl: row.linkedinUrl,
      instagramUrl: row.instagramUrl,
      location: row.location,
      photoUrl: row.photoUrl,
      accentColor: row.accentColor,
      enableParticles: row.enableParticles,
      enable3dVisual: row.enable3dVisual,
      enableScrollReveal: row.enableScrollReveal,
      showSections: {
        ...DEFAULT_CONFIG.showSections,
        ...(row.showSections || {}),
      },
    };
  } catch (error) {
    console.error('Database query failed in getSiteSettings:', error);
    throw new Error('Falha ao carregar configurações do site.', { cause: error });
  }
}

export async function updateSiteSettings(payload: Partial<SiteConfig>): Promise<SiteConfig> {
  try {
    await ensureSeeded();
    const current = await getSiteSettings();
    const merged: SiteConfig = {
      ...current,
      ...payload,
      showSections: {
        ...current.showSections,
        ...(payload.showSections || {}),
      },
    };

    await db
      .update(siteSettings)
      .set({
        brandName: merged.brandName,
        brandTagline: merged.brandTagline,
        heroTitle: merged.heroTitle,
        heroSubtitle: merged.heroSubtitle,
        email: merged.email,
        phoneDisplay: merged.phoneDisplay,
        whatsappNumber: merged.whatsappNumber,
        linkedinUrl: merged.linkedinUrl,
        instagramUrl: merged.instagramUrl,
        location: merged.location,
        photoUrl: merged.photoUrl,
        accentColor: merged.accentColor,
        enableParticles: merged.enableParticles,
        enable3dVisual: merged.enable3dVisual,
        enableScrollReveal: merged.enableScrollReveal,
        showSections: merged.showSections,
        updatedAt: new Date(),
      })
      .where(eq(siteSettings.key, 'default'));

    return merged;
  } catch (error) {
    console.error('Database query failed in updateSiteSettings:', error);
    throw new Error('Falha ao salvar configurações do site.', { cause: error });
  }
}

export async function listProjects(): Promise<ProjectItem[]> {
  try {
    await ensureSeeded();
    const rows = await db
      .select()
      .from(portfolioProjects)
      .orderBy(desc(portfolioProjects.createdAt), desc(portfolioProjects.id));

    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      category: r.category as ProjectCategoryValue,
      isExample: r.isExample,
      image: r.image,
      description: r.description,
      problemSolved: r.problemSolved,
      solutionImplemented: r.solutionImplemented,
      technologies: Array.isArray(r.technologies) ? r.technologies : [],
      demoUrl: r.demoUrl || undefined,
      viewsCount: r.viewsCount,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error('Database query failed in listProjects:', error);
    throw new Error('Falha ao carregar projetos do portfólio.', { cause: error });
  }
}

export async function createProject(input: {
  title: string;
  category: ProjectCategoryValue;
  isExample?: boolean;
  image?: string;
  description: string;
  problemSolved?: string;
  solutionImplemented?: string;
  technologies?: string[];
  demoUrl?: string;
}): Promise<ProjectItem> {
  try {
    await ensureSeeded();
    const slug = `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const [created] = await db
      .insert(portfolioProjects)
      .values({
        slug,
        title: input.title.trim(),
        category: input.category,
        isExample: Boolean(input.isExample),
        image: (input.image || '').trim(),
        description: input.description.trim(),
        problemSolved: (input.problemSolved || 'Não informado.').trim(),
        solutionImplemented: (input.solutionImplemented || 'Não informado.').trim(),
        technologies: (input.technologies || []).filter(Boolean),
        demoUrl: (input.demoUrl || '').trim(),
      })
      .returning();

    return {
      id: created.id,
      slug: created.slug,
      title: created.title,
      category: created.category as ProjectCategoryValue,
      isExample: created.isExample,
      image: created.image,
      description: created.description,
      problemSolved: created.problemSolved,
      solutionImplemented: created.solutionImplemented,
      technologies: created.technologies,
      demoUrl: created.demoUrl || undefined,
      viewsCount: created.viewsCount,
      createdAt: created.createdAt.toISOString(),
    };
  } catch (error) {
    console.error('Database query failed in createProject:', error);
    throw new Error('Falha ao criar projeto no portfólio.', { cause: error });
  }
}

export async function updateProject(
  id: number,
  input: Partial<{
    title: string;
    category: ProjectCategoryValue;
    isExample: boolean;
    image: string;
    description: string;
    problemSolved: string;
    solutionImplemented: string;
    technologies: string[];
    demoUrl: string;
  }>,
): Promise<ProjectItem | null> {
  try {
    const updateData: Record<string, unknown> = {};
    if (input.title !== undefined) updateData.title = input.title.trim();
    if (input.category !== undefined) updateData.category = input.category;
    if (input.isExample !== undefined) updateData.isExample = input.isExample;
    if (input.image !== undefined) updateData.image = input.image.trim();
    if (input.description !== undefined) updateData.description = input.description.trim();
    if (input.problemSolved !== undefined) updateData.problemSolved = input.problemSolved.trim();
    if (input.solutionImplemented !== undefined)
      updateData.solutionImplemented = input.solutionImplemented.trim();
    if (input.technologies !== undefined) updateData.technologies = input.technologies;
    if (input.demoUrl !== undefined) updateData.demoUrl = input.demoUrl.trim();

    const rows = await db
      .update(portfolioProjects)
      .set(updateData)
      .where(eq(portfolioProjects.id, id))
      .returning();

    if (rows.length === 0) return null;
    const updated = rows[0];
    return {
      id: updated.id,
      slug: updated.slug,
      title: updated.title,
      category: updated.category as ProjectCategoryValue,
      isExample: updated.isExample,
      image: updated.image,
      description: updated.description,
      problemSolved: updated.problemSolved,
      solutionImplemented: updated.solutionImplemented,
      technologies: updated.technologies,
      demoUrl: updated.demoUrl || undefined,
      viewsCount: updated.viewsCount,
      createdAt: updated.createdAt.toISOString(),
    };
  } catch (error) {
    console.error('Database query failed in updateProject:', error);
    throw new Error('Falha ao atualizar projeto.', { cause: error });
  }
}

export async function deleteProject(id: number): Promise<boolean> {
  try {
    const deleted = await db
      .delete(portfolioProjects)
      .where(eq(portfolioProjects.id, id))
      .returning({ id: portfolioProjects.id });
    return deleted.length > 0;
  } catch (error) {
    console.error('Database query failed in deleteProject:', error);
    throw new Error('Falha ao remover projeto.', { cause: error });
  }
}

export async function resetDefaultProjects(): Promise<ProjectItem[]> {
  try {
    await db
      .insert(portfolioProjects)
      .values(DEFAULT_PROJECTS_SEED)
      .onConflictDoNothing();
    return await listProjects();
  } catch (error) {
    console.error('Database query failed in resetDefaultProjects:', error);
    throw new Error('Falha ao restaurar projetos padrão.', { cause: error });
  }
}

export async function incrementProjectViews(slug: string): Promise<void> {
  try {
    await db
      .update(portfolioProjects)
      .set({ viewsCount: sql`${portfolioProjects.viewsCount} + 1` })
      .where(eq(portfolioProjects.slug, slug));
  } catch (error) {
    console.error('Database query failed in incrementProjectViews:', error);
  }
}

export async function listIndicators(): Promise<ExperienceIndicator[]> {
  try {
    await ensureSeeded();
    const rows = await db
      .select()
      .from(experienceIndicators)
      .orderBy(asc(experienceIndicators.sortOrder), asc(experienceIndicators.id));

    return rows.map((r) => ({
      id: r.id,
      sortOrder: r.sortOrder,
      label: r.label,
      value: r.value,
      note: r.note,
    }));
  } catch (error) {
    console.error('Database query failed in listIndicators:', error);
    throw new Error('Falha ao carregar indicadores.', { cause: error });
  }
}

export async function replaceIndicators(
  items: { label: string; value: string; note: string }[],
): Promise<ExperienceIndicator[]> {
  try {
    await ensureSeeded();
    await db.delete(experienceIndicators);
    if (items.length > 0) {
      await db.insert(experienceIndicators).values(
        items.map((item, idx) => ({
          sortOrder: idx + 1,
          label: item.label.trim(),
          value: item.value.trim(),
          note: item.note.trim(),
        })),
      );
    }
    return await listIndicators();
  } catch (error) {
    console.error('Database query failed in replaceIndicators:', error);
    throw new Error('Falha ao salvar indicadores.', { cause: error });
  }
}

export async function createLead(input: {
  nome: string;
  empresa?: string;
  email: string;
  telefone?: string;
  servico: string;
  descricao: string;
  device?: string;
}): Promise<LeadItem> {
  try {
    await ensureSeeded();
    const [created] = await db
      .insert(contactLeads)
      .values({
        nome: input.nome.trim(),
        empresa: (input.empresa || '').trim(),
        email: input.email.trim(),
        telefone: (input.telefone || '').trim(),
        servico: input.servico.trim(),
        descricao: input.descricao.trim(),
        status: 'novo',
        notes: '',
      })
      .returning();

    await db.insert(analyticsEvents).values({
      eventType: 'lead_submit',
      target: created.servico,
      category: 'Conversão',
      device: input.device || 'desktop',
    });

    return {
      id: created.id,
      nome: created.nome,
      empresa: created.empresa,
      email: created.email,
      telefone: created.telefone,
      servico: created.servico,
      descricao: created.descricao,
      status: created.status as LeadStatus,
      notes: created.notes,
      createdAt: created.createdAt.toISOString(),
    };
  } catch (error) {
    console.error('Database query failed in createLead:', error);
    throw new Error('Falha ao registrar solicitação de contato.', { cause: error });
  }
}

export async function listLeads(): Promise<LeadItem[]> {
  try {
    await ensureSeeded();
    const rows = await db
      .select()
      .from(contactLeads)
      .orderBy(desc(contactLeads.createdAt), desc(contactLeads.id));

    return rows.map((r) => ({
      id: r.id,
      nome: r.nome,
      empresa: r.empresa,
      email: r.email,
      telefone: r.telefone,
      servico: r.servico,
      descricao: r.descricao,
      status: r.status as LeadStatus,
      notes: r.notes,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error('Database query failed in listLeads:', error);
    throw new Error('Falha ao carregar leads.', { cause: error });
  }
}

export async function updateLead(
  id: number,
  input: Partial<{ status: LeadStatus; notes: string }>,
): Promise<LeadItem | null> {
  try {
    const updateData: Record<string, unknown> = {};
    if (input.status !== undefined) updateData.status = input.status;
    if (input.notes !== undefined) updateData.notes = input.notes;

    const rows = await db
      .update(contactLeads)
      .set(updateData)
      .where(eq(contactLeads.id, id))
      .returning();

    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      nome: r.nome,
      empresa: r.empresa,
      email: r.email,
      telefone: r.telefone,
      servico: r.servico,
      descricao: r.descricao,
      status: r.status as LeadStatus,
      notes: r.notes,
      createdAt: r.createdAt.toISOString(),
    };
  } catch (error) {
    console.error('Database query failed in updateLead:', error);
    throw new Error('Falha ao atualizar lead.', { cause: error });
  }
}

export async function deleteLead(id: number): Promise<boolean> {
  try {
    const deleted = await db
      .delete(contactLeads)
      .where(eq(contactLeads.id, id))
      .returning({ id: contactLeads.id });
    return deleted.length > 0;
  } catch (error) {
    console.error('Database query failed in deleteLead:', error);
    throw new Error('Falha ao remover lead.', { cause: error });
  }
}

export async function recordAnalyticsEvent(input: {
  eventType: AnalyticsEventType;
  target?: string;
  category?: string;
  device?: string;
}): Promise<void> {
  try {
    await ensureSeeded();
    await db.insert(analyticsEvents).values({
      eventType: input.eventType,
      target: (input.target || '').slice(0, 140),
      category: (input.category || '').slice(0, 80),
      device: input.device || 'desktop',
    });

    if (input.eventType === 'project_view' && input.target) {
      await incrementProjectViews(input.target);
    }
  } catch (error) {
    console.error('Database query failed in recordAnalyticsEvent:', error);
    throw new Error('Falha ao registrar evento de analytics.', { cause: error });
  }
}

export async function getAnalyticsDashboardData(days = 30): Promise<AnalyticsDashboardData> {
  try {
    await ensureSeeded();
    const safeDays = Math.min(365, Math.max(7, days));
    const since = new Date(Date.now() - safeDays * 86_400_000);

    const [events, leads, projects] = await Promise.all([
      db
        .select()
        .from(analyticsEvents)
        .where(gte(analyticsEvents.createdAt, since))
        .orderBy(desc(analyticsEvents.createdAt)),
      db.select().from(contactLeads).orderBy(desc(contactLeads.createdAt)),
      db.select().from(portfolioProjects),
    ]);

    const filteredLeads = leads.filter((l) => l.createdAt >= since);

    const totalVisits = events.filter((e) => e.eventType === 'page_view').length;
    const serviceViews = events.filter((e) => e.eventType === 'service_view').length;
    const projectViews = events.filter((e) => e.eventType === 'project_view').length;
    const whatsappClicks = events.filter((e) => e.eventType === 'whatsapp_click').length;
    const totalLeads = filteredLeads.length;
    const conversionRate =
      totalVisits > 0 ? Number(((totalLeads / totalVisits) * 100).toFixed(1)) : 0;

    // Build daily buckets
    const bucketCount = Math.min(safeDays, 30);
    const stepDays = Math.max(1, Math.ceil(safeDays / bucketCount));
    const labels: string[] = [];
    const visitsSeries: number[] = [];
    const leadsSeries: number[] = [];
    const interactionsSeries: number[] = [];

    const now = new Date();
    now.setHours(23, 59, 59, 999);

    for (let i = bucketCount - 1; i >= 0; i--) {
      const end = new Date(now.getTime() - i * stepDays * 86_400_000);
      const start = new Date(end.getTime() - stepDays * 86_400_000);
      const dayLabel = end.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      });
      labels.push(dayLabel);

      let vCount = 0;
      let iCount = 0;
      for (const ev of events) {
        if (ev.createdAt > start && ev.createdAt <= end) {
          if (ev.eventType === 'page_view') vCount++;
          else if (
            ev.eventType === 'service_view' ||
            ev.eventType === 'project_view' ||
            ev.eventType === 'whatsapp_click' ||
            ev.eventType === 'cta_click'
          ) {
            iCount++;
          }
        }
      }

      const lCount = filteredLeads.filter(
        (l) => l.createdAt > start && l.createdAt <= end,
      ).length;

      visitsSeries.push(vCount);
      leadsSeries.push(lCount);
      interactionsSeries.push(iCount);
    }

    // Service demand breakdown
    const serviceDemand = SERVICES_DATA.map((svc) => ({
      label: svc.title,
      views: events.filter(
        (e) => e.eventType === 'service_view' && e.target === svc.title,
      ).length,
      leads: filteredLeads.filter((l) => l.servico === svc.title).length,
    }));

    // Category engagement
    const allCategories: ProjectCategoryValue[] = [
      'Sites',
      'Sistemas',
      'Inteligência Artificial',
      'Automação',
      'Infraestrutura',
    ];
    const categoryEngagement = allCategories.map((cat) => {
      const catProjects = projects.filter((p) => p.category === cat);
      const dbViews = catProjects.reduce((acc, p) => acc + p.viewsCount, 0);
      const periodViews = events.filter(
        (e) => e.eventType === 'project_view' && e.category === cat,
      ).length;
      return {
        category: cat,
        projects: catProjects.length,
        views: Math.max(dbViews, periodViews),
      };
    });

    // Funnel
    const funnel = [
      { stage: 'Visitas ao Site', count: totalVisits },
      { stage: 'Serviços Explorados', count: serviceViews },
      { stage: 'Projetos Visualizados', count: projectViews },
      { stage: 'Cliques WhatsApp', count: whatsappClicks },
      { stage: 'Leads Enviados', count: totalLeads },
    ];

    // Device split
    const deviceCounts: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
    for (const ev of events) {
      if (ev.eventType === 'page_view') {
        const key = ev.device in deviceCounts ? ev.device : 'desktop';
        deviceCounts[key]++;
      }
    }
    const deviceSplit = [
      { device: 'Desktop', count: deviceCounts.desktop },
      { device: 'Mobile', count: deviceCounts.mobile },
      { device: 'Tablet', count: deviceCounts.tablet },
    ];

    // Lead statuses (all leads)
    const statusOrder: LeadStatus[] = [
      'novo',
      'em_analise',
      'proposta',
      'convertido',
      'arquivado',
    ];
    const leadStatusBreakdown = statusOrder.map((st) => ({
      status: st,
      count: leads.filter((l) => l.status === st).length,
    }));

    return {
      kpis: {
        totalVisits,
        totalLeads,
        conversionRate,
        totalProjects: projects.length,
        whatsappClicks,
        serviceViews,
      },
      timeline: {
        labels,
        visits: visitsSeries,
        leads: leadsSeries,
        interactions: interactionsSeries,
      },
      serviceDemand,
      categoryEngagement,
      funnel,
      deviceSplit,
      leadStatusBreakdown,
      recentEvents: events.slice(0, 15).map((e) => ({
        id: e.id,
        eventType: e.eventType,
        target: e.target,
        category: e.category,
        device: e.device,
        createdAt: e.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error('Database query failed in getAnalyticsDashboardData:', error);
    throw new Error('Falha ao gerar métricas do dashboard.', { cause: error });
  }
}
