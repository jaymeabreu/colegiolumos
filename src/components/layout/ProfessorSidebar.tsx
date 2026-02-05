import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, BookOpen, ClipboardCheck, Users, AlertCircle, MessageSquare, X, Menu } from 'lucide-react';
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

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  tabId: string;
  color?: string;
}

interface ProfessorSidebarProps {
  onTabChange?: (tabId: string) => void;
  professorNome?: string;
}

export function ProfessorSidebar({ onTabChange, professorNome }: ProfessorSidebarProps) {
  const navigate = useNavigate();
  const [config, setConfig] = useState<ConfiguracaoEscola | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('aulas');

  const menuItems: MenuItem[] = [
    {
      id: 'aulas',
      label: 'Aulas',
      icon: <BookOpen className="h-5 w-5" />,
      tabId: 'aulas',
      color: 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600'
    },
    {
      id: 'avaliacoes',
      label: 'Avaliações',
      icon: <ClipboardCheck className="h-5 w-5" />,
      tabId: 'avaliacoes',
      color: 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-600'
    },
    {
      id: 'alunos',
      label: 'Alunos',
      icon: <Users className="h-5 w-5" />,
      tabId: 'alunos',
      color: 'bg-cyan-50 dark:bg-cyan-900/20 border-l-4 border-cyan-600'
    },
    {
      id: 'ocorrencias',
      label: 'Ocorrências',
      icon: <AlertCircle className="h-5 w-5" />,
      tabId: 'ocorrencias',
      color: 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-600'
    },
    {
      id: 'recados',
      label: 'Recados',
      icon: <MessageSquare className="h-5 w-5" />,
      tabId: 'recados',
      color: 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-600'
    },
  ];

  useEffect(() => {
    loadConfig();
    
    window.addEventListener('configuracoesAtualizadas', loadConfig);
    
    return () => {
      window.removeEventListener('configuracoesAtualizadas', loadConfig);
    };
  }, []);

  useEffect(() => {
    const handleToggle = () => {
      setMobileMenuOpen(prev => !prev);
    };
    
    window.addEventListener('toggleSidebar', handleToggle);
    return () => window.removeEventListener('toggleSidebar', handleToggle);
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

  const handleMenuItemClick = (tabId: string) => {
    setActiveTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* BOTÃO HAMBURGUER - MOBILE */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="fixed top-4 left-4 z-[100] p-2.5 bg-white dark:bg-gray-900 rounded-lg shadow-lg max-[880px]:flex hidden hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        aria-label="Abrir menu"
      >
        <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
      </button>

      {/* OVERLAY - Apenas mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[9998] max-[880px]:block hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <div 
        className={`
          fixed left-0 top-0 h-screen bg-white dark:bg-gray-900 
          border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden
          transition-transform duration-300 ease-in-out
          w-full max-[880px]:w-screen min-[881px]:w-64 min-[881px]:relative
          max-[880px]:-translate-x-full z-[9999]
          ${mobileMenuOpen ? 'max-[880px]:translate-x-0' : ''}
        `}
      >
        {/* HEADER - LOGO E NOME DA ESCOLA */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Botão X para fechar (MOBILE) */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded min-[881px]:hidden"
            >
              <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>

            {config?.logo_url ? (
              <img 
                src={config.logo_url} 
                alt="Logo" 
                className="w-12 h-12 rounded-lg object-contain"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--primary)' }}>
                <span className="text-white font-bold text-sm">CL</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {config?.nome_escola || 'Colégio'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Professor</p>
            </div>
          </div>
        </div>

        {/* HEADER MOBILE COM NOME DO PROFESSOR */}
        {professorNome && (
          <div className="max-[880px]:block hidden px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">Bem-vindo,</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{professorNome}</p>
          </div>
        )}

        {/* MENUS - SCROLLÁVEL */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
          {menuItems.map((menu) => (
            <button
              key={menu.id}
              onClick={() => handleMenuItemClick(menu.tabId)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === menu.tabId 
                  ? menu.color + ' shadow-md' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              } text-gray-800 dark:text-gray-200`}
            >
              {menu.icon}
              <span className="text-sm">{menu.label}</span>
            </button>
          ))}
        </div>

        {/* CONFIGURAÇÕES - EMBAIXO */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4 flex-shrink-0">
          <button 
            onClick={() => navigate('/app/professor/configuracoes')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
          >
            <Settings className="h-5 w-5" />
            <span className="text-sm font-medium">Configurações</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default ProfessorSidebar;
