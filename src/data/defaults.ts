import type {
  ExperienceIndicator,
  ProjectCategoryValue,
  ServiceItem,
  SiteConfig,
  TimelineStep,
} from '../types/site.ts';

export const DEFAULT_CONFIG: SiteConfig = {
  brandName: 'ELIZEU ARAÚJO',
  brandTagline: 'SOLUÇÕES DIGITAIS',
  heroTitle: 'Sua empresa no próximo nível da tecnologia.',
  heroSubtitle:
    'Desenvolvo soluções digitais sob medida que conectam engenharia de software, inteligência artificial e governança de dados para transformar desafios operacionais em resultados mensuráveis.',
  email: 'contato@elizeuaraujo.com.br',
  phoneDisplay: '+55 (00) 00000-0000',
  whatsappNumber: '5500000000000',
  linkedinUrl: 'https://www.linkedin.com',
  instagramUrl: 'https://www.instagram.com',
  location: 'Atendimento Empresarial — Brasil',
  photoUrl: '',
  accentColor: '#0EA5E9',
  enableParticles: true,
  enable3dVisual: true,
  enableScrollReveal: true,
  showSections: {
    about: true,
    services: true,
    ai: true,
    projects: true,
    process: true,
    differentials: true,
  },
};

export const SERVICES_DATA: ServiceItem[] = [
  {
    id: 'sites',
    number: '01',
    title: 'Desenvolvimento de Sites',
    shortDesc:
      'Criação de sites institucionais, portais, landing pages e experiências digitais responsivas.',
    fullDesc:
      'Projetos web com arquitetura moderna, alta velocidade de carregamento, SEO técnico e design focado em conversão para posicionar sua empresa com autoridade no ambiente digital.',
    deliverables: [
      'Sites institucionais e portais corporativos',
      'Landing pages de alta conversão',
      'Otimização de desempenho (Core Web Vitals) e SEO',
      'Design responsivo para desktop, tablet e smartphone',
    ],
    techFocus: ['React', 'TypeScript', 'Tailwind CSS', 'SEO Técnico'],
    iconName: 'globe',
  },
  {
    id: 'sistemas',
    number: '02',
    title: 'Desenvolvimento de Sistemas',
    shortDesc:
      'Sistemas personalizados para gestão empresarial, controle de processos, administração e automação de atividades.',
    fullDesc:
      'Aplicações sob medida alinhadas às regras de negócio da sua organização, eliminando planilhas manuais, centralizando informações e aumentando a eficiência operacional.',
    deliverables: [
      'Sistemas web de gestão e controle operacional',
      'Dashboards gerenciais e indicadores em tempo real',
      'Automação de fluxos e rotinas administrativas',
      'Integração entre bancos de dados e APIs corporativas',
    ],
    techFocus: ['TypeScript', 'PostgreSQL', 'APIs REST', 'Cloud'],
    iconName: 'layers',
  },
  {
    id: 'ia',
    number: '03',
    title: 'Inteligência Artificial',
    shortDesc:
      'Implementação de IA, assistentes virtuais, chatbots, integração com modelos de linguagem e automações inteligentes.',
    fullDesc:
      'Aplicação prática de Inteligência Artificial para acelerar decisões, automatizar atendimentos e consultar bases de conhecimento internas com governança e proteção rigorosa das informações.',
    deliverables: [
      'Assistentes virtuais empresariais e chatbots inteligentes',
      'Consulta inteligente a documentos e manuais (RAG)',
      'Automação de triagem, classificação e análise de dados',
      'Políticas de privacidade, controle de acesso e governança',
    ],
    techFocus: ['LLMs', 'RAG Corporativo', 'Automações', 'Governança LGPD'],
    iconName: 'brain',
  },
  {
    id: 'seguranca',
    number: '04',
    title: 'Segurança da Informação',
    shortDesc:
      'Análise de riscos, proteção de sistemas, controle de acessos, boas práticas de segurança e proteção de dados.',
    fullDesc:
      'Mapeamento de vulnerabilidades e implementação de camadas de proteção para resguardar ativos digitais, dados de clientes e continuidade operacional do negócio.',
    deliverables: [
      'Diagnóstico de riscos e revisão de controles de acesso',
      'Adequação técnica a boas práticas de proteção de dados',
      'Estratégias de backup, redundância e continuidade',
      'Hardening de aplicações, servidores e ambientes web',
    ],
    techFocus: ['Controle de Acesso', 'LGPD', 'Hardening', 'Auditoria'],
    iconName: 'shield',
  },
  {
    id: 'infraestrutura',
    number: '05',
    title: 'Infraestrutura e Redes',
    shortDesc:
      'Organização, configuração, análise e otimização de infraestrutura tecnológica e redes corporativas.',
    fullDesc:
      'Estruturação de ambientes de TI estáveis, escaláveis e bem documentados para garantir conectividade confiável, desempenho e suporte ao crescimento da empresa.',
    deliverables: [
      'Análise, organização e segmentação de redes corporativas',
      'Configuração de servidores, nuvem e serviços essenciais',
      'Monitoramento de disponibilidade e gargalos de desempenho',
      'Documentação técnica de ativos e topologia de rede',
    ],
    techFocus: ['Redes Corporativas', 'Cloud & Servidores', 'Monitoramento', 'Topologia'],
    iconName: 'server',
  },
  {
    id: 'presenca',
    number: '06',
    title: 'Presença Digital e Redes Sociais',
    shortDesc:
      'Desenvolvimento da presença digital empresarial, criação de páginas, integração de canais e atendimento.',
    fullDesc:
      'Integração estratégica entre site, canais de atendimento e redes sociais para construir uma comunicação profissional, coerente e orientada à geração de oportunidades.',
    deliverables: [
      'Estruturação e padronização de canais digitais',
      'Integração de formulários, WhatsApp e redes sociais',
      'Páginas de captura e funis digitais de relacionamento',
      'Métricas e rastreamento para acompanhamento de resultados',
    ],
    techFocus: ['Omnichannel', 'Analytics', 'WhatsApp Business', 'UX'],
    iconName: 'share',
  },
];

