'use client';

import { useRef, useState } from 'react';
import { ArrowLeft, Download, Edit, Loader2, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigation } from '@/lib/navigation-context';
import { replaceTagsInTemplate, formatCurrency, valueToExtenso, formatDate } from '@/lib/contract-utils';
import {
  generateDocumentBodyHTML,
  generateDocumentHTML,
  DOCUMENT_STYLES,
} from '@/lib/template-processor';
import type { ClientDataFisica, FormData as ContractFormData } from '@/lib/types';

const PDF_PAGE_WIDTH_MM = 210;
const PDF_PAGE_HEIGHT_MM = 297;
const PDF_PAGE_MARGIN_MM = 20;
const MM_TO_PX = 96 / 25.4;

async function waitForDocumentAssets(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll('img'));

  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }

          image.onload = () => resolve();
          image.onerror = () => resolve();
        })
    )
  );

  if ('fonts' in document) {
    await document.fonts.ready;
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function prepareHtml2CanvasClone(clonedDocument: Document, clonedElement: HTMLElement) {
  clonedDocument.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => node.remove());

  const rootNodes = [
    clonedDocument.documentElement,
    clonedDocument.body,
    clonedElement,
    ...Array.from(clonedElement.querySelectorAll<HTMLElement>('*')),
  ];

  rootNodes.forEach((node) => {
    node.style.setProperty('background-image', 'none', 'important');
    node.style.setProperty('box-shadow', 'none', 'important');
    node.style.setProperty('caret-color', '#000000', 'important');
    node.style.setProperty('outline-color', 'transparent', 'important');
    node.style.setProperty('text-decoration-color', '#000000', 'important');
  });

  clonedDocument.documentElement.style.setProperty('background', '#ffffff', 'important');
  clonedDocument.body.style.setProperty('background', '#ffffff', 'important');
  clonedDocument.body.style.setProperty('color', '#000000', 'important');
  clonedElement.style.setProperty('background', '#ffffff', 'important');
  clonedElement.style.setProperty('color', '#000000', 'important');
  clonedElement.style.setProperty('border-color', 'transparent', 'important');
}

function getClientName(formData: ContractFormData) {
  return formData.clientData.tipo === 'fisica'
    ? (formData.clientData as ClientDataFisica).nome_cliente
    : formData.clientData.razao_social;
}

function sanitizeFilenamePart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 30);
}

