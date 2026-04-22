import extenso from 'extenso';
import { DEFAULT_DOCUMENT_FONT } from './types';
import type {
  ClientDataFisica,
  ClientDataJuridica,
  ContractData,
  ContractTemplate,
  FormData,
  PaymentInstallment,
  PaymentMethod,
} from './types';

const STORAGE_KEYS = {
  TEMPLATES: 'contract_templates',
  CURRENT_TEMPLATE: 'current_template',
  FORM_DATA: 'contract_form_data',
} as const;

function parseBRCurrency(value: string): number {
  let cleaned = value.replace(/[^\d,.-]/g, '');

  if (cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  }

  return parseFloat(cleaned);
}

function joinNonEmpty(parts: Array<string | undefined | null>, separator: string = ', '): string {
  return parts.map((part) => (part ?? '').trim()).filter(Boolean).join(separator);
}

function valueOrDash(value: string): string {
  return value.trim() || '________________';
}

function formatOptionalCurrency(value: string): string {
  return value.trim() ? formatCurrency(value) : '________________';
}

function getPaymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case 'pix':
      return 'PIX';
    case 'boleto':
      return 'Boleto bancario';
    case 'debito':
      return 'Cartao de debito';
    case 'credito':
      return 'Cartao de credito';
    case 'misto':
      return 'Pagamento misto';
    default:
      return '';
  }
}

function getInstallmentMethodLabel(method: PaymentInstallment['metodo']): string {
  switch (method) {
    case 'pix':
      return 'PIX';
    case 'boleto':
      return 'boleto bancario';
    case 'debito':
      return 'cartao de debito';
    case 'credito':
      return 'cartao de credito';
    default:
      return 'forma de pagamento';
  }
}

function hasDetailedInstallments(contractData: ContractData): boolean {
  return (
    contractData.parcelas_pagamento.length > 0 &&
    contractData.parcelas_pagamento.some((installment) => installment.valor.trim())
  );
}

function buildDetailedInstallmentItems(contractData: ContractData): string[] {
  return contractData.parcelas_pagamento.map((installment, index) => {
    const valor = formatOptionalCurrency(installment.valor);
    const methodLabel = getInstallmentMethodLabel(installment.metodo);
    const dueDate = installment.vencimento ? `, com vencimento em ${formatDate(installment.vencimento)}` : '';
    const note = installment.observacao.trim() ? ` (${installment.observacao.trim()})` : '';

    return `3.1.${index + 1}. ${valor} - via ${methodLabel}${dueDate}${note};`;
  });
}

function buildPaymentMethodItems(contractData: ContractData): string[] {
  if (hasDetailedInstallments(contractData)) {
    return buildDetailedInstallmentItems(contractData);
  }

  const items: string[] = [];
  const vencimentoBoleto = contractData.vencimento_boleto
    ? formatDate(contractData.vencimento_boleto)
    : '________________';

  if (contractData.forma_pagamento === 'pix' || contractData.forma_pagamento === 'misto') {
    items.push(`3.1.1. ${formatOptionalCurrency(contractData.valor_pix)} - via PIX;`);
  }

  if (contractData.forma_pagamento === 'boleto' || contractData.forma_pagamento === 'misto') {
    const prefix = items.length + 1;
    items.push(
      `3.1.${prefix}. ${formatOptionalCurrency(contractData.valor_boleto)} - via boleto bancario, com vencimento em ${vencimentoBoleto};`
    );
  }

  if (contractData.forma_pagamento === 'debito' || contractData.forma_pagamento === 'misto') {
    const prefix = items.length + 1;
    items.push(`3.1.${prefix}. ${formatOptionalCurrency(contractData.valor_debito)} - via cartao de debito;`);
  }

  if (contractData.forma_pagamento === 'credito' || contractData.forma_pagamento === 'misto') {
    const prefix = items.length + 1;
    const parcelas = contractData.parcelas_credito.trim()
      ? `, podendo ser parcelado em ate ${contractData.parcelas_credito.trim()} parcela(s)`
      : '';
    items.push(
      `3.1.${prefix}. ${formatOptionalCurrency(contractData.valor_credito)} - via cartao de credito${parcelas};`
    );
  }

  if (items.length === 0) {
    items.push('3.1.1. __________________ - forma de pagamento a definir.');
  }

  return items;
}

