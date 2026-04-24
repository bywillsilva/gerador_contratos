'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, User, Building2, FileText, DollarSign, CreditCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useNavigation } from '@/lib/navigation-context';
import { valueToExtenso, formatCurrency } from '@/lib/contract-utils';
import type {
  ClientType,
  ClientDataFisica,
  ClientDataJuridica,
  ContractData,
  FormData,
  InstallmentPaymentMethod,
  PaymentMethod,
  PaymentInstallment,
} from '@/lib/types';

const ESTADOS_CIVIS = ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'];

const PAYMENT_OPTIONS: Array<{ value: PaymentMethod; label: string; description: string }> = [
  { value: 'pix', label: 'PIX', description: 'Pagamento integral ou principal por PIX' },
  { value: 'boleto', label: 'Boleto', description: 'Pagamento por boleto bancário' },
  { value: 'debito', label: 'Débito', description: 'Pagamento por cartão de débito' },
  { value: 'credito', label: 'Crédito', description: 'Pagamento por cartão de crédito' },
  { value: 'misto', label: 'Misto', description: 'Combinação de mais de uma forma de pagamento' },
];

const INSTALLMENT_PAYMENT_OPTIONS: Array<{ value: InstallmentPaymentMethod; label: string }> = [
  { value: 'pix', label: 'PIX' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'debito', label: 'Débito' },
  { value: 'credito', label: 'Crédito' },
];

function createPaymentInstallment(index: number): PaymentInstallment {
  return {
    id: `installment_${Date.now()}_${index}`,
    metodo: 'pix',
    valor: '',
    vencimento: '',
    observacao: '',
  };
}

