import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Users, BookOpen, School, GraduationCap, FileText, Download, UserCheck, MessageSquare, BarChart3, LogOut, Menu } from 'lucide-react';
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
import { OcorrenciasList } from './components/OcorrenciasList';
import { ExportacaoTab } from './components/ExportacaoTab';
import { ScrollArea } from '../../components/ui/scroll-area';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { supabaseService } from '../../services/supabaseService';
import { supabase } from '../../lib/supabaseClient';
import { CoordinadorSidebar } from '../../components/admin/CoordinadorSidebar';

const getFormattedDate = () => {
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return today.toLocaleDateString('pt-BR', options);
};

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
  aluno_nome?: string;
  turma_id?: number;
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
  const [turmas, setTurmas] = useState<any[]>([]);
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
    loadTurmas();
  }, []);

  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

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
        .select(`
          *,
          alunos:aluno_id (nome, turma_id)
        `)
        .order('data', { ascending: false })
        .limit(5);

      if (data) {
        const ocorrenciasComNome = data.map((occ: any) => ({
          ...occ,
          aluno_nome: occ.alunos?.nome || 'Desconhecido',
          turma_id: occ.alunos?.turma_id
        }));
        setOcorrencias(ocorrenciasComNome);
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
        .order('data_publicacao', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Erro ao carregar comunicados:', error);
        setComunicados([]);
        return;
      }

      if (data) {
        setComunicados(data);
      }
    } catch (error) {
      console.error('Erro ao carregar comunicados:', error);
      setComunicados([]);
    }
  };

  const loadTurmas = async () => {
    try {
      const turmasData = await supabaseService.getTurmas();
      setTurmas(turmasData);
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      
      const alunos = await supabaseService.getAlunos();
      const alunosAtivos = alunos.filter(a => a.situacao === 'Ativo').length;
      const alunosInativos = alunos.length - alunosAtivos;

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
        return 'bg-red-500 text-white';
      case 'falta':
        return 'bg-yellow-500 text-white';
      case 'positivo':
        return 'bg-green-500 text-white';
      case 'elogio':
        return 'bg-blue-500 text-white';
      case 'disciplinar':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const capitalize = (text: string) => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const getTurmaNome = (turmaId?: number) => {
    if (!turmaId) return 'N/A';
    return turmas.find(t => t.id === turmaId)?.nome || 'N/A';
  };

  const getComunicadoBadge = (comunicado: any) => {
    if (comunicado.turma_id) {
      const turmaNome = turmas.find(t => t.id === comunicado.turma_id)?.nome || 'N/A';
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-500 text-white">
          Turma: {turmaNome}
        </span>
      );
    } else if (comunicado.usuario_id) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-purple-500 text-white">
          Individual
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-500 text-white">
          Geral
        </span>
      );
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      await supabase.auth.signOut().catch(() => {});
      window.location.href = '/';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      window.location.href = '/';
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="text-left">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-gray-900 dark:text-white">
                  Total de alunos
                </CardTitle>
                <Button 
                  size="sm"
                  onClick={() => setActiveTab('alunos')}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Ver tudo
                </Button>
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

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="text-left">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-gray-900 dark:text-white">
                  Total de professores
                </CardTitle>
                <Button 
                  size="sm"
                  onClick={() => setActiveTab('professores')}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Ver tudo
                </Button>
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

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="text-left">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-gray-900 dark:text-white">
                  Total de funcionários
                </CardTitle>
                <Button 
                  size="sm"
                  onClick={() => alert('Página de funcionários ainda não implementada')}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Ver tudo
                </Button>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="card-title">Ocorrências Recentes</h3>
                <Button
                  size="sm"
                  onClick={() => setActiveTab('ocorrencias')}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Ver tudo
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {ocorrencias.length > 0 ? (
                ocorrencias.map((ocorrencia) => (
                  <div key={ocorrencia.id} className="pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTipoColor(ocorrencia.tipo)}`}>
                            {capitalize(ocorrencia.tipo)}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {ocorrencia.aluno_nome || `Aluno #${ocorrencia.aluno_id}`}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Turma: <strong>{getTurmaNome(ocorrencia.turma_id)}</strong>
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                          {ocorrencia.descricao}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
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

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="card-title">Comunicados Recentes</h3>
                <Button
                  size="sm"
                  onClick={() => setActiveTab('comunicados')}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Ver tudo
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {comunicados.length > 0 ? (
                comunicados.map((comunicado) => (
                  <div key={comunicado.id} className="pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {comunicado.titulo}
                          </p>
                          {getComunicadoBadge(comunicado)}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                          {comunicado.mensagem}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Por: {comunicado.autor}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          📅 {formatDate(comunicado.data_publicacao)}
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
      <CoordinadorSidebar onTabChange={setActiveTab} />

      <div className="flex-1 flex flex-col ml-0 min-[881px]:ml-64">
        <header className="sticky top-0 z-50 border-b px-4 sm:px-6 py-4 flex-shrink-0 flex items-center" style={{ backgroundColor: 'var(--primary)' }}>
          <div className="flex items-center justify-between w-full gap-3">
            <button
              onClick={() => {
                const event = new CustomEvent('toggleSidebar');
                window.dispatchEvent(event);
              }}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg min-[881px]:hidden flex-shrink-0"
              aria-label="Menu"
            >
              <Menu className="h-5 w-5 text-white" />
            </button>

            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg font-semibold text-white truncate">
                Bem-vindo, {userProfile?.nome || 'Coordenador'} ✏️
              </h1>
              <p className="text-xs sm:text-sm text-white/80 mt-1 hidden min-[881px]:block">
                Tenha um bom dia de trabalho.
              </p>
            </div>
            
            <Button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-medium px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 flex-shrink-0"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          <ScrollArea className="h-full scrollbar-thin">
            <div className="p-4 sm:p-6">
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

                <TabsContent value="ocorrencias">
                  <OcorrenciasList />
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