function buildPaymentClause(contractData: ContractData): string {
  const lines: string[] = [];
  const paymentItems = buildPaymentMethodItems(contractData);
  const entradaPercentual = contractData.entrada_percentual.trim();
  const hasCreditInstallment = contractData.parcelas_pagamento.some(
    (installment) => installment.metodo === 'credito'
  );
  const usesCredit =
    hasCreditInstallment || contractData.forma_pagamento === 'credito' || contractData.forma_pagamento === 'misto';

  lines.push('3.1. O pagamento podera ser realizado da seguinte forma:');
  lines.push(...paymentItems);

  if (usesCredit) {
    lines.push(
      '3.2. O pagamento via cartao de credito podera ser efetuado de forma parcelada, conforme regras da administradora do cartao. Quaisquer juros, taxas de parcelamento, tarifas operacionais ou encargos financeiros cobrados pela operadora serao de inteira responsabilidade do CONTRATANTE e acrescidos ao valor da parcela no momento da transacao.'
    );
    lines.push(
      '3.2.1. A CONTRATADA nao se responsabiliza por eventuais recusas de transacao, limites indisponiveis ou restricoes impostas pela administradora do cartao.'
    );
  }

  lines.push(
    '3.3. Em caso de atrasos na obra por motivo exclusivo do CONTRATANTE, o cronograma de pagamentos devera ser mantido conforme as datas pactuadas, independentemente do estagio da execucao contratual, aplicando-se o disposto no art. 476 do Codigo Civil.'
  );
  lines.push(
    '3.4. Considerando que as esquadrias objeto deste contrato sao produzidas sob medida, impossibilitando sua reutilizacao comercial pela CONTRATADA, e que sua fabricacao envolve custos imediatos com materiais, mao de obra, planejamento e reserva de agenda produtiva, os pagamentos observarao a seguinte proporcao:'
  );

  if (entradaPercentual) {
    lines.push(
      `3.4.1. Na assinatura do contrato, o CONTRATANTE pagara o valor correspondente a ${entradaPercentual}% do total contratado, destinado a cobrir os custos iniciais, mobilizacao da equipe tecnica e garantir a disponibilidade da producao, considerando que as esquadrias serao fabricadas sob medida;`
    );
  } else {
    lines.push(
      '3.4.1. Na assinatura do contrato, o CONTRATANTE pagara o valor correspondente ao percentual de entrada pactuado entre as partes, destinado a cobrir os custos iniciais, mobilizacao da equipe tecnica e garantir a disponibilidade da producao, considerando que as esquadrias serao fabricadas sob medida;'
    );
  }

  lines.push(
    '3.4.2. Na fase de medicao tecnica e fabricacao, o CONTRATANTE realizara o pagamento correspondente a esta etapa, compondo a evolucao financeira necessaria para que, ate a data prevista para a instalacao, esteja quitado no minimo 90% do valor total contratado;'
  );
  lines.push('3.4.3. O saldo remanescente de 10% devera ser pago ao final da instalacao das esquadrias;');
  lines.push(
    '3.4.4. A ausencia de pagamento de quaisquer parcelas autoriza a CONTRATADA a suspender a fabricacao, entrega ou instalacao ate a regularizacao, sem prejuizo da cobranca das parcelas vencidas e vincendas.'
  );
  lines.push(
    '3.4.5. No caso de a CONTRATADA ultrapassar o prazo estabelecido para a fabricacao ou instalacao por motivo que lhe seja exclusivamente atribuivel, sera assegurada ao CONTRATANTE a aplicacao de multa moratoria limitada a 10% sobre o valor da etapa em atraso.'
  );

  if (contractData.observacoes_pagamento.trim()) {
    lines.push(contractData.observacoes_pagamento.trim());
  }

  if (contractData.condicao_fechamento.trim()) {
    lines.push(contractData.condicao_fechamento.trim());
  }

  return lines.join('\n');
}

