// Processador unificado de templates para garantir consistencia
// entre preview, impressao e geracao de PDF.

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
  left: {
    textAlign: 'left' as const,
    margin: '10px 0',
  },
  justify: {
    textAlign: 'justify' as const,
    margin: '10px 0',
  },
  list: {
    paddingLeft: '24px',
    margin: '6px 0',
  },
  orderedList: {
    basePaddingLeft: 24,
    levelIndent: 18,
    margin: '6px 0',
  },
} as const;

interface RenderOptions {
  highlightTags?: boolean;
}

interface DocumentRenderOptions {
  fontFamily?: string;
  logoDataUrl?: string;
  logoWidthMm?: number;
  logoPosition?: 'left' | 'center' | 'right';
}

const BULLET_SYMBOL = '\u2022';
const BULLET_PREFIXES = [`${BULLET_SYMBOL} `, 'â€¢ ', 'Ã¢â‚¬Â¢ '];
const ORDERED_LIST_PATTERN = /^(\d+(?:\.\d+)*\.?)\s+(.+)$/;

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

function renderAlignedBlock(content: string, align: 'left' | 'center' | 'right' | 'justify', options: RenderOptions): string {
  const style = DOCUMENT_STYLES[align];
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => applyInlineFormatting(line, options))
    .join('<br/>');

  return `<div style="text-align: ${style.textAlign}; margin: ${style.margin};">${lines}</div>`;
}

function renderParagraph(content: string, options: RenderOptions): string {
  const leadingWhitespaceMatch = content.match(/^[\t ]*/);
  const leadingWhitespace = leadingWhitespaceMatch?.[0] ?? '';
  const indentLevel = Array.from(leadingWhitespace).reduce((total, character) => {
    if (character === '\t') return total + 1;
    return total + 0.25;
  }, 0);
  const paddingLeft = indentLevel > 0 ? `${indentLevel * 24}px` : '0';
  const html = applyInlineFormatting(content.trim(), options).replace(/\n/g, '<br/>');

  return `<p style="margin: ${DOCUMENT_STYLES.paragraph.margin}; text-align: ${DOCUMENT_STYLES.paragraph.textAlign}; text-indent: ${DOCUMENT_STYLES.paragraph.textIndent}; padding-left: ${paddingLeft};">${html}</p>`;
}

function renderOrderedListItem(prefix: string, content: string, options: RenderOptions): string {
  const nestingLevel = Math.max(prefix.split('.').filter(Boolean).length - 1, 0);
  const paddingLeft =
    DOCUMENT_STYLES.orderedList.basePaddingLeft +
    nestingLevel * DOCUMENT_STYLES.orderedList.levelIndent;

  return `<div style="padding-left: ${paddingLeft}px; margin: ${DOCUMENT_STYLES.orderedList.margin};"><span style="font-weight: 600;">${escapeHtml(prefix)}</span> ${applyInlineFormatting(content, options)}</div>`;
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

    if (trimmedLine.startsWith('[LEFT]')) {
      let blockContent = rawLine;
      while (!blockContent.includes('[/LEFT]') && index + 1 < lines.length) {
        index += 1;
        blockContent += `\n${lines[index]}`;
      }

      const innerContent = blockContent.replace(/\[LEFT\]/g, '').replace(/\[\/LEFT\]/g, '').trim();
      blocks.push(renderAlignedBlock(innerContent, 'left', options));
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

    if (trimmedLine.startsWith('[JUSTIFY]')) {
      let blockContent = rawLine;
      while (!blockContent.includes('[/JUSTIFY]') && index + 1 < lines.length) {
        index += 1;
        blockContent += `\n${lines[index]}`;
      }

      const innerContent = blockContent.replace(/\[JUSTIFY\]/g, '').replace(/\[\/JUSTIFY\]/g, '').trim();
      blocks.push(renderAlignedBlock(innerContent, 'justify', options));
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

    const orderedListMatch = trimmedLine.match(ORDERED_LIST_PATTERN);
    if (orderedListMatch) {
      const [, prefix, itemText] = orderedListMatch;
      blocks.push(renderOrderedListItem(prefix, itemText, options));
      continue;
    }

    blocks.push(renderParagraph(rawLine, options));
  }

  return blocks.join('\n');
}

export function processTemplateToHTML(content: string): string {
  return renderTemplate(content);
}

function renderDocumentHeader(options: DocumentRenderOptions): string {
  if (!options.logoDataUrl) return '';

  const widthMm = Math.min(Math.max(options.logoWidthMm || 36, 10), 170);
  const justifyContent =
    options.logoPosition === 'left'
      ? 'flex-start'
      : options.logoPosition === 'right'
        ? 'flex-end'
        : 'center';

  return `<header class="document-header" style="display: flex; width: 100%; justify-content: ${justifyContent}; margin: 0 0 14mm 0;"><img src="${escapeHtml(options.logoDataUrl)}" alt="Logo da empresa" style="display: block; width: ${widthMm}mm; height: auto; max-height: 20mm; object-fit: contain;" /></header>`;
}

export function generateDocumentBodyHTML(content: string, options: DocumentRenderOptions = {}): string {
  const processedContent = processTemplateToHTML(content);
  const headerHTML = renderDocumentHeader(options);

  return `${headerHTML}<main class="document-content">${processedContent}</main>`;
}

export function generateDocumentHTML(
  content: string,
  title: string = 'Contrato',
  options: DocumentRenderOptions = {}
): string {
  const fontFamily = options.fontFamily || DOCUMENT_STYLES.page.fontFamily;
  const documentBody = generateDocumentBodyHTML(content, options);
  const pageMargin = options.logoDataUrl ? '42mm 20mm 24mm 20mm' : '24mm 20mm';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    @page {
      size: A4;
      margin: ${pageMargin};
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: ${fontFamily};
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
    .document-header {
      display: flex;
      width: 100%;
      margin: 0 0 14mm 0;
    }
    h1, h2 {
      break-after: avoid;
      page-break-after: avoid;
    }
    .document-content div {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    @media print {
      body {
        padding: 0;
      }
      .document-header {
        position: fixed;
        top: -28mm;
        left: 0;
        right: 0;
        height: 22mm;
        align-items: flex-start;
        margin: 0 !important;
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
  ${documentBody}
</body>
</html>`;
}

export function processTemplateForPreview(content: string, options: DocumentRenderOptions = {}): string {
  const processedContent = renderTemplate(content, { highlightTags: true });
  const headerHTML = renderDocumentHeader(options);

  return `${headerHTML}<main class="document-content">${processedContent}</main>`;
}
