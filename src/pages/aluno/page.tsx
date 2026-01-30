import { useState, useEffect } from 'react';
import { BookOpen, ClipboardList, BarChart3, Calendar, User, Bell, AlertCircle, TrendingUp, Award, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { ScrollArea } from '../../components/ui/scroll-area';
import { AuthHeader } from '../../components/auth/AuthHeader';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { authService } from '../../services/auth';
import type { Aluno, Diario, Nota, Presenca, Avaliacao, Ocorrencia, Disciplina, Aula } from '../../services/supabaseService';
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

export function AlunoPage() {
  const [activeTab, setActiveTab] = useState('avisos');
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [diarios, setDiarios] = useState<Diario[]>([]);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [presencas, setPresencas] = useState<Presenca[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [boletimCompleto, setBoletimCompleto] = useState<DisciplinaBoletim[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = authService.getAuthState();
  

  useEffect(() => {
  void loadData();
}, []);


  const loadData = async () => {
  if (!user?.alunoId) {
    setLoading(false);
    return;
  }

  try {
    setLoading(true);
    console.log('🎓 Carregando dados completos do aluno (SUPABASE):', user.alunoId);

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

    // 2) Vinculo aluno -> diários (diario_alunos)
    const { data: diarioAlunosRows, error: daErr } = await supabase
      .from('diario_alunos')
      .select('*')
      .eq('aluno_id', user.alunoId);

    if (daErr) throw daErr;

    const diarioIds = Array.from(
      new Set((diarioAlunosRows ?? []).map((r: any) => r.diario_id))
    ).filter(Boolean) as number[];

    if (diarioIds.length === 0) {
      setDiarios([]);
      setNotas([]);
      setPresencas([]);
      setAvaliacoes([]);
      setOcorrencias([]);
      setDisciplinas([]);
      setAulas([]);
      setBoletimCompleto([]);
      return;
    }

    // 3) Diários
    const { data: diariosRows, error: diariosErr } = await supabase
      .from('diarios')
      .select('*')
      .in('id', diarioIds);

    if (diariosErr) throw diariosErr;

    // normaliza snake_case -> camelCase esperado pelo seu front
    const diariosDoAluno: Diario[] = (diariosRows ?? []).map((d: any) => ({
      ...d,
      turmaId: d.turma_id ?? d.turmaId,
      professorId: d.professor_id ?? d.professorId,
      disciplinaId: d.disciplina_id ?? d.disciplinaId,
    }));

    setDiarios(diariosDoAluno);

    // 4) Disciplinas (para mostrar nome no boletim/avaliações)
    const disciplinaIds = Array.from(
      new Set(diariosDoAluno.map(d => d.disciplinaId).filter(Boolean))
    ) as number[];

    const { data: disciplinasRows, error: discErr } = await supabase
      .from('disciplinas')
      .select('*')
      .in('id', disciplinaIds);

    if (discErr) throw discErr;

    const disciplinasData: Disciplina[] = (disciplinasRows ?? []).map((x: any) => ({
      ...x,
    }));

    setDisciplinas(disciplinasData);

    // 5) Notas do aluno
    const { data: notasRows, error: notasErr } = await supabase
      .from('notas')
      .select('*')
      .eq('aluno_id', user.alunoId);

    if (notasErr) throw notasErr;

    const notasAluno: Nota[] = (notasRows ?? []).map((n: any) => ({
      ...n,
      alunoId: n.aluno_id ?? n.alunoId,
      avaliacaoId: n.avaliacao_id ?? n.avaliacaoId,
    }));

    setNotas(notasAluno);

    // 6) Presenças do aluno
    const { data: presRows, error: presErr } = await supabase
      .from('presencas')
      .select('*')
      .eq('aluno_id', user.alunoId);

    if (presErr) throw presErr;

    const presencasAluno: Presenca[] = (presRows ?? []).map((p: any) => ({
      ...p,
      alunoId: p.aluno_id ?? p.alunoId,
      aulaId: p.aula_id ?? p.aulaId,
    }));

    setPresencas(presencasAluno);

    // 7) Avaliações (de todos os diários do aluno)
    const { data: avRows, error: avErr } = await supabase
      .from('avaliacoes')
      .select('*')
      .in('diario_id', diarioIds);

    if (avErr) throw avErr;

    const todasAvaliacoes: Avaliacao[] = (avRows ?? []).map((a: any) => ({
      ...a,
      diarioId: a.diario_id ?? a.diarioId,
    }));

    setAvaliacoes(todasAvaliacoes);

    // 8) Aulas (para cálculo de frequência por diário)
    const { data: aulasRows, error: aulasErr } = await supabase
      .from('aulas')
      .select('*')
      .in('diario_id', diarioIds);

    if (aulasErr) throw aulasErr;

    const aulasData: Aula[] = (aulasRows ?? []).map((a: any) => ({
      ...a,
      diarioId: a.diario_id ?? a.diarioId,
      professorId: a.professor_id ?? a.professorId,
    }));

    setAulas(aulasData);

    // 9) Ocorrências
    const { data: ocRows, error: ocErr } = await supabase
      .from('ocorrencias')
      .select('*')
      .eq('aluno_id', user.alunoId);

    if (ocErr) throw ocErr;

    const ocorrenciasDoAluno: Ocorrencia[] = (ocRows ?? []).map((o: any) => ({
      ...o,
      alunoId: o.aluno_id ?? o.alunoId,
    }));

    setOcorrencias(ocorrenciasDoAluno);

    // 10) Monta boletim
    const boletim: DisciplinaBoletim[] = [];

    diariosDoAluno.forEach((diario) => {
      const disciplina = disciplinasData.find(d => d.id === diario.disciplinaId);
      if (!disciplina) return;

      const avaliacoesDisciplina = todasAvaliacoes.filter(av => av.diarioId === diario.id);
      const notasPorBimestre: Record<string, number | null> = {
        bim1: null, bim2: null, bim3: null, bim4: null
      };

      // média ponderada final
      const notasValidas = avaliacoesDisciplina
        .map(av => {
          const nota = notasAluno.find(n => n.avaliacaoId === av.id);
          return nota ? { valor: nota.valor, peso: av.peso ?? 1 } : null;
        })
        .filter(Boolean) as Array<{ valor: number; peso: number }>;

      const somaPesos = notasValidas.reduce((s, x) => s + (x.peso || 1), 0);
      const somaPonderada = notasValidas.reduce((s, x) => s + x.valor * (x.peso || 1), 0);
      const mediaFinal = somaPesos > 0 ? Number((somaPonderada / somaPesos).toFixed(1)) : 0;

      // médias por bimestre (simples)
      [1, 2, 3, 4].forEach((bimestre) => {
        const avBim = avaliacoesDisciplina.filter(av => av.bimestre === bimestre);
        if (avBim.length === 0) return;

        const notasBim = avBim
          .map(av => notasAluno.find(n => n.avaliacaoId === av.id))
          .filter(Boolean) as Nota[];

        if (notasBim.length === 0) return;

        const mediaBim = notasBim.reduce((s, n) => s + n.valor, 0) / notasBim.length;
        notasPorBimestre[`bim${bimestre}`] = Number(mediaBim.toFixed(1));
      });

      // frequência
      const aulasDoDiario = aulasData.filter(a => a.diarioId === diario.id);
      const totalAulas = aulasDoDiario.length;

      const presencasDaDisciplina = presencasAluno.filter(p =>
        aulasDoDiario.some(a => a.id === p.aulaId)
      );

      const presentes = presencasDaDisciplina.filter(p => p.status === 'PRESENTE').length;
      const faltas = presencasDaDisciplina.filter(p => p.status === 'FALTA').length;
      const frequencia = totalAulas > 0 ? (presentes / totalAulas) * 100 : 0;

      // situação
      let situacao = 'Em Andamento';
      if (mediaFinal > 0) {
        if (mediaFinal >= 7 && frequencia >= 75) situacao = 'Aprovado';
        else if (mediaFinal >= 5 && mediaFinal < 7) situacao = 'Recuperação';
        else if (mediaFinal < 5 || frequencia < 60) situacao = 'Reprovado';
      }

      boletim.push({
        disciplina: disciplina.nome,
        bimestre1: notasPorBimestre.bim1,
        bimestre2: notasPorBimestre.bim2,
        bimestre3: notasPorBimestre.bim3,
        bimestre4: notasPorBimestre.bim4,
        mediaFinal,
        frequencia,
        situacao,
        totalAulas,
        presencas: presentes,
        faltas,
      });
    });

    setBoletimCompleto(boletim);

    console.log('📊 Dados carregados (Supabase):', {
      diarios: diariosDoAluno.length,
      disciplinas: disciplinasData.length,
      notas: notasAluno.length,
      presencas: presencasAluno.length,
      avaliacoes: todasAvaliacoes.length,
      ocorrencias: ocorrenciasDoAluno.length,
      aulas: aulasData.length,
      boletim: boletim.length
    });
  } catch (error) {
    console.error('Erro ao carregar dados do aluno (Supabase):', error);
  } finally {
    setLoading(false);
  }
};


  const calcularMedia = (diarioId: number): number => {
  const avaliacoesDiario = avaliacoes.filter(a => a.diarioId === diarioId);
  if (avaliacoesDiario.length === 0) return 0;

  const notasValidas = avaliacoesDiario
    .map(av => {
      const n = notas.find(x => x.avaliacaoId === av.id);
      return n ? { valor: n.valor, peso: av.peso ?? 1 } : null;
    })
    .filter(Boolean) as Array<{ valor: number; peso: number }>;

  const somaPesos = notasValidas.reduce((s, x) => s + (x.peso || 1), 0);
  const somaPonderada = notasValidas.reduce((s, x) => s + x.valor * (x.peso || 1), 0);

  return somaPesos > 0 ? Number((somaPonderada / somaPesos).toFixed(1)) : 0;
};

const calcularFrequencia = (diarioId: number): number => {
  const aulasDoDiario = aulas.filter(a => a.diarioId === diarioId);
  const totalAulas = aulasDoDiario.length;
  if (totalAulas === 0) return 100;

  const presencasDoDiario = presencas.filter(p =>
    aulasDoDiario.some(a => a.id === p.aulaId)
  );

  const presentes = presencasDoDiario.filter(p => p.status === 'PRESENTE').length;
  return (presentes / totalAulas) * 100;
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

  const getSituacaoVariant = (situacao: string) => {
    if (situacao === 'Aprovado') return 'default';
    if (situacao === 'Recuperação') return 'secondary';
    if (situacao === 'Reprovado') return 'destructive';
    return 'outline';
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
                    {boletimCompleto.filter(d => d.situacao === 'Aprovado').length} aprovadas
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
                        <th className="text-center py-3 px-4 font-medium">Situação</th>
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
                          <td className="text-center py-3 px-4">
                            <Badge variant={getSituacaoVariant(item.situacao)}>
                              {item.situacao}
                            </Badge>
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
                      {item.frequencia < 75 && (
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
                                  <Badge variant="outline">
                                    {avaliacao.bimestre}º Bimestre
                                  </Badge>
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
