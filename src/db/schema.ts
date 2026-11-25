import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export interface SectionVisibility {
  about: boolean;
  services: boolean;
  ai: boolean;
  projects: boolean;
  process: boolean;
  differentials: boolean;
}

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name').default('').notNull(),
  role: text('role').default('viewer').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const authorizedAdmins = pgTable('authorized_admins', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  addedBy: text('added_by').default('system').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const siteSettings = pgTable('site_settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  brandName: text('brand_name').notNull(),
  brandTagline: text('brand_tagline').notNull(),
  heroTitle: text('hero_title').notNull(),
  heroSubtitle: text('hero_subtitle').notNull(),
  email: text('email').notNull(),
  phoneDisplay: text('phone_display').notNull(),
  whatsappNumber: text('whatsapp_number').notNull(),
  linkedinUrl: text('linkedin_url').notNull(),
  instagramUrl: text('instagram_url').notNull(),
  location: text('location').notNull(),
  photoUrl: text('photo_url').default('').notNull(),
  accentColor: text('accent_color').default('#0EA5E9').notNull(),
  enableParticles: boolean('enable_particles').default(true).notNull(),
  enable3dVisual: boolean('enable_3d_visual').default(true).notNull(),
  enableScrollReveal: boolean('enable_scroll_reveal').default(true).notNull(),
  showSections: jsonb('show_sections')
    .$type<SectionVisibility>()
    .default({
      about: true,
      services: true,
      ai: true,
      projects: true,
      process: true,
      differentials: true,
    })
    .notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const portfolioProjects = pgTable('portfolio_projects', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  isExample: boolean('is_example').default(false).notNull(),
  image: text('image').default('').notNull(),
  description: text('description').notNull(),
  problemSolved: text('problem_solved').notNull(),
  solutionImplemented: text('solution_implemented').notNull(),
  technologies: jsonb('technologies').$type<string[]>().default([]).notNull(),
  demoUrl: text('demo_url').default('').notNull(),
  viewsCount: integer('views_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const experienceIndicators = pgTable('experience_indicators', {
  id: serial('id').primaryKey(),
  sortOrder: integer('sort_order').default(0).notNull(),
  label: text('label').notNull(),
  value: text('value').notNull(),
  note: text('note').notNull(),
});

export const contactLeads = pgTable('contact_leads', {
  id: serial('id').primaryKey(),
  nome: text('nome').notNull(),
  empresa: text('empresa').default('').notNull(),
  email: text('email').notNull(),
  telefone: text('telefone').default('').notNull(),
  servico: text('servico').notNull(),
  descricao: text('descricao').notNull(),
  status: text('status').default('novo').notNull(),
  notes: text('notes').default('').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const analyticsEvents = pgTable('analytics_events', {
  id: serial('id').primaryKey(),
  eventType: text('event_type').notNull(),
  target: text('target').default('').notNull(),
  category: text('category').default('').notNull(),
  device: text('device').default('desktop').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
