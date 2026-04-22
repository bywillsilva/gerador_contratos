'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, User, Building2, FileText, DollarSign } from 'lucide-react';
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
import { useNavigation } from '@/lib/navigation-context';
import { valueToExtenso, formatCurrency } from '@/lib/contract-utils';
import type { ClientType, ClientDataFisica, ClientDataJuridica, ContractData, FormData } from '@/lib/types';

const ESTADOS_CIVIS = [
  'Solteiro(a)',
  'Casado(a)',
  'Divorciado(a)',
  'Viúvo(a)',
  'União Estável',
];

export function ContractForm() {
  const { navigate, setFormData } = useNavigation();
  const [clientType, setClientType] = useState<ClientType>('fisica');
  
  // Pessoa Física
  const [fisicaData, setFisicaData] = useState<Omit<ClientDataFisica, 'tipo'>>({
    nome_cliente: '',
    cpf: '',
    endereco: '',
    cep: '',
    nacionalidade: 'Brasileiro(a)',
    estado_civil: '',
    email: '',
    telefone: '',
  });

  // Pessoa Jurídica
  const [juridicaData, setJuridicaData] = useState<Omit<ClientDataJuridica, 'tipo'>>({
    razao_social: '',
    cnpj: '',
    endereco: '',
    cep: '',
    email: '',
    telefone: '',
  });

  // Dados do Contrato
  const [contractData, setContractData] = useState<ContractData>({
    valor: '',
    valor_extenso: '',
    data: new Date().toISOString().split('T')[0],
    condicao_fechamento: '',
  });

  // Update valor_extenso when valor changes
  useEffect(() => {
    if (contractData.valor) {
      const extenso = valueToExtenso(contractData.valor);
      setContractData((prev) => ({ ...prev, valor_extenso: extenso }));
    }
  }, [contractData.valor]);

  const handleFisicaChange = (field: keyof typeof fisicaData, value: string) => {
    setFisicaData((prev) => ({ ...prev, [field]: value }));
  };

  const handleJuridicaChange = (field: keyof typeof juridicaData, value: string) => {
    setJuridicaData((prev) => ({ ...prev, [field]: value }));
  };

  const handleContractChange = (field: keyof ContractData, value: string) => {
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
    return number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const isFormValid = () => {
    if (clientType === 'fisica') {
      return (
        fisicaData.nome_cliente.trim() &&
        fisicaData.cpf.length >= 14 &&
        fisicaData.endereco.trim() &&
        fisicaData.cep.length >= 9 &&
        fisicaData.email.trim() &&
        fisicaData.telefone.length >= 14 &&
        contractData.valor.trim()
      );
    } else {
      return (
        juridicaData.razao_social.trim() &&
        juridicaData.cnpj.length >= 18 &&
        juridicaData.endereco.trim() &&
        juridicaData.cep.length >= 9 &&
        juridicaData.email.trim() &&
        juridicaData.telefone.length >= 14 &&
        contractData.valor.trim()
      );
    }
  };

  const handleSubmit = () => {
    const formData: FormData = {
      clientData:
        clientType === 'fisica'
          ? { tipo: 'fisica', ...fisicaData }
          : { tipo: 'juridica', ...juridicaData },
      contractData,
    };
    setFormData(formData);
    navigate('preview');
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Preencher Contrato</h2>
        <p className="text-sm text-muted-foreground">
          Insira os dados do cliente e do contrato
        </p>
      </div>

      <div className="space-y-6">
        {/* Tipo de Cliente */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              Tipo de Cliente
            </CardTitle>
            <CardDescription>
              Selecione se o cliente é Pessoa Física ou Jurídica
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={clientType} onValueChange={(v) => setClientType(v as ClientType)}>
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

              {/* Pessoa Física */}
              <TabsContent value="fisica" className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={fisicaData.nome_cliente}
                      onChange={(e) => handleFisicaChange('nome_cliente', e.target.value)}
                      placeholder="Digite o nome completo"
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
                    <Label htmlFor="nacionalidade">Nacionalidade</Label>
                    <Input
                      id="nacionalidade"
                      value={fisicaData.nacionalidade}
                      onChange={(e) => handleFisicaChange('nacionalidade', e.target.value)}
                      placeholder="Brasileiro(a)"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="estado_civil">Estado Civil</Label>
                    <Select
                      value={fisicaData.estado_civil}
                      onValueChange={(v) => handleFisicaChange('estado_civil', v)}
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
                  <div>
                    <Label htmlFor="telefone_fisica">Telefone *</Label>
                    <Input
                      id="telefone_fisica"
                      value={fisicaData.telefone}
                      onChange={(e) => handleFisicaChange('telefone', formatPhoneInput(e.target.value))}
                      placeholder="(00) 00000-0000"
                      className="mt-1.5"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="email_fisica">E-mail *</Label>
                    <Input
                      id="email_fisica"
                      type="email"
                      value={fisicaData.email}
                      onChange={(e) => handleFisicaChange('email', e.target.value)}
                      placeholder="exemplo@email.com"
                      className="mt-1.5"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="endereco_fisica">Endereço Completo *</Label>
                    <Textarea
                      id="endereco_fisica"
                      value={fisicaData.endereco}
                      onChange={(e) => handleFisicaChange('endereco', e.target.value)}
                      placeholder="Rua, número, complemento, bairro, cidade, estado"
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

              {/* Pessoa Jurídica */}
              <TabsContent value="juridica" className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="razao_social">Razão Social *</Label>
                    <Input
                      id="razao_social"
                      value={juridicaData.razao_social}
                      onChange={(e) => handleJuridicaChange('razao_social', e.target.value)}
                      placeholder="Digite a razão social"
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
                    <Label htmlFor="telefone_juridica">Telefone *</Label>
                    <Input
                      id="telefone_juridica"
                      value={juridicaData.telefone}
                      onChange={(e) => handleJuridicaChange('telefone', formatPhoneInput(e.target.value))}
                      placeholder="(00) 00000-0000"
                      className="mt-1.5"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="email_juridica">E-mail *</Label>
                    <Input
                      id="email_juridica"
                      type="email"
                      value={juridicaData.email}
                      onChange={(e) => handleJuridicaChange('email', e.target.value)}
                      placeholder="empresa@email.com"
                      className="mt-1.5"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="endereco_juridica">Endereço Completo *</Label>
                    <Textarea
                      id="endereco_juridica"
                      value={juridicaData.endereco}
                      onChange={(e) => handleJuridicaChange('endereco', e.target.value)}
                      placeholder="Rua, número, complemento, bairro, cidade, estado"
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Dados do Contrato */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Dados do Contrato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
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
                <Label>Valor por Extenso</Label>
                <div className="mt-1.5 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                  {contractData.valor ? formatCurrency(contractData.valor) + ' - ' + contractData.valor_extenso : 'Preencha o valor para ver por extenso'}
                </div>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="condicao">Condição de Fechamento / Forma de Pagamento</Label>
                <Textarea
                  id="condicao"
                  value={contractData.condicao_fechamento}
                  onChange={(e) => handleContractChange('condicao_fechamento', e.target.value)}
                  placeholder="Ex: 50% de entrada + 50% na entrega, ou parcelado em 3x..."
                  className="mt-1.5"
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex justify-between">
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
