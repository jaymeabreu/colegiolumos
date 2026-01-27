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
  items?: MenuItem[];
}

export function CoordinadorSidebar() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<ConfiguracaoEscola | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['painel']);

  const menuItems: MenuItem[] = [
    {
      id: 'painel',
      label: 'Painel',
      icon: <BarChart3 className="h-4 w-4" />,
      items: [
        { id: 'visao-geral', label: 'Visão geral', icon: <BarChart3 className="h-4 w-4" />, path: '/app/admin' },
        { id: 'comunicados', label: 'Comunicados', icon: <MessageSquare className="h-4 w-4" />, path: '/app/admin' },
        { id: 'ocorrencias', label: 'Ocorrências', icon: <Clipboard className="h-4 w-4" />, path: '/app/admin' },
      ]
    },
    {
      id: 'gestao-escolar',
      label: 'Gestão Escolar',
      icon: <GraduationCap className="h-4 w-4" />,
      items: [
        { id: 'disciplinas', label: 'Disciplinas', icon: <School className="h-4 w-4" />, path: '/app/admin' },
        { id: 'turmas', label: 'Turmas', icon: <Users className="h-4 w-4" />, path: '/app/admin' },
        { id: 'alunos', label: 'Alunos', icon: <Users className="h-4 w-4" />, path: '/app/admin' },
        { id: 'professores', label: 'Professores', icon: <Users className="h-4 w-4" />, path: '/app/admin' },
        { id: 'funcionarios', label: 'Funcionários', icon: <Users className="h-4 w-4" />, path: '/app/admin' },
        { id: 'responsaveis', label: 'Responsáveis', icon: <Users className="h-4 w-4" />, path: '/app/admin' },
      ]
    },
    {
      id: 'area-pedagogica',
      label: 'Área Pedagógica',
      icon: <BookOpen className="h-4 w-4" />,
      items: [
        { id: 'diarios', label: 'Diários', icon: <FileText className="h-4 w-4" />, path: '/app/admin' },
        { id: 'calendario-escolar', label: 'Calendário Escolar', icon: <Calendar className="h-4 w-4" />, path: '/app/admin' },
        { id: 'agenda-recados', label: 'Agenda de Recados', icon: <Clipboard className="h-4 w-4" />, path: '/app/admin' },
      ]
    },
    {
      id: 'secretaria',
      label: 'Secretaria',
      icon: <FileText className="h-4 w-4" />,
      items: [
        { id: 'matriculas', label: 'Matrículas', icon: <Clipboard className="h-4 w-4" />, path: '/app/admin' },
        { id: 'historico-escolar', label: 'Histórico escolar', icon: <FileText className="h-4 w-4" />, path: '/app/admin' },
        { id: 'transferencias', label: 'Transferências', icon: <Users className="h-4 w-4" />, path: '/app/admin' },
        { id: 'portal-aluno', label: 'Portal do aluno', icon: <Users className="h-4 w-4" />, path: '/app/admin' },
      ]
    },
    {
      id: 'relatorios',
      label: 'Relatórios',
      icon: <BarChart3 className="h-4 w-4" />,
      path: '/app/admin'
    },
    {
      id: 'documentacao',
      label: 'Documentação',
      icon: <FileText className="h-4 w-4" />,
      path: '/app/admin'
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

  const handleMenuItemClick = (path?: string) => {
    if (path) {
      navigate(path);
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
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
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
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {menuItems.map((menu) => (
          <div key={menu.id}>
            <button
              onClick={() => {
                if (menu.items) {
                  toggleMenu(menu.id);
                } else {
                  handleMenuItemClick(menu.path);
                }
              }}
              className="w-full flex items-center justify-between px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              <div className="flex items-center gap-3">
                {menu.icon}
                <span>{menu.label}</span>
              </div>
              {menu.items && (
                expandedMenus.includes(menu.id) ? 
                  <ChevronUp className="h-4 w-4" /> : 
                  <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {/* SUB-MENUS */}
            {menu.items && expandedMenus.includes(menu.id) && (
              <div className="ml-4 space-y-1 mt-1">
                {menu.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleMenuItemClick(item.path)}
                    className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 transition-colors text-sm"
                  >
                    {item.icon}
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
