
import { useState, useEffect, useCallback } from 'react';
import { X, GraduationCap, TrendingUp, Calendar, AlertCircle, BookOpen, Award, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { supabaseService } from '../../services/supabaseService';
import type { Aluno, Avaliacao, Nota, Disciplina, Diario, Aula, Presenca, Ocorrencia } from '../../services/mockData';
interface BoletimModalProps {
  aluno: Aluno;
  onClose: () => void;
  diarioId?: string; // Opcional, usado quando chamado da área do professor
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

  const carregarDadosReais = useCallback(() => {
    try {
      console.log('🎓 Carregando dados do aluno:', aluno.nome);

      // Buscar todos os diários que o aluno está vinculado
      const todosOsDiarios = supabaseService.getDiarios();
      const todasAsDisciplinas = supabaseService.getDisciplinas();
      const diarioAlunos = supabaseService.getData().diarioAlunos;

      const diarios = todosOsDiarios.filter(diario =>
        diarioAlunos.some(da => da.alunoId === aluno.id && da.diarioId === diario.id)
      );

      console.log('📚 Diários do aluno:', diarios.length);

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

      // Processar cada diário/disciplina
      diarios.forEach(diario => {
        const disciplina = todasAsDisciplinas.find(d => d.id === diario.disciplinaId);
        if (!disciplina) return;

        console.log(`📖 Processando disciplina: ${disciplina.nome}`);

        // Calcular média da disciplina
        const media = supabaseService.calcularMediaAluno(aluno.id, diario.id);

        // Calcular frequência da disciplina
        const aulas = supabaseService.getAulasByDiario(diario.id);
        const presencas = supabaseService.getPresencasByAluno(aluno.id);
        const presencasDaDisciplina = presencas.filter(p =>
          aulas.some(a => a.id === p.aulaId)
        );

        const totalAulas = aulas.length;
        const presentes = presencasDaDisciplina.filter(p => p.status === 'PRESENTE').length;
        const faltas = presencasDaDisciplina.filter(p => p.status === 'FALTA').length;
        const frequencia = totalAulas > 0 ? (presentes / totalAulas) * 100 : 0;

        console.log(`📊 ${disciplina.nome}: Média ${media.toFixed(1)}, Frequência ${frequencia.toFixed(1)}%`);

        // Buscar avaliações e notas da disciplina
        const avaliacoes = supabaseService.getAvaliacoesByDiario(diario.id);
        const notas = supabaseService.getNotasByAluno(aluno.id);

        // Calcular notas reais por bimestre (apenas se existirem)
        const notasPorBimestre = { bim1: null, bim2: null, bim3: null, bim4: null };

        [1, 2, 3, 4].forEach(bimestre => {
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
        });

        avaliacoes.forEach(avaliacao => {
          const nota = notas.find(n => n.avaliacaoId === avaliacao.id);
          avaliacoesComNotas.push({
            avaliacao,
            nota,
            disciplina: disciplina.nome
          });
        });

        // Determinar situação baseada apenas em dados reais
        let situacao = 'Em Andamento';
        const bimestresComNotas = Object.values(notasPorBimestre).filter(nota => nota !== null).length;

        // Só avaliar situação se tiver dados suficientes
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

        // Adicionar ao boletim apenas com dados reais
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

        // Acumular para média geral apenas se tiver dados
        if (media > 0) {
          mediaGeral += media;
          frequenciaGeral += frequencia;
          totalDisciplinas++;
        }
      });

      // Calcular médias gerais
      mediaGeral = totalDisciplinas > 0 ? mediaGeral / totalDisciplinas : 0;
      frequenciaGeral = totalDisciplinas > 0 ? frequenciaGeral / totalDisciplinas : 0;

      // Buscar ocorrências do aluno
      const todasOcorrencias = supabaseService.getData().ocorrencias;
      const ocorrenciasDoAluno = todasOcorrencias.filter(o => o.alunoId === aluno.id);

      console.log('📈 Dados finais:', {
        mediaGeral: mediaGeral.toFixed(1),
        frequenciaGeral: frequenciaGeral.toFixed(1),
        totalDisciplinas,
        totalAvaliacoes: avaliacoesComNotas.length,
        totalOcorrencias: ocorrenciasDoAluno.length
      });

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
  }, [aluno.id]);

  useEffect(() => {
    if (aluno?.id) {
      carregarDadosReais();
    }
  }, [carregarDadosReais]);

  // Funções de cor
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
    return 'outline'; // Em Andamento
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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg p-8 text-center">
          <div className="loading mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados do aluno...</p>
        </div>
      </div>
    );
  }

  if (!desempenho) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhum dado encontrado</p>
          <Button onClick={onClose} className="mt-4">Fechar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-muted text-primary-foreground flex items-center justify-center font-semibold">
              {getInitials(aluno.nome)}
            </div>
            <div>
              <h2 className="text-xl font-semibold">Boletim Escolar</h2>
              <p className="text-muted-foreground">{aluno.nome}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="px-6 pt-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="resumo">Resumo</TabsTrigger>
                <TabsTrigger value="boletim">Boletim Completo</TabsTrigger>
                <TabsTrigger value="disciplinas">Por Disciplina</TabsTrigger>
                <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
                <TabsTrigger value="ocorrencias">Ocorrências</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-6">
                  {/* Tab: Resumo */}
                  <TabsContent value="resumo" className="mt-0">
                    {/* Cards de Resumo */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Média Geral</CardTitle>
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className={`text-2xl font-bold ${getMediaColor(desempenho.media)}`}>
                            {desempenho.media > 0 ? desempenho.media.toFixed(1) : '-'}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {desempenho.media >= 6 ? 'Aprovado' : desempenho.media > 0 ? 'Abaixo da média' : 'Sem notas'}
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Frequência</CardTitle>
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className={`text-2xl font-bold ${getFrequenciaColor(desempenho.frequencia)}`}>
                            {desempenho.frequencia > 0 ? desempenho.frequencia.toFixed(1) + '%' : '-'}
                          </div>
                          {desempenho.frequencia > 0 && (
                            <Progress value={desempenho.frequencia} className="mt-2" />
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Situação</CardTitle>
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {desempenho.media >= 6 && desempenho.frequencia >= 75 ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                Bom Desempenho
                              </Badge>
                            ) : desempenho.media > 0 ? (
                              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                Em Andamento
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Sem Dados</Badge>
                            )}
                          </div>
                          <p className="text-xs mt-2 text-muted-foreground">Status atual no período</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Ocorrências</CardTitle>
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-primary">{desempenho.ocorrencias.length}</div>
                          <p className="text-xs text-muted-foreground">Registros no período</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Performance por Disciplina */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Performance por Disciplina</CardTitle>
                        <CardDescription>Visão geral do desempenho</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {desempenho.boletim.length > 0 ? (
                          <div className="space-y-4">
                            {desempenho.boletim.map((item, index) => (
                              <div key={`performance-${index}`} className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-foreground">{item.disciplina}</span>
                                    <span className={`text-sm font-bold ${getMediaColor(item.mediaFinal)}`}>
                                      {item.mediaFinal > 0 ? item.mediaFinal.toFixed(1) : '-'}
                                    </span>
                                  </div>
                                  {item.mediaFinal > 0 && (
                                    <Progress value={(item.mediaFinal / 10) * 100} className="h-2" />
                                  )}
                                </div>
                                <Badge variant={getSituacaoVariant(item.situacao)} className="ml-4">
                                  {item.situacao}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhuma disciplina encontrada</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Tab: Boletim Completo */}
                  <TabsContent value="boletim" className="mt-0">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <GraduationCap className="h-5 w-5" />
                          Boletim Escolar Completo
                        </CardTitle>
                        <CardDescription>Notas e frequência por bimestre de todas as disciplinas</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {desempenho.boletim.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="border border-gray-300 px-4 py-2 text-left">Disciplina</th>
                                  <th className="border border-gray-300 px-4 py-2 text-center">1º Bim</th>
                                  <th className="border border-gray-300 px-4 py-2 text-center">2º Bim</th>
                                  <th className="border border-gray-300 px-4 py-2 text-center">3º Bim</th>
                                  <th className="border border-gray-300 px-4 py-2 text-center">4º Bim</th>
                                  <th className="border border-gray-300 px-4 py-2 text-center">Média Final</th>
                                  <th className="border border-gray-300 px-4 py-2 text-center">Frequência</th>
                                  <th className="border border-gray-300 px-4 py-2 text-center">Aulas</th>
                                  <th className="border border-gray-300 px-4 py-2 text-center">Situação</th>
                                </tr>
                              </thead>
                              <tbody>
                                {desempenho.boletim.map((item, index) => (
                                  <tr key={`boletim-${index}`} className="hover:bg-gray-50">
                                    <td className="border border-gray-300 px-4 py-2 font-medium">{item.disciplina}</td>
                                    <td className="border border-gray-300 px-4 py-2 text-center">
                                      {item.bimestre1 !== null ? (
                                        <span className={getMediaColor(item.bimestre1)}>{item.bimestre1.toFixed(1)}</span>
                                      ) : (
                                        <span className="text-muted-foreground">-</span>
                                      )}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-center">
                                      {item.bimestre2 !== null ? (
                                        <span className={getMediaColor(item.bimestre2)}>{item.bimestre2.toFixed(1)}</span>
                                      ) : (
                                        <span className="text-muted-foreground">-</span>
                                      )}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-center">
                                      {item.bimestre3 !== null ? (
                                        <span className={getMediaColor(item.bimestre3)}>{item.bimestre3.toFixed(1)}</span>
                                      ) : (
                                        <span className="text-muted-foreground">-</span>
                                      )}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-center">
                                      {item.bimestre4 !== null ? (
                                        <span className={getMediaColor(item.bimestre4)}>{item.bimestre4.toFixed(1)}</span>
                                      ) : (
                                        <span className="text-muted-foreground">-</span>
                                      )}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-center">
                                      <span className={`font-bold ${getMediaColor(item.mediaFinal)}`}>
                                        {item.mediaFinal > 0 ? item.mediaFinal.toFixed(1) : '-'}
                                      </span>
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-center">
                                      <span className={getFrequenciaColor(item.frequencia)}>
                                        {item.frequencia > 0 ? item.frequencia.toFixed(1) + '%' : '-'}
                                      </span>
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-center text-sm">
                                      <div>
                                        {item.presencas}P / {item.faltas}F
                                      </div>
                                      <div className="text-muted-foreground">({item.totalAulas} total)</div>
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-center">
                                      <Badge variant={getSituacaoVariant(item.situacao)}>{item.situacao}</Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
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
                          <Card key={`disciplina-${index}`}>
                            <CardHeader>
                              <CardTitle className="text-lg">{item.disciplina.nome}</CardTitle>
                              <CardDescription>Detalhes da disciplina</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="flex justify-between items-center">
                                <span className="text-base text-muted-foreground">Média Final:</span>
                                <span className={`font-bold text-lg ${getMediaColor(item.media)}`}>
                                  {item.media > 0 ? item.media.toFixed(1) : '-'}
                                </span>
                              </div>

                              <div className="flex justify-between items-center">
                                <span className="text-base text-muted-foreground">Frequência:</span>
                                <span className={`font-bold ${getFrequenciaColor(item.frequencia)}`}>
                                  {item.frequencia > 0 ? item.frequencia.toFixed(1) + '%' : '-'}
                                </span>
                              </div>

                              <div className="flex justify-between items-center">
                                <span className="text-base text-muted-foreground">Situação:</span>
                                <Badge variant={getSituacaoVariant(item.situacao)}>{item.situacao}</Badge>
                              </div>

                              <div className="space-y-2">
                                <span className="text-base text-muted-foreground">Presença:</span>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                  <div className="p-2 rounded bg-green-50">
                                    <div className="text-xs text-green-600">Presentes</div>
                                    <div className="font-bold text-green-700">{item.presencas}</div>
                                  </div>
                                  <div className="p-2 rounded bg-red-50">
                                    <div className="text-xs text-red-600">Faltas</div>
                                    <div className="font-bold text-red-700">{item.faltas}</div>
                                  </div>
                                  <div className="p-2 rounded bg-blue-50">
                                    <div className="text-xs text-blue-600">Total</div>
                                    <div className="font-bold text-blue-700">{item.totalAulas}</div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="col-span-full text-center py-8 text-muted-foreground">
                          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Nenhuma disciplina encontrada</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Tab: Avaliações */}
                  <TabsContent value="avaliacoes" className="mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            Notas das Avaliações
                          </CardTitle>
                          <CardDescription>Notas das avaliações realizadas</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {desempenho.avaliacoes.length > 0 ? (
                            <div className="space-y-4">
                              {desempenho.avaliacoes.map(({ avaliacao, nota, disciplina }) => (
                                <div
                                  key={`avaliacao-${avaliacao.id}`}
                                  className="flex items-center justify-between p-3 border rounded-lg bg-card"
                                >
                                  <div>
                                    <p className="font-medium text-foreground">{avaliacao.titulo}</p>
                                    <p className="text-base text-muted-foreground">
                                      {disciplina} • {new Date(avaliacao.data).toLocaleDateString('pt-BR')} • Peso:{' '}
                                      {avaliacao.peso}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    {nota ? (
                                      <div className={`text-lg font-bold ${getMediaColor(nota.valor)}`}>
                                        {nota.valor.toFixed(1)}
                                      </div>
                                    ) : (
                                      <Badge variant="secondary">Pendente</Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p>Nenhuma avaliação encontrada</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Próximas Avaliações
                          </CardTitle>
                          <CardDescription>Avaliações agendadas</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center py-8 text-muted-foreground">
                            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhuma avaliação agendada</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Tab: Ocorrências */}
                  <TabsContent value="ocorrencias" className="mt-0">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5" />
                          Ocorrências Registradas
                        </CardTitle>
                        <CardDescription>Histórico de ocorrências disciplinares e pedagógicas</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {desempenho.ocorrencias.length > 0 ? (
                          <div className="space-y-4">
                            {desempenho.ocorrencias.map(ocorrencia => (
                              <div key={`ocorrencia-${ocorrencia.id}`} className="border rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <Badge variant={getOcorrenciaColor(ocorrencia.tipo)}>
                                    {ocorrencia.tipo === 'disciplinar' ? 'Disciplinar' : 'Pedagógica'}
                                  </Badge>
                                  <span className="text-base text-muted-foreground">
                                    {new Date(ocorrencia.data).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>

                                <div>
                                  <h4 className="font-medium text-foreground mb-1">Descrição:</h4>
                                  <p className="text-base text-muted-foreground">{ocorrencia.descricao}</p>
                                </div>

                                <div>
                                  <h4 className="font-medium text-foreground mb-1">Ação Tomada:</h4>
                                  <p className="text-base text-muted-foreground">{ocorrencia.acaoTomada}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhuma ocorrência registrada</p>
                            <p className="text-sm mt-2">Parabéns! Não há ocorrências registradas.</p>
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
