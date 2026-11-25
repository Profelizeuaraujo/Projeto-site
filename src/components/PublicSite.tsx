import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Bot,
  BrainCircuit,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Code2,
  Compass,
  Copy,
  Cpu,
  ExternalLink,
  FileSearch,
  Instagram,
  Layers,
  Linkedin,
  Mail,
  Menu,
  MessageCircle,
  PenTool,
  Phone,
  Rocket,
  ShieldCheck,
  Terminal,
  User,
  Workflow,
  X,
  Zap,
} from 'lucide-react';
import {
  AI_CAPABILITIES,
  DEFAULT_TIMELINE,
  DIFFERENTIALS,
  SERVICES_DATA,
  WORK_STEPS,
} from '../data/defaults';
import { submitPublicLead, trackPublicEvent } from '../lib/api';
import type {
  ContactFormPayload,
  ExperienceIndicator,
  ProjectCategory,
  ProjectItem,
  ServiceItem,
  SiteConfig,
} from '../types/site';
import { HeroNeural3DVisual } from './HeroNeural3DVisual';
import { NeuralArchitectureVisual } from './NeuralArchitectureVisual';
import { ParticleNetworkBackground } from './ParticleNetworkBackground';
import { ProjectArtwork } from './ProjectArtwork';
import { Reveal } from './Reveal';
import { ServiceCard } from './ServiceCard';

const PROJECT_CATEGORIES: ProjectCategory[] = [
  'Todos',
  'Sites',
  'Sistemas',
  'Inteligência Artificial',
  'Automação',
  'Infraestrutura',
];

function renderCapabilityIcon(iconKey: string, accentColor: string) {
  const props = { className: 'h-4 w-4 shrink-0', style: { color: accentColor } };
  switch (iconKey) {
    case 'bot':
      return <Bot {...props} />;
    case 'message':
      return <MessageCircle {...props} />;
    case 'activity':
      return <Activity {...props} />;
    case 'workflow':
      return <Workflow {...props} />;
    case 'cpu':
      return <Cpu {...props} />;
    case 'filesearch':
      return <FileSearch {...props} />;
    case 'compass':
      return <Compass {...props} />;
    case 'pentool':
      return <PenTool {...props} />;
    case 'code':
      return <Code2 {...props} />;
    case 'rocket':
      return <Rocket {...props} />;
    case 'terminal':
      return <Terminal {...props} />;
    case 'brain':
      return <BrainCircuit {...props} />;
    case 'briefcase':
      return <Briefcase {...props} />;
    case 'layers':
      return <Layers {...props} />;
    case 'shield':
      return <ShieldCheck {...props} />;
    default:
      return <Zap {...props} />;
  }
}

