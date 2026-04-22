import extenso from 'extenso';
import type { FormData, ContractTemplate, ClientDataFisica, ClientDataJuridica } from './types';

const STORAGE_KEYS = {
  TEMPLATES: 'contract_templates',
  CURRENT_TEMPLATE: 'current_template',
  FORM_DATA: 'contract_form_data',
} as const;

// Função auxiliar para converter string formatada em BR para número
function parseBRCurrency(value: string): number {
  // Remove tudo exceto dígitos, vírgula e ponto
  let cleaned = value.replace(/[^\d,.-]/g, '');
  
  // Formato brasileiro: 1.234.567,89 -> remover pontos de milhar, trocar vírgula por ponto
  // Detecta se usa formato BR (vírgula como decimal)
  if (cleaned.includes(',')) {
    // Remove pontos (separador de milhar) e troca vírgula por ponto (decimal)
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  }
  
  return parseFloat(cleaned);
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
    
    const result = extenso(numValue, { mode: 'currency' });
    return result;
  } catch {
    return 'valor inválido';
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
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '');
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

export function formatCEP(cep: string): string {
  const cleaned = cep.replace(/\D/g, '');
  return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
}

export function replaceTagsInTemplate(template: string, formData: FormData): string {
  let result = template;
  const { clientData, contractData } = formData;

  // Common replacements
  result = result.replace(/\{\{valor\}\}/g, formatCurrency(contractData.valor));
  result = result.replace(/\{\{valor_extenso\}\}/g, valueToExtenso(contractData.valor));
  result = result.replace(/\{\{data\}\}/g, formatDate(contractData.data));
  result = result.replace(/\{\{condicao_fechamento\}\}/g, contractData.condicao_fechamento || '');
  result = result.replace(/\{\{email\}\}/g, clientData.email);
  result = result.replace(/\{\{telefone\}\}/g, formatPhone(clientData.telefone));
  result = result.replace(/\{\{endereco\}\}/g, clientData.endereco);
  result = result.replace(/\{\{cep\}\}/g, formatCEP(clientData.cep));

  if (clientData.tipo === 'fisica') {
    const fisicaData = clientData as ClientDataFisica;
    result = result.replace(/\{\{nome_cliente\}\}/g, fisicaData.nome_cliente);
    result = result.replace(/\{\{cpf\}\}/g, `CPF nº ${formatCPF(fisicaData.cpf)}`);
    result = result.replace(/\{\{cnpj\}\}/g, '');
    result = result.replace(/\{\{nacionalidade\}\}/g, fisicaData.nacionalidade);
    result = result.replace(/\{\{estado_civil\}\}/g, fisicaData.estado_civil);
    result = result.replace(/\{\{razao_social\}\}/g, fisicaData.nome_cliente);
  } else {
    const juridicaData = clientData as ClientDataJuridica;
    result = result.replace(/\{\{nome_cliente\}\}/g, juridicaData.razao_social);
    result = result.replace(/\{\{razao_social\}\}/g, juridicaData.razao_social);
    result = result.replace(/\{\{cnpj\}\}/g, `CNPJ nº ${formatCNPJ(juridicaData.cnpj)}`);
    result = result.replace(/\{\{cpf\}\}/g, '');
    result = result.replace(/\{\{nacionalidade\}\}/g, '');
    result = result.replace(/\{\{estado_civil\}\}/g, '');
  }

  // Limpa apenas espacos repetidos sem destruir quebras de linha do template
  result = result.replace(/[^\S\r\n]{2,}/g, ' ');
  result = result.replace(/,\s*,/g, ',');

  return result;
}

// LocalStorage functions
export function saveTemplate(template: ContractTemplate): void {
  if (typeof window === 'undefined') return;
  
  const templates = getTemplates();
  const existingIndex = templates.findIndex(t => t.id === template.id);
  
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
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function deleteTemplate(id: string): void {
  if (typeof window === 'undefined') return;
  
  const templates = getTemplates().filter(t => t.id !== id);
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
