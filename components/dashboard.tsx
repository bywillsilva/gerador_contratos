'use client';

import { useState, useEffect } from 'react';
import {
  FilePlus,
  FileEdit,
  FolderOpen,
  Files,
  Trash2,
  Clock,
  ArrowRight,
  LayoutTemplate,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useNavigation } from '@/lib/navigation-context';
import { getTemplates, deleteTemplate } from '@/lib/contract-utils';
import type { ContractTemplate } from '@/lib/types';
import { DEFAULT_DOCUMENT_FONT, DEFAULT_TEMPLATE } from '@/lib/types';

const DASHBOARD_ACTIONS = [
  {
    key: 'new',
    title: 'Criar Novo Contrato',
    description: 'Preencha os dados do cliente, da obra e monte um contrato pronto para imprimir.',
    badge: 'Fluxo completo',
    icon: FilePlus,
    iconClassName: 'bg-primary text-primary-foreground',
    buttonLabel: 'Iniciar Contrato',
    buttonVariant: 'default' as const,
  },
  {
    key: 'edit',
    title: 'Editar Template',
    description: 'Ajuste clausulas, numeracao, fonte, cabecalho e identidade visual do documento.',
    badge: 'Personalizacao',
    icon: FileEdit,
    iconClassName: 'bg-accent text-accent-foreground',
    buttonLabel: 'Abrir Editor',
    buttonVariant: 'outline' as const,
  },
  {
    key: 'library',
    title: 'Biblioteca de Templates',
    description: 'Reabra modelos salvos e mantenha uma base organizada para tipos diferentes de contrato.',
    badge: 'Reutilizacao',
    icon: FolderOpen,
    iconClassName: 'bg-[#5a5b5d] text-white',
    buttonLabel: 'Ver Templates',
    buttonVariant: 'outline' as const,
  },
  {
    key: 'pdf-merge',
    title: 'Juntar PDFs',
    description: 'Una contrato, anexos, propostas e comprovantes em um unico arquivo PDF para envio ao cliente.',
    badge: 'Ferramenta PDF',
    icon: Files,
    iconClassName: 'bg-primary/10 text-primary',
    buttonLabel: 'Abrir Ferramenta',
    buttonVariant: 'outline' as const,
  },
];

export function Dashboard() {
  const {
    navigate,
    setTemplateContent,
    setTemplateFontFamily,
    setTemplateLogoDataUrl,
    setTemplateLogoWidthMm,
    setTemplateLogoPosition,
    setSelectedTemplate,
    resetToDefault,
  } = useNavigation();

  const [savedTemplates, setSavedTemplates] = useState<ContractTemplate[]>([]);

  useEffect(() => {
    setSavedTemplates(getTemplates());
  }, []);

  const handleNewContract = () => {
    resetToDefault();
    navigate('form');
  };

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

  const handleAction = (actionKey: string) => {
    if (actionKey === 'new') {
      handleNewContract();
      return;
    }

    if (actionKey === 'edit') {
      handleEditTemplate();
      return;
    }

    if (actionKey === 'pdf-merge') {
      navigate('pdf-merge');
      return;
    }

    const templatesSection = document.getElementById('templates-section');
    templatesSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 xl:px-8">
      <section className="app-hero-surface rounded-[2rem] px-5 py-6 sm:px-8 sm:py-8">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="app-eyebrow">
                <Sparkles className="h-3.5 w-3.5" />
                Gestao de Contratos
              </span>
              <Badge variant="outline">Operacao comercial estruturada</Badge>
            </div>

            <div className="space-y-3">
              <h2 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
                Contratos com aparencia profissional, preenchimento rapido e impressao coerente.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                Centralize modelos, identidade visual, clausulas e dados comerciais em um fluxo unico.
                O objetivo aqui e sair do preenchimento para um documento final confiavel, elegante e pronto para assinatura.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={handleNewContract}>
                Criar Contrato Agora
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={handleEditTemplate}>
                Personalizar Template
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[1.5rem] border border-white/60 bg-white/72 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Templates Salvos
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
                {savedTemplates.length}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Modelos com fonte, logo e estrutura prontos para reutilizacao.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/60 bg-white/72 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Controle Visual
              </p>
              <p className="mt-3 text-lg font-semibold tracking-[-0.03em] text-foreground">
                Fonte, logo e cabecalho centralizados no mesmo fluxo
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/60 bg-white/72 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Visualizacao fiel ao PDF</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    O documento final respeita o template configurado, evitando divergencia entre edicao e impressao.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-5 xl:grid-cols-4">
        {DASHBOARD_ACTIONS.map((action) => {
          const Icon = action.icon;

          return (
            <Card key={action.key} className="border-white/60">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${action.iconClassName}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <Badge variant="outline">{action.badge}</Badge>
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleAction(action.key)}
                  variant={action.buttonVariant}
                  className="w-full justify-between"
                >
                  {action.buttonLabel}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section id="templates-section" className="mt-8">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="app-eyebrow">Base reutilizavel</span>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-foreground">
              Seus templates salvos
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Mantenha modelos separados por tipo de cliente, condicao comercial ou padrao visual da empresa.
            </p>
          </div>

          <div className="rounded-2xl border border-white/60 bg-white/68 px-4 py-3 text-sm text-muted-foreground">
            {savedTemplates.length > 0
              ? `${savedTemplates.length} template(s) pronto(s) para edicao`
              : 'Nenhum template salvo ainda'}
          </div>
        </div>

        {savedTemplates.length === 0 ? (
          <Card className="border-dashed border-border/80">
            <CardContent className="py-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <LayoutTemplate className="h-6 w-6" />
              </div>
              <h4 className="mt-4 text-lg font-semibold text-foreground">Sua biblioteca ainda esta vazia</h4>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
                Salve um template personalizado com fonte, logo e numeracao ja ajustados para reaproveitar nos proximos contratos.
              </p>
              <Button className="mt-6" onClick={handleEditTemplate}>
                Criar Primeiro Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
            {savedTemplates.map((template) => (
              <Card key={template.id} className="border-white/60">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <Badge variant="secondary">Template ativo</Badge>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <FolderOpen className="h-5 w-5" />
                    </div>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    Atualizado em {formatDate(template.updatedAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{template.fontFamily ? 'Fonte definida' : 'Fonte padrao'}</Badge>
                    <Badge variant="outline">{template.logoDataUrl ? 'Logo configurada' : 'Sem logo'}</Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleLoadTemplate(template)} className="flex-1">
                      Abrir Template
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir template?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acao nao pode ser desfeita. O template &quot;{template.name}&quot; sera removido da biblioteca.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
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
