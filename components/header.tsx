'use client';

import { FileText, Home, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigation, type Screen } from '@/lib/navigation-context';

export function Header() {
  const { currentScreen, navigate } = useNavigation();

  const getTitle = (screen: Screen) => {
    switch (screen) {
      case 'dashboard':
        return 'Painel Principal';
      case 'editor':
        return 'Editor de Template';
      case 'form':
        return 'Preencher Contrato';
      case 'preview':
        return 'Visualizar Contrato';
      case 'pdf-merge':
        return 'Juntar PDFs';
      default:
        return 'Gerador de Contratos';
    }
  };

  const getSubtitle = (screen: Screen) => {
    switch (screen) {
      case 'dashboard':
        return 'Organize templates, contratos e identidade visual em um unico fluxo.';
      case 'editor':
        return 'Estruture o documento com a mesma aparencia da impressao final.';
      case 'form':
        return 'Preencha dados comerciais, qualificacao do cliente e pagamento.';
      case 'preview':
        return 'Revise o contrato final com a mesma composicao do PDF.';
      case 'pdf-merge':
        return 'Una contrato, anexos e documentos em um unico PDF final.';
      default:
        return 'Sistema profissional para contratos de esquadrias de aluminio.';
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/45 bg-background/78 backdrop-blur-2xl">
      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 xl:px-8">
        <div className="app-hero-surface rounded-[1.75rem] px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-[0_18px_34px_-20px_rgba(0,126,130,0.7)] ring-1 ring-white/60">
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="app-eyebrow">
                    <Sparkles className="h-3.5 w-3.5" />
                    Workspace Contratual
                  </span>
                  <Badge variant="outline">Esquadrias de Aluminio</Badge>
                </div>

                <div>
                  <h1 className="text-xl font-semibold tracking-[-0.03em] text-foreground sm:text-2xl">
                    Gerador de Contratos
                  </h1>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                    {getSubtitle(currentScreen)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between xl:justify-end">
              <div className="rounded-2xl border border-white/60 bg-white/62 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Tela Atual
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">{getTitle(currentScreen)}</p>
              </div>

              {currentScreen !== 'dashboard' ? (
                <Button
                  variant="outline"
                  onClick={() => navigate('dashboard')}
                  className="self-start sm:self-auto"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Inicio
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
