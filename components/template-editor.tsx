'use client';

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import {
  Save,
  RotateCcw,
  ArrowRight,
  Tag,
  Info,
  Search,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  IndentIncrease,
  IndentDecrease,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Type,
  ImagePlus,
  PanelsTopLeft,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { useNavigation } from '@/lib/navigation-context';
import { saveTemplate, generateId } from '@/lib/contract-utils';
import {
  AVAILABLE_TAGS,
  DEFAULT_DOCUMENT_FONT,
  DEFAULT_TEMPLATE,
  FONT_OPTIONS,
  type LogoPosition,
} from '@/lib/types';
import { processTemplateForPreview, DOCUMENT_STYLES } from '@/lib/template-processor';

const FORMAT_MARKERS = {
  bold: { start: '**', end: '**', label: 'Negrito' },
  italic: { start: '_', end: '_', label: 'Italico' },
  underline: { start: '__', end: '__', label: 'Sublinhado' },
  heading1: { start: '# ', end: '', label: 'Titulo Principal' },
  heading2: { start: '## ', end: '', label: 'Subtitulo' },
  list: { start: '• ', end: '', label: 'Lista' },
  numberedList: { start: '1. ', end: '', label: 'Lista Numerada' },
  numberedItem: { start: '1.1. ', end: '', label: 'Item Numerado' },
  numberedSubitem: { start: '1.1.1. ', end: '', label: 'Subitem Numerado' },
  alignLeft: { start: '[LEFT]', end: '[/LEFT]', label: 'Alinhar Esquerda' },
  alignCenter: { start: '[CENTER]', end: '[/CENTER]', label: 'Centralizar' },
  alignRight: { start: '[RIGHT]', end: '[/RIGHT]', label: 'Alinhar Direita' },
  alignJustify: { start: '[JUSTIFY]', end: '[/JUSTIFY]', label: 'Justificar' },
} as const;

const INDENT_TOKEN = '\t';

const TOOLBAR_BUTTONS = [
  { key: 'bold', tooltip: 'Negrito (**texto**)', icon: Bold },
  { key: 'italic', tooltip: 'Italico (_texto_)', icon: Italic },
  { key: 'underline', tooltip: 'Sublinhado (__texto__)', icon: Underline },
  { key: 'separator-1', separator: true },
  { key: 'heading1', tooltip: 'Titulo principal (# texto)', icon: Heading1 },
  { key: 'heading2', tooltip: 'Subtitulo (## texto)', icon: Heading2 },
  { key: 'separator-2', separator: true },
  { key: 'alignLeft', tooltip: 'Alinhar a esquerda [LEFT]...[/LEFT]', icon: AlignLeft },
  { key: 'alignCenter', tooltip: 'Centralizar [CENTER]...[/CENTER]', icon: AlignCenter },
  { key: 'alignRight', tooltip: 'Alinhar a direita [RIGHT]...[/RIGHT]', icon: AlignRight },
  { key: 'alignJustify', tooltip: 'Justificar texto [JUSTIFY]...[/JUSTIFY]', icon: AlignJustify },
  { key: 'separator-3', separator: true },
  { key: 'list', tooltip: 'Item de lista (• texto)', icon: List },
  { key: 'numberedList', tooltip: 'Lista numerada (1. texto)', label: '1.' },
  { key: 'numberedItem', tooltip: 'Inserir item numerado (1.1. texto)', label: '1.1' },
  { key: 'numberedSubitem', tooltip: 'Inserir subitem numerado (1.1.1. texto)', label: '1.1.1' },
] as const;

const LOGO_POSITION_OPTIONS: Array<{
  value: LogoPosition;
  label: string;
  tooltip: string;
  icon: typeof AlignLeft;
}> = [
  { value: 'left', label: 'Esquerda', tooltip: 'Alinhar logo a esquerda', icon: AlignLeft },
  { value: 'center', label: 'Centro', tooltip: 'Centralizar logo', icon: AlignCenter },
  { value: 'right', label: 'Direita', tooltip: 'Alinhar logo a direita', icon: AlignRight },
];

export function TemplateEditor() {
  const {
    templateContent,
    setTemplateContent,
    templateFontFamily,
    setTemplateFontFamily,
    templateLogoDataUrl,
    setTemplateLogoDataUrl,
    templateLogoWidthMm,
    setTemplateLogoWidthMm,
    templateLogoPosition,
    setTemplateLogoPosition,
    selectedTemplate,
    setSelectedTemplate,
    navigate,
  } = useNavigation();

  const [templateName, setTemplateName] = useState(selectedTemplate?.name || '');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTemplateName(selectedTemplate?.name || '');
  }, [selectedTemplate]);

  const selectedFontLabel = useMemo(
    () => FONT_OPTIONS.find((font) => font.value === templateFontFamily)?.label || 'Fonte personalizada',
    [templateFontFamily]
  );

  const filteredTags = useMemo(() => {
    const query = tagSearch.trim().toLowerCase();
    if (!query) return AVAILABLE_TAGS;

    return AVAILABLE_TAGS.filter(({ tag, label, description }) =>
      [tag, label, description].some((value) => value.toLowerCase().includes(query))
    );
  }, [tagSearch]);

  const previewHTML = useMemo(
    () =>
      processTemplateForPreview(templateContent, {
        logoDataUrl: templateLogoDataUrl,
        logoWidthMm: templateLogoWidthMm,
        logoPosition: templateLogoPosition,
      }),
    [templateContent, templateLogoDataUrl, templateLogoWidthMm, templateLogoPosition]
  );

  const insertTag = useCallback(
    (tag: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = templateContent.substring(0, start) + tag + templateContent.substring(end);

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
      const selectedText = templateContent.substring(start, end);
      const format = FORMAT_MARKERS[formatKey];

      let newText = templateContent;
      let newCursorPos = start;

      if (
        formatKey === 'heading1' ||
        formatKey === 'heading2' ||
        formatKey === 'list' ||
        formatKey === 'numberedList' ||
        formatKey === 'numberedItem' ||
        formatKey === 'numberedSubitem'
      ) {
        const lineStart = templateContent.lastIndexOf('\n', start - 1) + 1;
        newText =
          templateContent.substring(0, lineStart) +
          format.start +
          templateContent.substring(lineStart);
        newCursorPos = start + format.start.length;
      } else if (selectedText) {
        newText =
          templateContent.substring(0, start) +
          format.start +
          selectedText +
          format.end +
          templateContent.substring(end);
        newCursorPos = end + format.start.length + format.end.length;
      } else {
        newText =
          templateContent.substring(0, start) +
          format.start +
          format.end +
          templateContent.substring(end);
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

  const indentCurrentLine = useCallback(
    (removeIndent: boolean = false) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const lineStart = templateContent.lastIndexOf('\n', start - 1) + 1;
      const lineEnd = templateContent.indexOf('\n', end);
      const safeLineEnd = lineEnd === -1 ? templateContent.length : lineEnd;
      const selectedBlock = templateContent.substring(lineStart, safeLineEnd);
      const lines = selectedBlock.split('\n');

      const updatedLines = lines.map((line) => {
        if (removeIndent) {
          if (line.startsWith(INDENT_TOKEN)) return line.slice(1);
          if (line.startsWith('    ')) return line.slice(4);
          return line;
        }

        return `${INDENT_TOKEN}${line}`;
      });

      const updatedBlock = updatedLines.join('\n');
      const newText =
        templateContent.substring(0, lineStart) + updatedBlock + templateContent.substring(safeLineEnd);
      const selectionShift = removeIndent ? 0 : INDENT_TOKEN.length;

      setTemplateContent(newText);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + selectionShift, end + selectionShift);
      }, 0);
    },
    [templateContent, setTemplateContent]
  );

  const handleEditorKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key !== 'Tab') return;

      event.preventDefault();
      indentCurrentLine(event.shiftKey);
    },
    [indentCurrentLine]
  );

  const handleReset = () => {
    setTemplateContent(DEFAULT_TEMPLATE);
    setTemplateFontFamily(DEFAULT_DOCUMENT_FONT);
    setTemplateLogoDataUrl('');
    setTemplateLogoWidthMm(36);
    setTemplateLogoPosition('center');
  };

  const handleLogoUpload = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        setTemplateLogoDataUrl(result);
      };
      reader.readAsDataURL(file);
      event.target.value = '';
    },
    [setTemplateLogoDataUrl]
  );

  const handleSave = () => {
    if (!templateName.trim()) return;

    const template = {
      id: selectedTemplate?.id || generateId(),
      name: templateName.trim(),
      content: templateContent,
      fontFamily: templateFontFamily,
      logoDataUrl: templateLogoDataUrl,
      logoWidthMm: templateLogoWidthMm,
      logoPosition: templateLogoPosition,
      createdAt: selectedTemplate?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveTemplate(template);
    setSelectedTemplate(template);
    setSaveDialogOpen(false);
  };

  const triggerLogoPicker = () => {
    logoInputRef.current?.click();
  };

  const editorPanel = (
    <div className="flex h-full min-h-0 flex-col bg-white/26">
      <div className="border-b border-border/60 bg-white/38 p-4">
        <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-end 2xl:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <PanelsTopLeft className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Editor do Template</p>
            </div>
            <p className="text-xs leading-6 text-muted-foreground">
              Busque tags, insira campos dinamicos e edite o contrato com a mesma estrutura usada no documento final.
            </p>
          </div>

          <div className="relative w-full 2xl:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={tagSearch}
              onChange={(event) => setTagSearch(event.target.value)}
              placeholder="Buscar tags para inserir"
              className="pl-9"
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto pb-1">
          <div className="flex min-w-max gap-2">
            {filteredTags.map(({ tag, label, description }) => (
              <TooltipProvider key={tag}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => insertTag(tag)}
                      className="flex shrink-0 items-center gap-2 rounded-full border border-border/80 bg-white/76 px-3 py-2 text-left text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-white"
                    >
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {label}
                      </Badge>
                      <span className="font-mono text-[11px] text-muted-foreground">{tag}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[240px]">
                    <p className="font-mono text-xs">{tag}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}

            {filteredTags.length === 0 ? (
              <div className="rounded-full border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                Nenhuma tag encontrada.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4">
        <textarea
          ref={textareaRef}
          value={templateContent}
          onChange={(e) => setTemplateContent(e.target.value)}
          onKeyDown={handleEditorKeyDown}
          className="min-h-[520px] flex-1 resize-none rounded-[1.5rem] border border-border/80 bg-white/82 p-6 font-mono text-sm leading-relaxed shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_20px_40px_-34px_rgba(15,23,42,0.4)] outline-none focus:ring-2 focus:ring-ring"
          placeholder="Digite o conteudo do seu contrato aqui..."
        />

        <div className="mt-4 rounded-[1.5rem] border border-border/70 bg-muted/15 p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Guia Rapido
          </p>
          <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-2 2xl:grid-cols-4">
            <span>
              <code className="rounded bg-white px-1.5 py-0.5">**texto**</code> = <strong>Negrito</strong>
            </span>
            <span>
              <code className="rounded bg-white px-1.5 py-0.5">_texto_</code> = <em>Italico</em>
            </span>
            <span>
              <code className="rounded bg-white px-1.5 py-0.5">1.1. texto</code> = Item numerado
            </span>
            <span>
              <code className="rounded bg-white px-1.5 py-0.5">Tab</code> = Recuo | <code className="rounded bg-white px-1.5 py-0.5">Shift+Tab</code> = Remover recuo
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const previewPanel = (
    <div className="flex h-full min-h-0 flex-col bg-[#e6f6f6]/90 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Previa ao Vivo</p>
          </div>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">
            Esta composicao representa como o documento sera gerado para impressao e PDF.
          </p>
        </div>
        <Badge variant="outline">Sincronizada</Badge>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-[1.6rem] border border-white/60 bg-white/72 p-4 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.5)]">
        <div className="mb-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>Documento renderizado com fonte e cabecalho atuais</span>
          <span>{selectedFontLabel}</span>
        </div>

        <div
          className="min-h-0 flex-1 overflow-auto rounded-[1.4rem] border border-border bg-white p-5 sm:p-6"
          style={{
            fontFamily: templateFontFamily || DOCUMENT_STYLES.page.fontFamily,
            fontSize: DOCUMENT_STYLES.page.fontSize,
            lineHeight: DOCUMENT_STYLES.page.lineHeight,
            color: DOCUMENT_STYLES.page.color,
          }}
          dangerouslySetInnerHTML={{ __html: previewHTML }}
        />
      </div>
    </div>
  );

  return (
    <div className="w-full px-3 py-6 sm:px-4 xl:px-6 2xl:px-8">
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        onChange={handleLogoUpload}
        className="hidden"
      />

      <div className="app-hero-surface mb-6 rounded-[1.8rem] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-3">
            <span className="app-eyebrow">Workspace do Template</span>
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-foreground">
                Editor de Template
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
                Uma area de trabalho mais ampla para editar e revisar lado a lado, com controles de documento integrados na barra superior.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{AVAILABLE_TAGS.length} tags disponiveis</Badge>
              <Badge variant="secondary">{selectedFontLabel}</Badge>
              <Badge variant="secondary">{templateLogoDataUrl ? `Logo ${templateLogoWidthMm} mm` : 'Sem logo'}</Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 xl:justify-end">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Restaurar Padrao
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
                    De um nome para seu template para encontra-lo facilmente depois.
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

            <Button onClick={() => navigate('form')}>
              Continuar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-white/60">
        <CardHeader className="border-b border-border/60 bg-white/52 pb-4">
          <div className="space-y-4">
            <div className="flex flex-col gap-2 2xl:flex-row 2xl:items-end 2xl:justify-between">
              <div>
                <CardTitle className="text-lg">Barra de Formatação do Documento</CardTitle>
                <CardDescription>
                  Fonte, logo, tamanho e posicao no mesmo conjunto de controles, junto da formatacao textual.
                </CardDescription>
              </div>
              <Badge variant="outline">Experiencia de edicao ampliada</Badge>
            </div>

            <TooltipProvider>
              <div className="-mx-2 overflow-x-auto px-2 pb-1">
                <div className="flex min-w-max items-stretch gap-3">
                  <div className="flex items-center gap-3 rounded-[1.2rem] border border-border/80 bg-white/78 px-3 py-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Fonte
                    </span>
                    <div className="w-[220px]">
                      <Select value={templateFontFamily} onValueChange={setTemplateFontFamily}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma fonte" />
                        </SelectTrigger>
                        <SelectContent>
                          {FONT_OPTIONS.map((font) => (
                            <SelectItem key={font.value} value={font.value}>
                              {font.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-[1.2rem] border border-border/80 bg-white/78 px-3 py-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Logo
                    </span>

                    <Button type="button" variant="outline" size="sm" onClick={triggerLogoPicker}>
                      <ImagePlus className="h-4 w-4" />
                      Carregar
                    </Button>

                    <div className="flex items-center gap-2">
                      <Label htmlFor="toolbar-logo-size" className="text-xs text-muted-foreground">
                        mm
                      </Label>
                      <Input
                        id="toolbar-logo-size"
                        type="number"
                        min="10"
                        max="170"
                        step="1"
                        value={templateLogoWidthMm}
                        onChange={(e) => setTemplateLogoWidthMm(Number(e.target.value) || 36)}
                        className="w-[88px]"
                      />
                    </div>

                    <ToggleGroup
                      type="single"
                      value={templateLogoPosition}
                      onValueChange={(value) => {
                        if (value) setTemplateLogoPosition(value as LogoPosition);
                      }}
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                    >
                      {LOGO_POSITION_OPTIONS.map((option) => {
                        const Icon = option.icon;

                        return (
                          <Tooltip key={option.value}>
                            <TooltipTrigger asChild>
                              <ToggleGroupItem value={option.value} aria-label={option.label}>
                                <Icon className="h-4 w-4" />
                              </ToggleGroupItem>
                            </TooltipTrigger>
                            <TooltipContent>{option.tooltip}</TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </ToggleGroup>

                    {templateLogoDataUrl ? (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setTemplateLogoDataUrl('')}>
                        Remover logo
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sem logo</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 rounded-[1.2rem] border border-border/80 bg-white/78 px-3 py-2">
                    <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Texto
                    </span>

                    {TOOLBAR_BUTTONS.map((item) => {
                      if ('separator' in item) {
                        return <Separator key={item.key} orientation="vertical" className="mx-1 h-6" />;
                      }

                      const formatKey = item.key as keyof typeof FORMAT_MARKERS;
                      const Icon = 'icon' in item ? item.icon : null;

                      return (
                        <Tooltip key={item.key}>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className={Icon ? 'h-8 w-8 px-0' : 'px-2 text-xs'}
                              onClick={() => applyFormat(formatKey)}
                            >
                              {Icon ? <Icon className="h-4 w-4" /> : 'label' in item ? item.label : null}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{item.tooltip}</TooltipContent>
                        </Tooltip>
                      );
                    })}

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 px-0"
                          onClick={() => indentCurrentLine(false)}
                        >
                          <IndentIncrease className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Aumentar recuo da linha atual</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 px-0"
                          onClick={() => indentCurrentLine(true)}
                        >
                          <IndentDecrease className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Diminuir recuo da linha atual</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </TooltipProvider>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="xl:hidden">
            <div className="border-b border-border/60">{editorPanel}</div>
            <div>{previewPanel}</div>
          </div>

          <div className="hidden xl:block">
            <ResizablePanelGroup direction="horizontal" className="min-h-[calc(100vh-300px)]">
              <ResizablePanel defaultSize={56} minSize={34}>
                {editorPanel}
              </ResizablePanel>

              <ResizableHandle withHandle className="bg-white/68" />

              <ResizablePanel defaultSize={44} minSize={28}>
                {previewPanel}
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
