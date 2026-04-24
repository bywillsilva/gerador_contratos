'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  ArrowRight,
  Building2,
  CheckCircle2,
  ExternalLink,
  FileEdit,
  FilePlus,
  Files,
  FolderOpen,
  LayoutTemplate,
  Lock,
  ShoppingCart,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { deleteTemplate, getTemplates } from '@/lib/contract-utils';
import { useNavigation, type Screen } from '@/lib/navigation-context';
import { DEFAULT_DOCUMENT_FONT, DEFAULT_TEMPLATE } from '@/lib/types';
import type { ContractTemplate } from '@/lib/types';

type ServiceState = 'active' | 'external' | 'planned';

interface ServiceAction {
  key: string;
  title: string;
  description: string;
  eyebrow: string;
  tags: string[];
  state: ServiceState;
  icon: typeof Sparkles;
  buttonLabel: string;
  screen?: Screen;
  href?: string;
}

interface ServiceCategory {
  key: string;
  title: string;
  description: string;
  services: ServiceAction[];
}

const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    key: 'contracts',
    title: 'Documentos e contratos',
    description: 'Criação, padronização e finalização de documentos comerciais.',
    services: [
      {
        key: 'new',
        title: 'Gerador de Contratos',
        description: 'Crie contratos completos com dados do cliente, condições de pagamento, revisão e PDF final.',
        eyebrow: 'Módulo ativo',
        tags: ['Contratos', 'PDF', 'Interno'],
        state: 'active',
        icon: FilePlus,
        buttonLabel: 'Abrir módulo',
        screen: 'form',
      },
      {
        key: 'edit',
        title: 'Editor de Templates',
        description: 'Padronize cláusulas, tags, fonte, cabeçalho, logo e estrutura visual dos modelos.',
        eyebrow: 'Configuração',
        tags: ['Modelos', 'Identidade'],
        state: 'active',
        icon: FileEdit,
        buttonLabel: 'Editar modelos',
        screen: 'editor',
      },
      {
        key: 'library',
        title: 'Biblioteca de Templates',
        description: 'Acesse modelos salvos e reaproveite estruturas prontas em novos contratos.',
        eyebrow: 'Biblioteca local',
        tags: ['Reuso', 'Padrões'],
        state: 'active',
        icon: FolderOpen,
        buttonLabel: 'Ver biblioteca',
        screen: 'dashboard',
      },
      {
        key: 'pdf-merge',
        title: 'Juntar PDFs',
        description: 'Una contratos, anexos e comprovantes em um único arquivo, na ordem escolhida.',
        eyebrow: 'Ferramenta PDF',
        tags: ['PDF', 'Anexos'],
        state: 'active',
        icon: Files,
        buttonLabel: 'Juntar arquivos',
        screen: 'pdf-merge',
      },
      {
        key: 'pdf-compress',
        title: 'Compactar PDF',
        description: 'Reduza arquivos pesados para envio e arquivamento preservando a legibilidade.',
        eyebrow: 'Ferramenta PDF',
        tags: ['PDF', 'Envio'],
        state: 'active',
        icon: Archive,
        buttonLabel: 'Compactar PDF',
        screen: 'pdf-compress',
      },
    ],
  },
  {
    key: 'commercial',
    title: 'Comercial e relacionamento',
    description: 'Sistemas conectados ao atendimento, clientes e continuidade comercial.',
    services: [
      {
        key: 'crm',
        title: 'CRM Comercial',
        description: 'Abra o ambiente comercial externo para acompanhar clientes, propostas e relacionamento.',
        eyebrow: 'Sistema externo',
        tags: ['CRM', 'Comercial'],
        state: 'external',
        icon: Building2,
        buttonLabel: 'Acessar CRM',
        href: 'https://crm-artglass.onrender.com/',
      },
      {
        key: 'pipeline',
        title: 'Operação de Propostas',
        description: 'Área reservada para aprovações, transição comercial e evolução do fechamento.',
        eyebrow: 'Planejado',
        tags: ['Propostas', 'Futuro'],
        state: 'planned',
        icon: LayoutTemplate,
        buttonLabel: 'Em breve',
      },
    ],
  },
  {
    key: 'operations',
    title: 'Operação interna',
    description: 'Base para módulos administrativos de apoio, compras e processos internos.',
    services: [
      {
        key: 'purchasing',
        title: 'Setor de Compras',
        description: 'Estrutura futura para fornecedores, cotações, solicitações e aprovações internas.',
        eyebrow: 'Planejado',
        tags: ['Compras', 'Fornecedores'],
        state: 'planned',
        icon: ShoppingCart,
        buttonLabel: 'Em breve',
      },
      {
        key: 'ops-center',
        title: 'Centro de Serviços',
        description: 'Ponto de entrada para novas rotinas administrativas distribuídas entre equipes.',
        eyebrow: 'Planejado',
        tags: ['Operação', 'Serviços'],
        state: 'planned',
        icon: Sparkles,
        buttonLabel: 'Em breve',
      },
    ],
  },
];

