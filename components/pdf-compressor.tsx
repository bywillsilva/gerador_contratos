'use client';

import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  Archive,
  Download,
  FileCheck2,
  Loader2,
  RotateCcw,
  Upload,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useNavigation } from '@/lib/navigation-context';

type CompressionLevel = 'leve' | 'equilibrada' | 'maxima';

interface CompressionResult {
  blob: Blob;
  fileName: string;
  originalSize: number;
  compressedSize: number;
}

const COMPRESSION_LEVELS: Array<{
  value: CompressionLevel;
  label: string;
  description: string;
}> = [
  {
    value: 'leve',
    label: 'Leve',
    description: 'Prioriza a qualidade maxima e a legibilidade, com reducao mais suave do arquivo.',
  },
  {
    value: 'equilibrada',
    label: 'Equilibrada',
    description: 'Mantem alta qualidade visual com compactacao moderada e segura para documentos importantes.',
  },
  {
    value: 'maxima',
    label: 'Maxima segura',
    description: 'Busca a maior reducao possivel, aceitando perda visual controlada para envio mais leve.',
  },
];

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function sanitizeFilename(value: string) {
  return value.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9_-]/g, '_') || 'pdf';
}

function getReductionPercentage(originalSize: number, compressedSize: number) {
  if (originalSize <= 0 || compressedSize >= originalSize) return 0;
  return ((originalSize - compressedSize) / originalSize) * 100;
}

async function compressPdfFile(file: File, level: CompressionLevel): Promise<CompressionResult> {
  const pdfjs = await import('pdfjs-dist');
  const { jsPDF } = await import('jspdf/dist/jspdf.es.min.js');
  const workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const profile =
    level === 'leve'
      ? { scale: 2, quality: 0.92 }
      : level === 'equilibrada'
        ? { scale: 1.65, quality: 0.84 }
        : { scale: 1.22, quality: 0.68 };

  const inputBytes = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: inputBytes, useWorkerFetch: false, isEvalSupported: false });
  const sourcePdf = await loadingTask.promise;

  if (sourcePdf.numPages === 0) {
    throw new Error('PDF sem paginas');
  }

  const firstPage = await sourcePdf.getPage(1);
  const firstViewport = firstPage.getViewport({ scale: 1 });
  const pdfDoc = new jsPDF({
    orientation: firstViewport.width >= firstViewport.height ? 'landscape' : 'portrait',
    unit: 'pt',
    format: [firstViewport.width, firstViewport.height],
    compress: true,
    putOnlyUsedFonts: true,
  });

  for (let pageNumber = 1; pageNumber <= sourcePdf.numPages; pageNumber += 1) {
    const page = await sourcePdf.getPage(pageNumber);
    const sourceViewport = page.getViewport({ scale: 1 });
    const renderViewport = page.getViewport({ scale: profile.scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { alpha: false });

    if (!context) {
      throw new Error('Nao foi possivel inicializar o canvas para compactacao.');
    }

    canvas.width = Math.max(1, Math.floor(renderViewport.width));
    canvas.height = Math.max(1, Math.floor(renderViewport.height));
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvas,
      canvasContext: context,
      viewport: renderViewport,
      background: 'rgb(255,255,255)',
    }).promise;

    const imageData = canvas.toDataURL('image/jpeg', profile.quality);
    const pageOrientation = sourceViewport.width >= sourceViewport.height ? 'landscape' : 'portrait';

    if (pageNumber > 1) {
      pdfDoc.addPage([sourceViewport.width, sourceViewport.height], pageOrientation);
    }

    pdfDoc.addImage(imageData, 'JPEG', 0, 0, sourceViewport.width, sourceViewport.height, undefined, 'MEDIUM');

    canvas.width = 0;
    canvas.height = 0;
  }

  const compressedBytes = pdfDoc.output('arraybuffer');
  const blob = new Blob([compressedBytes], { type: 'application/pdf' });

  return {
    blob,
    fileName: `${sanitizeFilename(file.name)}_compactado.pdf`,
    originalSize: file.size,
    compressedSize: compressedBytes.byteLength,
  };
}

