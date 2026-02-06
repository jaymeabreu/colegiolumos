import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseService, Aluno, Professor } from '@/services/supabaseService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Users, FileText, MessageSquare, Folder, Settings, BarChart3, LogOut, Menu, X } from 'lucide-react'; 

type TabId = 'visao-geral' | 'diarios' | 'comunicados' | 'alunos' | 'professores' | 'disciplinas' | 'turmas' | 'usuarios' | 'exportacao';

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

interface DashboardStats {
  totalAlunos: number;
  alunosAtivos: number;
  alunosInativos: number;
  totalProfessores: number;
  professoresAtivos: number;
  professoresInativos: number;
  totalFuncionarios: number;
  funcionariosAtivos: number;
  funcionariosInativos: number;
}

const COLORS_CHART = ['#1e40af', '#fbbf24'];

export function CoordinadorPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('visao-geral');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalAlunos: 0,
    alunosAtivos: 0,
    alunosInativos: 0,
    totalProfessores: 0,
    professoresAtivos: 0,
    professoresInativos: 0,
    totalFuncionarios: 0,
    funcionariosAtivos: 0,
    funcionariosInativos: 0,
  });

  const tabs: TabConfig[] = [
    { id: 'visao-geral', label: 'Visão geral', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'diarios', label: 'Diários', icon: <FileText className="h-4 w-4" /> },
    { id: 'comunicados', label: 'Comunicados', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'alunos', label: 'Alunos', icon: <Users className="h-4 w-4" /> },
    { id: 'professores', label: 'Professores', icon: <Users className="h-4 w-4" /> },
    { id: 'disciplinas', label: 'Disciplinas', icon: <Folder className="h-4 w-4" /> },
    { id: 'turmas', label: 'Turmas', icon: <Folder className="h-4 w-4" /> },
    { id: 'usuarios', label: 'Usuários', icon: <Users className="h-4 w-4" /> },
    { id: 'exportacao', label: 'Exportação', icon: <FileText className="h-4 w-4" /> },
  ];

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Buscar alunos
      const alunos = await supabaseService.getAlunos();
      const alunosAtivos = alunos.filter(a => a.situacao === 'Ativo').length;
      const alunosInativos = alunos.length - alunosAtivos;

      // Buscar professores
      const professores = await supabaseService.getProfessores();
      const professoresAtivos = professores.filter(p => p.situacao === 'ATIVO').length;
      const professoresInativos = professores.length - professoresAtivos;

      setStats({
        totalAlunos: alunos.length,
        alunosAtivos,
        alunosInativos,
        totalProfessores: professores.length,
        professoresAtivos,
        professoresInativos,
        totalFuncionarios: 0,
        funcionariosAtivos: 0,
        funcionariosInativos: 0,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderVisaoGeral = () => {
    const dataAlunos = [
      { name: 'Ativos', value: stats.alunosAtivos },
      { name: 'Inativos', value: stats.alunosInativos }
    ].filter(item => item.value > 0);

    const dataProfessores = [
      { name: 'Ativos', value: stats.professoresAtivos },
      { name: 'Inativos', value: stats.professoresInativos }
    ].filter(item => item.value > 0);

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Painel Administrativo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie usuários, turmas e configurações
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* TOTAL DE ALUNOS */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 dark:text-white">
                Total de alunos
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <button 
                  onClick={() => navigate('/app/admin?tab=alunos')}
                  className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
                >
                  Ver tudo
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={dataAlunos}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {dataAlunos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_CHART[index % COLORS_CHART.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-6 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#1e40af' }}></div>
                    <span className="text-gray-600 dark:text-gray-400">Ativos:</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{stats.alunosAtivos}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#fbbf24' }}></div>
                    <span className="text-gray-600 dark:text-gray-400">Inativos:</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{stats.alunosInativos}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TOTAL DE PROFESSORES */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 dark:text-white">
                Total de professores
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <button 
                  onClick={() => navigate('/app/admin?tab=professores')}
                  className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
                >
                  Ver tudo
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={dataProfessores}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {dataProfessores.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_CHART[index % COLORS_CHART.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-6 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#1e40af' }}></div>
                    <span className="text-gray-600 dark:text-gray-400">Ativos:</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{stats.professoresAtivos}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#fbbf24' }}></div>
                    <span className="text-gray-600 dark:text-gray-400">Inativos:</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{stats.professoresInativos}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TOTAL DE FUNCIONÁRIOS */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 dark:text-white">
                Total de funcionários
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <button 
                  onClick={() => alert('Página de funcionários ainda não implementada')}
                  className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
                >
                  Ver tudo
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[150px] flex items-center justify-center text-gray-400">
                Sem dados
              </div>
              <div className="mt-6 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Ativos:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Inativos:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">0</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-white">
              Calendário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-400">
              Calendário será implementado aqui
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'visao-geral':
        return renderVisaoGeral();
      case 'diarios':
        return <div className="text-gray-500">Seção de Diários - Em desenvolvimento</div>;
      case 'comunicados':
        return <div className="text-gray-500">Seção de Comunicados - Em desenvolvimento</div>;
      case 'alunos':
        return <div className="text-gray-500">Seção de Alunos - Em desenvolvimento</div>;
      case 'professores':
        return <div className="text-gray-500">Seção de Professores - Em desenvolvimento</div>;
      case 'disciplinas':
        return <div className="text-gray-500">Seção de Disciplinas - Em desenvolvimento</div>;
      case 'turmas':
        return <div className="text-gray-500">Seção de Turmas - Em desenvolvimento</div>;
      case 'usuarios':
        return <div className="text-gray-500">Seção de Usuários - Em desenvolvimento</div>;
      case 'exportacao':
        return <div className="text-gray-500">Seção de Exportação - Em desenvolvimento</div>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Painel Administrativo
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium">
              COORDENADOR
            </span>
            <span>CS Coordenador Sistema</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-14 z-30 px-4">
        <div className="max-w-7xl mx-auto overflow-x-auto">
          <div className="flex gap-8 min-w-full">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-3 px-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap
                  border-b-2 transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                  }
                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-gray-500">Carregando...</div>
          </div>
        ) : (
          renderTabContent()
        )}
      </div>
    </div>
  );
}

export default CoordinadorPanel;
