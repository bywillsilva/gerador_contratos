'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Save,
  RotateCcw,
  ArrowRight,
  Tag,
  Info,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  Heading1,
  Heading2,
  Type,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useNavigation } from '@/lib/navigation-context';
import { saveTemplate, generateId } from '@/lib/contract-utils';
import { AVAILABLE_TAGS, DEFAULT_TEMPLATE } from '@/lib/types';
import { processTemplateForPreview, DOCUMENT_STYLES } from '@/lib/template-processor';

// Marcadores de formatação para texto simples
const FORMAT_MARKERS = {
  bold: { start: '**', end: '**', label: 'Negrito' },
  italic: { start: '_', end: '_', label: 'Itálico' },
  underline: { start: '__', end: '__', label: 'Sublinhado' },
  heading1: { start: '# ', end: '', label: 'Título Principal' },
  heading2: { start: '## ', end: '', label: 'Subtítulo' },
  list: { start: '• ', end: '', label: 'Lista' },
  alignCenter: { start: '[CENTER]', end: '[/CENTER]', label: 'Centralizar' },
  alignRight: { start: '[RIGHT]', end: '[/RIGHT]', label: 'Alinhar Direita' },
};

export function TemplateEditor() {
  const { templateContent, setTemplateContent, selectedTemplate, setSelectedTemplate, navigate } =
    useNavigation();
  const [templateName, setTemplateName] = useState(selectedTemplate?.name || '');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertTag = useCallback(
    (tag: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = templateContent;
      const newText = text.substring(0, start) + tag + text.substring(end);

      setTemplateContent(newText);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length, start + tag.length);
      }, 0);
    },
    [templateContent, setTemplateContent]
  );

  const applyFormat = useCallback(
    (formatKey: keyof typeof FORMAT_MARKERS) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = templateContent;
      const selectedText = text.substring(start, end);
      const format = FORMAT_MARKERS[formatKey];

      let newText: string;
      let newCursorPos: number;

      if (formatKey === 'heading1' || formatKey === 'heading2' || formatKey === 'list') {
        // Para títulos e listas, inserir no início da linha
        const lineStart = text.lastIndexOf('\n', start - 1) + 1;
        newText = text.substring(0, lineStart) + format.start + text.substring(lineStart);
        newCursorPos = start + format.start.length;
      } else if (selectedText) {
        // Texto selecionado - envolver com marcadores
        newText =
          text.substring(0, start) +
          format.start +
          selectedText +
          format.end +
          text.substring(end);
        newCursorPos = end + format.start.length + format.end.length;
      } else {
        // Sem seleção - inserir marcadores e posicionar cursor no meio
        newText = text.substring(0, start) + format.start + format.end + text.substring(end);
        newCursorPos = start + format.start.length;
      }

      setTemplateContent(newText);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [templateContent, setTemplateContent]
  );

  const handleReset = () => {
    setTemplateContent(DEFAULT_TEMPLATE);
  };

  const handleSave = () => {
    if (!templateName.trim()) return;

    const template = {
      id: selectedTemplate?.id || generateId(),
      name: templateName.trim(),
      content: templateContent,
      createdAt: selectedTemplate?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveTemplate(template);
    setSelectedTemplate(template);
    setSaveDialogOpen(false);
  };

  const handleContinue = () => {
    navigate('form');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Editor de Template</h2>
          <p className="text-sm text-muted-foreground">
            Personalize seu modelo de contrato com tags dinâmicas e formatação
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Restaurar Padrão
          </Button>
          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Salvar Template</DialogTitle>
                <DialogDescription>
                  Dê um nome para seu template para encontrá-lo facilmente depois.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="template-name">Nome do Template</Label>
                <Input
                  id="template-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Ex: Contrato Esquadrias Premium"
                  className="mt-2"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={!templateName.trim()}>
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={handleContinue}>
            Continuar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Painel de Tags */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Tag className="h-4 w-4" />
              Tags Disponíveis
            </CardTitle>
            <CardDescription className="text-xs">
              Clique para inserir no editor
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-[600px] overflow-y-auto">
            <TooltipProvider>
              <div className="flex flex-col gap-2">
                {AVAILABLE_TAGS.map(({ tag, label, description }) => (
                  <Tooltip key={tag}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => insertTag(tag)}
                        className="group flex items-start gap-2 rounded-lg border border-border bg-card p-2 text-left transition-all hover:border-blue-500 hover:bg-blue-500/5"
                      >
                        <Badge
                          variant="secondary"
                          className="shrink-0 bg-blue-500/10 text-blue-600 group-hover:bg-blue-500 group-hover:text-white"
                        >
                          {label}
                        </Badge>
                        <Info className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[200px]">
                      <p className="font-mono text-xs">{tag}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>

        {/* Editor */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Conteúdo do Template</CardTitle>
            <CardDescription className="text-xs">
              Use os controles de formatação ou digite diretamente. As tags serão substituídas pelos
              dados reais.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Barra de Formatação */}
            <TooltipProvider>
              <div className="mb-3 flex flex-wrap items-center gap-1 rounded-lg border border-border bg-muted/50 p-2">
                <span className="mr-2 text-xs font-medium text-muted-foreground">Formatação:</span>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => applyFormat('bold')}
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Negrito (**texto**)</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => applyFormat('italic')}
                    >
                      <Italic className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Itálico (_texto_)</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => applyFormat('underline')}
                    >
                      <Underline className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Sublinhado (__texto__)</TooltipContent>
                </Tooltip>

                <Separator orientation="vertical" className="mx-1 h-6" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => applyFormat('heading1')}
                    >
                      <Heading1 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Título Principal (# texto)</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => applyFormat('heading2')}
                    >
                      <Heading2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Subtítulo (## texto)</TooltipContent>
                </Tooltip>

                <Separator orientation="vertical" className="mx-1 h-6" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => applyFormat('alignCenter')}
                    >
                      <AlignCenter className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Centralizar [CENTER]...[/CENTER]</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => applyFormat('alignRight')}
                    >
                      <AlignRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Alinhar Direita [RIGHT]...[/RIGHT]</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => applyFormat('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Item de Lista (• texto)</TooltipContent>
                </Tooltip>

                <Separator orientation="vertical" className="mx-1 h-6" />

                <div className="flex items-center gap-1 rounded border border-border bg-background px-2 py-1">
                  <Type className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Dica: selecione texto antes de formatar</span>
                </div>
              </div>
            </TooltipProvider>

            {/* Editor de Texto */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={templateContent}
                onChange={(e) => setTemplateContent(e.target.value)}
                className="min-h-[400px] w-full resize-none rounded-lg border border-border bg-background p-4 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Digite o conteúdo do seu contrato aqui..."
              />
            </div>

            {/* Legenda de Formatação */}
            <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
              <p className="mb-2 text-xs font-medium text-foreground">Guia de Formatação:</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                <span>
                  <code className="rounded bg-muted px-1">**texto**</code> = <strong>Negrito</strong>
                </span>
                <span>
                  <code className="rounded bg-muted px-1">_texto_</code> = <em>Itálico</em>
                </span>
                <span>
                  <code className="rounded bg-muted px-1">__texto__</code> = <u>Sublinhado</u>
                </span>
                <span>
                  <code className="rounded bg-muted px-1"># texto</code> = Título
                </span>
              </div>
            </div>

            {/* Prévia com Formatação */}
            <div className="mt-4 rounded-lg border border-border bg-card p-4">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Prévia do Template (como aparecerá no documento)
              </h4>
              <div
                className="max-h-[400px] overflow-y-auto rounded border border-border bg-white p-6"
                style={{
                  fontFamily: DOCUMENT_STYLES.page.fontFamily,
                  fontSize: DOCUMENT_STYLES.page.fontSize,
                  lineHeight: DOCUMENT_STYLES.page.lineHeight,
                  color: DOCUMENT_STYLES.page.color,
                }}
                dangerouslySetInnerHTML={{ __html: processTemplateForPreview(templateContent) }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