export function PublicSite({
  config,
  projects,
  indicators,
  onOpenDashboard,
}: {
  config: SiteConfig;
  projects: ProjectItem[];
  indicators: ExperienceIndicator[];
  onOpenDashboard: () => void;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredNavId, setHoveredNavId] = useState<string | null>(null);
  const [navIndicator, setNavIndicator] = useState({
    left: 0,
    width: 0,
    visible: false,
  });
  const navContainerRef = useRef<HTMLElement | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>('Todos');
  const [activeService, setActiveService] = useState<ServiceItem | null>(null);
  const [activeProject, setActiveProject] = useState<ProjectItem | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    empresa: '',
    email: '',
    telefone: '',
    servico: SERVICES_DATA[0].title,
    descricao: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedPayload, setSubmittedPayload] = useState<ContactFormPayload | null>(null);
  const [copiedMsg, setCopiedMsg] = useState(false);

  const trackedPageViewRef = useRef(false);

  // Track initial page view once per session mount
  useEffect(() => {
    if (!trackedPageViewRef.current) {
      trackedPageViewRef.current = true;
      trackPublicEvent('page_view', 'home', 'Acesso');
    }
  }, []);

  // Switch header to translucent frosted glass when scrolling down
  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > 24;
      setIsScrolled((prev) => (prev === next ? prev : next));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close modals on Escape key
  useEffect(() => {
    if (!activeService && !activeProject) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveService(null);
        setActiveProject(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeService, activeProject]);

  const accent = config.accentColor || '#0EA5E9';

  const filteredProjects = useMemo(() => {
    if (selectedCategory === 'Todos') return projects;
    return projects.filter((p) => p.category === selectedCategory);
  }, [projects, selectedCategory]);

  const scrollToSection = useCallback((id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleSelectService = useCallback((service: ServiceItem) => {
    setActiveService(service);
    trackPublicEvent('service_view', service.title, 'Serviços');
  }, []);

  const handleSelectProject = useCallback((project: ProjectItem) => {
    setActiveProject(project);
    trackPublicEvent('project_view', project.slug, project.category);
  }, []);

  const handleRequestServiceQuote = useCallback(
    (serviceTitle: string) => {
      setFormData((prev) => ({ ...prev, servico: serviceTitle }));
      setActiveService(null);
      scrollToSection('contato');
      trackPublicEvent('cta_click', serviceTitle, 'Serviços');
    },
    [scrollToSection],
  );

  const buildWhatsAppUrl = useCallback(
    (customText?: string) => {
      const cleanNumber = config.whatsappNumber.replace(/\D/g, '') || '5500000000000';
      const text =
        customText ||
        `Olá ${config.brandName}! Gostaria de conversar sobre soluções digitais para minha empresa.`;
      return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
    },
    [config.whatsappNumber, config.brandName],
  );

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const errors: Record<string, string> = {};
    if (!formData.nome.trim()) errors.nome = 'Informe seu nome.';
    if (!formData.email.trim() || !formData.email.includes('@')) {
      errors.email = 'Informe um e-mail válido.';
    }
    if (!formData.descricao.trim()) {
      errors.descricao = 'Descreva brevemente o seu projeto ou necessidade.';
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const saved = await submitPublicLead(formData);
      setSubmittedPayload({
        nome: saved.nome,
        empresa: saved.empresa,
        email: saved.email,
        telefone: saved.telefone,
        servico: saved.servico,
        descricao: saved.descricao,
        createdAt: saved.createdAt,
      });
      setFormData({
        nome: '',
        empresa: '',
        email: '',
        telefone: '',
        servico: SERVICES_DATA[0].title,
        descricao: '',
      });
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Não foi possível enviar sua solicitação. Tente novamente.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const copyPayloadToClipboard = () => {
    if (!submittedPayload) return;
    const summary = `Solicitação de Contato — ${config.brandName}\nNome: ${submittedPayload.nome}\nEmpresa: ${submittedPayload.empresa || '-'}\nE-mail: ${submittedPayload.email}\nTelefone: ${submittedPayload.telefone || '-'}\nServiço: ${submittedPayload.servico}\nDescrição: ${submittedPayload.descricao}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(summary).then(() => {
        setCopiedMsg(true);
        window.setTimeout(() => setCopiedMsg(false), 2500);
      });
    }
  };

  const navItems = useMemo(() => {
    const items: { id: string; label: string; action?: () => void }[] = [];
    if (config.showSections.about) items.push({ id: 'sobre', label: 'Sobre' });
    if (config.showSections.services) items.push({ id: 'servicos', label: 'Serviços' });
    if (config.showSections.projects) items.push({ id: 'projetos', label: 'Projetos' });
    if (config.showSections.process) items.push({ id: 'como-funciona', label: 'Processo' });
    items.push({ id: 'dashboard', label: 'Painel', action: onOpenDashboard });
    return items;
  }, [config.showSections, onOpenDashboard]);

  const handleNavEnter = useCallback(
    (id: string, el: HTMLButtonElement) => {
      setHoveredNavId(id);
      const navEl = navContainerRef.current;
      if (!navEl) return;
      const navRect = navEl.getBoundingClientRect();
      const btnRect = el.getBoundingClientRect();
      setNavIndicator({
        left: btnRect.left - navRect.left,
        width: btnRect.width,
        visible: true,
      });
    },
    [],
  );

  const handleNavLeave = useCallback(() => {
    setHoveredNavId(null);
    setNavIndicator((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <div
      className="relative min-h-screen overflow-x-clip bg-[#050B14] text-slate-100"
      style={{ '--site-accent': accent } as React.CSSProperties}
    >
      {config.enableParticles && <ParticleNetworkBackground accentColor={accent} />}

      {/* Subtle ambient top illumination */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-44 left-1/2 z-0 h-[440px] w-[720px] -translate-x-1/2 rounded-full opacity-15 blur-[130px]"
        style={{ backgroundColor: accent }}
      />

      {/* TOP BAR CONTRACT: 3 clean zones separated by gap-8 */}
      <header
        className={`sticky top-0 z-50 border-b transition-all duration-300 ${
          isScrolled
            ? 'border-white/15 bg-[#050B14]/40 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.28)]'
            : 'border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
          {/* Zone 1: Brand wordmark + tagline */}
          <button
            type="button"
            onClick={() => scrollToSection('inicio')}
            className="group flex cursor-pointer flex-col items-start text-left whitespace-nowrap shrink-0 transition-transform duration-200 hover:-translate-y-[1px] focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            <span className="font-display text-base font-bold leading-tight tracking-tight text-slate-100 transition-colors duration-200 group-hover:text-white sm:text-lg">
              {config.brandName}
            </span>
            <span
              className="mt-0.5 text-[10px] font-semibold uppercase leading-tight tracking-[0.22em] opacity-90 transition-opacity duration-200 group-hover:opacity-100 sm:text-[11px]"
              style={{ color: accent }}
            >
              {config.brandTagline || 'SOLUÇÕES DIGITAIS'}
            </span>
          </button>

          {/* Zone 2: Concise single-line navigation links with smooth sliding hover spotlight */}
          <nav
            ref={navContainerRef}
            onMouseLeave={handleNavLeave}
            className="relative hidden items-center gap-1 rounded-xl p-1 md:flex"
            aria-label="Navegação principal"
          >
            {/* Sliding hover pill + bottom accent glow */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1 bottom-1 left-0 rounded-lg transition-all duration-200 ease-out"
              style={{
                transform: `translate3d(${navIndicator.left}px, 0, 0)`,
                width: `${navIndicator.width}px`,
                opacity: navIndicator.visible ? 1 : 0,
                backgroundColor: `${accent}24`,
                border: `1px solid ${accent}66`,
                boxShadow: `0 6px 20px -6px ${accent}75`,
              }}
            >
              <span
                className="absolute inset-x-3 bottom-0.5 h-[2px] rounded-full"
                style={{
                  backgroundColor: accent,
                  boxShadow: `0 0 10px ${accent}`,
                }}
              />
            </span>

            {navItems.map((item) => {
              const isHovered = hoveredNavId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={(e) => handleNavEnter(item.id, e.currentTarget)}
                  onFocus={(e) => handleNavEnter(item.id, e.currentTarget)}
                  onBlur={handleNavLeave}
                  onClick={() =>
                    item.action ? item.action() : scrollToSection(item.id)
                  }
                  className="relative z-10 cursor-pointer rounded-lg px-3.5 py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-all duration-200 focus-visible:outline-none"
                  style={{
                    color: isHovered ? '#FFFFFF' : '#CBD5E1',
                    transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single primary CTA + Mobile toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => scrollToSection('contato')}
              className="group inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-[#050B14] whitespace-nowrap shrink-0 transition-all duration-200 hover:-translate-y-[1px] hover:brightness-110"
              style={{ backgroundColor: accent }}
            >
              <span>Contato</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Abrir menu de navegação"
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-[#0B1526] text-slate-100 transition-colors hover:border-white/25 hover:text-white md:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-[#0B1526] px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (item.action) item.action();
                    else scrollToSection(item.id);
                  }}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-200 transition-all duration-200 hover:translate-x-1 hover:bg-white/[0.06] hover:text-white"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10">
        {/* 1. HERO SECTION */}
        <section id="inicio" className="py-16 sm:py-24 lg:py-28">
          <div className="mx-auto grid max-w-7xl items-stretch gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
            <div className="flex flex-col justify-center lg:col-span-7">
              <p
                className="text-sm font-medium tracking-wide"
                style={{ color: accent }}
              >
                {config.brandTagline} · {config.location}
              </p>

              <h1 className="font-display mt-4 max-w-2xl text-[clamp(2.25rem,4vw,3.75rem)] font-bold leading-[1.1] tracking-tight text-balance text-slate-50">
                {config.heroTitle}
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
                {config.heroSubtitle}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    trackPublicEvent('cta_click', 'hero_solucoes', 'Hero');
                    scrollToSection('servicos');
                  }}
                  className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-[#050B14] whitespace-nowrap transition-opacity hover:opacity-90"
                  style={{ backgroundColor: accent }}
                >
                  <span>Conheça minhas soluções</span>
                  <ChevronRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    trackPublicEvent('cta_click', 'hero_contato', 'Hero');
                    scrollToSection('contato');
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#0B1526] px-6 py-3 text-sm font-semibold text-slate-100 whitespace-nowrap transition-colors hover:border-white/30"
                >
                  <MessageCircle className="h-4 w-4" style={{ color: accent }} />
                  <span>Fale comigo</span>
                </button>
              </div>

              {/* Clean unboxed proof strip */}
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-6 text-xs text-slate-400">
                <span>Sistemas Sob Medida</span>
                <span aria-hidden="true">·</span>
                <span>Inteligência Artificial Aplicada</span>
                <span aria-hidden="true">·</span>
                <span>Segurança e Governança LGPD</span>
              </div>
            </div>

            <div className="lg:col-span-5">
              <HeroNeural3DVisual
                accentColor={accent}
                enabled={config.enable3dVisual}
              />
            </div>
          </div>
        </section>

        {/* 2. SOBRE MIM */}
        {config.showSections.about && (
          <section
            id="sobre"
            className="border-t border-white/10 bg-[#08101E] py-20 sm:py-24"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <Reveal enabled={config.enableScrollReveal}>
                <div className="grid items-start gap-12 lg:grid-cols-12">
                  {/* Photo & Indicators */}
                  <div className="lg:col-span-5">
                    <div className="rounded-2xl border border-white/10 bg-[#0B1526] p-5">
                      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-[#050B14] sm:h-32 sm:w-32">
                          {config.photoUrl ? (
                            <img
                              src={config.photoUrl}
                              alt={`Fotografia profissional de ${config.brandName}`}
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover object-top"
                            />
                          ) : (
                            <User className="h-10 w-10" style={{ color: accent }} />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            className="text-xs font-semibold uppercase tracking-wider"
                            style={{ color: accent }}
                          >
                            Consultor de Tecnologia
                          </p>
                          <p className="font-display mt-1 text-lg font-bold text-slate-100">
                            {config.brandName}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {config.location}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Experience Indicators */}
                    <div className="mt-5 grid grid-cols-2 gap-3.5">
                      {indicators.map((ind) => (
                        <div
                          key={ind.id}
                          className="rounded-xl border border-white/10 bg-[#0B1526] p-4"
                        >
                          <p
                            className="font-display text-lg font-bold tabular-nums"
                            style={{ color: accent }}
                          >
                            {ind.value}
                          </p>
                          <p className="mt-0.5 text-xs font-semibold text-slate-100">
                            {ind.label}
                          </p>
                          <p className="mt-1 text-xs leading-snug text-slate-400">
                            {ind.note}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bio & Trajectory */}
                  <div className="lg:col-span-7">
                    <p
                      className="text-xs font-semibold tracking-wide"
                      style={{ color: accent }}
                    >
                      Sobre Mim
                    </p>
                    <h2 className="font-display mt-3 text-3xl font-bold leading-tight text-balance text-slate-50 sm:text-4xl">
                      Experiência em tecnologia. Visão de negócios. Soluções que transformam.
                    </h2>

                    <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-300">
                      <p>
                        Sou Elizeu Araújo, profissional de Tecnologia da Informação com
                        experiência em desenvolvimento de soluções tecnológicas, análise de
                        sistemas, análise de negócios e melhoria de processos empresariais.
                      </p>
                      <p>
                        Minha trajetória profissional me proporcionou uma visão ampla sobre
                        os desafios enfrentados pelas organizações e sobre como a tecnologia
                        pode ser utilizada para resolver problemas, automatizar atividades e
                        melhorar resultados.
                      </p>
                      <p>
                        Atuo desenvolvendo soluções personalizadas, sempre aproximando as
                        necessidades reais das empresas das possibilidades oferecidas pela
                        engenharia de software e pela inteligência artificial.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Full-width symmetrical 3-column Trajectory for crisp alignment on laptops & desktops */}
                <div className="mt-14 border-t border-white/10 pt-10">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: accent }}
                      >
                        Evolução Contínua
                      </p>
                      <h3 className="font-display mt-1 text-xl font-bold text-slate-50">
                        Trajetória e Evolução Profissional
                      </h3>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-5 md:grid-cols-3">
                    {DEFAULT_TIMELINE.map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex h-full flex-col rounded-xl border border-white/10 bg-[#0B1526] p-5"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#050B14] font-mono text-xs font-semibold tabular-nums"
                            style={{ color: accent }}
                          >
                            0{idx + 1}
                          </span>
                          <span
                            className="font-mono text-xs font-medium tracking-wide"
                            style={{ color: accent }}
                          >
                            {item.phase}
                          </span>
                        </div>

                        <h4 className="font-display mt-4 text-base font-semibold leading-snug text-slate-100">
                          {item.title}
                        </h4>
                        <p className="mt-2 text-sm leading-relaxed text-slate-400">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          </section>
        )}

        {/* 3. SERVIÇOS */}
        {config.showSections.services && (
          <section id="servicos" className="border-t border-white/10 py-20 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <Reveal enabled={config.enableScrollReveal}>
                <div className="max-w-3xl">
                  <p
                    className="text-xs font-semibold tracking-wide"
                    style={{ color: accent }}
                  >
                    Serviços Especializados
                  </p>
                  <h2 className="font-display mt-3 text-3xl font-bold text-balance text-slate-50 sm:text-4xl">
                    Soluções digitais completas para impulsionar sua empresa.
                  </h2>
                  <p className="mt-3 text-base text-slate-400">
                    Selecione qualquer área abaixo para explorar os entregáveis técnicos e
                    solicitar um diagnóstico personalizado.
                  </p>
                </div>
              </Reveal>

              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {SERVICES_DATA.map((service, index) => (
                  <Reveal
                    key={service.id}
                    delay={index * 50}
                    enabled={config.enableScrollReveal}
                  >
                    <ServiceCard
                      service={service}
                      accentColor={accent}
                      onSelect={handleSelectService}
                    />
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 4. INTELIGÊNCIA ARTIFICIAL */}
        {config.showSections.ai && (
          <section
            id="inteligencia-artificial"
            className="border-t border-white/10 bg-[#08101E] py-20 sm:py-24"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <Reveal enabled={config.enableScrollReveal}>
                <div className="grid items-center gap-12 lg:grid-cols-12">
                  <div className="lg:col-span-7">
                    <p
                      className="text-xs font-semibold tracking-wide"
                      style={{ color: accent }}
                    >
                      Inteligência Artificial Aplicada
                    </p>
                    <h2 className="font-display mt-3 text-3xl font-bold text-balance text-slate-50 sm:text-4xl">
                      A inteligência artificial trabalhando a favor do seu negócio.
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-slate-300">
                      Implementação responsável e estratégica de IA aplicada a processos
                      reais, considerando sempre{' '}
                      <strong className="font-semibold text-slate-100">
                        privacidade, segurança, governança e proteção de dados
                      </strong>
                      .
                    </p>

                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                      {AI_CAPABILITIES.map((cap) => (
                        <div
                          key={cap.title}
                          className="rounded-xl border border-white/10 bg-[#0B1526] p-4"
                        >
                          <div className="flex items-center gap-2.5">
                            {renderCapabilityIcon(cap.iconKey, accent)}
                            <h3 className="text-sm font-semibold text-slate-100">
                              {cap.title}
                            </h3>
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-slate-400">
                            {cap.desc}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8">
                      <button
                        type="button"
                        onClick={() =>
                          handleRequestServiceQuote('Inteligência Artificial')
                        }
                        className="inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-[#050B14] whitespace-nowrap transition-opacity hover:opacity-90"
                        style={{ backgroundColor: accent }}
                      >
                        <span>Planejar solução com IA</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-5">
                    <NeuralArchitectureVisual accentColor={accent} />
                  </div>
                </div>
              </Reveal>
            </div>
          </section>
        )}

        {/* 5. PORTFÓLIO DE PROJETOS */}
        {config.showSections.projects && (
          <section id="projetos" className="border-t border-white/10 py-20 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <Reveal enabled={config.enableScrollReveal}>
                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                  <div>
                    <p
                      className="text-xs font-semibold tracking-wide"
                      style={{ color: accent }}
                    >
                      Portfólio de Projetos
                    </p>
                    <h2 className="font-display mt-3 text-3xl font-bold text-balance text-slate-50 sm:text-4xl">
                      Tecnologia aplicada a desafios reais.
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm text-slate-400">
                      Explore arquiteturas implementadas e modelos demonstrativos. Novos
                      projetos podem ser publicados e acompanhados pelo Painel de Controle.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onOpenDashboard}
                    className="inline-flex items-center gap-2 self-start rounded-lg border border-white/15 bg-[#0B1526] px-4 py-2.5 text-xs font-semibold text-slate-200 whitespace-nowrap transition-colors hover:border-white/30 hover:text-white"
                  >
                    <span>Gerenciar Portfólio</span>
                    <ArrowRight className="h-3.5 w-3.5" style={{ color: accent }} />
                  </button>
                </div>

                {/* Interactive Segmented Category Filter */}
                <div
                  className="mt-8 inline-flex flex-wrap items-center gap-1 rounded-lg border border-white/10 bg-[#0B1526] p-1"
                  role="tablist"
                  aria-label="Filtrar projetos por categoria"
                >
                  {PROJECT_CATEGORIES.map((cat) => {
                    const active = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setSelectedCategory(cat)}
                        className={`rounded-md px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                          active
                            ? 'bg-white/10 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </Reveal>

              {filteredProjects.length === 0 ? (
                <div className="mt-10 rounded-xl border border-white/10 bg-[#0B1526] p-10 text-center">
                  <p className="text-sm text-slate-300">
                    Nenhum projeto cadastrado na categoria{' '}
                    <strong>{selectedCategory}</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('Todos')}
                    className="mt-4 text-xs font-semibold underline underline-offset-4"
                    style={{ color: accent }}
                  >
                    Ver todas as categorias
                  </button>
                </div>
              ) : (
                <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredProjects.map((project, idx) => (
                    <Reveal
                      key={project.id}
                      delay={idx * 45}
                      enabled={config.enableScrollReveal}
                    >
                      <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0B1526] transition-colors duration-200 hover:border-white/25">
                        <ProjectArtwork
                          image={project.image}
                          title={project.title}
                          category={project.category}
                          accentColor={accent}
                          className="h-44 w-full"
                        />

                        <div className="flex flex-1 flex-col justify-between p-5">
                          <div>
                            {/* Clean unboxed metadata (Zero-Pill Discipline) */}
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                              <span className="font-medium" style={{ color: accent }}>
                                {project.category}
                              </span>
                              {project.isExample && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-amber-300/90">
                                    Exemplo demonstrativo
                                  </span>
                                </>
                              )}
                            </div>

                            <h3 className="font-display mt-2 text-lg font-bold text-slate-100">
                              {project.title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-slate-400">
                              {project.description}
                            </p>

                            <div className="mt-4 space-y-2 border-t border-white/10 pt-3.5 text-xs">
                              <p className="text-slate-400">
                                <span className="font-semibold text-slate-200">
                                  Desafio:{' '}
                                </span>
                                {project.problemSolved}
                              </p>
                              <p className="text-slate-400">
                                <span className="font-semibold text-slate-200">
                                  Solução:{' '}
                                </span>
                                {project.solutionImplemented}
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 border-t border-white/10 pt-3.5">
                            <p className="font-mono text-[11px] text-slate-400">
                              {project.technologies.join(' · ')}
                            </p>

                            <div className="mt-3.5 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => handleSelectProject(project)}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap hover:text-white transition-colors"
                                style={{ color: accent }}
                              >
                                <span>Ver detalhes</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>

                              {project.demoUrl &&
                                (project.demoUrl.startsWith('#') ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      scrollToSection(project.demoUrl!.slice(1))
                                    }
                                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 whitespace-nowrap hover:text-slate-100"
                                  >
                                    <span>Explorar</span>
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </button>
                                ) : (
                                  <a
                                    href={project.demoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 whitespace-nowrap hover:text-slate-100"
                                  >
                                    <span>Demonstração</span>
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                ))}
                            </div>
                          </div>
                        </div>
                      </article>
                    </Reveal>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 6. COMO FUNCIONA MEU TRABALHO */}
        {config.showSections.process && (
          <section
            id="como-funciona"
            className="border-t border-white/10 bg-[#08101E] py-20 sm:py-24"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <Reveal enabled={config.enableScrollReveal}>
                <div className="max-w-2xl">
                  <p
                    className="text-xs font-semibold tracking-wide"
                    style={{ color: accent }}
                  >
                    Metodologia de Entrega
                  </p>
                  <h2 className="font-display mt-3 text-3xl font-bold text-slate-50 sm:text-4xl">
                    Como funciona meu trabalho
                  </h2>
                </div>

                <div className="relative mt-12">
                  <div
                    aria-hidden="true"
                    className="animate-flow-line absolute left-8 right-8 top-9 hidden h-px lg:block"
                  />

                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {WORK_STEPS.map((item) => (
                      <div
                        key={item.step}
                        className="relative flex flex-col items-start rounded-xl border border-white/10 bg-[#0B1526] p-6"
                      >
                        <div className="flex w-full items-center justify-between">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#050B14]">
                            {renderCapabilityIcon(item.iconKey, accent)}
                          </div>
                          <span className="font-mono text-xs font-semibold tabular-nums text-slate-500">
                            {item.step}
                          </span>
                        </div>
                        <h3 className="font-display mt-5 text-base font-bold text-slate-100">
                          {item.step}. {item.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-400">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          </section>
        )}

        {/* 7. DIFERENCIAIS */}
        {config.showSections.differentials && (
          <section id="diferenciais" className="border-t border-white/10 py-20 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <Reveal enabled={config.enableScrollReveal}>
                <div className="max-w-3xl">
                  <p
                    className="text-xs font-semibold tracking-wide"
                    style={{ color: accent }}
                  >
                    Diferenciais
                  </p>
                  <h2 className="font-display mt-3 text-3xl font-bold text-slate-50 sm:text-4xl">
                    Mais do que tecnologia. Soluções para negócios.
                  </h2>
                </div>

                <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {DIFFERENTIALS.map((diff) => (
                    <div
                      key={diff.title}
                      className="rounded-xl border border-white/10 bg-[#0B1526] p-6"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#050B14]">
                        {renderCapabilityIcon(diff.iconKey, accent)}
                      </div>
                      <h3 className="mt-4 text-base font-semibold text-slate-100">
                        {diff.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-400">
                        {diff.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </section>
        )}

        {/* 8. CONTATO */}
        <section
          id="contato"
          className="border-t border-white/10 bg-[#08101E] py-20 sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal enabled={config.enableScrollReveal}>
              <div className="grid gap-12 lg:grid-cols-12">
                <div className="lg:col-span-5">
                  <p
                    className="text-xs font-semibold tracking-wide"
                    style={{ color: accent }}
                  >
                    Contato
                  </p>
                  <h2 className="font-display mt-3 text-3xl font-bold text-balance text-slate-50 sm:text-4xl">
                    Vamos transformar sua ideia em realidade?
                  </h2>
                  <p className="mt-4 text-base leading-relaxed text-slate-300">
                    Tem um projeto em mente ou precisa modernizar a tecnologia da sua
                    empresa? Envie seu briefing ou inicie uma conversa direta.
                  </p>

                  <div className="mt-8 space-y-4">
                    <a
                      href={buildWhatsAppUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        trackPublicEvent('whatsapp_click', 'contato_direto', 'Conversão')
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-[#050B14] transition-opacity hover:opacity-90"
                      style={{ backgroundColor: accent }}
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Conversar via WhatsApp</span>
                    </a>

                    <div className="space-y-3 rounded-xl border border-white/10 bg-[#0B1526] p-5 text-sm">
                      <div className="flex items-center gap-3 text-slate-300">
                        <Mail className="h-4 w-4 shrink-0" style={{ color: accent }} />
                        <span className="truncate">{config.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-300">
                        <Phone className="h-4 w-4 shrink-0" style={{ color: accent }} />
                        <span className="tabular-nums">{config.phoneDisplay}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7">
                  <div className="rounded-2xl border border-white/10 bg-[#0B1526] p-6 sm:p-8">
                    {submittedPayload ? (
                      <div className="space-y-5">
                        <div className="flex items-start gap-3">
                          <CheckCircle2
                            className="mt-0.5 h-6 w-6 shrink-0"
                            style={{ color: accent }}
                          />
                          <div>
                            <h3 className="font-display text-xl font-bold text-slate-50">
                              Solicitação registrada com sucesso
                            </h3>
                            <p className="mt-1 text-sm text-slate-300">
                              Seu briefing foi salvo e está disponível no painel de
                              atendimento. Se preferir, envie o resumo agora pelo WhatsApp
                              ou copie os dados abaixo.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1.5 rounded-xl border border-white/10 bg-[#050B14] p-4 text-xs text-slate-300">
                          <p>
                            <strong className="text-slate-100">Nome:</strong>{' '}
                            {submittedPayload.nome}
                          </p>
                          <p>
                            <strong className="text-slate-100">Empresa:</strong>{' '}
                            {submittedPayload.empresa || 'Não informada'}
                          </p>
                          <p>
                            <strong className="text-slate-100">E-mail:</strong>{' '}
                            {submittedPayload.email}
                          </p>
                          <p>
                            <strong className="text-slate-100">Serviço:</strong>{' '}
                            {submittedPayload.servico}
                          </p>
                          <p>
                            <strong className="text-slate-100">Descrição:</strong>{' '}
                            {submittedPayload.descricao}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <a
                            href={buildWhatsAppUrl(
                              `Olá ${config.brandName}! Meu nome é ${submittedPayload.nome}${
                                submittedPayload.empresa
                                  ? ` (${submittedPayload.empresa})`
                                  : ''
                              }. Tenho interesse em: ${submittedPayload.servico}.\n\nProjeto: ${
                                submittedPayload.descricao
                              }\nE-mail: ${submittedPayload.email}`,
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() =>
                              trackPublicEvent(
                                'whatsapp_click',
                                'briefing_whatsapp',
                                'Conversão',
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold text-[#050B14]"
                            style={{ backgroundColor: accent }}
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span>Enviar resumo no WhatsApp</span>
                          </a>

                          <button
                            type="button"
                            onClick={copyPayloadToClipboard}
                            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#050B14] px-4 py-2.5 text-xs font-semibold text-slate-100 hover:border-white/30"
                          >
                            <Copy className="h-4 w-4" style={{ color: accent }} />
                            <span>{copiedMsg ? 'Copiado!' : 'Copiar resumo'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSubmittedPayload(null)}
                            className="text-xs font-medium text-slate-400 hover:text-slate-100"
                          >
                            Nova solicitação
                          </button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleContactSubmit} noValidate className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label
                              htmlFor="nome"
                              className="mb-1.5 block text-xs font-medium text-slate-300"
                            >
                              Nome *
                            </label>
                            <input
                              id="nome"
                              type="text"
                              value={formData.nome}
                              onChange={(e) =>
                                setFormData((p) => ({ ...p, nome: e.target.value }))
                              }
                              placeholder="Seu nome completo"
                              className="w-full rounded-lg border border-white/15 bg-[#050B14] px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-400 focus:outline-none"
                            />
                            {formErrors.nome && (
                              <p className="mt-1 text-xs text-rose-400">{formErrors.nome}</p>
                            )}
                          </div>

                          <div>
                            <label
                              htmlFor="empresa"
                              className="mb-1.5 block text-xs font-medium text-slate-300"
                            >
                              Empresa
                            </label>
                            <input
                              id="empresa"
                              type="text"
                              value={formData.empresa}
                              onChange={(e) =>
                                setFormData((p) => ({ ...p, empresa: e.target.value }))
                              }
                              placeholder="Nome da sua empresa"
                              className="w-full rounded-lg border border-white/15 bg-[#050B14] px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-400 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label
                              htmlFor="email"
                              className="mb-1.5 block text-xs font-medium text-slate-300"
                            >
                              E-mail *
                            </label>
                            <input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) =>
                                setFormData((p) => ({ ...p, email: e.target.value }))
                              }
                              placeholder="voce@empresa.com.br"
                              className="w-full rounded-lg border border-white/15 bg-[#050B14] px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-400 focus:outline-none"
                            />
                            {formErrors.email && (
                              <p className="mt-1 text-xs text-rose-400">{formErrors.email}</p>
                            )}
                          </div>

                          <div>
                            <label
                              htmlFor="telefone"
                              className="mb-1.5 block text-xs font-medium text-slate-300"
                            >
                              Telefone / WhatsApp
                            </label>
                            <input
                              id="telefone"
                              type="tel"
                              value={formData.telefone}
                              onChange={(e) =>
                                setFormData((p) => ({ ...p, telefone: e.target.value }))
                              }
                              placeholder="(00) 00000-0000"
                              className="w-full rounded-lg border border-white/15 bg-[#050B14] px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-400 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="servico"
                            className="mb-1.5 block text-xs font-medium text-slate-300"
                          >
                            Serviço desejado
                          </label>
                          <select
                            id="servico"
                            value={formData.servico}
                            onChange={(e) =>
                              setFormData((p) => ({ ...p, servico: e.target.value }))
                            }
                            className="w-full rounded-lg border border-white/15 bg-[#050B14] px-3.5 py-2.5 text-sm text-slate-100 focus:border-sky-400 focus:outline-none"
                          >
                            {SERVICES_DATA.map((s) => (
                              <option key={s.id} value={s.title}>
                                {s.number} — {s.title}
                              </option>
                            ))}
                            <option value="Consultoria Tecnológica Personalizada">
                              Consultoria Tecnológica Personalizada
                            </option>
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="descricao"
                            className="mb-1.5 block text-xs font-medium text-slate-300"
                          >
                            Descrição do projeto *
                          </label>
                          <textarea
                            id="descricao"
                            rows={4}
                            value={formData.descricao}
                            onChange={(e) =>
                              setFormData((p) => ({ ...p, descricao: e.target.value }))
                            }
                            placeholder="Conte brevemente sobre o desafio da sua empresa e o que você deseja construir ou melhorar..."
                            className="w-full rounded-lg border border-white/15 bg-[#050B14] px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-400 focus:outline-none"
                          />
                          {formErrors.descricao && (
                            <p className="mt-1 text-xs text-rose-400">
                              {formErrors.descricao}
                            </p>
                          )}
                        </div>

                        {submitError && (
                          <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs text-rose-300">
                            {submitError}
                          </p>
                        )}

                        <button
                          type="submit"
                          disabled={submitting}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-[#050B14] transition-opacity hover:opacity-90 disabled:opacity-60"
                          style={{ backgroundColor: accent }}
                        >
                          <span>
                            {submitting ? 'Enviando solicitação...' : 'Enviar Solicitação'}
                          </span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* QUIET FOOTER */}
      <footer className="relative z-10 border-t border-white/10 bg-[#050B14] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div>
              <p className="font-display text-base font-bold text-slate-100">
                {config.brandName}{' '}
                <span className="font-normal text-slate-500">·</span>{' '}
                <span style={{ color: accent }}>{config.brandTagline}</span>
              </p>
              <p className="mt-1.5 text-sm text-slate-400">
                Tecnologia inteligente. Soluções reais. Resultados para seu negócio.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
              {navItems.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() =>
                    link.action ? link.action() : scrollToSection(link.id)
                  }
                  className="transition-colors hover:text-white"
                >
                  {link.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2.5">
              <a
                href={config.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#0B1526] text-slate-300 transition-colors hover:border-white/30 hover:text-white"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href={config.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#0B1526] text-slate-300 transition-colors hover:border-white/30 hover:text-white"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href={buildWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                onClick={() =>
                  trackPublicEvent('whatsapp_click', 'footer_whatsapp', 'Conversão')
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#0B1526] text-slate-300 transition-colors hover:border-white/30 hover:text-white"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="mt-8 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row">
            <p>
              © {new Date().getFullYear()} {config.brandName}. Todos os direitos
              reservados.
            </p>
            <button
              type="button"
              onClick={onOpenDashboard}
              className="text-left text-slate-400 underline-offset-4 hover:text-slate-200 hover:underline sm:text-right"
            >
              Acessar Painel Administrativo
            </button>
          </div>
        </div>
      </footer>

      {/* MODAL: SERVICE DETAILS */}
      {activeService && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveService(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/15 bg-[#0B1526] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveService(null)}
              aria-label="Fechar detalhes do serviço"
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <p className="font-mono text-xs tabular-nums" style={{ color: accent }}>
              Serviço {activeService.number}
            </p>
            <h3 className="font-display mt-1 text-2xl font-bold text-slate-50">
              {activeService.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              {activeService.fullDesc}
            </p>

            <div className="mt-5 border-t border-white/10 pt-5">
              <h4 className="text-xs font-semibold text-slate-200">
                O que pode ser implementado
              </h4>
              <ul className="mt-3 space-y-2">
                {activeService.deliverables.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-slate-300"
                  >
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0"
                      style={{ color: accent }}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-5 font-mono text-xs text-slate-400">
              Stack: {activeService.techFocus.join(' · ')}
            </p>

            <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setActiveService(null)}
                className="rounded-lg border border-white/15 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => handleRequestServiceQuote(activeService.title)}
                className="inline-flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-semibold text-[#050B14]"
                style={{ backgroundColor: accent }}
              >
                <span>Solicitar proposta</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PROJECT DETAILS */}
      {activeProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveProject(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/15 bg-[#0B1526] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveProject(null)}
              aria-label="Fechar detalhes do projeto"
              className="absolute right-4 top-4 z-10 rounded-lg bg-[#050B14]/85 p-1.5 text-slate-300 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <ProjectArtwork
              image={activeProject.image}
              title={activeProject.title}
              category={activeProject.category}
              accentColor={accent}
              className="h-56 w-full rounded-xl"
            />

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="font-medium" style={{ color: accent }}>
                {activeProject.category}
              </span>
              {activeProject.isExample && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-300/90">Exemplo demonstrativo</span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {activeProject.viewsCount} visualizações
              </span>
            </div>

            <h3 className="font-display mt-2 text-2xl font-bold text-slate-50">
              {activeProject.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {activeProject.description}
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-[#050B14] p-4">
                <p className="text-xs font-semibold" style={{ color: accent }}>
                  Problema Resolvido
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                  {activeProject.problemSolved}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#050B14] p-4">
                <p className="text-xs font-semibold text-slate-100">
                  Solução Implementada
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                  {activeProject.solutionImplemented}
                </p>
              </div>
            </div>

            <p className="mt-4 font-mono text-xs text-slate-400">
              Tecnologias: {activeProject.technologies.join(' · ')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