export function PdfCompressor() {
  const { navigate } = useNavigation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('leve');
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<CompressionResult | null>(null);

  const reductionPercentage = useMemo(() => {
    if (!result) return 0;
    return getReductionPercentage(result.originalSize, result.compressedSize);
  }, [result]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setError('');
    setResult(null);

    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setPdfFile(null);
      setError('Selecione um arquivo PDF valido.');
      event.target.value = '';
      return;
    }

    setPdfFile(file);
    event.target.value = '';
  };

  const resetTool = () => {
    setPdfFile(null);
    setResult(null);
    setError('');
    setCompressionLevel('leve');
  };

  const handleCompress = async () => {
    if (!pdfFile) {
      setError('Selecione um PDF antes de compactar.');
      return;
    }

    setIsCompressing(true);
    setError('');
    setResult(null);

    try {
      const compressed = await compressPdfFile(pdfFile, compressionLevel);
      setResult(compressed);
    } catch (compressionError) {
      console.error('Erro ao compactar PDF:', compressionError);
      setError('Nao foi possivel compactar este PDF. Verifique se o arquivo esta protegido por senha ou corrompido.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;

    const url = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-10 sm:px-8">
      <div className="app-hero-surface mb-6 rounded-lg px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <span className="app-eyebrow">
              <Archive className="h-3.5 w-3.5" />
              Ferramenta PDF
            </span>
            <div>
              <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">Compactar PDF</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                Reduza o tamanho do arquivo preservando boa qualidade para envio, armazenamento e assinatura.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('dashboard')}>
              Voltar ao Painel
            </Button>
            <Button onClick={handleCompress} disabled={!pdfFile || isCompressing}>
              {isCompressing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Compactando...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Compactar Agora
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_380px]">
        <Card className="service-card">
          <CardHeader className="pb-4">
            <CardTitle>Arquivo de origem</CardTitle>
              <CardDescription>
              Ideal para PDFs comerciais, contratos, anexos e arquivos que precisam ocupar menos espaco com reducao real de megabytes.
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {!pdfFile ? (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.03] px-5 py-14 text-center transition-colors hover:bg-white/[0.06]"
              >
                <div className="service-icon">
                  <Upload className="h-6 w-6" />
                </div>
                <span className="mt-4 text-base font-semibold text-foreground">Selecionar PDF</span>
                <span className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
                  O arquivo fica no seu navegador durante o processo. Nada e enviado para um servidor externo.
                </span>
              </button>
            ) : (
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="service-icon">
                      <FileCheck2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{pdfFile.name}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{formatFileSize(pdfFile.size)}</Badge>
                        <Badge variant="outline">PDF original</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
                      Trocar arquivo
                    </Button>
                    <Button type="button" variant="ghost" onClick={resetTool}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Limpar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {error ? (
              <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-3">
              {COMPRESSION_LEVELS.map((option) => {
                const active = compressionLevel === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCompressionLevel(option.value)}
                    className={`rounded-lg border p-4 text-left transition-all ${
                      active
                        ? 'border-primary bg-primary/8 shadow-[0_18px_40px_rgba(0,0,0,0.06)]'
                        : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-foreground">{option.label}</span>
                      {active ? <Badge>Ativo</Badge> : <Badge variant="outline">Selecionar</Badge>}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="service-card">
          <CardHeader className="pb-4">
            <CardTitle>Resultado</CardTitle>
            <CardDescription>
              A compactacao agora reprocessa as paginas para gerar um PDF mais leve. Quanto mais pesado for o original, maior tende a ser o ganho.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result ? (
              <>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Antes
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-foreground">
                        {formatFileSize(result.originalSize)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Depois
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-foreground">
                        {formatFileSize(result.compressedSize)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Badge>{compressionLevel === 'leve' ? 'Leve' : compressionLevel === 'equilibrada' ? 'Equilibrada' : 'Maxima segura'}</Badge>
                    <Badge variant="outline">
                      {compressionLevel === 'leve'
                        ? 'Qualidade maxima'
                        : compressionLevel === 'equilibrada'
                          ? 'Alta qualidade'
                          : 'Reducao intensa'}
                    </Badge>
                    <Badge variant="outline">
                      {reductionPercentage > 0
                        ? `${reductionPercentage.toFixed(1)}% menor`
                        : 'Tamanho preservado'}
                    </Badge>
                  </div>
                </div>

                <Button onClick={handleDownload} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Baixar PDF Compactado
                </Button>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.03] px-4 py-10 text-center">
                <p className="text-sm font-medium text-foreground">Nenhum arquivo compactado ainda</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Selecione um PDF, escolha o nivel de compactacao e gere o arquivo final para download.
                </p>
              </div>
            )}

            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-muted-foreground">
              Melhor resultado: contratos, propostas e PDFs exportados digitalmente. Em scans fotograficos ou arquivos ja comprimidos, o ganho tende a ser menor.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