function buildClientQualification(clientData: FormData['clientData']): string {
  if (clientData.tipo === 'fisica') {
    const fisicaData = clientData as ClientDataFisica;

    return `${fisicaData.nome_cliente}, ${joinNonEmpty([
      fisicaData.nacionalidade,
      fisicaData.estado_civil,
      fisicaData.profissao,
    ])}, RG ${valueOrDash(fisicaData.rg)}, portador do CPF nº ${formatCPF(fisicaData.cpf)}, residente e domiciliado na ${valueOrDash(fisicaData.endereco)}, CEP ${formatCEP(fisicaData.cep)}, telefone ${formatPhone(fisicaData.telefone)}, e-mail ${valueOrDash(fisicaData.email)}, doravante denominado CONTRATANTE;`;
  }

  const juridicaData = clientData as ClientDataJuridica;
  const nomeFantasia = juridicaData.nome_fantasia.trim() ? `${juridicaData.nome_fantasia.trim()}, ` : '';

  return `${juridicaData.razao_social}, ${nomeFantasia}CNPJ nº ${formatCNPJ(juridicaData.cnpj)}, e-mail ${valueOrDash(juridicaData.email)}, com sede em ${valueOrDash(juridicaData.endereco)}, CEP ${formatCEP(juridicaData.cep)}. Neste ato representada por ${valueOrDash(juridicaData.representante_nome)}, ${joinNonEmpty([
    juridicaData.representante_nacionalidade,
    juridicaData.representante_estado_civil,
    juridicaData.representante_profissao,
  ])}, RG ${valueOrDash(juridicaData.representante_rg)}, portador do CPF nº ${formatCPF(juridicaData.representante_cpf)}, residente e domiciliado na ${valueOrDash(juridicaData.representante_endereco)}, CEP ${formatCEP(juridicaData.representante_cep)}, telefone ${formatPhone(juridicaData.representante_telefone)}, e-mail ${valueOrDash(juridicaData.representante_email)}, doravante denominado CONTRATANTE;`;
}

function buildSignatureName(clientData: FormData['clientData']): string {
  return clientData.tipo === 'fisica' ? clientData.nome_cliente : clientData.razao_social;
}

function buildSignatureDocument(clientData: FormData['clientData']): string {
  return clientData.tipo === 'fisica'
    ? `CPF: ${formatCPF(clientData.cpf)}`
    : `CNPJ: ${formatCNPJ(clientData.cnpj)}`;
}

export function formatCurrency(value: string | number): string {
  const numValue = typeof value === 'string' ? parseBRCurrency(value) : value;
  if (isNaN(numValue)) return 'R$ 0,00';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
}

export function valueToExtenso(value: string | number): string {
  try {
    const numValue = typeof value === 'string' ? parseBRCurrency(value) : value;

    if (isNaN(numValue) || numValue === 0) return 'zero reais';

    return extenso(numValue, { mode: 'currency' });
  } catch {
    return 'valor invalido';
  }
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned ? cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '________________';
}

export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '');
  return cleaned ? cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5') : '________________';
}

export function formatCEP(cep: string): string {
  const cleaned = cep.replace(/\D/g, '');
  return cleaned ? cleaned.replace(/(\d{5})(\d{3})/, '$1-$2') : '________________';
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (!cleaned) return '________________';

  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }

  return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
}

