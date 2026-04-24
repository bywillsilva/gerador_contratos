'use client';

import { useEffect, useState } from 'react';
import { Home, LayoutGrid, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useNavigation, type Screen } from '@/lib/navigation-context';

function getTitle(screen: Screen) {
  switch (screen) {
    case 'dashboard':
      return 'Central Administrativa';
    case 'editor':
      return 'Editor de Template';
    case 'form':
      return 'Gerador de Contratos';
    case 'preview':
      return 'Visualizar Contrato';
    case 'pdf-merge':
      return 'Juntar PDFs';
    case 'pdf-compress':
      return 'Compactar PDF';
    default:
      return 'Central Administrativa';
  }
}

function getSubtitle(screen: Screen) {
  switch (screen) {
    case 'dashboard':
      return 'Serviços administrativos, documentos e sistemas conectados em um só lugar.';
    case 'editor':
      return 'Padronize modelos, cláusulas, fonte e identidade visual.';
    case 'form':
      return 'Preencha os dados e gere o contrato final com segurança.';
    case 'preview':
      return 'Revise o documento final antes de imprimir ou baixar.';
    case 'pdf-merge':
      return 'Una documentos e anexos em um único arquivo.';
    case 'pdf-compress':
      return 'Reduza arquivos PDF preservando legibilidade.';
    default:
      return 'Serviços administrativos, documentos e sistemas conectados em um só lugar.';
  }
}

const NAV_ITEMS = [
  { id: 'hub-categories', label: 'Categorias' },
  { id: 'hub-models', label: 'Modelos' },
];

export function Header() {
  const { currentScreen, navigate } = useNavigation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDashboard = currentScreen === 'dashboard';

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToSection = (id: string) => {
    if (typeof document === 'undefined') {
      return;
    }

    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
            <LayoutGrid className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Workspace ArtGlass
            </p>
            <h1 className="mt-1 truncate text-xl font-semibold text-foreground">{getTitle(currentScreen)}</h1>
            <p className="mt-0.5 max-w-2xl text-sm leading-6 text-muted-foreground">{getSubtitle(currentScreen)}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          {isDashboard ? (
            <nav className="flex flex-wrap items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
              {NAV_ITEMS.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollToSection(item.id)}
                  className="h-8 rounded-md px-3 text-muted-foreground hover:bg-white/[0.08] hover:text-foreground"
                >
                  {item.label}
                </Button>
              ))}
            </nav>
          ) : null}

          {mounted ? (
            <ToggleGroup
              type="single"
              value={theme === 'light' ? 'light' : 'dark'}
              onValueChange={(value) => {
                if (value === 'light' || value === 'dark') {
                  setTheme(value);
                }
              }}
              variant="outline"
              size="sm"
              className="rounded-lg border border-white/10 bg-white/[0.03] p-1"
            >
              <ToggleGroupItem
                value="dark"
                aria-label="Tema escuro"
                className="h-8 w-8 rounded-md border-0 bg-transparent p-0 text-muted-foreground data-[state=on]:bg-foreground data-[state=on]:text-background"
              >
                <Moon className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="light"
                aria-label="Tema claro"
                className="h-8 w-8 rounded-md border-0 bg-transparent p-0 text-muted-foreground data-[state=on]:bg-foreground data-[state=on]:text-background"
              >
                <Sun className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          ) : (
            <div
              aria-hidden="true"
              className="flex h-10 w-[76px] rounded-lg border border-white/10 bg-white/[0.03] p-1"
            />
          )}

          {!isDashboard ? (
            <Button variant="outline" onClick={() => navigate('dashboard')} className="h-10 rounded-lg">
              <Home className="h-4 w-4" />
              Central
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