function getTodayInputValue(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function ContractForm() {
  const { navigate, setFormData, formData } = useNavigation();
  const [clientType, setClientType] = useState<ClientType>('fisica');

  const [fisicaData, setFisicaData] = useState<Omit<ClientDataFisica, 'tipo'>>({
    nome_cliente: '',
    cpf: '',
    rg: '',
    profissao: '',
    endereco: '',
    cep: '',
    nacionalidade: 'Brasileiro(a)',
    estado_civil: '',
    email: '',
    telefone: '',
  });

  const [juridicaData, setJuridicaData] = useState<Omit<ClientDataJuridica, 'tipo'>>({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    endereco: '',
    cep: '',
    email: '',
    telefone: '',
    representante_nome: '',
    representante_nacionalidade: 'Brasileiro(a)',
    representante_estado_civil: '',
    representante_profissao: '',
    representante_rg: '',
    representante_cpf: '',
    representante_endereco: '',
    representante_cep: '',
    representante_email: '',
    representante_telefone: '',
  });

  const [contractData, setContractData] = useState<ContractData>({
    numero_contrato: '',
    valor: '',
    valor_extenso: '',
    data: getTodayInputValue(),
    endereco_obra: '',
    orcamento_numero: '',
    forma_pagamento: 'pix',
    quantidade_parcelas: '1',
    parcelas_pagamento: [createPaymentInstallment(0)],
    valor_pix: '',
    valor_boleto: '',
    vencimento_boleto: '',
    valor_debito: '',
    valor_credito: '',
    parcelas_credito: '',
    entrada_percentual: '',
    incluir_etapa_medicao_pagamento: true,
    incluir_saldo_final_pagamento: true,
    observacoes_pagamento: '',
    condicao_fechamento: '',
  });

  useEffect(() => {
    if (contractData.valor) {
      setContractData((prev) => ({ ...prev, valor_extenso: valueToExtenso(contractData.valor) }));
      return;
    }

    setContractData((prev) => ({ ...prev, valor_extenso: '' }));
  }, [contractData.valor]);

  useEffect(() => {
    if (!formData) return;

    if (formData.clientData.tipo === 'fisica') {
      setClientType('fisica');
      setFisicaData({
        nome_cliente: formData.clientData.nome_cliente,
        cpf: formData.clientData.cpf,
        rg: formData.clientData.rg,
        profissao: formData.clientData.profissao,
        endereco: formData.clientData.endereco,
        cep: formData.clientData.cep,
        nacionalidade: formData.clientData.nacionalidade,
        estado_civil: formData.clientData.estado_civil,
        email: formData.clientData.email,
        telefone: formData.clientData.telefone,
      });
    } else {
      setClientType('juridica');
      setJuridicaData({
        razao_social: formData.clientData.razao_social,
        nome_fantasia: formData.clientData.nome_fantasia,
        cnpj: formData.clientData.cnpj,
        endereco: formData.clientData.endereco,
        cep: formData.clientData.cep,
        email: formData.clientData.email,
        telefone: formData.clientData.telefone,
        representante_nome: formData.clientData.representante_nome,
        representante_nacionalidade: formData.clientData.representante_nacionalidade,
        representante_estado_civil: formData.clientData.representante_estado_civil,
        representante_profissao: formData.clientData.representante_profissao,
        representante_rg: formData.clientData.representante_rg,
        representante_cpf: formData.clientData.representante_cpf,
        representante_endereco: formData.clientData.representante_endereco,
        representante_cep: formData.clientData.representante_cep,
        representante_email: formData.clientData.representante_email,
        representante_telefone: formData.clientData.representante_telefone,
      });
    }

    setContractData({
      ...formData.contractData,
      numero_contrato: formData.contractData.numero_contrato || formData.contractData.orcamento_numero,
      orcamento_numero: formData.contractData.orcamento_numero || formData.contractData.numero_contrato,
      incluir_etapa_medicao_pagamento: formData.contractData.incluir_etapa_medicao_pagamento ?? true,
      incluir_saldo_final_pagamento: formData.contractData.incluir_saldo_final_pagamento ?? true,
    });
  }, [formData]);

  const handleFisicaChange = (field: keyof typeof fisicaData, value: string) => {
    setFisicaData((prev) => ({ ...prev, [field]: value }));
  };

  const handleJuridicaChange = (field: keyof typeof juridicaData, value: string) => {
    setJuridicaData((prev) => ({ ...prev, [field]: value }));
  };

  const parseCurrencyToNumber = (value: string) => {
    const cleaned = value.replace(/[^\d,.-]/g, '');
    if (!cleaned) return 0;

    const normalized = cleaned.includes(',')
      ? cleaned.replace(/\./g, '').replace(',', '.')
      : cleaned;

    const parsed = Number.parseFloat(normalized);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const formatNumberToCurrencyInput = (value: number) =>
    value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const parseInputDate = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);

    if (!year || !month || !day) {
      return new Date();
    }

    return new Date(year, month - 1, day);
  };

  const formatInputDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const addDaysToInputDate = (value: string, days: number) => {
    const date = parseInputDate(value);
    date.setDate(date.getDate() + days);

    return formatInputDate(date);
  };

  const distributeInstallments = (
    totalValue: string,
    installmentCount: string,
    contractDate: string,
    existingInstallments: PaymentInstallment[],
    paymentMethod: PaymentMethod
  ): PaymentInstallment[] => {
    const count = installmentCount === '' ? 0 : Number.parseInt(installmentCount, 10);

    if (!count) return [];

    const totalInCents = Math.round(parseCurrencyToNumber(totalValue) * 100);
    const baseValueInCents = count > 0 ? Math.floor(totalInCents / count) : 0;
    const remainderInCents = count > 0 ? totalInCents % count : 0;
    const defaultMethod: InstallmentPaymentMethod = paymentMethod === 'misto' ? 'pix' : paymentMethod;

    return Array.from({ length: count }, (_, index) => {
      const existing = existingInstallments[index];
      const cents = baseValueInCents + (index < remainderInCents ? 1 : 0);

      return {
        id: existing?.id || `installment_${Date.now()}_${index}`,
        metodo: existing?.metodo || defaultMethod,
        valor: totalInCents > 0 ? formatNumberToCurrencyInput(cents / 100) : '',
        vencimento: addDaysToInputDate(contractDate, index * 30),
        observacao: existing?.observacao || (index === 0 ? 'sinal/entrada' : ''),
      };
    });
  };

  const calculateEntryPercentage = (data: ContractData) => {
    const total = parseCurrencyToNumber(data.valor);
    const entryValue = parseCurrencyToNumber(data.parcelas_pagamento[0]?.valor || '');

    if (!total || !entryValue) return '';

    const percentage = (entryValue / total) * 100;
    return percentage.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const handleContractChange = (field: keyof ContractData, value: string) => {
    setContractData((prev) => {
      const next =
        field === 'orcamento_numero' || field === 'numero_contrato'
          ? {
              ...prev,
              numero_contrato: value,
              orcamento_numero: value,
            }
          : { ...prev, [field]: value };

      if (field === 'valor' || field === 'data') {
        next.parcelas_pagamento = distributeInstallments(
          field === 'valor' ? value : prev.valor,
          prev.quantidade_parcelas,
          field === 'data' ? value : prev.data,
          prev.parcelas_pagamento,
          prev.forma_pagamento
        );
      }

      if (field === 'forma_pagamento') {
        next.parcelas_pagamento = distributeInstallments(
          prev.valor,
          prev.quantidade_parcelas,
          prev.data,
          prev.parcelas_pagamento,
          value as PaymentMethod
        );
      }

      return {
        ...next,
        entrada_percentual: calculateEntryPercentage(next),
      };
    });
  };

  const handleContractBooleanChange = (field: keyof ContractData, value: boolean) => {
    setContractData((prev) => ({ ...prev, [field]: value }));
  };

  const formatCPFInput = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 11);
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatCNPJInput = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 14);
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatCEPInput = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 8);
    return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const formatPhoneInput = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 11);
    if (cleaned.length <= 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }

    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const formatCurrencyInput = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const number = parseInt(cleaned, 10) / 100;
    if (isNaN(number)) return '';

    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleInstallmentCountChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    const normalizedCount = digitsOnly === '' ? '' : String(Math.max(1, Number.parseInt(digitsOnly, 10)));

    setContractData((prev) => {
      const next = {
        ...prev,
        quantidade_parcelas: normalizedCount,
        parcelas_pagamento: distributeInstallments(
          prev.valor,
          normalizedCount,
          prev.data,
          prev.parcelas_pagamento,
          prev.forma_pagamento
        ),
      };

      return {
        ...next,
        entrada_percentual: calculateEntryPercentage(next),
      };
    });
  };

  const handleInstallmentChange = (
    installmentId: string,
    field: keyof PaymentInstallment,
    value: string
  ) => {
    setContractData((prev) => {
      const next = {
        ...prev,
        parcelas_pagamento: prev.parcelas_pagamento.map((installment) =>
          installment.id === installmentId ? { ...installment, [field]: value } : installment
        ),
      };

      return {
        ...next,
        entrada_percentual: calculateEntryPercentage(next),
      };
    });
  };

  const installmentTotal = contractData.parcelas_pagamento.reduce(
    (total, installment) => total + parseCurrencyToNumber(installment.valor),
    0
  );
  const contractTotal = parseCurrencyToNumber(contractData.valor);
  const paymentDifference = Math.abs(contractTotal - installmentTotal);
  const isInstallmentDistributionValid =
    contractData.quantidade_parcelas.trim() !== '' &&
    contractData.parcelas_pagamento.length > 0 &&
    paymentDifference < 0.01 &&
    contractData.parcelas_pagamento.every((installment) => installment.valor.trim());

  const isFormValid = () => {
    const commonValid = contractData.valor.trim() && contractData.endereco_obra.trim();

    if (!commonValid) return false;
    if (!isInstallmentDistributionValid) return false;

    if (clientType === 'fisica') {
      return (
        fisicaData.nome_cliente.trim() &&
        fisicaData.cpf.length >= 14 &&
        fisicaData.endereco.trim() &&
        fisicaData.cep.length >= 9
      );
    }

    return (
      juridicaData.razao_social.trim() &&
      juridicaData.cnpj.length >= 18 &&
      juridicaData.endereco.trim() &&
      juridicaData.cep.length >= 9
    );
  };

  const derivePaymentMethodFromInstallments = (): PaymentMethod => {
    const usedMethods = Array.from(
      new Set(
        contractData.parcelas_pagamento
          .filter((installment) => installment.valor.trim())
          .map((installment) => installment.metodo)
      )
    );

    if (usedMethods.length === 0) return contractData.forma_pagamento;
    if (usedMethods.length === 1) return usedMethods[0];

    return 'misto';
  };

  const handleSubmit = () => {
    const formData: FormData = {
      clientData:
        clientType === 'fisica'
          ? { tipo: 'fisica', ...fisicaData }
          : { tipo: 'juridica', ...juridicaData },
      contractData: {
        ...contractData,
        entrada_percentual: calculateEntryPercentage(contractData),
        forma_pagamento: derivePaymentMethodFromInstallments(),
      },
    };

    setFormData(formData);
    navigate('preview');
  };

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8">
      <div className="app-hero-surface mb-8 rounded-lg px-6 py-7 sm:px-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div>
            <span className="app-eyebrow">Dados comerciais</span>
            <h2 className="mt-4 text-3xl font-semibold text-foreground sm:text-4xl">
              Preencher Contrato
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Informe os dados do contratante, da obra e da condição de pagamento. O contrato final será montado
              automaticamente com base neste cadastro.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="service-card px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Contratante
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {clientType === 'fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}
              </p>
            </div>
            <div className="service-card px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Valor Atual
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {contractData.valor ? formatCurrency(contractData.valor) : 'Não informado'}
              </p>
            </div>
            <div className="service-card px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Parcelas
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {contractData.quantidade_parcelas || '0'} configurada(s)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="service-card form-card">
          <CardHeader className="form-card-header">
            <CardTitle className="flex items-center gap-3 text-xl">
              <span className="service-icon h-10 w-10">
                <User className="h-4 w-4" />
              </span>
              Identificação do Contratante
            </CardTitle>
            <CardDescription>Escolha o tipo de cliente e preencha somente os dados necessários.</CardDescription>
          </CardHeader>
          <CardContent className="form-card-content">
            <Tabs value={clientType} onValueChange={(value) => setClientType(value as ClientType)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="fisica" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Pessoa Física
                </TabsTrigger>
                <TabsTrigger value="juridica" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Pessoa Jurídica
                </TabsTrigger>
              </TabsList>

              <TabsContent value="fisica" className="mt-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={fisicaData.nome_cliente}
                      onChange={(e) => handleFisicaChange('nome_cliente', e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      value={fisicaData.cpf}
                      onChange={(e) => handleFisicaChange('cpf', formatCPFInput(e.target.value))}
                      placeholder="000.000.000-00"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rg">RG</Label>
                    <Input
                      id="rg"
                      value={fisicaData.rg}
                      onChange={(e) => handleFisicaChange('rg', e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nacionalidade">Nacionalidade</Label>
                    <Input
                      id="nacionalidade"
                      value={fisicaData.nacionalidade}
                      onChange={(e) => handleFisicaChange('nacionalidade', e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="estado_civil">Estado Civil</Label>
                    <Select
                      value={fisicaData.estado_civil}
                      onValueChange={(value) => handleFisicaChange('estado_civil', value)}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTADOS_CIVIS.map((estado) => (
                          <SelectItem key={estado} value={estado}>
                            {estado}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="profissao">Profissão</Label>
                    <Input
                      id="profissao"
                      value={fisicaData.profissao}
                      onChange={(e) => handleFisicaChange('profissao', e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefone_fisica">Telefone</Label>
                    <Input
                      id="telefone_fisica"
                      value={fisicaData.telefone}
                      onChange={(e) => handleFisicaChange('telefone', formatPhoneInput(e.target.value))}
                      placeholder="(00) 00000-0000"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email_fisica">E-mail</Label>
                    <Input
                      id="email_fisica"
                      type="email"
                      value={fisicaData.email}
                      onChange={(e) => handleFisicaChange('email', e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="endereco_fisica">Endereço Completo *</Label>
                    <Textarea
                      id="endereco_fisica"
                      value={fisicaData.endereco}
                      onChange={(e) => handleFisicaChange('endereco', e.target.value)}
                      className="mt-1.5"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cep_fisica">CEP *</Label>
                    <Input
                      id="cep_fisica"
                      value={fisicaData.cep}
                      onChange={(e) => handleFisicaChange('cep', formatCEPInput(e.target.value))}
                      placeholder="00000-000"
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="juridica" className="mt-6 space-y-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="razao_social">Razão Social *</Label>
                    <Input
                      id="razao_social"
                      value={juridicaData.razao_social}
                      onChange={(e) => handleJuridicaChange('razao_social', e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                    <Input
                      id="nome_fantasia"
                      value={juridicaData.nome_fantasia}
                      onChange={(e) => handleJuridicaChange('nome_fantasia', e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cnpj">CNPJ *</Label>
                    <Input
                      id="cnpj"
                      value={juridicaData.cnpj}
                      onChange={(e) => handleJuridicaChange('cnpj', formatCNPJInput(e.target.value))}
                      placeholder="00.000.000/0000-00"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefone_juridica">Telefone</Label>
                    <Input
                      id="telefone_juridica"
                      value={juridicaData.telefone}
                      onChange={(e) =>
                        handleJuridicaChange('telefone', formatPhoneInput(e.target.value))
                      }
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email_juridica">E-mail</Label>
                    <Input
                      id="email_juridica"
                      type="email"
                      value={juridicaData.email}
                      onChange={(e) => handleJuridicaChange('email', e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="endereco_juridica">Endereço da Empresa *</Label>
                    <Textarea
                      id="endereco_juridica"
                      value={juridicaData.endereco}
                      onChange={(e) => handleJuridicaChange('endereco', e.target.value)}
                      className="mt-1.5"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cep_juridica">CEP *</Label>
                    <Input
                      id="cep_juridica"
                      value={juridicaData.cep}
                      onChange={(e) => handleJuridicaChange('cep', formatCEPInput(e.target.value))}
                      placeholder="00000-000"
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div className="form-subpanel p-4 sm:p-5">
                  <h3 className="text-sm font-semibold text-foreground">
                    Representante Legal <span className="font-normal text-muted-foreground">(opcional)</span>
                  </h3>
                  <div className="mt-4 grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label htmlFor="representante_nome">Nome do Representante</Label>
                      <Input
                        id="representante_nome"
                        value={juridicaData.representante_nome}
                        onChange={(e) =>
                          handleJuridicaChange('representante_nome', e.target.value)
                        }
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="representante_cpf">CPF</Label>
                      <Input
                        id="representante_cpf"
                        value={juridicaData.representante_cpf}
                        onChange={(e) =>
                          handleJuridicaChange('representante_cpf', formatCPFInput(e.target.value))
                        }
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="representante_rg">RG</Label>
                      <Input
                        id="representante_rg"
                        value={juridicaData.representante_rg}
                        onChange={(e) => handleJuridicaChange('representante_rg', e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="representante_nacionalidade">Nacionalidade</Label>
                      <Input
                        id="representante_nacionalidade"
                        value={juridicaData.representante_nacionalidade}
                        onChange={(e) =>
                          handleJuridicaChange('representante_nacionalidade', e.target.value)
                        }
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="representante_estado_civil">Estado Civil</Label>
                      <Select
                        value={juridicaData.representante_estado_civil}
                        onValueChange={(value) =>
                          handleJuridicaChange('representante_estado_civil', value)
                        }
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {ESTADOS_CIVIS.map((estado) => (
                            <SelectItem key={estado} value={estado}>
                              {estado}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="representante_profissao">Profissão</Label>
                      <Input
                        id="representante_profissao"
                        value={juridicaData.representante_profissao}
                        onChange={(e) =>
                          handleJuridicaChange('representante_profissao', e.target.value)
                        }
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="representante_telefone">Telefone</Label>
                      <Input
                        id="representante_telefone"
                        value={juridicaData.representante_telefone}
                        onChange={(e) =>
                          handleJuridicaChange(
                            'representante_telefone',
                            formatPhoneInput(e.target.value)
                          )
                        }
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="representante_email">E-mail</Label>
                      <Input
                        id="representante_email"
                        type="email"
                        value={juridicaData.representante_email}
                        onChange={(e) =>
                          handleJuridicaChange('representante_email', e.target.value)
                        }
                        className="mt-1.5"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="representante_endereco">Endereço do Representante</Label>
                      <Textarea
                        id="representante_endereco"
                        value={juridicaData.representante_endereco}
                        onChange={(e) =>
                          handleJuridicaChange('representante_endereco', e.target.value)
                        }
                        className="mt-1.5"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="representante_cep">CEP do Representante</Label>
                      <Input
                        id="representante_cep"
                        value={juridicaData.representante_cep}
                        onChange={(e) =>
                          handleJuridicaChange('representante_cep', formatCEPInput(e.target.value))
                        }
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="service-card form-card">
          <CardHeader className="form-card-header">
            <CardTitle className="flex items-center gap-3 text-xl">
              <span className="service-icon h-10 w-10">
                <FileText className="h-4 w-4" />
              </span>
              Dados do Contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="form-card-content">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="orcamento_numero">Número da Proposta</Label>
                <Input
                  id="orcamento_numero"
                  value={contractData.orcamento_numero}
                  onChange={(e) => handleContractChange('orcamento_numero', e.target.value)}
                  className="mt-1.5"
                  placeholder="Ex: N49"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Este número será usado automaticamente no contrato e no orçamento.
                </p>
              </div>
              <div>
                <Label htmlFor="data">Data do Contrato</Label>
                <Input
                  id="data"
                  type="date"
                  value={contractData.data}
                  onChange={(e) => handleContractChange('data', e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="valor">Valor do Contrato (R$) *</Label>
                <div className="relative mt-1.5">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="valor"
                    value={contractData.valor}
                    onChange={(e) => handleContractChange('valor', formatCurrencyInput(e.target.value))}
                    placeholder="0,00"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="endereco_obra">Endereço da Obra *</Label>
                <Textarea
                  id="endereco_obra"
                  value={contractData.endereco_obra}
                  onChange={(e) => handleContractChange('endereco_obra', e.target.value)}
                  className="mt-1.5"
                  rows={2}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Valor por Extenso</Label>
                <div className="form-muted-box mt-1.5 px-3.5 py-3 text-sm leading-6 text-muted-foreground">
                  {contractData.valor
                    ? `${formatCurrency(contractData.valor)} - ${contractData.valor_extenso}`
                    : 'Preencha o valor para gerar o valor por extenso'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="service-card form-card">
          <CardHeader className="form-card-header">
            <CardTitle className="flex items-center gap-3 text-xl">
              <span className="service-icon h-10 w-10">
                <CreditCard className="h-4 w-4" />
              </span>
              Condição de Pagamento
            </CardTitle>
            <CardDescription>
              A cláusula de pagamento será montada automaticamente com base nestes campos
            </CardDescription>
          </CardHeader>
          <CardContent className="form-card-content space-y-6">
            <div>
              <Label>Forma de Pagamento</Label>
              <RadioGroup
                value={contractData.forma_pagamento}
                onValueChange={(value) => handleContractChange('forma_pagamento', value)}
                className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
              >
                {PAYMENT_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="form-choice flex cursor-pointer items-start gap-3 p-3.5"
                  >
                    <RadioGroupItem value={option.value} className="mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-foreground">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label htmlFor="quantidade_parcelas">Quantidade de Parcelas</Label>
                <Input
                  id="quantidade_parcelas"
                  value={contractData.quantidade_parcelas}
                  onChange={(e) => handleInstallmentCountChange(e.target.value)}
                  placeholder="Ex: 3"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="entrada_percentual">% de Entrada</Label>
                <Input
                  id="entrada_percentual"
                  value={calculateEntryPercentage(contractData) || '0'}
                  readOnly
                  placeholder="Calculado pelo sinal"
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="form-subpanel space-y-4 p-4 sm:p-5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Distribuição das Parcelas</h3>
                  <p className="text-xs text-muted-foreground">
                    Defina quanto será pago em cada parcela e por qual meio.
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  Total informado: <span className="font-medium text-foreground">{formatCurrency(installmentTotal)}</span>
                </div>
              </div>

              <div className="space-y-3">
                {contractData.parcelas_pagamento.map((installment, index) => (
                  <div
                    key={installment.id}
                    className="form-subpanel grid gap-3 p-3.5 lg:grid-cols-12"
                  >
                    <div className="lg:col-span-2">
                      <Label>Parcela {index + 1}</Label>
                      <Select
                        value={installment.metodo}
                        onValueChange={(value) =>
                          handleInstallmentChange(
                            installment.id,
                            'metodo',
                            value as InstallmentPaymentMethod
                          )
                        }
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {INSTALLMENT_PAYMENT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="lg:col-span-3">
                      <Label>Valor</Label>
                      <Input
                        value={installment.valor}
                        onChange={(e) =>
                          handleInstallmentChange(
                            installment.id,
                            'valor',
                            formatCurrencyInput(e.target.value)
                          )
                        }
                        placeholder="0,00"
                        className="mt-1.5"
                      />
                    </div>

                    <div className="lg:col-span-3">
                      <Label>Vencimento</Label>
                      <Input
                        type="date"
                        value={installment.vencimento}
                        onChange={(e) =>
                          handleInstallmentChange(installment.id, 'vencimento', e.target.value)
                        }
                        className="mt-1.5"
                      />
                    </div>

                    <div className="lg:col-span-4">
                      <Label>Observação</Label>
                      <Input
                        value={installment.observacao}
                        onChange={(e) =>
                          handleInstallmentChange(installment.id, 'observacao', e.target.value)
                        }
                        placeholder="Ex: entrada, sinal, parcela final..."
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-muted-box px-4 py-3 text-sm">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    Valor do contrato: <strong>{formatCurrency(contractData.valor || 0)}</strong>
                  </span>
                  <span>
                    Diferença: <strong>{formatCurrency(paymentDifference)}</strong>
                  </span>
                </div>
                <p className={`mt-2 text-xs ${isInstallmentDistributionValid ? 'text-primary' : 'text-destructive'}`}>
                  {isInstallmentDistributionValid
                    ? 'A soma das parcelas está fechando exatamente com o valor total do contrato.'
                    : 'A soma das parcelas precisa bater com o valor total do contrato para liberar a visualização.'}
                </p>
              </div>
            </div>

            <div className="grid gap-5">
              <div className="form-subpanel p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-foreground">Cláusulas opcionais do pagamento</h3>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  Desative os trechos que não devem aparecer neste contrato específico.
                </p>

                <div className="mt-4 grid gap-3">
                  <label className="form-choice flex items-start gap-3 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={contractData.incluir_etapa_medicao_pagamento}
                      onChange={(e) =>
                        handleContractBooleanChange('incluir_etapa_medicao_pagamento', e.target.checked)
                      }
                      className="mt-1 h-4 w-4 rounded border-border text-primary"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">Incluir cláusula 3.4.2</p>
                      <p className="text-xs leading-6 text-muted-foreground">
                        Mantém o trecho sobre pagamento na fase de medição técnica e fabricação.
                      </p>
                    </div>
                  </label>

                  <label className="form-choice flex items-start gap-3 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={contractData.incluir_saldo_final_pagamento}
                      onChange={(e) =>
                        handleContractBooleanChange('incluir_saldo_final_pagamento', e.target.checked)
                      }
                      className="mt-1 h-4 w-4 rounded border-border text-primary"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">Incluir cláusula 3.4.3</p>
                      <p className="text-xs leading-6 text-muted-foreground">
                        Mantém o trecho sobre saldo remanescente de 10% ao final da instalação.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="observacoes_pagamento">Observações da Forma de Pagamento</Label>
                <Textarea
                  id="observacoes_pagamento"
                  value={contractData.observacoes_pagamento}
                  onChange={(e) => handleContractChange('observacoes_pagamento', e.target.value)}
                  placeholder="Ex: O saldo restante será quitado ao final da instalação."
                  className="mt-1.5"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="condicao_fechamento">Texto Complementar da Cláusula</Label>
                <Textarea
                  id="condicao_fechamento"
                  value={contractData.condicao_fechamento}
                  onChange={(e) => handleContractChange('condicao_fechamento', e.target.value)}
                  placeholder="Use este campo para regras adicionais do pagamento."
                  className="mt-1.5"
                  rows={4}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" onClick={() => navigate('editor')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Editor
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid()}>
            Visualizar Contrato
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