export interface DefaultProjectSeed {
  slug: string;
  title: string;
  category: ProjectCategoryValue;
  isExample: boolean;
  image: string;
  description: string;
  problemSolved: string;
  solutionImplemented: string;
  technologies: string[];
  demoUrl: string;
  viewsCount: number;
}

export const DEFAULT_PROJECTS_SEED: DefaultProjectSeed[] = [
  {
    slug: 'demo-sistema-gestao',
    title: 'Plataforma de Gestão Operacional & BI',
    category: 'Sistemas',
    isExample: true,
    image: '',
    description:
      'Modelo demonstrativo de sistema web corporativo para centralização de processos, controle de demandas e visualização de indicadores estratégicos.',
    problemSolved:
      'Empresas com controles fragmentados em múltiplas planilhas enfrentam retrabalho, baixa visibilidade gerencial e atrasos na tomada de decisão.',
    solutionImplemented:
      'Arquitetura web modular com painéis em tempo real, controle de permissões por perfil e fluxos automatizados de aprovação.',
    technologies: ['React', 'TypeScript', 'Tailwind CSS', 'PostgreSQL'],
    demoUrl: '#contato',
    viewsCount: 42,
  },
  {
    slug: 'demo-assistente-ia',
    title: 'Assistente Corporativo de IA com Base Documental',
    category: 'Inteligência Artificial',
    isExample: true,
    image: '',
    description:
      'Protótipo demonstrativo de assistente inteligente integrado a documentos internos para respostas rápidas e triagem automatizada.',
    problemSolved:
      'Equipes gastam tempo excessivo buscando procedimentos em manuais extensos ou respondendo dúvidas operacionais repetitivas.',
    solutionImplemented:
      'Pipeline de consulta semântica com isolamento de dados corporativos, trilha de auditoria e integração via API segura.',
    technologies: ['TypeScript', 'LLM APIs', 'RAG', 'Governança & LGPD'],
    demoUrl: '#inteligencia-artificial',
    viewsCount: 58,
  },
  {
    slug: 'demo-infra-seguranca',
    title: 'Arquitetura de Rede Segura & Monitoramento',
    category: 'Infraestrutura',
    isExample: true,
    image: '',
    description:
      'Exemplo demonstrativo de reestruturação de infraestrutura corporativa com segmentação de rede, políticas de acesso e monitoramento contínuo.',
    problemSolved:
      'Ambientes sem padronização de acessos e sem visibilidade de falhas ficam expostos a instabilidades e riscos de segurança.',
    solutionImplemented:
      'Segmentação lógica, padronização de backups, controle de acessos baseado em menor privilégio e painel de disponibilidade.',
    technologies: ['Redes Corporativas', 'Segurança da Informação', 'Cloud', 'Monitoramento'],
    demoUrl: '#contato',
    viewsCount: 29,
  },
  {
    slug: 'demo-automacao-fluxos',
    title: 'Automação de Atendimento & Captação Digital',
    category: 'Automação',
    isExample: true,
    image: '',
    description:
      'Modelo demonstrativo de fluxo automatizado conectando landing page, qualificação inicial de leads e encaminhamento para atendimento.',
    problemSolved:
      'Contatos comerciais sem triagem estruturada geram perda de oportunidades e demora na resposta ao cliente.',
    solutionImplemented:
      'Formulário inteligente com validação, categorização automática da demanda e integração direta com canal de atendimento.',
    technologies: ['React', 'Webhooks', 'Automação', 'Analytics'],
    demoUrl: '#contato',
    viewsCount: 37,
  },
  {
    slug: 'demo-portal-institucional',
    title: 'Portal Institucional de Alta Performance',
    category: 'Sites',
    isExample: true,
    image: '',
    description:
      'Exemplo demonstrativo de site institucional responsivo e otimizado para SEO técnico e conversão de clientes B2B.',
    problemSolved:
      'Presença digital desatualizada transmite pouca credibilidade e dificulta a apresentação clara de serviços e diferenciais.',
    solutionImplemented:
      'Interface moderna com design system próprio, carregamento rápido, acessibilidade e pontos estratégicos de conversão.',
    technologies: ['React', 'TypeScript', 'Tailwind CSS', 'SEO'],
    demoUrl: '#servicos',
    viewsCount: 46,
  },
];

