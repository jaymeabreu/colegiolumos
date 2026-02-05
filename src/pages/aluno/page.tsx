import { useState, useEffect } from 'react';
import { BookOpen, ClipboardList, BarChart3, Calendar, User, Bell, AlertCircle, TrendingUp, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { ScrollArea } from '../../components/ui/scroll-area';
import { AuthHeader } from '../../components/auth/AuthHeader';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { authService } from '../../services/auth';
import type { Aluno, Diario, Nota, Presenca, Avaliacao, Ocorrencia, Disciplina } from '../../services/supabaseService';
import { supabase } from '../../lib/supabaseClient';
import { AvisosTab } from './components/AvisosTab';

interface DisciplinaBoletim {
  disciplina: string;
  bimestre1: number | null;
  bimestre2: number | null;
  bimestre3: number | null;
  bimestre4: number | null;
  mediaFinal: number;
  frequencia: number;
  situacao: string;
  totalAulas: number;
  presencas: number;
  faltas: number;
}

interface AlunoPageProps {
  currentTab?: string;
}

export function AlunoPage({ currentTab }: AlunoPageProps) {
  const [activeTab, setActiveTab] = useState(currentTab || 'avisos');
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [diarios, setDiarios] = useState<Diario[]>([]);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [boletimCompleto, setBoletimCompleto] = useState<DisciplinaBoletim[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = authService.getAuthState();

  useEffect(() => {
    void loadData();
  }, []);

  // Sincroniza o activeTab quando currentTab muda
  useEffect(() => {
    if (currentTab) {
      setActiveTab(currentTab);
    }
  }, [currentTab]);

  const loadData = async () => {
    if (!user?.alunoId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🎓 Carregando dados do aluno (VIEW):', user.alunoId);

      // 1) Aluno
      const { data: alunoRow, error: alunoErr } = await supabase
        .from('alunos')
        .select('*')
        .eq('id', user.alunoId)
        .maybeSingle();

      if (alunoErr) throw alunoErr;
      const alunoData = (alunoRow as any) as Aluno | null;
      setAluno(alunoData ?? null);
      if (!alunoData) return;

      // 2) BUSCAR DA VIEW (já vem tudo calculado!)
      const { data: boletimRows, error: boletimErr } = await supabase
        .from('boletim_alunos')
        .select('*')
        .eq('aluno_id', user.alunoId)
        .order('disciplina', { ascending: true })
        .order('bimestre', { ascending: true });

      if (boletimErr) throw boletimErr;

      console.log('📊 Dados da VIEW:', boletimRows);

      // 3) Agrupar por disciplina (somar bimestres)
      const disciplinasMap = new Map<number, DisciplinaBoletim>();

      (boletimRows ?? []).forEach((row: any) => {
        const disciplinaId = row.disciplina_id;
        const bimestre = row.bimestre;
        const media = row.media_bimestre ? Number(row.media_bimestre) : null;

        let entry = disciplinasMap.get(disciplinaId);

        if (!entry) {
          entry = {
            disciplina: row.disciplina,
            bimestre1: null,
            bimestre2: null,
            bimestre3: null,
            bimestre4: null,
            mediaFinal: 0,
            frequencia: 0,
            situacao: 'Em Andamento',
            totalAulas: row.total_presencas_registradas || 0,
            presencas: row.total_presencas || 0,
            faltas: row.total_faltas || 0,
          };
          disciplinasMap.set(disciplinaId, entry);
        }

        // Adicionar nota do bimestre
        if (bimestre === 1) entry.bimestre1 = media;
        if (bimestre === 2) entry.bimestre2 = media;
        if (bimestre === 3) entry.bimestre3 = media;
        if (bimestre === 4) entry.bimestre4 = media;

        // Acumular totais
        entry.totalAulas += row.total_presencas_registradas || 0;
        entry.presencas += row.total_presencas || 0;
        entry.faltas += row.total_faltas || 0;
      });

      // 4) Calcular médias finais e situação
      const boletimFinal: DisciplinaBoletim[] = [];

      disciplinasMap.forEach((entry) => {
        const notas = [
          entry.bimestre1,
          entry.bimestre2,
          entry.bimestre3,
          entry.bimestre4,
        ].filter((n): n is number => n !== null);

        // Média final = média dos bimestres com nota
        entry.mediaFinal = notas.length > 0 
          ? Number((notas.reduce((s, n) => s + n, 0) / notas.length).toFixed(1))
          : 0;

        // Frequência
        entry.frequencia = entry.totalAulas > 0
          ? Number(((entry.presencas / entry.totalAulas) * 100).toFixed(1))
          : 100;

        // Situação (regras: média >= 5 E frequência >= 75%)
        if (entry.mediaFinal === 0) {
          entry.situacao = 'Em Andamento';
        } else if (entry.mediaFinal >= 5 && entry.frequencia >= 75) {
          entry.situacao = 'Aprovado';
        } else if (entry.mediaFinal < 5 || entry.frequencia < 75) {
          entry.situacao = 'Reprovado';
        } else {
          entry.situacao = 'Em Andamento';
        }

        boletimFinal.push(entry);
      });

      setBoletimCompleto(boletimFinal);

      // 5) Buscar outros dados (avaliacoes, ocorrencias)
      const diarioIds = (boletimRows ?? []).map((r: any) => r.diario_id);

      if (diarioIds.length > 0) {
        // Avaliações
        const { data: avRows } = await supabase
          .from('avaliacoes')
          .select('*')
          .in('diario_id', diarioIds);
        
        setAvaliacoes((avRows ?? []).map((a: any) => ({
          ...a,
          diarioId: a.diario_id,
        })));

        // Notas
        const { data: notasRows } = await supabase
          .from('notas')
          .select('*')
          .eq('aluno_id', user.alunoId);

        setNotas((notasRows ?? []).map((n: any) => ({
          ...n,
          alunoId: n.aluno_id,
          avaliacaoId: n.avaliacao_id,
        })));

        // Disciplinas
        const disciplinaIds = Array.from(disciplinasMap.keys());
        const { data: discRows } = await supabase
          .from('disciplinas')
          .select('*')
          .in('id', disciplinaIds);

        setDisciplinas(discRows ?? []);

        // Diários
        const { data: diariosRows } = await supabase
          .from('diarios')
          .select('*')
          .in('id', diarioIds);

        setDiarios((diariosRows ?? []).map((d: any) => ({
          ...d,
          turmaId: d.turma_id,
          professorId: d.professor_id,
          disciplinaId: d.disciplina_id,
        })));
      }

      // Ocorrências
      const { data: ocRows } = await supabase
        .from('ocorrencias')
        .select('*')
        .eq('aluno_id', user.alunoId);

      setOcorrencias((ocRows ?? []).map((o: any) => ({
        ...o,
        alunoId: o.aluno_id,
      })));

      console.log('✅ Dados carregados:', {
        boletim: boletimFinal.length,
      });

    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMediaColor = (media: number) => {
    if (media >= 7) return 'text-green-600';
    if (media >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getFrequenciaColor = (freq: number) => {
    if (freq >= 75) return 'text-green-600';
    if (freq >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getOcorrenciaColor = (tipo: string) => {
    if (tipo === 'disciplinar') return 'destructive';
    if (tipo === 'pedagogica') return 'secondary';
    return 'default';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const tabsConfig = [
    { id: 'avisos', label: 'Avisos', icon: Bell },
    { id: 'boletim', label: 'Boletim', icon: BarChart3 },
    { id: 'frequencia', label: 'Frequência', icon: ClipboardList },
    { id: 'avaliacoes', label: 'Avaliações', icon: BookOpen },
    { id: 'ocorrencias', label: 'Ocorrências', icon: AlertCircle }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!aluno) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="sticky top-0 z-50 border-b bg-card px-6 py-4 flex-shrink-0 h-20 flex items-center">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <User className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  Área do Aluno
                </h1>
              </div>
            </div>
            <AuthHeader />
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-semibold">Dados não encontrados</CardTitle>
              <CardDescription className="text-sm">
                Não foi possível carregar os dados do aluno. Entre em contato com a secretaria.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const mediaGeral = boletimCompleto.length > 0 
    ? boletimCompleto.reduce((sum, item) => sum + item.mediaFinal, 0) / boletimCompleto.length 
    : 0;
  
  const frequenciaGeral = boletimCompleto.length > 0 
    ? boletimCompleto.reduce((sum, item) => sum + item.frequencia, 0) / boletimCompleto.length 
    : 0;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'avisos':
        return <AvisosTab />;
      
      case 'boletim':
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Média Geral</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getMediaColor(mediaGeral)}`}>
                    {mediaGeral.toFixed(1)}
                  </div>
                  <Progress value={(mediaGeral / 10) * 100} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Frequência Geral</CardTitle>
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getFrequenciaColor(frequenciaGeral)}`}>
                    {frequenciaGeral.toFixed(1)}%
                  </div>
                  <Progress value={frequenciaGeral} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Disciplinas</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{boletimCompleto.length}</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Total de disciplinas cursadas
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Boletim Completo - {new Date().getFullYear()}</CardTitle>
                <CardDescription>
                  Notas e desempenho por disciplina
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Disciplina</th>
                        <th className="text-center py-3 px-4 font-medium">1º Bim</th>
                        <th className="text-center py-3 px-4 font-medium">2º Bim</th>
                        <th className="text-center py-3 px-4 font-medium">3º Bim</th>
                        <th className="text-center py-3 px-4 font-medium">4º Bim</th>
                        <th className="text-center py-3 px-4 font-medium">Média</th>
                        <th className="text-center py-3 px-4 font-medium">Freq.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {boletimCompleto.map((item, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{item.disciplina}</td>
                          <td className="text-center py-3 px-4">
                            {item.bimestre1 !== null ? item.bimestre1.toFixed(1) : '-'}
                          </td>
                          <td className="text-center py-3 px-4">
                            {item.bimestre2 !== null ? item.bimestre2.toFixed(1) : '-'}
                          </td>
                          <td className="text-center py-3 px-4">
                            {item.bimestre3 !== null ? item.bimestre3.toFixed(1) : '-'}
                          </td>
                          <td className="text-center py-3 px-4">
                            {item.bimestre4 !== null ? item.bimestre4.toFixed(1) : '-'}
                          </td>
                          <td className={`text-center py-3 px-4 font-bold ${getMediaColor(item.mediaFinal)}`}>
                            {item.mediaFinal > 0 ? item.mediaFinal.toFixed(1) : '-'}
                          </td>
                          <td className={`text-center py-3 px-4 ${getFrequenciaColor(item.frequencia)}`}>
                            {item.frequencia.toFixed(0)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'frequencia':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Frequência por Disciplina</CardTitle>
                <CardDescription>
                  Acompanhe suas presenças e faltas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {boletimCompleto.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{item.disciplina}</h3>
                          <p className="text-sm text-muted-foreground">
                            {item.totalAulas} aulas ministradas
                          </p>
                        </div>
                        <Badge variant={item.frequencia >= 75 ? 'default' : 'destructive'}>
                          {item.frequencia.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <Progress value={item.frequencia} className="h-2" />
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600">
                            ✓ {item.presencas} presenças
                          </span>
                          <span className="text-red-600">
                            ✗ {item.faltas} faltas
                          </span>
                        </div>
                      </div>
                      {item.frequencia < 75 && item.totalAulas > 0 && (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                          <AlertCircle className="h-4 w-4 inline mr-1" />
                          Atenção: Frequência abaixo do mínimo (75%)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'avaliacoes':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Próximas Avaliações</CardTitle>
                <CardDescription>
                  Provas e trabalhos agendados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {avaliacoes.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Nenhuma avaliação cadastrada
                  </p>
                ) : (
                  <div className="space-y-4">
                    {avaliacoes
                      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
                      .map((avaliacao) => {
                        const diario = diarios.find(d => d.id === avaliacao.diarioId);
                        const disciplina = diario ? disciplinas.find(d => d.id === diario.disciplinaId) : null;
                        const nota = notas.find(n => n.avaliacaoId === avaliacao.id);

                        return (
                          <div key={avaliacao.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-medium">{avaliacao.titulo}</h3>
                                  {avaliacao.bimestre && (
                                    <Badge variant="outline">
                                      {avaliacao.bimestre}º Bimestre
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {disciplina?.nome || 'Disciplina'}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {formatDate(avaliacao.data)}
                                  </span>
                                  <span>Peso: {avaliacao.peso}</span>
                                </div>
                              </div>
                              {nota && (
                                <div className="text-right">
                                  <div className={`text-2xl font-bold ${getMediaColor(nota.valor)}`}>
                                    {nota.valor.toFixed(1)}
                                  </div>
                                  <p className="text-xs text-muted-foreground">/ 10.0</p>
                                </div>
                              )}
                            </div>
                            {avaliacao.descricao && (
                              <p className="mt-3 text-sm text-muted-foreground">
                                {avaliacao.descricao}
                              </p>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 'ocorrencias':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ocorrências Registradas</CardTitle>
                <CardDescription>
                  Histórico de ocorrências disciplinares e pedagógicas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ocorrencias.length === 0 ? (
                  <div className="text-center py-8">
                    <Award className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="font-medium text-green-600">Parabéns!</p>
                    <p className="text-sm text-muted-foreground">
                      Nenhuma ocorrência registrada
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ocorrencias
                      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                      .map((ocorrencia) => (
                        <div key={ocorrencia.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-5 w-5 text-destructive" />
                              <h3 className="font-medium">{ocorrencia.titulo}</h3>
                            </div>
                            <Badge variant={getOcorrenciaColor(ocorrencia.tipo)}>
                              {ocorrencia.tipo === 'disciplinar' ? 'Disciplinar' : 'Pedagógica'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {ocorrencia.descricao}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(ocorrencia.data)}
                            </span>
                            {ocorrencia.gravidade && (
                              <span>Gravidade: {ocorrencia.gravidade}</span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return <AvisosTab />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-background">
        <header className="sticky top-0 z-50 border-b bg-card px-6 py-4 flex-shrink-0 h-20 flex items-center">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <User className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  Área do Aluno
                </h1>
                <p className="text-sm text-muted-foreground">
                  Bem-vindo, {aluno.nome}
                </p>
              </div>
            </div>
            <AuthHeader />
          </div>
        </header>

        <div className="sticky top-20 z-40 border-b bg-card px-6 flex-shrink-0">
          <nav className="flex space-x-8 py-0">
            {tabsConfig.map(({ id, label, icon: Icon }) => (
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

        <main className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6">
              <ErrorBoundary>
                {renderTabContent()}
              </ErrorBoundary>
            </div>
          </ScrollArea>
        </main>
      </div>
    </ErrorBoundary>
  );
}
