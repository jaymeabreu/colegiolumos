import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Upload, Building2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { createClient } from '@supabase/supabase-js';

interface ConfiguracaoEscola {
  id?: number;
  nome_escola?: string;
  logo_url?: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
}

// Inicializar cliente Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export function Configuracoes() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [instituicao, setInstituicao] = useState<ConfiguracaoEscola>({
    nome_escola: '',
    logo_url: '',
    cnpj: '',
    endereco: '',
    telefone: '',
    email: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoadingData(true);
      const { data, error } = await supabase
        .from('configuracoes_escola')
        .select('*')
        .maybeSingle();

      if (data) {
        setInstituicao(data);
        if (data.logo_url) {
          setLogoPreview(data.logo_url);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogoToSupabase = async (file: File): Promise<string | null> => {
    try {
      const fileName = `logo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const { data, error } = await supabase.storage
        .from('logo')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload da logo:', error);
      alert('Erro ao fazer upload da logo. Tente novamente.');
      return null;
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      let logoUrl = instituicao.logo_url;

      // Se houver novo logo, fazer upload
      if (logoFile) {
        const uploadedUrl = await uploadLogoToSupabase(logoFile);
        if (uploadedUrl) {
          logoUrl = uploadedUrl;
        } else {
          setLoading(false);
          return;
        }
      }

      const payload: any = {
        nome_escola: instituicao.nome_escola,
        logo_url: logoUrl || null,
        cnpj: instituicao.cnpj || null,
        telefone: instituicao.telefone || null,
        email: instituicao.email || null,
        endereco: instituicao.endereco || null,
      };

      // Se existe ID, atualiza; senão cria novo
      if (instituicao.id) {
        const { error } = await supabase
          .from('configuracoes_escola')
          .update(payload)
          .eq('id', instituicao.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('configuracoes_escola')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setInstituicao(data);
        }
      }

      setLogoFile(null);
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* HEADER COM BOTÃO VOLTAR */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/app/admin')}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Building2 className="h-8 w-8 text-blue-600" />
                Configurações da Instituição
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gerencie as informações e personalização do sistema
              </p>
            </div>
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
                  value={instituicao.nome_escola || ''}
                  onChange={(e) => setInstituicao({ ...instituicao, nome_escola: e.target.value })}
                  placeholder="Ex: Colégio Lumos"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={instituicao.cnpj || ''}
                  onChange={(e) => setInstituicao({ ...instituicao, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={instituicao.telefone || ''}
                  onChange={(e) => setInstituicao({ ...instituicao, telefone: e.target.value })}
                  placeholder="(00) 0000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={instituicao.email || ''}
                  onChange={(e) => setInstituicao({ ...instituicao, email: e.target.value })}
                  placeholder="contato@colegiolumos.com.br"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Textarea
                id="endereco"
                value={instituicao.endereco || ''}
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
                {logoPreview ? (
                  <img 
                    src={logoPreview}
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
                  Qualquer formato de imagem (PNG, JPG, SVG, etc)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BOTÃO SALVAR */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/app/admin')}
          >
            Cancelar
          </Button>
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
