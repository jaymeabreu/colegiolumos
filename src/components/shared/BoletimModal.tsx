import { useState, useEffect, useCallback } from 'react';
import { X, GraduationCap, TrendingUp, Calendar, AlertCircle, BookOpen, Award, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { supabaseService, Aluno, Avaliacao, Nota, Disciplina, Diario, Aula, Presenca, Ocorrencia } from '../../services/supabaseService';

interface BoletimModalProps {
  aluno: Aluno;
  onClose: () => void;
  diarioId?: string;
}

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

interface AlunoDesempenho {
  aluno: Aluno;
  media: number;
  frequencia: number;
  avaliacoes: Array<{
    avaliacao: Avaliacao;
    nota?: Nota;
    disciplina: string;
  }>;
  disciplinas: Array<{
    disciplina: Disciplina;
    media: number;
    frequencia: number;
    situacao: string;
    totalAulas: number;
    presencas: number;
    faltas: number;
  }>;
  boletim: DisciplinaBoletim[];
  ocorrencias: Ocorrencia[];
}

export function BoletimModal({ aluno, onClose, diarioId }: BoletimModalProps) {
  const [desempenho, setDesempenho] = useState<AlunoDesempenho | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('resumo');

  const carregarDadosReais = useCallback(async () => {
    try {
      console.log('🎓 Carregando dados do aluno:', aluno.nome);

      const todosOsDiarios = await supabaseService.getDiarios();
      const todasAsDisciplinas = await supabaseService.getDisciplinas();
      const diarioAlunos = await supabaseService.getDiarioAlunos();

      const diarios = todosOsDiarios.filter(diario =>
        diarioAlunos.some(da => da.alunoId === aluno.id && da.diarioId === diario.id)
      );

      let mediaGeral = 0;
      let frequenciaGeral = 0;
      let totalDisciplinas = 0;
      const avaliacoesComNotas: Array<{
        avaliacao: Avaliacao;
        nota?: Nota;
        disciplina: string;
      }> = [];
      const disciplinasDetalhes: Array<{
        disciplina: Disciplina;
        media: number;
        frequencia: number;
        situacao: string;
        totalAulas: number;
        presencas: number;
        faltas: number;
      }> = [];
      const boletimCompleto: DisciplinaBoletim[] = [];

      for (const diario of diarios) {
        const disciplina = todasAsDisciplinas.find(d => d.id === diario.disciplinaId);
        if (!disciplina) continue;

        const media = await supabaseService.calcularMediaAluno(aluno.id, diario.id);
        const aulas = await supabaseService.getAulasByDiario(diario.id);
        const presencas = await supabaseService.getPresencasByAluno(aluno.id);
        const presencasDaDisciplina = presencas.filter(p =>
          aulas.some(a => a.id === p.aulaId)
        );

        const totalAulas = aulas.length;
        const presentes = presencasDaDisciplina.filter(p => p.status === 'PRESENTE').length;
        const faltas = presencasDaDisciplina.filter(p => p.status === 'FALTA').length;
        const frequencia = totalAulas > 0 ? (presentes / totalAulas) * 100 : 0;

        const avaliacoes = await supabaseService.getAvaliacoesByDiario(diario.id);
        const notas = await supabaseService.getNotasByAluno(aluno.id);

        const notasPorBimestre = { bim1: null, bim2: null, bim3: null, bim4: null };

        for (let bimestre = 1; bimestre <= 4; bimestre++) {
          const avaliacoesBim = avaliacoes.filter(av => av.bimestre === bimestre);
          if (avaliacoesBim.length > 0) {
            const notasAluno = avaliacoesBim
              .map(av => notas.find(n => n.avaliacaoId === av.id))
              .filter(nota => nota !== undefined);

            if (notasAluno.length > 0) {
              const mediaBimestre = notasAluno.reduce((sum, nota) => sum + nota!.valor, 0) / notasAluno.length;
              notasPorBimestre[`bim${bimestre}` as keyof typeof notasPorBimestre] = Number(mediaBimestre.toFixed(1));
            }
          }
        }

        avaliacoes.forEach(avaliacao => {
          const nota = notas.find(n => n.avaliacaoId === avaliacao.id);
          avaliacoesComNotas.push({
            avaliacao,
            nota,
            disciplina: disciplina.nome
          });
        });

        let situacao = 'Em Andamento';
        const bimestresComNotas = Object.values(notasPorBimestre).filter(nota => nota !== null).length;

        if (bimestresComNotas >= 2 && media > 0) {
          if (media >= 6 && frequencia >= 75) {
            situacao = 'Bom Desempenho';
          } else if (media < 4 || frequencia < 60) {
            situacao = 'Atenção Necessária';
          }
        }

        disciplinasDetalhes.push({
          disciplina,
          media,
          frequencia,
          situacao,
          totalAulas,
          presencas: presentes,
          faltas
        });

        boletimCompleto.push({
          disciplina: disciplina.nome,
          bimestre1: notasPorBimestre.bim1,
          bimestre2: notasPorBimestre.bim2,
          bimestre3: notasPorBimestre.bim3,
          bimestre4: notasPorBimestre.bim4,
          mediaFinal: media,
          frequencia,
          situacao,
          totalAulas,
          presencas: presentes,
          faltas
        });

        if (media > 0) {
          mediaGeral += media;
          frequenciaGeral += frequencia;
          totalDisciplinas++;
        }
      }

      mediaGeral = totalDisciplinas > 0 ? mediaGeral / totalDisciplinas : 0;
      frequenciaGeral = totalDisciplinas > 0 ? frequenciaGeral / totalDisciplinas : 0;

      const todasOcorrencias = await supabaseService.getOcorrencias();
      const ocorrenciasDoAluno = todasOcorrencias.filter(o => o.alunoId === aluno.id);

      setDesempenho({
        aluno,
        media: mediaGeral,
        frequencia: frequenciaGeral,
        avaliacoes: avaliacoesComNotas,
        disciplinas: disciplinasDetalhes,
        boletim: boletimCompleto,
        ocorrencias: ocorrenciasDoAluno
      });
    } catch (error) {
      console.error('Erro ao carregar desempenho:', error);
    } finally {
      setLoading(false);
    }
  }, [aluno.id, aluno.nome]);

  useEffect(() => {
    if (aluno?.id) {
      carregarDadosReais();
    }
  }, [carregarDadosReais]);

  const getMediaColor = useCallback((media: number) => {
    if (media >= 7) return 'text-green-600';
    if (media >= 6) return 'text-yellow-600';
    return 'text-red-600';
  }, []);

  const getFrequenciaColor = useCallback((freq: number) => {
    if (freq >= 75) return 'text-green-600';
    if (freq >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }, []);

  const getSituacaoVariant = useCallback((situacao: string) => {
    if (situacao === 'Aprovado' || situacao === 'Bom Desempenho') return 'default';
    if (situacao === 'Recuperação' || situacao === 'Necessita Recuperação' || situacao === 'Desempenho Regular')
      return 'secondary';
    if (situacao === 'Risco de Reprovação' || situacao === 'Atenção Necessária') return 'destructive';
    return 'outline';
  }, []);

  const getOcorrenciaColor = useCallback((tipo: string) => {
    if (tipo === 'disciplinar') return 'destructive';
    if (tipo === 'pedagogica') return 'secondary';
    return 'default';
  }, []);

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
        <div className="bg-background rounded-lg p-8 text-center">
          <div className="loading mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados do aluno...</p>
        </div>
      </div>
    );
  }

  if (!desempenho) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
        <div className="bg-background rounded-lg p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhum dado encontrado</p>
          <Button onClick={onClose} className="mt-4">Fechar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      {/* 
          CORREÇÃO DE LARGURA:
          Usamos !max-w-none e !w-[95vw] para garantir que o modal ocupe a largura total,
          evitando que as informações fiquem espremidas.
      */}
      <div 
        className="bg-background rounded-xl !w-[95vw] !max-w-none h-[92vh] flex flex-col shadow-2xl overflow-hidden border"
        style={{ width: '95vw', maxWidth: '95vw' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border border-primary/20">
              {getInitials(aluno.nome)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                Boletim Escolar
                <Badge variant="outline" className="ml-2 font-normal">{aluno.matricula}</Badge>
              </h2>
              <p className="text-muted-foreground flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {aluno.nome}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs Content */}
        <div className="flex-1 flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-6 border-b bg-slate-50/30">
              <TabsList className="h-14 bg-transparent gap-2">
                <TabsTrigger 
                  value="resumo" 
                  className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full"
                >
                  Resumo
                </TabsTrigger>
                <TabsTrigger 
                  value="boletim" 
                  className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full"
                >
                  Boletim Completo
                </TabsTrigger>
                <TabsTrigger 
                  value="disciplinas" 
                  className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full"
                >
                  Por Disciplina
                </TabsTrigger>
                <TabsTrigger 
                  value="avaliacoes" 
                  className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full"
                >
                  Avaliações
                </TabsTrigger>
                <TabsTrigger 
                  value="ocorrencias" 
                  className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full"
                >
                  Ocorrências
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="p-8 max-w-7xl mx-auto">
                  {/* Tab: Resumo */}
                  <TabsContent value="resumo" className="mt-0 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <Card className="border-l-4 border-l-blue-500 shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                            Média Geral
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className={`text-3xl font-bold ${getMediaColor(desempenho.media)}`}>
                            {desempenho.media > 0 ? desempenho.media.toFixed(1) : '-'}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Média ponderada atual</p>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-l-green-500 shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                            Frequência
                            <Calendar className="h-4 w-4 text-green-500" />
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className={`text-3xl font-bold ${getFrequenciaColor(desempenho.frequencia)}`}>
                            {desempenho.frequencia > 0 ? desempenho.frequencia.toFixed(1) + '%' : '-'}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Presença total nas aulas</p>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-l-yellow-500 shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                            Situação
                            <GraduationCap className="h-4 w-4 text-yellow-500" />
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-2">
                            <Badge className="text-sm py-1 px-3">
                              {desempenho.media >= 6 ? 'Regular' : 'Em Análise'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">Status atual no período</p>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-l-purple-500 shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                            Ocorrências
                            <AlertCircle className="h-4 w-4 text-purple-500" />
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-foreground">
                            {desempenho.ocorrencias.length}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Registros no período</p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg">Performance por Disciplina</CardTitle>
                        <CardDescription>Visão geral do desempenho acadêmico</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {desempenho.disciplinas.map((item, index) => (
                            <div key={`perf-${index}`} className="space-y-2">
                              <div className="flex justify-between text-sm font-medium">
                                <span className="text-foreground">{item.disciplina.nome}</span>
                                <span className={getMediaColor(item.media)}>
                                  {item.media > 0 ? item.media.toFixed(1) : 'Sem nota'} — {item.situacao}
                                </span>
                              </div>
                              <Progress value={item.media * 10} className="h-2" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Tab: Boletim Completo */}
                  <TabsContent value="boletim" className="mt-0">
                    <Card className="shadow-sm overflow-hidden">
                      <CardHeader className="bg-slate-50/50 border-b">
                        <CardTitle>Boletim Detalhado</CardTitle>
                        <CardDescription>Notas e frequências por bimestre</CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        {desempenho.boletim.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                              <thead>
                                <tr className="bg-slate-100/50 text-slate-700">
                                  <th className="border-b px-4 py-4 text-left font-semibold">Disciplina</th>
                                  <th className="border-b px-4 py-4 text-center font-semibold">1º Bim</th>
                                  <th className="border-b px-4 py-4 text-center font-semibold">2º Bim</th>
                                  <th className="border-b px-4 py-4 text-center font-semibold">3º Bim</th>
                                  <th className="border-b px-4 py-4 text-center font-semibold">4º Bim</th>
                                  <th className="border-b px-4 py-4 text-center font-semibold">Média</th>
                                  <th className="border-b px-4 py-4 text-center font-semibold">Freq.</th>
                                  <th className="border-b px-4 py-4 text-center font-semibold">Situação</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {desempenho.boletim.map((item, index) => (
                                  <tr key={`boletim-${index}`} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-4 font-medium text-foreground">{item.disciplina}</td>
                                    <td className="px-4 py-4 text-center text-muted-foreground">{item.bimestre1 ?? '-'}</td>
                                    <td className="px-4 py-4 text-center text-muted-foreground">{item.bimestre2 ?? '-'}</td>
                                    <td className="px-4 py-4 text-center text-muted-foreground">{item.bimestre3 ?? '-'}</td>
                                    <td className="px-4 py-4 text-center text-muted-foreground">{item.bimestre4 ?? '-'}</td>
                                    <td className={`px-4 py-4 text-center font-bold ${getMediaColor(item.mediaFinal)}`}>
                                      {item.mediaFinal > 0 ? item.mediaFinal.toFixed(1) : '-'}
                                    </td>
                                    <td className={`px-4 py-4 text-center font-medium ${getFrequenciaColor(item.frequencia)}`}>
                                      {item.frequencia > 0 ? item.frequencia.toFixed(0) + '%' : '-'}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                      <Badge variant={getSituacaoVariant(item.situacao)} className="font-normal">
                                        {item.situacao}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-12 text-muted-foreground">
                            <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>Nenhum dado de boletim encontrado</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Tab: Por Disciplina */}
                  <TabsContent value="disciplinas" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {desempenho.disciplinas.length > 0 ? (
                        desempenho.disciplinas.map((item, index) => (
                          <Card key={`disciplina-${index}`} className="shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg text-primary">{item.disciplina.nome}</CardTitle>
                              <CardDescription>Detalhes da disciplina</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                <span className="text-sm text-muted-foreground">Média Final:</span>
                                <span className={`font-bold text-lg ${getMediaColor(item.media)}`}>
                                  {item.media > 0 ? item.media.toFixed(1) : '-'}
                                </span>
                              </div>

                              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                <span className="text-sm text-muted-foreground">Frequência:</span>
                                <span className={`font-bold ${getFrequenciaColor(item.frequencia)}`}>
                                  {item.frequencia > 0 ? item.frequencia.toFixed(1) + '%' : '-'}
                                </span>
                              </div>

                              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                <span className="text-sm text-muted-foreground">Situação:</span>
                                <Badge variant={getSituacaoVariant(item.situacao)}>{item.situacao}</Badge>
                              </div>

                              <div className="space-y-3 pt-1">
                                <span className="text-sm font-medium text-foreground">Resumo de Presença:</span>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                  <div className="p-2 rounded-lg bg-green-50 border border-green-100">
                                    <div className="text-[10px] uppercase tracking-wider text-green-600 font-bold">Presenças</div>
                                    <div className="font-bold text-green-700">{item.presencas}</div>
                                  </div>
                                  <div className="p-2 rounded-lg bg-red-50 border border-red-100">
                                    <div className="text-[10px] uppercase tracking-wider text-red-600 font-bold">Faltas</div>
                                    <div className="font-bold text-red-700">{item.faltas}</div>
                                  </div>
                                  <div className="p-2 rounded-lg bg-blue-50 border border-blue-100">
                                    <div className="text-[10px] uppercase tracking-wider text-blue-600 font-bold">Total</div>
                                    <div className="font-bold text-blue-700">{item.totalAulas}</div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
                          <p>Nenhuma disciplina encontrada</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Tab: Avaliações */}
                  <TabsContent value="avaliacoes" className="mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <Card className="shadow-sm">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-primary" />
                            Notas das Avaliações
                          </CardTitle>
                          <CardDescription>Histórico de notas por avaliação</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {desempenho.avaliacoes.length > 0 ? (
                            <div className="space-y-4">
                              {desempenho.avaliacoes.map(({ avaliacao, nota, disciplina }, idx) => (
                                <div
                                  key={`avaliacao-${idx}`}
                                  className="flex items-center justify-between p-4 border rounded-xl bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all"
                                >
                                  <div>
                                    <p className="font-semibold text-foreground">{avaliacao.titulo}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {disciplina} • {new Date(avaliacao.data).toLocaleDateString('pt-BR')} • Peso: {avaliacao.peso}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    {nota ? (
                                      <div className={`text-xl font-black ${getMediaColor(nota.valor)}`}>
                                        {nota.valor.toFixed(1)}
                                      </div>
                                    ) : (
                                      <Badge variant="secondary" className="font-normal">Pendente</Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12 text-muted-foreground">
                              <Award className="h-12 w-12 mx-auto mb-4 opacity-20" />
                              <p>Nenhuma avaliação encontrada</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="shadow-sm">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            Próximas Avaliações
                          </CardTitle>
                          <CardDescription>Calendário de avaliações agendadas</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center py-12 text-muted-foreground">
                            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>Nenhuma avaliação agendada para os próximos dias</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Tab: Ocorrências */}
                  <TabsContent value="ocorrencias" className="mt-0">
                    <Card className="shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-primary" />
                          Ocorrências Registradas
                        </CardTitle>
                        <CardDescription>Histórico disciplinar e pedagógico</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {desempenho.ocorrencias.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {desempenho.ocorrencias.map(ocorrencia => (
                              <div key={`ocorrencia-${ocorrencia.id}`} className="border rounded-xl p-5 space-y-4 bg-slate-50/30">
                                <div className="flex items-center justify-between">
                                  <Badge variant={getOcorrenciaColor(ocorrencia.tipo)} className="px-3">
                                    {ocorrencia.tipo === 'disciplinar' ? 'Disciplinar' : 'Pedagógica'}
                                  </Badge>
                                  <span className="text-xs font-medium text-muted-foreground bg-white px-2 py-1 rounded border">
                                    {new Date(ocorrencia.data).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>

                                <div>
                                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Descrição:</h4>
                                  <p className="text-sm text-foreground leading-relaxed">{ocorrencia.descricao}</p>
                                </div>

                                {ocorrencia.acaoTomada && (
                                  <div className="pt-3 border-t border-slate-200/60">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ação Tomada:</h4>
                                    <p className="text-sm text-foreground leading-relaxed italic">"{ocorrencia.acaoTomada}"</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-16 text-muted-foreground">
                            <div className="h-20 w-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                              <CheckCircle className="h-10 w-10 text-green-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">Tudo em ordem!</h3>
                            <p className="max-w-xs mx-auto mt-2">Não há ocorrências registradas para este aluno no período atual.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </ScrollArea>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default BoletimModal;
