import type {
  AdminAccessOverview,
  AnalyticsDashboardData,
  AnalyticsEventType,
  AuthSessionProfile,
  ExperienceIndicator,
  LeadItem,
  LeadStatus,
  ProjectCategoryValue,
  ProjectItem,
  PublicBootstrapResponse,
  SiteConfig,
} from '../types/site';

export function detectDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w < 640) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

async function parseJson<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      typeof (data as { error?: string }).error === 'string'
        ? (data as { error: string }).error
        : `Erro na requisição (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

export async function fetchPublicBootstrap(): Promise<PublicBootstrapResponse> {
  const res = await fetch('/api/public/bootstrap');
  return parseJson<PublicBootstrapResponse>(res);
}

export async function submitPublicLead(payload: {
  nome: string;
  empresa: string;
  email: string;
  telefone: string;
  servico: string;
  descricao: string;
}): Promise<LeadItem> {
  const res = await fetch('/api/public/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, device: detectDeviceType() }),
  });
  return parseJson<LeadItem>(res);
}

export function trackPublicEvent(
  eventType: AnalyticsEventType,
  target = '',
  category = '',
): void {
  const body = JSON.stringify({
    eventType,
    target,
    category,
    device: detectDeviceType(),
  });

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' });
    navigator.sendBeacon('/api/public/analytics', blob);
    return;
  }

  fetch('/api/public/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {});
}

// Authenticated Admin API Calls
function authHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchAuthSession(
  token: string,
): Promise<AuthSessionProfile> {
  const res = await fetch('/api/auth/session', {
    headers: authHeaders(token),
  });
  return parseJson<AuthSessionProfile>(res);
}

export async function fetchAdminAccess(
  token: string,
): Promise<AdminAccessOverview> {
  const res = await fetch('/api/admin/access', {
    headers: authHeaders(token),
  });
  return parseJson<AdminAccessOverview>(res);
}

export async function grantAdminAccess(
  token: string,
  email: string,
): Promise<AdminAccessOverview> {
  const res = await fetch('/api/admin/access', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ email }),
  });
  return parseJson<AdminAccessOverview>(res);
}

export async function revokeAdminAccess(
  token: string,
  email: string,
): Promise<AdminAccessOverview> {
  const res = await fetch(`/api/admin/access/${encodeURIComponent(email)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  return parseJson<AdminAccessOverview>(res);
}

export async function fetchAdminAnalytics(
  token: string,
  days = 30,
): Promise<AnalyticsDashboardData> {
  const res = await fetch(`/api/admin/analytics?days=${days}`, {
    headers: authHeaders(token),
  });
  return parseJson<AnalyticsDashboardData>(res);
}

export async function saveAdminSettings(
  token: string,
  settings: Partial<SiteConfig>,
): Promise<SiteConfig> {
  const res = await fetch('/api/admin/settings', {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(settings),
  });
  return parseJson<SiteConfig>(res);
}

export async function saveAdminIndicators(
  token: string,
  indicators: { label: string; value: string; note: string }[],
): Promise<ExperienceIndicator[]> {
  const res = await fetch('/api/admin/indicators', {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ indicators }),
  });
  return parseJson<ExperienceIndicator[]>(res);
}

export async function createAdminProject(
  token: string,
  project: {
    title: string;
    category: ProjectCategoryValue;
    isExample: boolean;
    image: string;
    description: string;
    problemSolved: string;
    solutionImplemented: string;
    technologies: string[];
    demoUrl: string;
  },
): Promise<ProjectItem> {
  const res = await fetch('/api/admin/projects', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(project),
  });
  return parseJson<ProjectItem>(res);
}

export async function updateAdminProject(
  token: string,
  id: number,
  project: Partial<{
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
): Promise<ProjectItem> {
  const res = await fetch(`/api/admin/projects/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(project),
  });
  return parseJson<ProjectItem>(res);
}

export async function deleteAdminProject(token: string, id: number): Promise<void> {
  const res = await fetch(`/api/admin/projects/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  await parseJson(res);
}

export async function resetAdminProjects(token: string): Promise<ProjectItem[]> {
  const res = await fetch('/api/admin/projects/reset', {
    method: 'POST',
    headers: authHeaders(token),
  });
  return parseJson<ProjectItem[]>(res);
}

export async function fetchAdminLeads(token: string): Promise<LeadItem[]> {
  const res = await fetch('/api/admin/leads', {
    headers: authHeaders(token),
  });
  return parseJson<LeadItem[]>(res);
}

export async function patchAdminLead(
  token: string,
  id: number,
  payload: Partial<{ status: LeadStatus; notes: string }>,
): Promise<LeadItem> {
  const res = await fetch(`/api/admin/leads/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return parseJson<LeadItem>(res);
}

export async function deleteAdminLead(token: string, id: number): Promise<void> {
  const res = await fetch(`/api/admin/leads/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  await parseJson(res);
}

/**
 * Client-side image compression using an offscreen Canvas to avoid storing
 * multi-megabyte base64 strings and keep database payloads fast and light.
 */
export function compressImageFile(
  file: File,
  maxWidth = 960,
  quality = 0.82,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler arquivo de imagem.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Arquivo de imagem inválido.'));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/webp', quality);
        resolve(
          compressed.startsWith('data:image/webp')
            ? compressed
            : canvas.toDataURL('image/jpeg', quality),
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
