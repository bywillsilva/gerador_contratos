// Processador unificado de templates para garantir consistencia
// entre preview, impressao e geracao de PDF.

// Estilos CSS inline para o documento final
export const DOCUMENT_STYLES = {
  page: {
    fontFamily: 'Georgia, "Times New Roman", Times, serif',
    fontSize: '12pt',
    lineHeight: '1.6',
    color: '#000',
    backgroundColor: '#fff',
  },
  h1: {
    fontSize: '16pt',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    margin: '24px 0 16px 0',
    lineHeight: '1.3',
  },
  h2: {
    fontSize: '13pt',
    fontWeight: 'bold',
    margin: '20px 0 10px 0',
    lineHeight: '1.3',
  },
  paragraph: {
    margin: '0 0 10px 0',
    textAlign: 'justify' as const,
    textIndent: '0',
  },
  center: {
    textAlign: 'center' as const,
    margin: '10px 0',
  },
  right: {
    textAlign: 'right' as const,
    margin: '10px 0',
  },
  list: {
    paddingLeft: '24px',
    margin: '6px 0',
  },
} as const;

interface RenderOptions {
  highlightTags?: boolean;
}

const BULLET_SYMBOL = '\u2022';
const BULLET_PREFIXES = [`${BULLET_SYMBOL} `, 'â€¢ ', 'Ã¢â‚¬Â¢ '];

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightDynamicTags(value: string): string {
  return value.replace(
    /\{\{([^}]+)\}\}/g,
    '<span style="display: inline-block; background-color: #3B82F6; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 500; margin: 0 2px; font-family: monospace;">{{$1}}</span>'
  );
}

function applyInlineFormatting(value: string, options: RenderOptions): string {
  let html = escapeHtml(value);

  if (options.highlightTags) {
    html = highlightDynamicTags(html);
  }

  html = html.replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight: bold;">$1</strong>');
  html = html.replace(/__(.+?)__/g, '<u style="text-decoration: underline;">$1</u>');
  html = html.replace(/(?<!_)_([^_]+?)_(?!_)/g, '<em style="font-style: italic;">$1</em>');

  return html;
}

function renderAlignedBlock(content: string, align: 'center' | 'right', options: RenderOptions): string {
  const style = align === 'center' ? DOCUMENT_STYLES.center : DOCUMENT_STYLES.right;
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => applyInlineFormatting(line, options))
    .join('<br/>');

  return `<div style="text-align: ${style.textAlign}; margin: ${style.margin};">${lines}</div>`;
}

function renderParagraph(content: string, options: RenderOptions): string {
  const html = applyInlineFormatting(content.trim(), options).replace(/\n/g, '<br/>');
  return `<p style="margin: ${DOCUMENT_STYLES.paragraph.margin}; text-align: ${DOCUMENT_STYLES.paragraph.textAlign}; text-indent: ${DOCUMENT_STYLES.paragraph.textIndent};">${html}</p>`;
}

function renderTemplate(content: string, options: RenderOptions = {}): string {
  const normalized = content.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const blocks: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const trimmedLine = rawLine.trim();

    if (!trimmedLine) {
      blocks.push('<div style="height: 10px;"></div>');
      continue;
    }

    if (trimmedLine.startsWith('[CENTER]')) {
      let blockContent = rawLine;
      while (!blockContent.includes('[/CENTER]') && index + 1 < lines.length) {
        index += 1;
        blockContent += `\n${lines[index]}`;
      }

      const innerContent = blockContent.replace(/\[CENTER\]/g, '').replace(/\[\/CENTER\]/g, '').trim();
      blocks.push(renderAlignedBlock(innerContent, 'center', options));
      continue;
    }

    if (trimmedLine.startsWith('[RIGHT]')) {
      let blockContent = rawLine;
      while (!blockContent.includes('[/RIGHT]') && index + 1 < lines.length) {
        index += 1;
        blockContent += `\n${lines[index]}`;
      }

      const innerContent = blockContent.replace(/\[RIGHT\]/g, '').replace(/\[\/RIGHT\]/g, '').trim();
      blocks.push(renderAlignedBlock(innerContent, 'right', options));
      continue;
    }

    if (trimmedLine.startsWith('## ')) {
      blocks.push(
        `<h2 style="font-size: ${DOCUMENT_STYLES.h2.fontSize}; font-weight: ${DOCUMENT_STYLES.h2.fontWeight}; margin: ${DOCUMENT_STYLES.h2.margin}; line-height: ${DOCUMENT_STYLES.h2.lineHeight};">${applyInlineFormatting(trimmedLine.slice(3), options)}</h2>`
      );
      continue;
    }

    if (trimmedLine.startsWith('# ')) {
      blocks.push(
        `<h1 style="font-size: ${DOCUMENT_STYLES.h1.fontSize}; font-weight: ${DOCUMENT_STYLES.h1.fontWeight}; text-align: ${DOCUMENT_STYLES.h1.textAlign}; margin: ${DOCUMENT_STYLES.h1.margin}; line-height: ${DOCUMENT_STYLES.h1.lineHeight};">${applyInlineFormatting(trimmedLine.slice(2), options)}</h1>`
      );
      continue;
    }

    if (BULLET_PREFIXES.some((prefix) => trimmedLine.startsWith(prefix))) {
      const itemText = trimmedLine.replace(/^(?:\u2022 |â€¢ |Ã¢â‚¬Â¢ )/, '');
      blocks.push(
        `<div style="padding-left: ${DOCUMENT_STYLES.list.paddingLeft}; margin: ${DOCUMENT_STYLES.list.margin};">${BULLET_SYMBOL} ${applyInlineFormatting(itemText, options)}</div>`
      );
      continue;
    }

    blocks.push(renderParagraph(rawLine, options));
  }

  return blocks.join('\n');
}

// Converte marcadores para estilos CSS inline (para HTML/PDF)
export function processTemplateToHTML(content: string): string {
  return renderTemplate(content);
}

// Gera o HTML completo do documento para impressao/PDF
export function generateDocumentHTML(content: string, title: string = 'Contrato'): string {
  const processedContent = processTemplateToHTML(content);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: ${DOCUMENT_STYLES.page.fontFamily};
      font-size: ${DOCUMENT_STYLES.page.fontSize};
      line-height: ${DOCUMENT_STYLES.page.lineHeight};
      color: ${DOCUMENT_STYLES.page.color};
      background-color: ${DOCUMENT_STYLES.page.backgroundColor};
      padding: 0;
      margin: 0;
    }
    .document-content {
      width: 100%;
    }
    @media print {
      body {
        padding: 0;
      }
    }
    @media screen {
      body {
        padding: 20mm;
      }
    }
  </style>
</head>
<body>
  <main class="document-content">
    ${processedContent}
  </main>
</body>
</html>`;
}

// Para preview com destaque de tags (usado no editor de template)
export function processTemplateForPreview(content: string): string {
  return renderTemplate(content, { highlightTags: true });
}