export function replaceTagsInTemplate(template: string, formData: FormData): string {
  let result = template;
  const { clientData, contractData } = formData;

  const replacements: Record<string, string> = {
    numero_contrato: valueOrDash(contractData.numero_contrato),
    valor: formatCurrency(contractData.valor),
    valor_extenso: valueToExtenso(contractData.valor),
    data: formatDate(contractData.data),
    endereco_obra: valueOrDash(contractData.endereco_obra),
    orcamento_numero: valueOrDash(contractData.orcamento_numero),
    forma_pagamento: getPaymentMethodLabel(contractData.forma_pagamento),
    condicao_pagamento: buildPaymentClause(contractData),
    qualificacao_contratante: buildClientQualification(clientData),
    assinatura_contratante_nome: buildSignatureName(clientData),
    assinatura_contratante_documento: buildSignatureDocument(clientData),
    valor_pix: formatOptionalCurrency(contractData.valor_pix),
    valor_boleto: formatOptionalCurrency(contractData.valor_boleto),
    vencimento_boleto: contractData.vencimento_boleto
      ? formatDate(contractData.vencimento_boleto)
      : '________________',
    valor_debito: formatOptionalCurrency(contractData.valor_debito),
    valor_credito: formatOptionalCurrency(contractData.valor_credito),
    parcelas_credito: valueOrDash(contractData.parcelas_credito),
    nome_cliente: '',
    cpf: '',
    rg: '',
    profissao: '',
    endereco: '',
    cep: '',
    nacionalidade: '',
    estado_civil: '',
    email: '',
    telefone: '',
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    representante_nome: '',
    representante_nacionalidade: '',
    representante_estado_civil: '',
    representante_profissao: '',
    representante_rg: '',
    representante_cpf: '',
    representante_endereco: '',
    representante_cep: '',
    representante_email: '',
    representante_telefone: '',
  };

  if (clientData.tipo === 'fisica') {
    const fisicaData = clientData as ClientDataFisica;

    replacements.nome_cliente = fisicaData.nome_cliente;
    replacements.cpf = formatCPF(fisicaData.cpf);
    replacements.rg = valueOrDash(fisicaData.rg);
    replacements.profissao = valueOrDash(fisicaData.profissao);
    replacements.endereco = valueOrDash(fisicaData.endereco);
    replacements.cep = formatCEP(fisicaData.cep);
    replacements.nacionalidade = valueOrDash(fisicaData.nacionalidade);
    replacements.estado_civil = valueOrDash(fisicaData.estado_civil);
    replacements.email = valueOrDash(fisicaData.email);
    replacements.telefone = formatPhone(fisicaData.telefone);
    replacements.razao_social = fisicaData.nome_cliente;
  } else {
    const juridicaData = clientData as ClientDataJuridica;

    replacements.nome_cliente = juridicaData.razao_social;
    replacements.endereco = valueOrDash(juridicaData.endereco);
    replacements.cep = formatCEP(juridicaData.cep);
    replacements.email = valueOrDash(juridicaData.email);
    replacements.telefone = formatPhone(juridicaData.telefone);
    replacements.razao_social = juridicaData.razao_social;
    replacements.nome_fantasia = valueOrDash(juridicaData.nome_fantasia);
    replacements.cnpj = formatCNPJ(juridicaData.cnpj);
    replacements.representante_nome = valueOrDash(juridicaData.representante_nome);
    replacements.representante_nacionalidade = valueOrDash(juridicaData.representante_nacionalidade);
    replacements.representante_estado_civil = valueOrDash(juridicaData.representante_estado_civil);
    replacements.representante_profissao = valueOrDash(juridicaData.representante_profissao);
    replacements.representante_rg = valueOrDash(juridicaData.representante_rg);
    replacements.representante_cpf = formatCPF(juridicaData.representante_cpf);
    replacements.representante_endereco = valueOrDash(juridicaData.representante_endereco);
    replacements.representante_cep = formatCEP(juridicaData.representante_cep);
    replacements.representante_email = valueOrDash(juridicaData.representante_email);
    replacements.representante_telefone = formatPhone(juridicaData.representante_telefone);
    replacements.cpf = formatCPF(juridicaData.representante_cpf);
  }

  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }

  result = result.replace(/[^\S\r\n]{2,}/g, ' ');
  result = result.replace(/,\s*,/g, ',');

  return result;
}

export function saveTemplate(template: ContractTemplate): void {
  if (typeof window === 'undefined') return;

  const templates = getTemplates();
  const existingIndex = templates.findIndex((t) => t.id === template.id);

  if (existingIndex >= 0) {
    templates[existingIndex] = { ...template, updatedAt: new Date().toISOString() };
  } else {
    templates.push(template);
  }

  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
}

export function getTemplates(): ContractTemplate[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    if (!data) return [];

    return (JSON.parse(data) as Array<Partial<ContractTemplate>>).map((template) => ({
      id: template.id || generateId(),
      name: template.name || 'Template sem nome',
      content: template.content || '',
      fontFamily: template.fontFamily || DEFAULT_DOCUMENT_FONT,
      logoDataUrl: template.logoDataUrl || '',
      logoWidthMm: template.logoWidthMm || 36,
      logoPosition: template.logoPosition || 'center',
      createdAt: template.createdAt || new Date().toISOString(),
      updatedAt: template.updatedAt || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export function deleteTemplate(id: string): void {
  if (typeof window === 'undefined') return;

  const templates = getTemplates().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
}

export function setCurrentTemplate(content: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEYS.CURRENT_TEMPLATE, content);
}

export function getCurrentTemplate(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(STORAGE_KEYS.CURRENT_TEMPLATE);
}

export function saveFormData(data: FormData): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEYS.FORM_DATA, JSON.stringify(data));
}

export function getFormData(): FormData | null {
  if (typeof window === 'undefined') return null;

  try {
    const data = sessionStorage.getItem(STORAGE_KEYS.FORM_DATA);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function generateId(): string {
  return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
