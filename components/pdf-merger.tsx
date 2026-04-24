'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Download,
  FileCheck2,
  Files,
  Loader2,
  Plus,
  Upload,
  X,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useNavigation } from '@/lib/navigation-context';

interface PdfItem {
  id: string;
  file: File;
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function createPdfItem(file: File): PdfItem {
  return {
    id: `${file.name}_${file.size}_${file.lastModified}_${crypto.randomUUID()}`,
    file,
  };
}

function sanitizeFilename(value: string) {
  return value.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9_-]/g, '_') || 'pdf';
}

export function PdfMerger() {
  const { navigate } = useNavigation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pdfs, setPdfs] = useState<PdfItem[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState('');

  const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setError('');

    const invalidFile = selectedFiles.find(
      (file) => file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')
    );

    if (invalidFile) {
      setError('Selecione apenas arquivos PDF.');
      event.target.value = '';
      return;
    }

    setPdfs((current) => [...current, ...selectedFiles.map(createPdfItem)]);
    event.target.value = '';
  };

  const removePdf = (id: string) => {
    setPdfs((current) => current.filter((item) => item.id !== id));
  };

  const movePdf = (id: string, direction: 'up' | 'down') => {
    setPdfs((current) => {
      const currentIndex = current.findIndex((item) => item.id === id);
      if (currentIndex === -1) return current;

      const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (nextIndex < 0 || nextIndex >= current.length) return current;

      const next = [...current];
      const [item] = next.splice(currentIndex, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  };

  const clearAll = () => {
    setPdfs([]);
    setError('');
  };

  const mergePdfs = async () => {
    if (pdfs.length < 2) {
      setError('Selecione pelo menos dois PDFs antes de juntar.');
      return;
    }

    setIsMerging(true);
    setError('');

    try {
      const { PDFDocument } = await import('pdf-lib');
      const mergedPdf = await PDFDocument.create();

      for (const item of pdfs) {
        const sourcePdf = await PDFDocument.load(await item.file.arrayBuffer(), { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const bytes = await mergedPdf.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const baseName = sanitizeFilename(pdfs[0].file.name);

      link.href = url;
      link.download = `${baseName}_mais_${pdfs.length - 1}_pdfs_unificado.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (mergeError) {
      console.error('Erro ao juntar PDFs:', mergeError);
      setError('Nao foi possivel juntar estes PDFs. Verifique se algum arquivo esta protegido por senha.');
    } finally {
      setIsMerging(false);
    }
  };

  const canMerge = pdfs.length >= 2 && !isMerging;

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8">
      <div className="app-hero-surface mb-6 rounded-lg px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <span className="app-eyebrow">
              <Files className="h-3.5 w-3.5" />
              Ferramenta PDF
            </span>
            <div>
              <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">Juntar PDFs</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                Selecione quantos PDFs quiser, ajuste a ordem e gere um unico arquivo final.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('dashboard')}>
              Voltar ao Painel
            </Button>
            <Button onClick={mergePdfs} disabled={!canMerge}>
              {isMerging ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Juntando...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar PDF Unido
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <Card className="service-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Arquivos selecionados</CardTitle>
              <CardDescription>A ordem abaixo sera a ordem das paginas no PDF final.</CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              <Input
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf"
                multiple
                onChange={handleFilesChange}
                className="hidden"
              />
              <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar PDFs
              </Button>
              <Button type="button" variant="ghost" onClick={clearAll} disabled={pdfs.length === 0}>
                Limpar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {pdfs.length === 0 ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.03] px-5 py-12 text-center transition-colors hover:bg-white/[0.06]"
            >
              <div className="service-icon">
                <Upload className="h-6 w-6" />
              </div>
              <span className="mt-4 text-base font-semibold text-foreground">Selecionar PDFs</span>
              <span className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
                Voce pode selecionar varios arquivos de uma vez ou adicionar novos PDFs depois.
              </span>
            </button>
          ) : (
            <div className="space-y-3">
              {pdfs.map((item, index) => (
                <div
                  key={item.id}
                  className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[auto_minmax(0,1fr)_auto]"
                >
                  <div className="service-icon">
                    <FileCheck2 className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{index + 1}</Badge>
                      <p className="truncate font-medium text-foreground">{item.file.name}</p>
                      <Badge variant="outline">{formatFileSize(item.file.size)}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Posicao {index + 1} no PDF unificado
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => movePdf(item.id, 'up')}
                      disabled={index === 0}
                      aria-label="Mover PDF para cima"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => movePdf(item.id, 'down')}
                      disabled={index === pdfs.length - 1}
                      aria-label="Mover PDF para baixo"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePdf(item.id)}
                      aria-label="Remover PDF"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error ? (
            <div className="rounded-lg border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
