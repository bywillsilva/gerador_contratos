'use client';

import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Files,
  FolderOpen,
  Home,
  Menu,
  Settings,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigation, type Screen } from '@/lib/navigation-context';
import { cn } from '@/lib/utils';

const menuItems: Array<{
  title: string;
  screen: Screen;
  icon: typeof Home;
  badge?: string;
}> = [
  { title: 'Painel', screen: 'dashboard', icon: Home },
  { title: 'Contratos', screen: 'form', icon: FileText },
  { title: 'Editor', screen: 'editor', icon: Settings },
  { title: 'Biblioteca', screen: 'dashboard', icon: FolderOpen, badge: 'Templates' },
  { title: 'Juntar PDFs', screen: 'pdf-merge', icon: Files },
  { title: 'Compactar PDF', screen: 'pdf-compress', icon: Files },
];

function isActiveItem(itemScreen: Screen, currentScreen: Screen, title: string) {
  if (title === 'Biblioteca') {
    return currentScreen === 'dashboard';
  }

  if (itemScreen === 'form') {
    return currentScreen === 'form' || currentScreen === 'preview';
  }

  return currentScreen === itemScreen;
}

export function AppSidebar() {
  const { currentScreen, navigate } = useNavigation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setMobileOpen(true);
    window.addEventListener('contracts-mobile-sidebar:open', handleOpen);
    return () => window.removeEventListener('contracts-mobile-sidebar:open', handleOpen);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [currentScreen]);

  return (
    <>
      <aside
        className={cn(
          'sticky top-0 hidden h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 md:flex',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex h-16 items-center border-b border-sidebar-border px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Menu className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed ? (
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-sidebar-foreground">Central Admin</span>
                <Badge variant="outline" className="mt-1 w-fit">
                  Workspace
                </Badge>
              </div>
            ) : null}
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-4">
          {menuItems.map((item) => {
            const active = isActiveItem(item.screen, currentScreen, item.title);
            const Icon = item.icon;

            return (
              <button
                key={`${item.title}-${item.screen}`}
                type="button"
                onClick={() => navigate(item.screen)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5 flex-shrink-0', active && 'text-sidebar-primary')} />
                {!collapsed ? (
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <span className="truncate">{item.title}</span>
                    {item.badge ? (
                      <Badge variant="outline" className="text-[10px]">
                        {item.badge}
                      </Badge>
                    ) : null}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full justify-center text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="mr-2 h-4 w-4" />
                <span>Recolher</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-[min(84vw,20rem)] flex-col border-r border-sidebar-border bg-sidebar shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Menu className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-sidebar-foreground">Central Admin</p>
                  <Badge variant="outline" className="mt-1">
                    Workspace
                  </Badge>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                aria-label="Fechar menu"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
              {menuItems.map((item) => {
                const active = isActiveItem(item.screen, currentScreen, item.title);
                const Icon = item.icon;

                return (
                  <button
                    key={`${item.title}-${item.screen}-mobile`}
                    type="button"
                    onClick={() => navigate(item.screen)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-sidebar-accent text-sidebar-primary'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    )}
                  >
                    <Icon className={cn('h-5 w-5 flex-shrink-0', active && 'text-sidebar-primary')} />
                    <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                      <span className="truncate">{item.title}</span>
                      {item.badge ? (
                        <Badge variant="outline" className="text-[10px]">
                          {item.badge}
                        </Badge>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      ) : null}
    </>
  );
}
