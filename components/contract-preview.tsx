'use client';

import { useRef, useState } from 'react';
import { ArrowLeft, Download, Edit, Loader2, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigation } from '@/lib/navigation-context';
import { replaceTagsInTemplate, formatCurrency, valueToExtenso } from '@/lib/contract-utils';
import {
  generateDocumentBodyHTML,
  generateDocumentHTML,
  DOCUMENT_STYLES,
} from '@/lib/template-processor';
import type { ClientDataFisica } from '@/lib/types';

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

  if (!formData) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <Card>
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

  // Função para gerar PDF usando html2canvas + jsPDF (alternativa)
  const generatePDF = async () => {
    setIsGenerating(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      if (!previewRef.current) {
        throw new Error('Elemento de preview não encontrado');
      }

      // Renderizar o conteúdo em canvas
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Criar PDF A4
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Calcular dimensões mantendo proporção
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Se a imagem é mais alta que uma página, dividir em múltiplas páginas
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Nome do arquivo
      const clientName =
        formData.clientData.tipo === 'fisica'
          ? (formData.clientData as ClientDataFisica).nome_cliente
          : formData.clientData.razao_social;

      const sanitizedName = clientName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .substring(0, 30);

      const date = new Date().toISOString().split('T')[0];
      const filename = `contrato_${sanitizedName}_${date}.pdf`;

      pdf.save(filename);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      // Fallback para impressão
      alert('Não foi possível gerar o PDF diretamente. Use a opção de impressão e salve como PDF.');
      handlePrint();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 xl:px-8">
      <div className="app-hero-surface mb-6 rounded-[1.8rem] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-3">
            <span className="app-eyebrow">Documento final</span>
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-foreground">Visualizar Contrato</h2>
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
          <Button onClick={generatePDF} disabled={isGenerating}>
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
        </div>
      </div>
      </div>

      {/* Documento Simulado A4 */}
      <Card className="overflow-hidden border-white/60">
          <CardHeader className="border-b bg-white/55 py-3">
            <CardTitle className="flex flex-col gap-1 text-sm font-medium text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>Prévia do Documento (A4 - 210mm x 297mm)</span>
            <span className="text-xs">O PDF gerado terá esta aparência</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto bg-[#e6f6f6] p-4 sm:p-6">
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
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Cliente</p>
            <p className="font-medium text-foreground">
              {formData.clientData.tipo === 'fisica'
                ? (formData.clientData as ClientDataFisica).nome_cliente
                : formData.clientData.razao_social}
            </p>
          </CardContent>
        </Card>
        <Card>
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
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Data</p>
            <p className="font-medium text-foreground">
              {new Date(formData.contractData.data).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
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
