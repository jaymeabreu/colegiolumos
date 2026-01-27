import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, BookOpen, School, GraduationCap, FileText, Download, UserCheck, MessageSquare, BarChart3, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
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

interface Aluno {
  id: string;
  nome: string;
  data_nascimento: string;
  turma_id: string;
  situacao: string;
}

interface Aniversario {
  id: string;
  nome: string;
  dataNascimento: string;
  turma: string;
  diasAte: number;
}

const COLORS_CHART = ['#1e40af', '#fbbf24'];

export function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'visao-geral');
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [aniversarios, setAniversarios] = useState<Aniversario[]>([]);
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
    loadAniversarios();
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

  const loadAniversarios = async () => {
    try {
      const alunos = await supabaseService.getAlunos();
      
      // Calcular próximos aniversários
      const hoje = new Date();
      const proximosAniversarios: Aniversario[] = [];

      alunos.forEach((aluno: Aluno) => {
        if (!aluno.data_nascimento) return;

        const dataNasc = new Date(aluno.data_nascimento);
        let proximoAniversario = new Date(hoje.getFullYear(), dataNasc.getMonth(), dataNasc.getDate());

        // Se o aniversário já passou este ano, pega do próximo ano
        if (proximoAniversario < hoje) {
          proximoAniversario = new Date(hoje.getFullYear() + 1, dataNasc.getMonth(), dataNasc.getDate());
        }

        // Calcula dias até o aniversário
        const diferenca = proximoAniversario.getTime() - hoje.getTime();
        const diasAte = Math.ceil(diferenca / (1000 * 60 * 60 * 24));

        // Pega apenas próximos 30 dias
        if (diasAte <= 30 && diasAte >= 0) {
          proximosAniversarios.push({
            id: aluno.id,
            nome: aluno.nome,
            dataNascimento: aluno.data_nascimento,
            turma: aluno.turma_id || 'Sem turma',
            diasAte
          });
        }
      });

      // Ordena por dias até aniversário
      proximosAniversarios.sort((a, b) => a.diasAte - b.diasAte);
      setAniversarios(proximosAniversarios.slice(0, 5)); // Pega apenas os 5 próximos
    } catch (error) {
      console.error('Erro ao carregar aniversários:', error);
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

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Dias vazios do mês anterior
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Dias do mês atual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getMonthYear = () => {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getAniversarioColor = (diasAte: number) => {
    if (diasAte === 0) return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
    if (diasAte <= 7) return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20';
    return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
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

    const calendarDays = generateCalendarDays();
    const today = new Date();
    const isCurrentMonth = today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
    const todayDate = today.getDate();

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

        {/* CALENDÁRIO + PRÓXIMOS ANIVERSÁRIOS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CALENDÁRIO */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 lg:col-span-1">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">Calendário</h3>
                <button className="text-blue-600 hover:text-blue-700 text-sm">+ Adicionar um evento</button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Navegação do mês */}
              <div className="flex items-center justify-between">
                <button onClick={previousMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="font-medium text-gray-900 dark:text-white text-sm">{getMonthYear()}</span>
                <button onClick={nextMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Cabeçalho dias da semana */}
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-400">
                <div>D</div>
                <div>S</div>
                <div>T</div>
                <div>Q</div>
                <div>Q</div>
                <div>S</div>
                <div>S</div>
              </div>

              {/* Dias do calendário */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => (
                  <div key={index} className="text-center">
                    {day ? (
                      <button
                        className={`w-full aspect-square rounded-lg text-sm font-medium transition-colors ${
                          isCurrentMonth && day === todayDate
                            ? 'bg-green-500 text-white'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {day}
                      </button>
                    ) : (
                      <div className="text-gray-400 text-xs">{}</div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* PRÓXIMOS ANIVERSÁRIOS */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Próximos aniversários</CardTitle>
                <a href="#" className="text-blue-600 dark:text-blue-400 text-sm hover:underline">Ver todo</a>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {aniversarios.length > 0 ? (
                aniversarios.map((aniversario, index) => (
                  <div key={aniversario.id} className={`flex gap-4 pb-3 border-l-4 px-4 py-2 rounded-lg ${getAniversarioColor(aniversario.diasAte)} ${index !== aniversarios.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{aniversario.nome}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">📅 {formatDate(aniversario.dataNascimento)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">📚 Turma: {aniversario.turma}</p>
                      {aniversario.diasAte === 0 && <p className="text-xs text-red-600 dark:text-red-400 font-semibold mt-1">🎉 Hoje é o aniversário!</p>}
                      {aniversario.diasAte === 1 && <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold mt-1">⏰ Amanhã faz aniversário!</p>}
                      {aniversario.diasAte > 1 && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Em {aniversario.diasAte} dias</p>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>Nenhum aniversário próximo nos próximos 30 dias</p>
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
            <div className="text-teal-100 text-sm">
              Atualizado recentemente em 3 de maio de 2025
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
