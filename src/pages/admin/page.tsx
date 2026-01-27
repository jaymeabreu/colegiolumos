import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Users, BookOpen, School, GraduationCap, FileText, Download, UserCheck, MessageSquare, BarChart3, LogOut } from 'lucide-react';
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
import { supabase } from '../../lib/supabaseClient';
import { CoordinadorSidebar } from '../../components/admin/CoordinadorSidebar';

interface DashboardStats {
  totalAlunos: number;
  alunosAtivos: number;
  alunosInativos: number;
  totalProfessores: number;
  professoresAtivos: number;
  professoresInativos: number;
}

interface UserProfile {
  nome: string;
  email: string;
}

interface Ocorrencia {
  id: string;
  aluno_id: string;
  tipo: string;
  data: string;
  descricao: string;
  acao_tomada?: string;
}

interface Comunicado {
  id: string;
  titulo: string;
  conteudo: string;
  data_criacao: string;
  autor: string;
}

const COLORS_CHART = ['#1e40af', '#fbbf24'];

export function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'visao-geral');
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
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
    loadUserProfile();
    loadOcorrencias();
    loadComunicados();
  }, []);

  // Quando activeTab muda, atualiza a URL
  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

  // Quando a URL muda, atualiza activeTab
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const loadUserProfile = async () => {
    try {
      const { data } = await supabase
        .from('configuracoes_escola')
        .select('nome_escola')
        .maybeSingle();
      
      if (data?.nome_escola) {
        setUserProfile({ nome: data.nome_escola, email: '' });
      } else {
        setUserProfile({ nome: 'Coordenador', email: '' });
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      setUserProfile({ nome: 'Coordenador', email: '' });
    }
  };

  const loadOcorrencias = async () => {
    try {
      const { data, error } = await supabase
        .from('ocorrencias')
        .select('*')
        .order('data', { ascending: false })
        .limit(5);

      if (data) {
        setOcorrencias(data);
      }
    } catch (error) {
      console.error('Erro ao carregar ocorrências:', error);
    }
  };

  const loadComunicados = async () => {
    try {
      const { data, error } = await supabase
        .from('comunicados')
        .select('*')
        .order('data_criacao', { ascending: false })
        .limit(5);

      if (data) {
        setComunicados(data);
      }
    } catch (error) {
      console.error('Erro ao carregar comunicados:', error);
    }
  };

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getTipoColor = (tipo: string) => {
    switch(tipo?.toLowerCase()) {
      case 'comportamento':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300';
      case 'falta':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300';
      case 'positivo':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300';
      default:
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300';
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('user');
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      alert('Erro ao fazer logout. Tente novamente.');
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

        {/* OCORRÊNCIAS + COMUNICADOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* OCORRÊNCIAS */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Ocorrências Recentes</CardTitle>
                <a href="#" className="text-blue-600 dark:text-blue-400 text-sm hover:underline">Ver tudo</a>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {ocorrencias.length > 0 ? (
                ocorrencias.map((ocorrencia) => (
                  <div key={ocorrencia.id} className="pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getTipoColor(ocorrencia.tipo)}`}>
                            {ocorrencia.tipo}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          Aluno #{ocorrencia.aluno_id}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {ocorrencia.descricao}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          📅 {formatDate(ocorrencia.data)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>Nenhuma ocorrência registrada</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* COMUNICADOS */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Comunicados Recentes</CardTitle>
                <a href="#" className="text-blue-600 dark:text-blue-400 text-sm hover:underline">Ver tudo</a>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {comunicados.length > 0 ? (
                comunicados.map((comunicado) => (
                  <div key={comunicado.id} className="pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {comunicado.titulo}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                          {comunicado.conteudo}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Por: {comunicado.autor}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          📅 {formatDate(comunicado.data_criacao)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>Nenhum comunicado registrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* SIDEBAR FIXO NA ESQUERDA */}
      <CoordinadorSidebar onTabChange={setActiveTab} />

      {/* CONTEÚDO PRINCIPAL COM MARGEM ESQUERDA */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Header Fixo */}
        <header className="sticky top-0 z-50 border-b bg-teal-700 dark:bg-teal-900 px-6 py-4 flex-shrink-0 flex items-center">
          <div className="flex items-center justify-between w-full">
            <div>
              <h1 className="text-lg font-semibold text-white">
                Bem-vindo de volta, {userProfile?.nome || 'Coordenador'} ✏️
              </h1>
              <p className="text-sm text-teal-100 mt-1">Tenha um bom dia de trabalho.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-teal-100 text-sm">
                Atualizado recentemente em 3 de maio de 2025
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-teal-100 hover:text-white hover:bg-teal-600 flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </header>

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
