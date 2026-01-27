import { useState, useEffect } from 'react';
import { Users, BookOpen, School, GraduationCap, FileText, Download, UserCheck, MessageSquare, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button'; 
import { AuthHeader } from '../../components/auth/AuthHeader';
import { DiariosList } from './components/DiariosList';
import { AlunosList } from './components/AlunosList';
import { ProfessoresList } from './components/ProfessoresList';
import { DisciplinasList } from './components/DisciplinasList';
import { TurmasList } from './components/TurmasList';
import { UsuariosList } from './components/UsuariosList';
import { ComunicadosList } from './components/ComunicadosList';
import { ExportacaoTab } from './components/ExportacaoTab';
import { ScrollArea } from '../../components/ui/scroll-area';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { supabaseService } from '../../services/supabaseService';
import { CoordinadorSidebar } from '../../components/admin/CoordinadorSidebar';

interface DashboardStats {
  totalAlunos: number;
  alunosAtivos: number;
  alunosInativos: number;
  totalProfessores: number;
  professoresAtivos: number;
  professoresInativos: number;
}

const COLORS_CHART = ['#1e40af', '#fbbf24'];

export function AdminPage() {
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalAlunos: 0,
    alunosAtivos: 0,
    alunosInativos: 0,
    totalProfessores: 0,
    professoresAtivos: 0,
    professoresInativos: 0,
  });

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
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Visão Geral
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Resumo das informações principais da instituição
          </p>
        </div>

        {/* GRID COM GRÁFICOS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* TOTAL DE ALUNOS */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 dark:text-white">
                Total de alunos
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <a href="#" className="text-blue-600 dark:text-blue-400 text-sm hover:underline">
                  Ver tudo
                </a>
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
                <a href="#" className="text-blue-600 dark:text-blue-400 text-sm hover:underline">
                  Ver tudo
                </a>
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
                <a href="#" className="text-blue-600 dark:text-blue-400 text-sm hover:underline">
                  Ver tudo
                </a>
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
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* SIDEBAR FIXO NA ESQUERDA */}
      <CoordinadorSidebar />

      {/* CONTEÚDO PRINCIPAL COM MARGEM ESQUERDA */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Header Fixo */}
        <header className="sticky top-0 z-50 border-b bg-card px-6 py-4 flex-shrink-0 flex items-center">
          <div className="flex items-center justify-between w-full">
            <div>
              <h1 className="text-2xl font-bold">
                Painel Administrativo
              </h1>
              <p className="text-base text-muted-foreground">
                Gerencie usuários, turmas e configurações
              </p>
            </div>
            <AuthHeader />
          </div>
        </header>

        {/* Tabs Navigation Fixas */}
        <div className="sticky top-16 z-40 border-b bg-card px-6 flex-shrink-0">
          <nav className="flex space-x-8 py-0 overflow-x-auto">
            {[
              { id: 'visao-geral', label: 'Visão geral', icon: BarChart3 },
              { id: 'diarios', label: 'Diários', icon: BookOpen },
              { id: 'comunicados', label: 'Comunicados', icon: MessageSquare },
              { id: 'alunos', label: 'Alunos', icon: Users },
              { id: 'professores', label: 'Professores', icon: UserCheck },
              { id: 'disciplinas', label: 'Disciplinas', icon: School },
              { id: 'turmas', label: 'Turmas', icon: GraduationCap },
              { id: 'usuarios', label: 'Usuários', icon: Users },
              { id: 'exportacao', label: 'Exportação', icon: Download }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-fast ${
                  activeTab === id
                    ? 'text-primary border-primary'
                    : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Scrollável */}
        <main className="flex-1 overflow-hidden">
          <ScrollArea className="h-full scrollbar-thin">
            <div className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsContent value="visao-geral">
                  {loading ? (
                    <div className="flex items-center justify-center h-96">
                      <div className="text-muted-foreground">Carregando...</div>
                    </div>
                  ) : (
                    renderVisaoGeral()
                  )}
                </TabsContent>

                <TabsContent value="diarios">
                  <DiariosList />
                </TabsContent>

                <TabsContent value="comunicados">
                  <ComunicadosList />
                </TabsContent>

                <TabsContent value="alunos">
                  <AlunosList />
                </TabsContent>

                <TabsContent value="professores">
                  <ProfessoresList />
                </TabsContent>

                <TabsContent value="disciplinas">
                  <DisciplinasList />
                </TabsContent>

                <TabsContent value="turmas">
                  <TurmasList />
                </TabsContent>

                <TabsContent value="usuarios">
                  <UsuariosList />
                </TabsContent>

                <TabsContent value="exportacao">
                  <ExportacaoTab />
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </main>
      </div>
    </div>
  );
}

export default AdminPage;
