export type ServiceId =
  | 'sites'
  | 'sistemas'
  | 'ia'
  | 'seguranca'
  | 'infraestrutura'
  | 'presenca';

export type ProjectCategory =
  | 'Todos'
  | 'Sites'
  | 'Sistemas'
  | 'Inteligência Artificial'
  | 'Automação'
  | 'Infraestrutura';

export type ProjectCategoryValue = Exclude<ProjectCategory, 'Todos'>;

export interface ServiceItem {
  id: ServiceId;
  number: string;
  title: string;
  shortDesc: string;
  fullDesc: string;
  deliverables: string[];
  techFocus: string[];
  iconName: 'globe' | 'layers' | 'brain' | 'shield' | 'server' | 'share';
}

export interface ProjectItem {
  id: number;
  slug: string;
  title: string;
  category: ProjectCategoryValue;
  isExample: boolean;
  image: string;
  description: string;
  problemSolved: string;
  solutionImplemented: string;
  technologies: string[];
  demoUrl?: string;
  viewsCount: number;
  createdAt?: string;
}

export interface TimelineStep {
  id: string;
  phase: string;
  title: string;
  description: string;
}

export interface ExperienceIndicator {
  id: number;
  sortOrder: number;
  label: string;
  value: string;
  note: string;
}

export interface SectionVisibility {
  about: boolean;
  services: boolean;
  ai: boolean;
  projects: boolean;
  process: boolean;
  differentials: boolean;
}

export interface SiteConfig {
  brandName: string;
  brandTagline: string;
  heroTitle: string;
  heroSubtitle: string;
  email: string;
  phoneDisplay: string;
  whatsappNumber: string;
  linkedinUrl: string;
  instagramUrl: string;
  location: string;
  photoUrl: string;
  accentColor: string;
  enableParticles: boolean;
  enable3dVisual: boolean;
  enableScrollReveal: boolean;
  showSections: SectionVisibility;
}

export type LeadStatus =
  | 'novo'
  | 'em_analise'
  | 'proposta'
  | 'convertido'
  | 'arquivado';

export interface LeadItem {
  id: number;
  nome: string;
  empresa: string;
  email: string;
  telefone: string;
  servico: string;
  descricao: string;
  status: LeadStatus;
  notes: string;
  createdAt: string;
}

export interface ContactFormPayload {
  nome: string;
  empresa: string;
  email: string;
  telefone: string;
  servico: string;
  descricao: string;
  createdAt: string;
}

export type AnalyticsEventType =
  | 'page_view'
  | 'service_view'
  | 'project_view'
  | 'whatsapp_click'
  | 'lead_submit'
  | 'cta_click';

export interface AnalyticsDashboardData {
  kpis: {
    totalVisits: number;
    totalLeads: number;
    conversionRate: number;
    totalProjects: number;
    whatsappClicks: number;
    serviceViews: number;
  };
  timeline: {
    labels: string[];
    visits: number[];
    leads: number[];
    interactions: number[];
  };
  serviceDemand: {
    label: string;
    views: number;
    leads: number;
  }[];
  categoryEngagement: {
    category: string;
    projects: number;
    views: number;
  }[];
  funnel: {
    stage: string;
    count: number;
  }[];
  deviceSplit: {
    device: string;
    count: number;
  }[];
  leadStatusBreakdown: {
    status: LeadStatus;
    count: number;
  }[];
  recentEvents: {
    id: number;
    eventType: string;
    target: string;
    category: string;
    device: string;
    createdAt: string;
  }[];
}

export interface PublicBootstrapResponse {
  settings: SiteConfig;
  projects: ProjectItem[];
  indicators: ExperienceIndicator[];
}

export type UserRole = 'admin' | 'viewer';

export interface AuthSessionProfile {
  uid: string;
  email: string;
  displayName: string;
  picture: string;
  role: UserRole;
  isAdmin: boolean;
  isPrimaryAdmin: boolean;
}

export interface AuthorizedAdminItem {
  id: number;
  email: string;
  addedBy: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface RegisteredUserItem {
  id: number;
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  isPrimary: boolean;
  createdAt: string;
}

export interface AdminAccessOverview {
  authorizedAdmins: AuthorizedAdminItem[];
  registeredUsers: RegisteredUserItem[];
}

