import extenso from 'extenso';
import { DEFAULT_DOCUMENT_FONT } from './types';
import type {
  ClientDataFisica,
  ClientDataJuridica,
  ContractData,
  ContractTemplate,
  ContractTemplateTransferFile,
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

function appendIfValue(parts: string[], label: string, value: string, formatter?: (input: string) => string) {
  const normalized = value.trim();
  if (!normalized) return;
  parts.push(`${label} ${formatter ? formatter(normalized) : normalized}`);
}

function appendPlainIfValue(parts: string[], value: string, formatter?: (input: string) => string) {
  const normalized = value.trim();
  if (!normalized) return;
  parts.push(formatter ? formatter(normalized) : normalized);
}

function valueOrDash(value: string): string {
  return value.trim() || '________________';
}

function formatOptionalCurrency(value: string): string {
  return value.trim() ? formatCurrency(value) : '________________';
}

function parseLocalDate(date: Date | string): Date {
  if (date instanceof Date) return date;

  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return new Date(date);

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function getPaymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case 'pix':
      return 'PIX';
    case 'boleto':
      return 'Boleto bancário';
    case 'debito':
      return 'Cartão de débito';
    case 'credito':
      return 'Cartão de crédito';
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
      return 'boleto bancário';
    case 'debito':
      return 'cartão de débito';
    case 'credito':
      return 'cartão de crédito';
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
        `3.1.${prefix}. ${formatOptionalCurrency(contractData.valor_boleto)} - via boleto bancário, com vencimento em ${vencimentoBoleto};`
    );
  }

  if (contractData.forma_pagamento === 'debito' || contractData.forma_pagamento === 'misto') {
    const prefix = items.length + 1;
      items.push(`3.1.${prefix}. ${formatOptionalCurrency(contractData.valor_debito)} - via cartão de débito;`);
  }

  if (contractData.forma_pagamento === 'credito' || contractData.forma_pagamento === 'misto') {
    const prefix = items.length + 1;
    const parcelas = contractData.parcelas_credito.trim()
      ? `, podendo ser parcelado em até ${contractData.parcelas_credito.trim()} parcela(s)`
      : '';
    items.push(
      `3.1.${prefix}. ${formatOptionalCurrency(contractData.valor_credito)} - via cartão de crédito${parcelas};`
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
  const entradaPercentual =
    contractData.entrada_percentual.trim() || calculateEntryPercentageFromInstallments(contractData);
  const hasCreditInstallment = contractData.parcelas_pagamento.some(
    (installment) => installment.metodo === 'credito'
  );
  const usesCredit =
    hasCreditInstallment || contractData.forma_pagamento === 'credito' || contractData.forma_pagamento === 'misto';

  lines.push('3.1. O pagamento poderá ser realizado da seguinte forma:');
  lines.push(...paymentItems);

  if (contractData.observacoes_pagamento.trim()) {
    lines.push(`3.1.${paymentItems.length + 1}. ${contractData.observacoes_pagamento.trim()}`);
  }

  if (usesCredit) {
    lines.push(
      '3.2. O pagamento via cartão de crédito poderá ser efetuado de forma parcelada, conforme regras da administradora do cartão. Quaisquer juros, taxas de parcelamento, tarifas operacionais ou encargos financeiros cobrados pela operadora serão de inteira responsabilidade do CONTRATANTE e acrescidos ao valor da parcela no momento da transação.'
    );
    lines.push(
      '3.2.1. A CONTRATADA não se responsabiliza por eventuais recusas de transação, limites indisponíveis ou restrições impostas pela administradora do cartão.'
    );
  }

  lines.push(
    '3.3. Em caso de atrasos na obra por motivo exclusivo do CONTRATANTE, o cronograma de pagamentos deverá ser mantido conforme as datas pactuadas, independentemente do estágio da execução contratual, aplicando-se o disposto no art. 476 do Código Civil.'
  );
  lines.push(
    '3.4. Considerando que as esquadrias objeto deste contrato são produzidas sob medida, impossibilitando sua reutilização comercial pela CONTRATADA, e que sua fabricação envolve custos imediatos com materiais, mão de obra, planejamento e reserva de agenda produtiva, os pagamentos observarão a seguinte proporção:'
  );

  if (entradaPercentual) {
    lines.push(
        `3.4.1. Na assinatura do contrato, o CONTRATANTE pagará o valor correspondente a ${entradaPercentual}% do total contratado, destinado a cobrir os custos iniciais, mobilização da equipe técnica e garantir a disponibilidade da produção, considerando que as esquadrias serão fabricadas sob medida;`
    );
  } else {
    lines.push(
        '3.4.1. Na assinatura do contrato, o CONTRATANTE pagará o valor correspondente ao percentual de entrada pactuado entre as partes, destinado a cobrir os custos iniciais, mobilização da equipe técnica e garantir a disponibilidade da produção, considerando que as esquadrias serão fabricadas sob medida;'
    );
  }

  lines.push(
    '3.4.2. Na fase de medição técnica e fabricação, o CONTRATANTE realizará o pagamento correspondente a esta etapa, compondo a evolução financeira necessária para que, até a data prevista para a instalação, esteja quitado no mínimo 90% do valor total contratado;'
  );
  lines.push('3.4.3. O saldo remanescente de 10% deverá ser pago ao final da instalação das esquadrias;');
  lines.push(
    '3.4.4. A ausência de pagamento de quaisquer parcelas autoriza a CONTRATADA a suspender a fabricação, entrega ou instalação até a regularização, sem prejuízo da cobrança das parcelas vencidas e vincendas.'
  );
  lines.push(
    '3.4.5. No caso de a CONTRATADA ultrapassar o prazo estabelecido para a fabricação ou instalação por motivo que lhe seja exclusivamente atribuível, será assegurada ao CONTRATANTE a aplicação de multa moratória limitada a 10% sobre o valor da etapa em atraso.'
  );

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

function buildClientQualificationSafe(clientData: FormData['clientData']): string {
  if (clientData.tipo === 'fisica') {
    const fisicaData = clientData as ClientDataFisica;
    const descriptors: string[] = [];
    const identityParts: string[] = [];
    const contactParts: string[] = [];

    appendPlainIfValue(descriptors, fisicaData.nacionalidade);
    appendPlainIfValue(descriptors, fisicaData.estado_civil);
    appendPlainIfValue(descriptors, fisicaData.profissao);
    appendIfValue(identityParts, 'RG', fisicaData.rg);
    identityParts.push(`portador do CPF nº ${formatCPF(fisicaData.cpf)}`);
    appendIfValue(contactParts, 'residente e domiciliado na', fisicaData.endereco);
    appendIfValue(contactParts, 'CEP', fisicaData.cep, formatCEP);
    appendIfValue(contactParts, 'telefone', fisicaData.telefone, formatPhone);
    appendIfValue(contactParts, 'e-mail', fisicaData.email);

    return [
      fisicaData.nome_cliente,
      joinNonEmpty(descriptors),
      joinNonEmpty(identityParts),
      joinNonEmpty(contactParts),
      'doravante denominado CONTRATANTE;',
    ]
      .filter(Boolean)
      .join(', ');
  }

  const juridicaData = clientData as ClientDataJuridica;
  const nomeFantasia = juridicaData.nome_fantasia.trim() ? `${juridicaData.nome_fantasia.trim()}, ` : '';
  const companyParts: string[] = [];
  const representativeDescriptors: string[] = [];
  const representativeParts: string[] = [];
  const representativeContactParts: string[] = [];
  const representativeValues = [
    juridicaData.representante_nome,
    juridicaData.representante_cpf,
    juridicaData.representante_rg,
    juridicaData.representante_nacionalidade,
    juridicaData.representante_estado_civil,
    juridicaData.representante_profissao,
    juridicaData.representante_endereco,
    juridicaData.representante_cep,
    juridicaData.representante_telefone,
    juridicaData.representante_email,
  ];
  const hasRepresentativeData = representativeValues.some((value) => value.trim());

  companyParts.push(`${juridicaData.razao_social}, ${nomeFantasia}CNPJ nº ${formatCNPJ(juridicaData.cnpj)}`.trim());
  appendIfValue(companyParts, 'e-mail', juridicaData.email);
  appendIfValue(companyParts, 'com sede em', juridicaData.endereco);
  appendIfValue(companyParts, 'CEP', juridicaData.cep, formatCEP);

  appendPlainIfValue(representativeDescriptors, juridicaData.representante_nacionalidade);
  appendPlainIfValue(representativeDescriptors, juridicaData.representante_estado_civil);
  appendPlainIfValue(representativeDescriptors, juridicaData.representante_profissao);
  appendIfValue(representativeParts, 'RG', juridicaData.representante_rg);
  representativeParts.push(`portador do CPF nº ${formatCPF(juridicaData.representante_cpf)}`);
  appendIfValue(representativeContactParts, 'residente e domiciliado na', juridicaData.representante_endereco);
  appendIfValue(representativeContactParts, 'CEP', juridicaData.representante_cep, formatCEP);
  appendIfValue(representativeContactParts, 'telefone', juridicaData.representante_telefone, formatPhone);
  appendIfValue(representativeContactParts, 'e-mail', juridicaData.representante_email);

  const representativeIdentity = juridicaData.representante_cpf.trim()
    ? joinNonEmpty(representativeParts)
    : joinNonEmpty(representativeParts.filter((part) => !part.includes('CPF')));

  const representativeBlock = hasRepresentativeData
    ? [
        juridicaData.representante_nome ? `Neste ato representada por ${juridicaData.representante_nome}` : '',
        joinNonEmpty(representativeDescriptors),
        representativeIdentity,
        joinNonEmpty(representativeContactParts),
      ]
        .filter(Boolean)
        .join(', ')
    : '';

  return [joinNonEmpty(companyParts), representativeBlock, 'doravante denominado CONTRATANTE;']
    .filter(Boolean)
    .join('. ');
}

function buildSignatureDocument(clientData: FormData['clientData']): string {
  return clientData.tipo === 'fisica'
    ? `CPF: ${formatCPF(clientData.cpf)}`
    : `CNPJ: ${formatCNPJ(clientData.cnpj)}`;
}

function buildPaymentClauseSafe(contractData: ContractData): string {
  const lines: string[] = [];
  const paymentItems = buildPaymentMethodItems(contractData);
  const entradaPercentual =
    contractData.entrada_percentual.trim() || calculateEntryPercentageFromInstallments(contractData);
  const hasCreditInstallment = contractData.parcelas_pagamento.some(
    (installment) => installment.metodo === 'credito'
  );
  const usesCredit =
    hasCreditInstallment || contractData.forma_pagamento === 'credito' || contractData.forma_pagamento === 'misto';

  lines.push('3.1. O pagamento poderá ser realizado da seguinte forma:');
  lines.push(...paymentItems);

  if (contractData.observacoes_pagamento.trim()) {
    lines.push(`3.1.${paymentItems.length + 1}. ${contractData.observacoes_pagamento.trim()}`);
  }

  if (usesCredit) {
    lines.push(
      '3.2. O pagamento via cartão de crédito poderá ser efetuado de forma parcelada, conforme regras da administradora do cartão. Quaisquer juros, taxas de parcelamento, tarifas operacionais ou encargos financeiros cobrados pela operadora serão de inteira responsabilidade do CONTRATANTE e acrescidos ao valor da parcela no momento da transação.'
    );
    lines.push(
      '3.2.1. A CONTRATADA não se responsabiliza por eventuais recusas de transação, limites indisponíveis ou restrições impostas pela administradora do cartão.'
    );
  }

  lines.push(
    '3.3. Em caso de atrasos na obra por motivo exclusivo do CONTRATANTE, o cronograma de pagamentos deverá ser mantido conforme as datas pactuadas, independentemente do estágio da execução contratual, aplicando-se o disposto no art. 476 do Código Civil.'
  );
  lines.push(
    '3.4. Considerando que as esquadrias objeto deste contrato são produzidas sob medida, impossibilitando sua reutilização comercial pela CONTRATADA, e que sua fabricação envolve custos imediatos com materiais, mão de obra, planejamento e reserva de agenda produtiva, os pagamentos observarão a seguinte proporção:'
  );

  if (entradaPercentual) {
    lines.push(
      `3.4.1. Na assinatura do contrato, o CONTRATANTE pagará o valor correspondente a ${entradaPercentual}% do total contratado, destinado a cobrir os custos iniciais, mobilização da equipe técnica e garantir a disponibilidade da produção, considerando que as esquadrias serão fabricadas sob medida;`
    );
  } else {
    lines.push(
      '3.4.1. Na assinatura do contrato, o CONTRATANTE pagará o valor correspondente ao percentual de entrada pactuado entre as partes, destinado a cobrir os custos iniciais, mobilização da equipe técnica e garantir a disponibilidade da produção, considerando que as esquadrias serão fabricadas sob medida;'
    );
  }

  if (contractData.incluir_etapa_medicao_pagamento) {
    lines.push(
      '3.4.2. Na fase de medição técnica e fabricação, o CONTRATANTE realizará o pagamento correspondente a esta etapa, compondo a evolução financeira necessária para que, até a data prevista para a instalação, esteja quitado no mínimo 90% do valor total contratado;'
    );
  }

  if (contractData.incluir_saldo_final_pagamento) {
    lines.push('3.4.3. O saldo remanescente de 10% deverá ser pago ao final da instalação das esquadrias;');
  }

  lines.push(
    '3.4.4. A ausência de pagamento de quaisquer parcelas autoriza a CONTRATADA a suspender a fabricação, entrega ou instalação até a regularização, sem prejuízo da cobrança das parcelas vencidas e vincendas.'
  );
  lines.push(
    '3.4.5. No caso de a CONTRATADA ultrapassar o prazo estabelecido para a fabricação ou instalação por motivo que lhe seja exclusivamente atribuível, será assegurada ao CONTRATANTE a aplicação de multa moratória limitada a 10% sobre o valor da etapa em atraso.'
  );

  if (contractData.condicao_fechamento.trim()) {
    lines.push(contractData.condicao_fechamento.trim());
  }

  return lines.join('\n');
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
  const d = parseLocalDate(date);

  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function calculateEntryPercentageFromInstallments(contractData: ContractData): string {
  const total = parseBRCurrency(contractData.valor);
  const entryValue = parseBRCurrency(contractData.parcelas_pagamento[0]?.valor || '');

  if (!total || !entryValue || Number.isNaN(total) || Number.isNaN(entryValue)) {
    return '';
  }

  return ((entryValue / total) * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
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
    condicao_pagamento: buildPaymentClauseSafe(contractData),
    qualificacao_contratante: buildClientQualificationSafe(clientData),
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
    replacements.email = fisicaData.email.trim();
    replacements.telefone = fisicaData.telefone.trim() ? formatPhone(fisicaData.telefone) : '';
    replacements.razao_social = fisicaData.nome_cliente;
  } else {
    const juridicaData = clientData as ClientDataJuridica;

    replacements.nome_cliente = juridicaData.razao_social;
    replacements.endereco = valueOrDash(juridicaData.endereco);
    replacements.cep = formatCEP(juridicaData.cep);
    replacements.email = juridicaData.email.trim();
    replacements.telefone = juridicaData.telefone.trim() ? formatPhone(juridicaData.telefone) : '';
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
    replacements.representante_email = juridicaData.representante_email.trim();
    replacements.representante_telefone = juridicaData.representante_telefone.trim()
      ? formatPhone(juridicaData.representante_telefone)
      : '';
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

function normalizeTemplate(template: Partial<ContractTemplate>): ContractTemplate {
  return {
    id: template.id || generateId(),
    name: template.name || 'Template sem nome',
    content: template.content || '',
    fontFamily: template.fontFamily || DEFAULT_DOCUMENT_FONT,
    logoDataUrl: template.logoDataUrl || '',
    logoWidthMm: template.logoWidthMm || 36,
    logoPosition: template.logoPosition || 'center',
    createdAt: template.createdAt || new Date().toISOString(),
    updatedAt: template.updatedAt || new Date().toISOString(),
  };
}

export function getTemplates(): ContractTemplate[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    if (!data) return [];

    return (JSON.parse(data) as Array<Partial<ContractTemplate>>).map(normalizeTemplate);
  } catch {
    return [];
  }
}

export function createTemplateTransferFile(template: ContractTemplate): ContractTemplateTransferFile {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    app: 'gerador-contratos',
    template: normalizeTemplate(template),
  };
}

export function exportTemplateFile(template: ContractTemplate): void {
  if (typeof window === 'undefined') return;

  const payload = createTemplateTransferFile(template);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = template.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  link.href = url;
  link.download = `${safeName || 'template_contrato'}.gctemplate.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function importTemplateFile(file: File): Promise<ContractTemplate> {
  const rawContent = await file.text();
  const parsed = JSON.parse(rawContent) as Partial<ContractTemplateTransferFile> | Partial<ContractTemplate>;

  const templateSource =
    parsed && 'template' in parsed && parsed.template && typeof parsed.template === 'object'
      ? parsed.template
      : parsed;

  if (!templateSource || typeof templateSource !== 'object') {
    throw new Error('Arquivo de template invalido.');
  }

  return normalizeTemplate(templateSource as Partial<ContractTemplate>);
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