export const DEFAULT_TIMELINE: TimelineStep[] = [
  {
    id: 'tl-1',
    phase: 'Base Técnica',
    title: 'Tecnologia da Informação & Infraestrutura',
    description:
      'Construção de alicerce sólido em suporte, redes corporativas, segurança da informação e sustentação de ambientes empresariais.',
  },
  {
    id: 'tl-2',
    phase: 'Sistemas & Negócios',
    title: 'Análise de Sistemas e Melhoria de Processos',
    description:
      'Atuação próxima às áreas de negócio para mapear gargalos, traduzir demandas em requisitos claros e desenvolver sistemas sob medida.',
  },
  {
    id: 'tl-3',
    phase: 'Inovação & IA',
    title: 'Soluções Digitais Inteligentes',
    description:
      'Integração entre engenharia de software, automação e inteligência artificial com foco em privacidade, governança e resultados reais.',
  },
];

export const DEFAULT_INDICATORS_SEED: Omit<ExperienceIndicator, 'id'>[] = [
  {
    sortOrder: 1,
    label: 'Frentes de Atuação',
    value: '06 Pilares',
    note: 'Web, Sistemas, IA, Segurança, Redes e Presença Digital',
  },
  {
    sortOrder: 2,
    label: 'Abordagem de Projeto',
    value: 'Sob Medida',
    note: 'Soluções desenhadas para a realidade de cada empresa',
  },
  {
    sortOrder: 3,
    label: 'Prioridade Técnica',
    value: 'Segurança',
    note: 'Governança, controle de acessos e proteção de dados',
  },
  {
    sortOrder: 4,
    label: 'Foco de Entrega',
    value: 'Negócios',
    note: 'Tecnologia alinhada a eficiência operacional e resultados',
  },
];

