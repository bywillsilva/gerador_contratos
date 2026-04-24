export type ClientType = 'fisica' | 'juridica';

export type PaymentMethod = 'pix' | 'boleto' | 'debito' | 'credito' | 'misto';
export type InstallmentPaymentMethod = Exclude<PaymentMethod, 'misto'>;
export type LogoPosition = 'left' | 'center' | 'right';

export interface PaymentInstallment {
  id: string;
  metodo: InstallmentPaymentMethod;
  valor: string;
  vencimento: string;
  observacao: string;
}

export const FONT_OPTIONS = [
  { value: '"Times New Roman", Times, serif', label: 'Times New Roman' },
  { value: 'Georgia, "Times New Roman", Times, serif', label: 'Georgia' },
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
  { value: '"Helvetica Neue", Helvetica, Arial, sans-serif', label: 'Helvetica' },
  { value: 'Garamond, "Times New Roman", serif', label: 'Garamond' },
  { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
  { value: 'Tahoma, Geneva, sans-serif', label: 'Tahoma' },
  { value: '"Trebuchet MS", Helvetica, sans-serif', label: 'Trebuchet MS' },
] as const;

export const DEFAULT_DOCUMENT_FONT = '"Times New Roman", Times, serif';

export interface ClientDataFisica {
  tipo: 'fisica';
  nome_cliente: string;
  cpf: string;
  rg: string;
  profissao: string;
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
  nome_fantasia: string;
  cnpj: string;
  endereco: string;
  cep: string;
  email: string;
  telefone: string;
  representante_nome: string;
  representante_nacionalidade: string;
  representante_estado_civil: string;
  representante_profissao: string;
  representante_rg: string;
  representante_cpf: string;
  representante_endereco: string;
  representante_cep: string;
  representante_email: string;
  representante_telefone: string;
}

export type ClientData = ClientDataFisica | ClientDataJuridica;

export interface ContractData {
  numero_contrato: string;
  valor: string;
  valor_extenso: string;
  data: string;
  endereco_obra: string;
  orcamento_numero: string;
  forma_pagamento: PaymentMethod;
  quantidade_parcelas: string;
  parcelas_pagamento: PaymentInstallment[];
  valor_pix: string;
  valor_boleto: string;
  vencimento_boleto: string;
  valor_debito: string;
  valor_credito: string;
  parcelas_credito: string;
  entrada_percentual: string;
  incluir_etapa_medicao_pagamento: boolean;
  incluir_saldo_final_pagamento: boolean;
  observacoes_pagamento: string;
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
  fontFamily: string;
  logoDataUrl: string;
  logoWidthMm: number;
  logoPosition: LogoPosition;
  createdAt: string;
  updatedAt: string;
}

export interface ContractTemplateTransferFile {
  version: 1;
  exportedAt: string;
  app: 'gerador-contratos';
  template: ContractTemplate;
}

export const AVAILABLE_TAGS = [
  { tag: '{{numero_contrato}}', label: 'Nº Contrato', description: 'Número do contrato' },
  { tag: '{{data}}', label: 'Data', description: 'Data do contrato por extenso' },
  { tag: '{{valor}}', label: 'Valor (R$)', description: 'Valor numérico do contrato' },
  { tag: '{{valor_extenso}}', label: 'Valor por Extenso', description: 'Valor escrito por extenso' },
  { tag: '{{endereco_obra}}', label: 'Endereço da Obra', description: 'Local da instalação' },
  { tag: '{{orcamento_numero}}', label: 'Nº Orçamento', description: 'Número do orçamento/anexo' },
  {
    tag: '{{condicao_pagamento}}',
    label: 'Cláusula Pagamento',
    description: 'Texto dinâmico completo da cláusula de pagamento',
  },
  {
    tag: '{{qualificacao_contratante}}',
    label: 'Qualificação Contratante',
    description: 'Bloco completo do contratante conforme PF/PJ',
  },
  {
    tag: '{{assinatura_contratante_nome}}',
    label: 'Assinatura Nome',
    description: 'Nome ou razão social na assinatura',
  },
  {
    tag: '{{assinatura_contratante_documento}}',
    label: 'Assinatura Documento',
    description: 'CPF ou CNPJ do contratante',
  },
  { tag: '{{nome_cliente}}', label: 'Nome do Cliente', description: 'Nome completo do cliente' },
  { tag: '{{cpf}}', label: 'CPF', description: 'CPF do cliente ou representante' },
  { tag: '{{rg}}', label: 'RG', description: 'RG do cliente físico' },
  { tag: '{{profissao}}', label: 'Profissão', description: 'Profissão do cliente físico' },
  { tag: '{{nacionalidade}}', label: 'Nacionalidade', description: 'Nacionalidade do cliente físico' },
  { tag: '{{estado_civil}}', label: 'Estado Civil', description: 'Estado civil do cliente físico' },
  { tag: '{{endereco}}', label: 'Endereço', description: 'Endereço principal do contratante' },
  { tag: '{{cep}}', label: 'CEP', description: 'CEP principal do contratante' },
  { tag: '{{email}}', label: 'E-mail', description: 'E-mail principal do contratante' },
  { tag: '{{telefone}}', label: 'Telefone', description: 'Telefone principal do contratante' },
  { tag: '{{razao_social}}', label: 'Razão Social', description: 'Razão social da empresa contratante' },
  {
    tag: '{{nome_fantasia}}',
    label: 'Nome Fantasia',
    description: 'Nome fantasia da empresa contratante',
  },
  { tag: '{{cnpj}}', label: 'CNPJ', description: 'CNPJ da empresa contratante' },
  {
    tag: '{{representante_nome}}',
    label: 'Representante',
    description: 'Nome do representante legal',
  },
  {
    tag: '{{representante_nacionalidade}}',
    label: 'Nac. Representante',
    description: 'Nacionalidade do representante',
  },
  {
    tag: '{{representante_estado_civil}}',
    label: 'EC Representante',
    description: 'Estado civil do representante',
  },
  {
    tag: '{{representante_profissao}}',
    label: 'Prof. Representante',
    description: 'Profissão do representante',
  },
  { tag: '{{representante_rg}}', label: 'RG Representante', description: 'RG do representante' },
  {
    tag: '{{representante_cpf}}',
    label: 'CPF Representante',
    description: 'CPF do representante',
  },
  {
    tag: '{{representante_endereco}}',
    label: 'End. Representante',
    description: 'Endereço do representante',
  },
  { tag: '{{representante_cep}}', label: 'CEP Representante', description: 'CEP do representante' },
  {
    tag: '{{representante_email}}',
    label: 'E-mail Representante',
    description: 'E-mail do representante',
  },
  {
    tag: '{{representante_telefone}}',
    label: 'Tel. Representante',
    description: 'Telefone do representante',
  },
  {
    tag: '{{forma_pagamento}}',
    label: 'Forma de Pagamento',
    description: 'Descrição resumida da forma de pagamento',
  },
  { tag: '{{valor_pix}}', label: 'Valor PIX', description: 'Valor previsto para PIX' },
  { tag: '{{valor_boleto}}', label: 'Valor Boleto', description: 'Valor previsto para boleto' },
  {
    tag: '{{vencimento_boleto}}',
    label: 'Venc. Boleto',
    description: 'Data de vencimento do boleto',
  },
  { tag: '{{valor_debito}}', label: 'Valor Débito', description: 'Valor previsto para débito' },
  { tag: '{{valor_credito}}', label: 'Valor Crédito', description: 'Valor previsto para crédito' },
  {
    tag: '{{parcelas_credito}}',
    label: 'Parcelas Crédito',
    description: 'Quantidade de parcelas no cartão',
  },
] as const;

export const DEFAULT_TEMPLATE = `# CONTRATO Nº {{numero_contrato}}

Pelo presente instrumento particular, de um lado:

ART GLASS FABRICACAO E INSTALACAO DE VIDROS E ESQUADRIAS LTDA, pessoa jurídica de direito privado, inscrita no CNPJ sob o n° 31.121.969/0001-44, com endereço na Rua Anísio de Souza, nº 2616, Lote 32/38, Bairro Candelária, Natal/RN, CEP 59064-330, neste ato representada por seu diretor-executivo, João Batista Barreto Júnior, brasileiro, casado, portador do CPF n° 075.412.764-80 e RG n° 59829440 MD/RN, doravante denominada CONTRATADA;

E, de outro lado:
{{qualificacao_contratante}}

Têm entre si justo e contratado o presente Contrato de Fornecimento de Esquadrias em Alumínio, que será regido pelas cláusulas e condições seguintes:

## CLÁUSULA 1 – DO OBJETO
1.1. O presente contrato tem por objeto o fornecimento e instalação de esquadrias em ALUMÍNIO para a obra situada na {{endereco_obra}}.
1.2. As descrições técnicas, dimensões, quantidades e preços unitários constam do Orçamento nº {{orcamento_numero}}, que integra este contrato como Anexo I.

## CLÁUSULA 2 – DO PREÇO
2.1. O valor total do contrato é de **{{valor}}** ({{valor_extenso}}).
2.2. No preço acima estão incluídos:
2.2.1. Todos os tributos federais, estaduais e municipais, inclusive IPI;
2.2.2. Despesas com embalagem, transporte, manuseio, fabricação e instalação das peças;
2.2.3. Materiais de instalação (calços, parafusos, vedações etc.).
2.3. Eventuais alterações nas dimensões ou quantidade de esquadrias, após a assinatura deste contrato, implicarão em revisão proporcional dos valores, calculada com base em orçamento eletrônico gerado por software específico utilizado pela CONTRATADA, respeitados os custos fixos.
2.4. Será admitida tolerância de até 10 cm nas medidas (para mais ou para menos), por unidade, sem impacto no valor contratado.
2.5. Em caso de inadimplemento, incidirá:
2.5.1. Multa moratória de 2% sobre o valor em atraso;
2.5.2. Juros de mora de 1% ao mês, calculados pro rata die;
2.5.3. Atualização monetária pelo IGP-M, após 30 dias de atraso;
2.5.4. Possibilidade de protesto do título após o 14º dia de inadimplemento.

## CLÁUSULA 3 – DO PAGAMENTO
{{condicao_pagamento}}

## CLÁUSULA 4 – DO PRAZO DE ENTREGA E INSTALAÇÃO
4.1. O prazo para entrega e instalação das esquadrias será de 25 (vinte e cinco) a 30 (trinta) dias corridos, contados a partir da assinatura da Autorização de Medição, devidamente formalizada pelo CONTRATANTE, ressalvadas as hipóteses de caso fortuito ou força maior, conforme disposto no art. 393 do Código Civil. Após a assinatura da Autorização de Medição pelo CONTRATANTE, a CONTRATADA terá até 05 (cinco) dias corridos para realização da medição na obra. A partir da medição começará a contar o prazo de 25 dias para entrega e instalação.
4.2. Na hipótese de a obra não estar integralmente apta para execução dos serviços, podendo ser liberada apenas em partes, a continuidade será condicionada à liberação das áreas necessárias. A liberação parcial será formalizada mediante assinatura da Autorização Parcial de Frente de Serviço pelo CONTRATANTE, passando o prazo descrito nesta cláusula a aplicar-se exclusivamente às áreas liberadas.
4.3. Para efeito de retomada dos serviços remanescentes, o prazo de execução relativo ao saldo pendente somente terá início após a assinatura da Autorização Final de Frente de Serviço, documento que deverá abranger todas as áreas ainda não liberadas e necessárias para conclusão integral da instalação.
4.4. A ausência de liberação integral das áreas de trabalho não será considerada atraso imputável à CONTRATADA, ficando o prazo automaticamente suspenso até a regularização pelo CONTRATANTE.

## CLÁUSULA 5 – DA GARANTIA
5.1. A CONTRATADA concede as seguintes garantias:
5.1.1. 10 (dez) anos para os perfis em ALUMÍNIO;
5.1.2. 02 (dois) anos para os componentes;
5.1.3. 02 (dois) anos de assistência técnica, sem custos com deslocamento ou peças, em caso de defeito de fabricação ou desgaste prematuro, desde que não decorrente de uso inadequado, falta de manutenção, intervenção de terceiros não autorizados, eventos externos, caso fortuito ou força maior, o que será determinado por análise técnica da CONTRATADA.

## CLÁUSULA 6 – OBRIGAÇÕES DO CONTRATANTE
6.1. Compete ao CONTRATANTE:
6.1.1. Fornecer todas as informações necessárias à perfeita execução dos serviços;
6.1.2. Receber os produtos conforme descrito neste contrato;
6.1.3. Efetuar os pagamentos conforme as condições acordadas;
6.1.4. Informar previamente à CONTRATADA sobre a existência de tubulações hidráulicas, elétricas, ou quaisquer outras instalações embutidas nas áreas onde serão realizadas intervenções para instalação das esquadrias.
6.2. Na hipótese de omissão dessas informações e ocorrendo infiltrações ou danos decorrentes da interferência com tais estruturas, devidamente constatados após análise técnica da CONTRATADA, os custos referentes a deslocamentos, visitas técnicas e eventuais reparos serão de responsabilidade exclusiva do CONTRATANTE.
6.1.5. Garantir a guarda e integridade dos materiais entregues e estocados em obra, responsabilizando-se por danos, perdas ou extravios decorrentes de manuseio inadequado ou descuido de funcionários próprios ou de terceiros que estejam atuando na obra.

## CLÁUSULA 7 – OBRIGAÇÕES DA CONTRATADA
7.1. Compete à CONTRATADA:
7.1.1. Executar o fornecimento conforme as especificações técnicas e condições previstas na Cláusula 1 deste contrato e em seus anexos;
7.1.2. Cumprir os prazos estabelecidos neste contrato, salvo em caso de ocorrência de caso fortuito ou força maior, devidamente justificados e documentados;
7.1.3. Responder integralmente pelos encargos trabalhistas, previdenciários, fiscais e tributários incidentes sobre os profissionais designados para a execução do objeto contratual, não recaindo sobre o CONTRATANTE qualquer responsabilidade solidária ou subsidiária;
7.1.4. Prestar os serviços de instalação de forma técnica e segura, utilizando materiais adequados e observando as normas de segurança aplicáveis;
7.1.5. Responsabilizar-se pela integridade das esquadrias até o momento da entrega no local de descarga previamente acordado entre as partes, não sendo necessariamente o endereço da obra.

## CLÁUSULA 8 – DA RESPONSABILIDADE TÉCNICA COMPARTILHADA
8.1. Antes do início da produção das esquadrias, as partes deverão realizar, em ação coordenada, vistoria técnica conjunta no local da obra, a fim de verificar as condições adequadas para o início da execução desse serviço, oportunidade em que será assinada a respectiva Autorização de Medição, Autorização Parcial de Frente de Serviço ou Autorização Final de Frente de Serviço.
8.2. O CONTRATANTE deverá informar imediatamente e formalmente à CONTRATADA sobre quaisquer alterações na obra que afetem diretamente a produção das esquadrias, a fim de que a CONTRATADA avalie a viabilidade técnica e informe o CONTRATANTE sobre eventuais custos adicionais decorrentes.
8.3. Todos os custos oriundos de alterações posteriores a estas liberações ficarão sob a exclusiva responsabilidade do CONTRATANTE.
8.4. Antes do início da instalação das esquadrias, as partes deverão realizar, em ação coordenada, vistoria técnica conjunta no local da obra, a fim de verificar a conformidade da situação física da obra com o constante dos Termos de Liberação.
8.5. Nessa oportunidade, será assinado o Relatório de Liberação de Serviço, documento que deverá atestar as condições adequadas para a execução do serviço de instalação ou apontar eventuais restrições identificadas e as recomendações para correções.
8.6. Caso o local esteja em desconformidade com os critérios mínimos exigidos para a instalação segura e eficaz das esquadrias, a CONTRATADA poderá suspender os serviços até que as irregularidades sejam sanadas pelo CONTRATANTE, sem que isso configure descumprimento contratual.
8.7. O descumprimento dos apontamentos técnicos registrados pela CONTRATADA na vistoria exime-a de responsabilidade por vícios ou falhas na instalação decorrentes exclusivamente dessas condições desfavoráveis.
8.8. Na hipótese de ocorrência do descrito nesta cláusula ou na eventualidade de que, a qualquer tempo, mesmo durante a vigência do período de garantia, venham a ocorrer infiltrações ou danos às esquadrias e/ou estruturas adjacentes, e constatando-se, por meio de análise técnica realizada pela CONTRATADA, que tais eventos não têm relação com defeitos de fabricação ou de instalação das esquadrias e seus componentes, mas sim com uso inadequado, falta de manutenção, intervenção de terceiros não autorizados, eventos externos, caso fortuito ou força maior, ficará sob responsabilidade exclusiva do CONTRATANTE o pagamento de todos os custos decorrentes, incluindo, mas não se limitando a visitas técnicas, mão de obra e eventuais reparos necessários.

## CLÁUSULA 9 – DA RESCISÃO
9.1. Caso a rescisão ocorra por iniciativa do CONTRATANTE, sem justa causa, este deverá pagar à CONTRATADA multa compensatória de 10% (dez por cento) sobre o valor total do contrato, além do pagamento proporcional dos serviços já executados e dos materiais adquiridos.
9.2. A rescisão por justa causa, motivada pelo descumprimento contratual de quaisquer das partes, autoriza a parte inocente a reter ou exigir valores a título de perdas e danos, nos termos dos arts. 475 e 476 do Código Civil.

## CLÁUSULA 10 – DA PROTEÇÃO DE DADOS (LGPD)
10.1. Em observância à Lei nº 13.709/2018 (“Lei Geral de Proteção de Dados Pessoais”), AS PARTES ficam, desde já, autorizadas a realizar o tratamento dos dados pessoais dos representantes legais e da equipe técnica do presente CONTRATO DE PRESTAÇÃO DE SERVIÇOS disponíveis ou que venham a ser coletados ou recebidos, utilizando tais informações tão somente para os fins lícitos e previstos na consecução deste instrumento, bem como utilizá-las nas avaliações atuariais, financeiras, estatísticas e demais avaliações e usos típicos das atividades de cada partícipe, podendo compartilhá-las com órgãos governamentais e de controle externo para fins de atendimento a dispositivos legais.

## CLÁUSULA 11 – DISPOSIÇÕES FINAIS
11.1. Considerar-se-á cumprida a obrigação da CONTRATADA com a conclusão integral do fornecimento e instalação das esquadrias em ALUMÍNIO, conforme descrito na Cláusula 1, desde que atendidas todas as condições contratuais pactuadas, mediante a assinatura do Termo de Recebimento de Obra por ambas as partes.
11.2. O descumprimento de quaisquer das obrigações estipuladas neste contrato, por quaisquer das partes, poderá ensejar sua rescisão imediata, com fundamento nas disposições das Cláusulas 6 a 8, sem prejuízo da aplicação das penalidades contratuais, perdas e danos eventualmente apurados, além de medidas judiciais cabíveis.

## CLÁUSULA 12 – DO FORO
12.1. Para dirimir quaisquer dúvidas ou controvérsias oriundas deste contrato, as partes elegem, de comum acordo, o foro da Comarca de Natal/RN, com renúncia expressa a qualquer outro, por mais privilegiado que seja.

E por estarem assim justas e contratadas, firmam o presente contrato em duas vias de igual teor e forma, juntamente com as testemunhas abaixo.

[RIGHT]Natal/RN, {{data}}.[/RIGHT]

[RIGHT]_________________________________________
ART GLASS FABRICACAO E INSTALACAO DE VIDROS E ESQUADRIAS LTDA
CNPJ: 31.121.969/0001-44
CONTRATADA[/RIGHT]

[RIGHT]_________________________________________
{{assinatura_contratante_nome}}
{{assinatura_contratante_documento}}
CONTRATANTE[/RIGHT]

[RIGHT]_________________________________________
Testemunha 1[/RIGHT]

[RIGHT]_________________________________________
Testemunha 2[/RIGHT]`;
