export type ClientType = 'fisica' | 'juridica';

export interface ClientDataFisica {
  tipo: 'fisica';
  nome_cliente: string;
  cpf: string;
  endereco: string;
  cep: string;
  nacionalidade: string;
  estado_civil: string;
  email: string;
  telefone: string;
}

export interface ClientDataJuridica {
  tipo: 'juridica';
  razao_social: string;
  cnpj: string;
  endereco: string;
  cep: string;
  email: string;
  telefone: string;
}

export type ClientData = ClientDataFisica | ClientDataJuridica;

export interface ContractData {
  valor: string;
  valor_extenso: string;
  data: string;
  condicao_fechamento: string;
}

export interface FormData {
  clientData: ClientData;
  contractData: ContractData;
}

export interface ContractTemplate {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export const AVAILABLE_TAGS = [
  { tag: '{{nome_cliente}}', label: 'Nome do Cliente', description: 'Nome completo ou Razão Social' },
  { tag: '{{cpf}}', label: 'CPF', description: 'CPF do cliente (Pessoa Física)' },
  { tag: '{{cnpj}}', label: 'CNPJ', description: 'CNPJ da empresa (Pessoa Jurídica)' },
  { tag: '{{endereco}}', label: 'Endereço', description: 'Endereço completo com CEP' },
  { tag: '{{valor}}', label: 'Valor (R$)', description: 'Valor numérico do contrato' },
  { tag: '{{valor_extenso}}', label: 'Valor por Extenso', description: 'Valor escrito por extenso' },
  { tag: '{{data}}', label: 'Data', description: 'Data do contrato' },
  { tag: '{{email}}', label: 'E-mail', description: 'E-mail do cliente' },
  { tag: '{{telefone}}', label: 'Telefone', description: 'Telefone do cliente' },
  { tag: '{{estado_civil}}', label: 'Estado Civil', description: 'Estado civil (Pessoa Física)' },
  { tag: '{{nacionalidade}}', label: 'Nacionalidade', description: 'Nacionalidade (Pessoa Física)' },
  { tag: '{{razao_social}}', label: 'Razão Social', description: 'Razão social (Pessoa Jurídica)' },
  { tag: '{{cep}}', label: 'CEP', description: 'Código postal' },
  { tag: '{{condicao_fechamento}}', label: 'Condição de Fechamento', description: 'Condições especiais' },
] as const;

export const DEFAULT_TEMPLATE = `# CONTRATO DE COMPRA E VENDA DE ESQUADRIAS DE ALUMÍNIO

Pelo presente instrumento particular de contrato de compra e venda, de um lado:

**VENDEDOR:** [NOME DA EMPRESA], pessoa jurídica de direito privado, inscrita no CNPJ sob o nº [CNPJ DA EMPRESA], com sede na [ENDEREÇO DA EMPRESA], neste ato representada na forma de seu contrato social.

**COMPRADOR:** {{nome_cliente}}, inscrito no {{cpf}}{{cnpj}}, {{nacionalidade}} {{estado_civil}}, residente e domiciliado na {{endereco}}, CEP {{cep}}, e-mail: {{email}}, telefone: {{telefone}}.

As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de Compra e Venda de Esquadrias de Alumínio, que se regerá pelas cláusulas seguintes e pelas condições descritas no presente.

## CLÁUSULA PRIMEIRA - DO OBJETO

O presente contrato tem como objeto a compra e venda de esquadrias de alumínio, conforme especificações técnicas acordadas entre as partes.

## CLÁUSULA SEGUNDA - DO PREÇO E FORMA DE PAGAMENTO

O valor total do presente contrato é de **{{valor}}** ({{valor_extenso}}), a ser pago conforme condições estabelecidas: {{condicao_fechamento}}.

## CLÁUSULA TERCEIRA - DO PRAZO

O prazo para fabricação e entrega dos produtos será acordado entre as partes no momento da confirmação do pedido.

## CLÁUSULA QUARTA - DAS DISPOSIÇÕES GERAIS

As partes elegem o foro da comarca onde está estabelecida a sede do VENDEDOR para dirimir quaisquer dúvidas oriundas deste contrato.

E por estarem assim justos e contratados, firmam o presente instrumento em duas vias de igual teor.

[CENTER]**Local e data:** {{data}}[/CENTER]

[CENTER]_________________________________
VENDEDOR[/CENTER]

[CENTER]_________________________________
COMPRADOR: {{nome_cliente}}[/CENTER]`;
