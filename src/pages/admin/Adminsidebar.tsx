import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  BarChart3, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LogOut
} from 'lucide-react';
import { Button } from '../ui/button';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

export function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      path: '/app/admin'
    },
    {
      id: 'diarios',
      label: 'Diários',
      icon: <FileText className="h-5 w-5" />,
      path: '/app/admin/diarios'
    },
    {
      id: 'professores',
      label: 'Professores',
      icon: <Users className="h-5 w-5" />,
      path: '/app/admin/professores'
    },
    {
      id: 'alunos',
      label: 'Alunos',
      icon: <GraduationCap className="h-5 w-5" />,
      path: '/app/admin/alunos'
    },
    {
      id: 'relatorios',
      label: 'Relatórios',
      icon: <BarChart3 className="h-5 w-5" />,
      path: '/app/admin/relatorios'
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    // Adicione aqui sua lógica de logout
    navigate('/');
  };

  return (
    <div 
      className={`
        fixed left-0 top-0 h-screen bg-white dark:bg-gray-900 
        border-r border-gray-200 dark:border-gray-700
        transition-all duration-300 ease-in-out z-50
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* HEADER DO SIDEBAR */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CL</span>
            </div>
            <span className="font-bold text-gray-900 dark:text-white">Admin</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* MENU ITEMS */}
      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
              transition-all duration-200
              ${isActive(item.path)
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            {item.icon}
            {!collapsed && <span className="text-sm">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* CONFIGURAÇÕES E LOGOUT */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-1">
        <button
          onClick={() => navigate('/app/admin/configuracoes')}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
            transition-all duration-200
            ${isActive('/app/admin/configuracoes')
              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          <Settings className="h-5 w-5" />
          {!collapsed && <span className="text-sm">Configurações</span>}
        </button>

        <button
          onClick={handleLogout}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
            text-gray-700 dark:text-gray-300 
            hover:bg-red-50 dark:hover:bg-red-900/20
            hover:text-red-600 dark:hover:text-red-400
            transition-all duration-200
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="text-sm">Sair</span>}
        </button>
      </div>
    </div>
  );
}

export default AdminSidebar;
