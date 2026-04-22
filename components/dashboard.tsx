'use client';

import { useState, useEffect } from 'react';
import { FilePlus, FileEdit, FolderOpen, Trash2, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { DEFAULT_TEMPLATE } from '@/lib/types';

export function Dashboard() {
  const { navigate, setTemplateContent, setSelectedTemplate, resetToDefault } = useNavigation();
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
    setSelectedTemplate(null);
    navigate('editor');
  };

  const handleLoadTemplate = (template: ContractTemplate) => {
    setTemplateContent(template.content);
    setSelectedTemplate(template);
    navigate('editor');
  };

  const handleDeleteTemplate = (id: string) => {
    deleteTemplate(id);
    setSavedTemplates(getTemplates());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Bem-vindo ao Gerador de Contratos
        </h2>
        <p className="mt-2 text-muted-foreground">
          Crie contratos profissionais de forma rápida e personalizada
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Criar Novo Contrato */}
        <Card className="group cursor-pointer border-2 border-transparent transition-all hover:border-primary hover:shadow-lg">
          <CardHeader className="pb-3">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <FilePlus className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl">Criar Novo Contrato</CardTitle>
            <CardDescription>
              Preencha os dados e gere um contrato usando o template padrão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleNewContract} className="w-full">
              Iniciar
            </Button>
          </CardContent>
        </Card>

        {/* Editar Template */}
        <Card className="group cursor-pointer border-2 border-transparent transition-all hover:border-primary hover:shadow-lg">
          <CardHeader className="pb-3">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
              <FileEdit className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl">Editar Template</CardTitle>
            <CardDescription>
              Personalize o modelo do contrato com suas próprias cláusulas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleEditTemplate} variant="outline" className="w-full">
              Editar
            </Button>
          </CardContent>
        </Card>

        {/* Templates Salvos */}
        <Card className="group cursor-pointer border-2 border-transparent transition-all hover:border-primary hover:shadow-lg md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-[#3B82F6]/10 text-[#3B82F6] transition-colors group-hover:bg-[#3B82F6] group-hover:text-white">
              <FolderOpen className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl">Templates Salvos</CardTitle>
            <CardDescription>
              {savedTemplates.length > 0
                ? `${savedTemplates.length} template(s) disponível(is)`
                : 'Nenhum template salvo ainda'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {savedTemplates.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                Seus templates personalizados aparecerão aqui
              </p>
            ) : (
              <div className="text-sm text-muted-foreground">
                Selecione um template abaixo para editar
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lista de Templates Salvos */}
      {savedTemplates.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Seus Templates</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {savedTemplates.map((template) => (
              <Card key={template.id} className="relative">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    Atualizado em {formatDate(template.updatedAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleLoadTemplate(template)}
                    className="flex-1"
                  >
                    Abrir
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
                          Esta ação não pode ser desfeita. O template &quot;{template.name}&quot; será
                          permanentemente excluído.
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
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