export const AI_CAPABILITIES = [
  {
    title: 'Assistentes virtuais empresariais',
    desc: 'Agentes treinados com o contexto do seu negócio para apoiar equipes internas e clientes.',
    iconKey: 'bot' as const,
  },
  {
    title: 'Atendimento automatizado',
    desc: 'Triagem inteligente, respostas ágeis e encaminhamento contextualizado para o time humano.',
    iconKey: 'message' as const,
  },
  {
    title: 'Análise inteligente de informações',
    desc: 'Extração de padrões, resumos executivos e apoio à decisão a partir de dados operacionais.',
    iconKey: 'activity' as const,
  },
  {
    title: 'Automação de tarefas repetitivas',
    desc: 'Redução de trabalho manual com fluxos que classificam, validam e integram informações.',
    iconKey: 'workflow' as const,
  },
  {
    title: 'Integração de IA aos sistemas existentes',
    desc: 'Conexão segura via APIs com ERPs, CRMs, portais e bancos de dados já utilizados na empresa.',
    iconKey: 'cpu' as const,
  },
  {
    title: 'Consulta inteligente a documentos corporativos',
    desc: 'Busca semântica em políticas, contratos e manuais com citação precisa da origem.',
    iconKey: 'filesearch' as const,
  },
];

export const WORK_STEPS = [
  {
    step: '01',
    title: 'Diagnóstico',
    description:
      'Entender as necessidades, gargalos operacionais e os desafios reais da empresa.',
    iconKey: 'compass' as const,
  },
  {
    step: '02',
    title: 'Planejamento',
    description:
      'Definir a arquitetura, escopo e a melhor solução tecnológica com foco em viabilidade.',
    iconKey: 'pentool' as const,
  },
  {
    step: '03',
    title: 'Desenvolvimento',
    description:
      'Construir, testar e implementar a solução com qualidade, segurança e transparência.',
    iconKey: 'code' as const,
  },
  {
    step: '04',
    title: 'Evolução',
    description:
      'Acompanhar o uso em produção, melhorar fluxos e otimizar continuamente os resultados.',
    iconKey: 'rocket' as const,
  },
];

export const DIFFERENTIALS = [
  {
    title: 'Experiência em Tecnologia da Informação',
    desc: 'Vivência prática em múltiplos ambientes tecnológicos, unindo desenvolvimento, sistemas e infraestrutura.',
    iconKey: 'terminal' as const,
  },
  {
    title: 'Visão técnica e estratégica',
    desc: 'Capacidade de escolher a tecnologia certa para o momento da empresa, evitando complexidade desnecessária.',
    iconKey: 'brain' as const,
  },
  {
    title: 'Conhecimento de processos empresariais',
    desc: 'Leitura clara de rotinas administrativas e operacionais para transformar gargalos em fluxos eficientes.',
    iconKey: 'briefcase' as const,
  },
  {
    title: 'Soluções personalizadas',
    desc: 'Cada projeto é estruturado sob medida para a realidade, cultura e objetivos da organização.',
    iconKey: 'layers' as const,
  },
  {
    title: 'Foco em segurança e qualidade',
    desc: 'Boas práticas de proteção de dados, controle de acesso, código limpo e arquitetura confiável.',
    iconKey: 'shield' as const,
  },
  {
    title: 'Compromisso com resultados',
    desc: 'Tecnologia tratada como meio para gerar eficiência, economia de tempo e crescimento sustentável.',
    iconKey: 'zap' as const,
  },
];
