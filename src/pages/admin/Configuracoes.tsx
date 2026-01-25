import { useState } from 'react';
import { Save, Upload, Building2, Palette, Globe, Bell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';

export function Configuracoes() {
  const [loading, setLoading] = useState(false);
  const [instituicao, setInstituicao] = useState({
    nome: 'Colégio Lumos',
    cnpj: '',
    endereco: '',
    telefone: '',
    email: '',
    logo: null as File | null
  });

  const handleSave = async () => {
    setLoading(true);
    // Aqui você implementará a lógica de salvar no Supabase
    setTimeout(() => {
      setLoading(false);
      alert('Configurações salvas com sucesso!');
    }, 1000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInstituicao({ ...instituicao, logo: file });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Building2 className="h-8 w-8 text-red-600" />
              Configurações da Instituição
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie as informações e personalização do sistema
            </p>
          </div>
        </div>

        {/* INFORMAÇÕES DA INSTITUIÇÃO */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informações da Instituição
            </CardTitle>
            <CardDescription>
              Dados básicos e informações de contato
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Instituição</Label>
                <Input
                  id="nome"
                  value={instituicao.nome}
                  onChange={(e) => setInstituicao({ ...instituicao, nome: e.target.value })}
                  placeholder="Ex: Colégio Lumos"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={instituicao.cnpj}
                  onChange={(e) => setInstituicao({ ...instituicao, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={instituicao.telefone}
                  onChange={(e) => setInstituicao({ ...instituicao, telefone: e.target.value })}
                  placeholder="(00) 0000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={instituicao.email}
                  onChange={(e) => setInstituicao({ ...instituicao, email: e.target.value })}
                  placeholder="contato@colegiolumos.com.br"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Textarea
                id="endereco"
                value={instituicao.endereco}
                onChange={(e) => setInstituicao({ ...instituicao, endereco: e.target.value })}
                placeholder="Rua, número, bairro, cidade - Estado"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* LOGO DA INSTITUIÇÃO */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Logo da Instituição
            </CardTitle>
            <CardDescription>
              Faça upload do logo que aparecerá no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                {instituicao.logo ? (
                  <img 
                    src={URL.createObjectURL(instituicao.logo)} 
                    alt="Logo preview" 
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <Upload className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <Label htmlFor="logo" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg w-fit transition-colors">
                    <Upload className="h-4 w-4" />
                    <span>Escolher arquivo</span>
                  </div>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </Label>
                <p className="text-sm text-gray-500 mt-2">
                  PNG, JPG ou SVG (máx. 2MB)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PERSONALIZAÇÃO */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Personalização
            </CardTitle>
            <CardDescription>
              Cores e tema do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Azul', color: 'bg-blue-500' },
                { name: 'Verde', color: 'bg-green-500' },
                { name: 'Roxo', color: 'bg-purple-500' },
                { name: 'Vermelho', color: 'bg-red-500' }
              ].map((tema) => (
                <button
                  key={tema.name}
                  className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-full ${tema.color}`}></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {tema.name}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* BOTÃO SALVAR */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-6"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Configuracoes;
