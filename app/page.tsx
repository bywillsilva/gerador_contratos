'use client';

import dynamic from 'next/dynamic';
import { NavigationProvider, useNavigation } from '@/lib/navigation-context';
import { Header } from '@/components/header';
import { Dashboard } from '@/components/dashboard';
import { TemplateEditor } from '@/components/template-editor';
import { ContractForm } from '@/components/contract-form';
import { Loader2 } from 'lucide-react';

// Carregar ContractPreview dinamicamente para evitar problemas com jsPDF no SSR
const ContractPreview = dynamic(
  () => import('@/components/contract-preview').then((mod) => mod.ContractPreview),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
  }
);

function AppContent() {
  const { currentScreen } = useNavigation();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {currentScreen === 'dashboard' && <Dashboard />}
        {currentScreen === 'editor' && <TemplateEditor />}
        {currentScreen === 'form' && <ContractForm />}
        {currentScreen === 'preview' && <ContractPreview />}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <NavigationProvider>
      <AppContent />
    </NavigationProvider>
  );
}
