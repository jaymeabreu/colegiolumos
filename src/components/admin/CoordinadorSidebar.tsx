import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface ConfiguracaoEscola {
  id?: number;
  nome_escola?: string;
  logo_url?: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
}

export function CoordinadorSidebar() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<ConfiguracaoEscola | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
    
    // Recarregar quando configurações forem salvas
    window.addEventListener('configuracoesAtualizadas', loadConfig);
    
    return () => {
      window.removeEventListener('configuracoesAtualizadas', loadConfig);
    };
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('configuracoes_escola')
        .select('*')
        .maybeSingle();

      if (data) {
        setConfig(data);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      {/* HEADER - LOGO E NOME DA ESCOLA */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          {config?.logo_url ? (
            <img 
              src={config.logo_url} 
              alt="Logo" 
              className="w-12 h-12 rounded-lg object-contain"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">CL</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {config?.nome_escola || 'Colégio'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Coordenador</p>
          </div>
        </div>
      </div>

      {/* ESPAÇO VAZIO NO MEIO */}
      <div className="flex-1"></div>

      {/* CONFIGURAÇÕES - EMBAIXO */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button 
          onClick={() => navigate('/app/admin/configuracoes')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
        >
          <Settings className="h-5 w-5" />
          <span className="text-sm font-medium">Configurações</span>
        </button>
      </div>
    </div>
  );
}

export default CoordinadorSidebar;