export function Dashboard() {
  const {
    navigate,
    resetToDefault,
    setSelectedTemplate,
    setTemplateContent,
    setTemplateFontFamily,
    setTemplateLogoDataUrl,
    setTemplateLogoPosition,
    setTemplateLogoWidthMm,
  } = useNavigation();
  const [savedTemplates, setSavedTemplates] = useState<ContractTemplate[]>([]);

  useEffect(() => {
    setSavedTemplates(getTemplates());
  }, []);

  const allServices = useMemo(() => SERVICE_CATEGORIES.flatMap((category) => category.services), []);
  const activeServices = allServices.filter((service) => service.state === 'active' || service.state === 'external');
  const plannedCount = allServices.filter((service) => service.state === 'planned').length;

  const handleEditTemplate = () => {
    setTemplateContent(DEFAULT_TEMPLATE);
    setTemplateFontFamily(DEFAULT_DOCUMENT_FONT);
    setTemplateLogoDataUrl('');
    setTemplateLogoWidthMm(36);
    setTemplateLogoPosition('center');
    setSelectedTemplate(null);
    navigate('editor');
  };

  const handleLoadTemplate = (template: ContractTemplate) => {
    setTemplateContent(template.content);
    setTemplateFontFamily(template.fontFamily || DEFAULT_DOCUMENT_FONT);
    setTemplateLogoDataUrl(template.logoDataUrl || '');
    setTemplateLogoWidthMm(template.logoWidthMm || 36);
    setTemplateLogoPosition(template.logoPosition || 'center');
    setSelectedTemplate(template);
    navigate('editor');
  };

  const handleDeleteTemplate = (id: string) => {
    deleteTemplate(id);
    setSavedTemplates(getTemplates());
  };

  const handleAction = (service: ServiceAction) => {
    if (service.href) {
      window.open(service.href, '_blank', 'noopener,noreferrer');
      return;
    }

    if (service.key === 'new') {
      resetToDefault();
      navigate('form');
      return;
    }

    if (service.key === 'edit') {
      handleEditTemplate();
      return;
    }

    if (service.key === 'library') {
      document.getElementById('hub-models')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (service.screen) {
      navigate(service.screen);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:py-12">
      <section className="border-b border-white/10 pb-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Hub de serviços descentralizados
            </p>
            <h2 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.04] text-foreground sm:text-6xl">
              A central para acessar cada sistema da operação.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
              Contratos, ferramentas PDF, CRM e novos módulos administrativos reunidos em uma experiência clara,
              rápida e preparada para crescer com a empresa.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
            <Metric label="Ativos" value={activeServices.length} />
            <Metric label="Planejados" value={plannedCount} />
            <Metric label="Modelos" value={savedTemplates.length} />
          </div>
        </div>
      </section>

      <section id="hub-categories" className="space-y-10 pt-10">
        {SERVICE_CATEGORIES.map((category) => (
          <div key={category.key}>
            <SectionHeading eyebrow="Categoria" title={category.title} description={category.description} />
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {category.services.map((service) => (
                <ServiceCard key={service.key} service={service} onAction={handleAction} />
              ))}
            </div>
          </div>
        ))}
      </section>

      <section id="hub-models" className="mt-12 border-t border-white/10 pt-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Biblioteca local"
            title="Modelos de contrato"
            description="Templates salvos ficam disponíveis para edição e reaproveitamento no fluxo contratual."
          />
          <Button variant="outline" onClick={handleEditTemplate} className="h-11 rounded-lg">
            <FileEdit className="h-4 w-4" />
            Novo template
          </Button>
        </div>

        {savedTemplates.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
            <h4 className="text-xl font-semibold text-foreground">Nenhum template salvo ainda</h4>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
              Crie o primeiro modelo para manter cláusulas, identidade visual e estrutura documental sempre prontas.
            </p>
            <Button onClick={handleEditTemplate} className="mt-5 h-11 rounded-lg">
              <FileEdit className="h-4 w-4" />
              Criar template
            </Button>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {savedTemplates.map((template) => (
              <Card key={template.id} className="service-card py-0">
                <CardHeader className="px-5 pt-5 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-lg">{template.name}</CardTitle>
                      <CardDescription className="mt-2">Atualizado em {formatDate(template.updatedAt)}</CardDescription>
                    </div>
                    <div className="service-icon">
                      <FolderOpen className="h-5 w-5" />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="px-5 pb-5">
                  <div className="mb-5 flex flex-wrap gap-2">
                    <Badge variant="secondary">{template.fontFamily || DEFAULT_DOCUMENT_FONT}</Badge>
                    {template.logoDataUrl ? <Badge variant="secondary">Logo configurada</Badge> : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => handleLoadTemplate(template)} className="h-10 rounded-lg">
                      <FolderOpen className="h-4 w-4" />
                      Abrir
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="h-10 rounded-lg">
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir template?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Essa ação remove permanentemente o template &quot;{template.name}&quot; da biblioteca local.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteTemplate(template.id)}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>
      <h3 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-muted-foreground sm:text-base">{description}</p>
    </div>
  );
}

function ServiceCard({
  service,
  onAction,
  featured = false,
}: {
  service: ServiceAction;
  onAction: (service: ServiceAction) => void;
  featured?: boolean;
}) {
  const Icon = service.icon;
  const isPlanned = service.state === 'planned';
  const StateIcon = service.state === 'planned' ? Lock : service.state === 'external' ? ExternalLink : CheckCircle2;

  return (
    <Card className={`service-card py-0 ${featured ? 'min-h-[290px]' : 'min-h-[250px]'}`}>
      <CardHeader className="px-5 pt-5 pb-4">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <div className="service-icon">
            <Icon className="h-5 w-5" />
          </div>
          <Badge variant={isPlanned ? 'secondary' : 'outline'} className="min-w-0 max-w-[160px] truncate">
            <StateIcon className="h-3 w-3" />
            {service.eyebrow}
          </Badge>
        </div>

        <div className="space-y-3">
          <CardTitle className="text-xl leading-tight">{service.title}</CardTitle>
          <CardDescription className="text-sm leading-7">{service.description}</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="mt-auto px-5 pb-5">
        <div className="mb-5 flex flex-wrap gap-2">
          {service.tags.map((tag) => (
            <Badge key={`${service.key}-${tag}`} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>

        <Button
          onClick={() => onAction(service)}
          disabled={isPlanned}
          variant={service.state === 'active' ? 'default' : 'outline'}
          className="h-11 w-full rounded-lg"
        >
          {service.buttonLabel}
          {service.href ? <ExternalLink className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
        </Button>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
