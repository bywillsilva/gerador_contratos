'use client';

import { FileText, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      default:
        return 'Gerador de Contratos';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Gerador de Contratos</h1>
            <p className="text-xs text-muted-foreground">Esquadrias de Alumínio</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-sm font-medium text-muted-foreground sm:block">
            {getTitle(currentScreen)}
          </span>
          {currentScreen !== 'dashboard' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('dashboard')}
              className="ml-4"
            >
              <Home className="mr-2 h-4 w-4" />
              Início
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
