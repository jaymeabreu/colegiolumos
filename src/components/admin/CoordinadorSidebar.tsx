import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, ChevronDown, ChevronUp, BarChart3, FileText, MessageSquare, Users, BookOpen, GraduationCap, School, Calendar, Clipboard } from 'lucide-react';
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
  path?: string;
  color?: string;
  tabId?: string;
  items?: MenuItem[];
}

interface CoordinadorSidebarProps {
  onTabChange?: (tabId: string) => void;
}

export function CoordinadorSidebar({ onTabChange }: CoordinadorSidebarProps) {
  const navigate = useNavigate();
  const [config, setConfig] = useState<ConfiguracaoEscola | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['painel']);

  const menuItems: MenuItem[] = [
    {
      id: 'painel',
      label: 'Painel',
      icon: <BarChart3 className="h-5 w-5" />,
      color: 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600',
      items: [
        { id: 'visao-geral', label: 'Visão geral', icon: <BarChart3 className="h-4 w-4" />, tabId: 'visao-geral' },
        { id: 'comunicados', label: 'Comunicados', icon: <MessageSquare className="h-4 w-4" />, tabId: 'comunicados' },
        { id: 'ocorrencias', label: 'Ocorrências', icon: <Clipboard className="h-4 w-4" />, tabId: 'ocorrencias' },
      ]
    },
    {
      id: 'gestao-escolar',
      label: 'Gestão Escolar',
      icon: <GraduationCap className="h-5 w-5" />,
      color: 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-600',
      items: [
        { id: 'disciplinas', label: 'Disciplinas', icon: <School className="h-4 w-4" />, tabId: 'disciplinas' },
        { id: 'turmas', label: 'Turmas', icon: <Users className="h-4 w-4" />, tabId: 'turmas' },
        { id: 'alunos', label: 'Alunos', icon: <Users className="h-4 w-4" />, tabId: 'alunos' },
        { id: 'professores', label: 'Professores', icon: <Users className="h-4 w-4" />, tabId: 'professores' },
      ]
    },
    {
      id: 'area-pedagogica',
      label: 'Área Pedagógica',
      icon: <BookOpen className="h-5 w-5" />,
      color: 'bg-cyan-50 dark:bg-cyan-900/20 border-l-4 border-cyan-600',
      items: [
        { id: 'diarios', label: 'Diários', icon: <FileText className="h-4 w-4" />, tabId: 'diarios' },
        { id: 'calendario-escolar', label: 'Calendário Escolar', icon: <Calendar className="h-4 w-4" />, tabId: 'calendario-escolar' },
        { id: 'agenda-recados', label: 'Agenda de Recados', icon: <Clipboard className="h-4 w-4" />, tabId: 'agenda-recados' },
      ]
    },
    {
      id: 'secretaria',
      label: 'Secretaria',
      icon: <FileText className="h-5 w-5" />,
      color: 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-600',
      items: [
        { id: 'matriculas', label: 'Matrículas', icon: <Clipboard className="h-4 w-4" />, tabId: 'matriculas' },
        { id: 'historico-escolar', label: 'Histórico escolar', icon: <FileText className="h-4 w-4" />, tabId: 'historico-escolar' },
        { id: 'transferencias', label: 'Transferências', icon: <Users className="h-4 w-4" />, tabId: 'transferencias' },
        { id: 'portal-aluno', label: 'Portal do aluno', icon: <Users className="h-4 w-4" />, tabId: 'portal-aluno' },
      ]
    },
    {
      id: 'relatorios',
      label: 'Relatórios',
      icon: <BarChart3 className="h-5 w-5" />,
      color: 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-600',
      tabId: 'relatorios'
    },
    {
      id: 'documentacao',
      label: 'Documentação',
      icon: <FileText className="h-5 w-5" />,
      color: 'bg-gray-100 dark:bg-gray-700 border-l-4 border-gray-600',
      tabId: 'documentacao'
    },
  ];

  useEffect(() => {
    loadConfig();
    
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

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleMenuItemClick = (tabId?: string) => {
    if (tabId && onTabChange) {
      onTabChange(tabId);
    }
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
      {/* HEADER - LOGO E NOME DA ESCOLA */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3">
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
            <p className="text-xs text-gray-500 dark:text-gray-400">Coordenador</p>
          </div>
        </div>
      </div>

      {/* MENUS - SCROLLÁVEL */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        {menuItems.map((menu) => (
          <div key={menu.id}>
            <button
              onClick={() => {
                if (menu.items) {
                  toggleMenu(menu.id);
                } else {
                  handleMenuItemClick(menu.tabId);
                }
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-all ${
                menu.color || 'hover:bg-gray-100 dark:hover:bg-gray-800'
              } text-gray-800 dark:text-gray-200`}
            >
              <div className="flex items-center gap-3">
                {menu.icon}
                <span className="text-sm">{menu.label}</span>
              </div>
              {menu.items && (
                expandedMenus.includes(menu.id) ? 
                  <ChevronUp className="h-4 w-4" /> : 
                  <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {/* SUB-MENUS */}
            {menu.items && expandedMenus.includes(menu.id) && (
              <div className="ml-2 space-y-1 mt-1 pl-2 border-l-2 border-gray-200 dark:border-gray-700">
                {menu.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleMenuItemClick(item.tabId)}
                    className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
                  >
                    <span>•</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CONFIGURAÇÕES - EMBAIXO */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4 flex-shrink-0">
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