function buildCommercialFilename(formData: ContractFormData) {
  const proposalNumber = formData.contractData.orcamento_numero.trim() || 'SEM NUMERO';
  const clientName = getClientName(formData).trim() || 'SEM CLIENTE';
  const safeProposalNumber = proposalNumber.replace(/[\\/:*?"<>|]/g, '-').trim();
  const safeClientName = clientName.replace(/[\\/:*?"<>|]/g, '-').trim().toUpperCase();

  return `CAPA CONTRATO - ${safeProposalNumber} - PROPOSTA COMERCIAL - ${safeClientName}.pdf`;
}

export function ContractPreview() {
  const {
    navigate,
    templateContent,
    templateFontFamily,
    templateLogoDataUrl,
    templateLogoWidthMm,
    templateLogoPosition,
    formData,
  } = useNavigation();
  const previewRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfError, setPdfError] = useState('');

  if (!formData) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
        <Card className="service-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Nenhum dado de contrato disponível.</p>
            <Button className="mt-4" onClick={() => navigate('form')}>
              Preencher Formulário
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const processedContent = replaceTagsInTemplate(templateContent, formData);
  const htmlContent = generateDocumentBodyHTML(processedContent, {
    logoDataUrl: templateLogoDataUrl,
    logoWidthMm: templateLogoWidthMm,
    logoPosition: templateLogoPosition,
  });

  // Função para imprimir/salvar como PDF usando a API de impressão do navegador
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita popups para imprimir o documento.');
      return;
    }

    const clientName =
      formData.clientData.tipo === 'fisica'
        ? (formData.clientData as ClientDataFisica).nome_cliente
        : formData.clientData.razao_social;

    // Usar a função unificada para gerar o HTML do documento
    const documentHTML = generateDocumentHTML(
      processedContent,
      `Contrato - ${clientName}`,
      {
        fontFamily: templateFontFamily,
        logoDataUrl: templateLogoDataUrl,
        logoWidthMm: templateLogoWidthMm,
        logoPosition: templateLogoPosition,
      }
    );
    printWindow.document.write(documentHTML);
    printWindow.document.close();
    
    // Aguardar o conteúdo carregar antes de imprimir
    printWindow.onload = () => {
      printWindow.print();
    };
    
    // Fallback para navegadores que não disparam onload
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const downloadPDFDirectly = async () => {
    setIsGenerating(true);
    setPdfError('');

    let staging: HTMLDivElement | null = null;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf/dist/jspdf.es.min.js');

      staging = document.createElement('div');
      staging.style.position = 'fixed';
      staging.style.left = '-10000px';
      staging.style.top = '0';
      staging.style.width = `${PDF_PAGE_WIDTH_MM}mm`;
      staging.style.background = '#ffffff';
      staging.style.pointerEvents = 'none';
      staging.style.fontFamily = templateFontFamily || DOCUMENT_STYLES.page.fontFamily;
      staging.style.fontSize = DOCUMENT_STYLES.page.fontSize;
      staging.style.lineHeight = DOCUMENT_STYLES.page.lineHeight;
      staging.style.color = DOCUMENT_STYLES.page.color;
      document.body.appendChild(staging);

      const sourceWrapper = document.createElement('div');
      sourceWrapper.style.width = '100%';
      sourceWrapper.innerHTML = htmlContent;
      staging.appendChild(sourceWrapper);

      const sourceHeader = sourceWrapper.querySelector('.document-header');
      const sourceContent = sourceWrapper.querySelector('.document-content');

      if (!sourceContent) {
        throw new Error('Conteúdo do documento não encontrado para geração do PDF.');
      }

      const sourceChildren = Array.from(sourceContent.children);
      sourceWrapper.remove();

      const pages: HTMLDivElement[] = [];
      const innerHeightPx = (PDF_PAGE_HEIGHT_MM - PDF_PAGE_MARGIN_MM * 2) * MM_TO_PX;

      const createPage = () => {
        const page = document.createElement('div');
        page.style.width = `${PDF_PAGE_WIDTH_MM}mm`;
        page.style.height = `${PDF_PAGE_HEIGHT_MM}mm`;
        page.style.boxSizing = 'border-box';
        page.style.padding = `${PDF_PAGE_MARGIN_MM}mm`;
        page.style.background = '#ffffff';
        page.style.overflow = 'hidden';

        if (sourceHeader) {
          page.appendChild(sourceHeader.cloneNode(true));
        }

        const content = document.createElement('main');
        content.className = 'document-content';
        content.style.width = '100%';
        page.appendChild(content);

        staging?.appendChild(page);
        pages.push(page);

        return content;
      };

      let currentContent = createPage();

      sourceChildren.forEach((child) => {
        const clone = child.cloneNode(true);
        currentContent.appendChild(clone);

        const headerHeight = currentContent.previousElementSibling?.getBoundingClientRect().height || 0;
        const availableHeight = innerHeightPx - headerHeight;

        if (currentContent.children.length > 1 && currentContent.scrollHeight > availableHeight) {
          currentContent.removeChild(clone);
          currentContent = createPage();
          currentContent.appendChild(clone);
        }
      });

      await waitForDocumentAssets(staging);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      for (let index = 0; index < pages.length; index += 1) {
        const canvas = await html2canvas(pages[index], {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          onclone: (clonedDocument, clonedElement) => {
            prepareHtml2CanvasClone(clonedDocument, clonedElement as HTMLElement);
          },
        });

        if (index > 0) {
          pdf.addPage();
        }

        pdf.addImage(canvas.toDataURL('image/jpeg', 0.96), 'JPEG', 0, 0, PDF_PAGE_WIDTH_MM, PDF_PAGE_HEIGHT_MM);
      }

      downloadBlob(pdf.output('blob'), buildCommercialFilename(formData));
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      const detail = error instanceof Error ? error.message : 'Erro inesperado ao montar o arquivo.';
      const message = `Não foi possível baixar o PDF diretamente. ${detail}`;
      setPdfError(message);
      alert(`${message} O botão Imprimir continua disponível como alternativa.`);
    } finally {
      staging?.remove();
      setIsGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8">
      <div className="app-hero-surface mb-6 rounded-lg px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-3">
            <span className="app-eyebrow">Documento final</span>
            <div>
              <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">Visualizar Contrato</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                Revise a composicao do documento antes de imprimir ou baixar o PDF final.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => navigate('form')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Editar Dados
            </Button>
            <Button variant="outline" onClick={() => navigate('editor')}>
              <Edit className="mr-2 h-4 w-4" />
              Editar Template
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            <Button onClick={downloadPDFDirectly} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar PDF
                </>
              )}
            </Button>
            {pdfError ? (
              <p className="basis-full text-xs leading-6 text-destructive sm:text-right">{pdfError}</p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Documento Simulado A4 */}
      <Card className="service-card overflow-hidden py-0">
          <CardHeader className="border-b border-white/10 bg-white/[0.03] py-3">
            <CardTitle className="flex flex-col gap-1 text-sm font-medium text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>Prévia do Documento (A4 - 210mm x 297mm)</span>
            <span className="text-xs">O PDF gerado terá esta aparência</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto bg-background/40 p-4 sm:p-6">
          {/* Página A4 simulada */}
          <div
            ref={previewRef}
            className="mx-auto min-w-[210mm] bg-white shadow-xl"
            style={{
              maxWidth: '210mm',
              minHeight: '297mm',
              padding: '20mm',
               fontFamily: templateFontFamily || DOCUMENT_STYLES.page.fontFamily,
              fontSize: DOCUMENT_STYLES.page.fontSize,
              lineHeight: DOCUMENT_STYLES.page.lineHeight,
              color: DOCUMENT_STYLES.page.color,
              backgroundColor: DOCUMENT_STYLES.page.backgroundColor,
            }}
          >
            <div
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Resumo dos Dados */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="service-card">
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Cliente</p>
            <p className="font-medium text-foreground">
              {formData.clientData.tipo === 'fisica'
                ? (formData.clientData as ClientDataFisica).nome_cliente
                : formData.clientData.razao_social}
            </p>
          </CardContent>
        </Card>
        <Card className="service-card">
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Valor</p>
            <p className="font-medium text-foreground">
              {formatCurrency(formData.contractData.valor)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {valueToExtenso(formData.contractData.valor)}
            </p>
          </CardContent>
        </Card>
        <Card className="service-card">
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Data</p>
            <p className="font-medium text-foreground">
              {formatDate(formData.contractData.data)}
            </p>
          </CardContent>
        </Card>
        <Card className="service-card lg:col-span-3">
          <CardContent className="flex flex-wrap items-center gap-2 py-4">
            <p className="mr-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Aparencia
            </p>
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-foreground">
              Fonte: {templateFontFamily}
            </span>
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-foreground">
              Logo: {templateLogoDataUrl ? 'Ativa' : 'Sem logo'}
            </span>
            {templateLogoDataUrl ? (
              <>
                <span className="rounded-full bg-muted px-3 py-1 text-xs text-foreground">
                  Tamanho: {templateLogoWidthMm} mm
                </span>
                <span className="rounded-full bg-muted px-3 py-1 text-xs text-foreground">
                  Posicao: {templateLogoPosition === 'left' ? 'Esquerda' : templateLogoPosition === 'right' ? 'Direita' : 'Centralizada'}
                </span>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
