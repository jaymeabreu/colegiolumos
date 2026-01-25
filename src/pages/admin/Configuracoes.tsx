import { useState, useRef } from 'react';
import { ArrowLeft, Upload, Save, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { useNavigate } from 'react-router-dom';

interface ConfigData {
  nomeInstituicao: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  descricao: string;
  logo: File | null;
  logoPreview: string | null;
}

export function Configuracoes() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<ConfigData>({
    nomeInstituicao: 'Colégio Lumos',
    email: 'contato@colegiolumos.com.br',
    telefone: '(11) 3000-0000',
    endereco: 'Rua Exemplo, 123',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01310-100',
    descricao: 'Instituição de ensino comprometida com a excelência educacional',
    logo: null,
    logoPreview: null
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione um arquivo de imagem');
        return;
      }

      // Validar tamanho (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('O arquivo não pode exceder 5MB');
        return;
      }

      // Gerar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          logo: file,
          logoPreview: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setFormData(prev => ({
      ...prev,
      logo: null,
      logoPreview: null
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Configurações da Instituição
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie as informações e preferências da escola
            </p>
          </div>
        </div>

        {/* SUCCESS MESSAGE */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <div className="h-2 w-2 bg-green-600 rounded-full"></div>
            <p className="text-green-800 font-medium">
              ✅ Configurações salvas com sucesso!
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SEÇÃO: LOGO */}
          <Card>
            <CardHeader>
              <CardTitle>Logo da Instituição</CardTitle>
              <CardDescription>
                A logo aparecerá no topo do site e na página de login
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-6">
                {/* PREVIEW */}
                <div className="flex-1">
                  <div className="w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                    {formData.logoPreview ? (
                      <div className="text-center">
                        <img 
                          src={formData.logoPreview} 
                          alt="Logo Preview" 
                          className="h-40 w-auto mx-auto object-contain"
                        />
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Nenhuma logo selecionada</p>
                      </div>
                    )}
                  </div>

                  {formData.logoPreview && (
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                      Remover Logo
                    </button>
                  )}
                </div>

                {/* UPLOAD */}
                <div className="flex-1 flex flex-col justify-center">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="logo" className="block mb-2">
                        Selecionar Arquivo
                      </Label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        id="logo"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full px-4 py-3 border-2 border-blue-300 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors font-medium"
                      >
                        <Upload className="h-4 w-4 inline mr-2" />
                        Escolher Imagem
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      <p>• Formatos: JPG, PNG, GIF, SVG</p>
                      <p>• Tamanho máximo: 5MB</p>
                      <p>• Recomendado: 300x300px</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEÇÃO: INFORMAÇÕES GERAIS */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
              <CardDescription>
                Dados principais da instituição
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nomeInstituicao">Nome da Instituição</Label>
                  <Input
                    id="nomeInstituicao"
                    name="nomeInstituicao"
                    value={formData.nomeInstituicao}
                    onChange={handleInputChange}
                    placeholder="Ex: Colégio Lumos"
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail Institucional</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="contato@escola.com.br"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleInputChange}
                    placeholder="(11) 3000-0000"
                  />
                </div>
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    name="cep"
                    value={formData.cep}
                    onChange={handleInputChange}
                    placeholder="01310-100"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleInputChange}
                  placeholder="Rua Exemplo, 123"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    name="cidade"
                    value={formData.cidade}
                    onChange={handleInputChange}
                    placeholder="São Paulo"
                  />
                </div>
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    name="estado"
                    value={formData.estado}
                    onChange={handleInputChange}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEÇÃO: DESCRIÇÃO */}
          <Card>
            <CardHeader>
              <CardTitle>Descrição da Instituição</CardTitle>
              <CardDescription>
                Breve descrição que aparecerá no login
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleInputChange}
                placeholder="Descreva a instituição..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* BOTÕES */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <div className="inline-block animate-spin mr-2">⏳</div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Configuracoes;
