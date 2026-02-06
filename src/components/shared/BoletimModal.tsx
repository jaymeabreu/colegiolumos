import { useState, useEffect, useCallback } from 'react';
import { X, GraduationCap, TrendingUp, Calendar, AlertCircle, BookOpen, Award, User, CheckCircle } from 'lucide-react';
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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" style={{ zIndex: 51 }}>
        <div className="bg-background rounded-lg p-8 text-center">
          <div className="loading mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados do aluno...</p>
        </div>
      </div>
    );
  }

  if (!desempenho) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" style={{ zIndex: 51 }}>
        <div className="bg-background rounded-lg p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhum dado encontrado</p>
          <Button onClick={onClose} className="mt-4">Fechar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div 
        className="bg-background rounded-xl !w-[95vw] !max-w-none h-[92vh] flex flex-col shadow-2xl overflow-hidden border"
        style={{ width: '95vw', maxWidth: '95vw', zIndex: 51 }}
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
            type="button"
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs Content */}
        <div className="flex-1 flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-6 border-b bg-slate-50/30">
              <TabsList className="h-14 bg-transparent gap-2">
                <TabsTrigger value="resumo" className="px-6 h-full">Resumo</TabsTrigger>
                <TabsTrigger value="boletim" className="px-6 h-full">Boletim Completo</TabsTrigger>
                <TabsTrigger value="disciplinas" className="px-6 h-full">Por Disciplina</TabsTrigger>
                <TabsTrigger value="avaliacoes" className="px-6 h-full">Avaliações</TabsTrigger>
                <TabsTrigger value="ocorrencias" className="px-6 h-full">Ocorrências</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="p-8 max-w-7xl mx-auto">
                  <TabsContent value="resumo" className="mt-0 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <Card><CardContent className="pt-6"><div className={`text-3xl font-bold ${getMediaColor(desempenho.media)}`}>{desempenho.media > 0 ? desempenho.media.toFixed(1) : '-'}</div><p className="text-xs text-muted-foreground mt-1">Média Geral</p></CardContent></Card>
                      <Card><CardContent className="pt-6"><div className={`text-3xl font-bold ${getFrequenciaColor(desempenho.frequencia)}`}>{desempenho.frequencia > 0 ? desempenho.frequencia.toFixed(1) + '%' : '-'}</div><p className="text-xs text-muted-foreground mt-1">Frequência</p></CardContent></Card>
                      <Card><CardContent className="pt-6"><Badge className="text-sm py-1 px-3">{desempenho.media >= 6 ? 'Regular' : 'Em Análise'}</Badge><p className="text-xs text-muted-foreground mt-2">Situação</p></CardContent></Card>
                      <Card><CardContent className="pt-6"><div className="text-3xl font-bold text-foreground">{desempenho.ocorrencias.length}</div><p className="text-xs text-muted-foreground mt-1">Ocorrências</p></CardContent></Card>
                    </div>
                    <Card>
                      <CardHeader><CardTitle className="text-lg">Performance por Disciplina</CardTitle></CardHeader>
                      <CardContent className="space-y-6">
                        {desempenho.disciplinas.map((item, index) => (
                          <div key={`perf-${index}`} className="space-y-2">
                            <div className="flex justify-between text-sm font-medium"><span>{item.disciplina.nome}</span><span className={getMediaColor(item.media)}>{item.media > 0 ? item.media.toFixed(1) : 'Sem nota'}</span></div>
                            <Progress value={item.media * 10} className="h-2" />
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="boletim" className="mt-0">
                    <Card className="overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                          <thead><tr className="bg-slate-100/50"><th className="px-4 py-4 text-left">Disciplina</th><th className="px-4 py-4 text-center">1º Bim</th><th className="px-4 py-4 text-center">2º Bim</th><th className="px-4 py-4 text-center">3º Bim</th><th className="px-4 py-4 text-center">4º Bim</th><th className="px-4 py-4 text-center">Média</th><th className="px-4 py-4 text-center">Freq.</th><th className="px-4 py-4 text-center">Situação</th></tr></thead>
                          <tbody className="divide-y">
                            {desempenho.boletim.map((item, index) => (
                              <tr key={`boletim-${index}`} className="hover:bg-slate-50/50">
                                <td className="px-4 py-4 font-medium">{item.disciplina}</td>
                                <td className="px-4 py-4 text-center">{item.bimestre1 ?? '-'}</td>
                                <td className="px-4 py-4 text-center">{item.bimestre2 ?? '-'}</td>
                                <td className="px-4 py-4 text-center">{item.bimestre3 ?? '-'}</td>
                                <td className="px-4 py-4 text-center">{item.bimestre4 ?? '-'}</td>
                                <td className={`px-4 py-4 text-center font-bold ${getMediaColor(item.mediaFinal)}`}>{item.mediaFinal > 0 ? item.mediaFinal.toFixed(1) : '-'}</td>
                                <td className={`px-4 py-4 text-center font-medium ${getFrequenciaColor(item.frequencia)}`}>{item.frequencia > 0 ? item.frequencia.toFixed(0) + '%' : '-'}</td>
                                <td className="px-4 py-4 text-center"><Badge variant={getSituacaoVariant(item.situacao)}>{item.situacao}</Badge></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </TabsContent>

                  <TabsContent value="disciplinas" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {desempenho.disciplinas.map((item, index) => (
                        <Card key={`disciplina-${index}`} className="hover:shadow-md transition-shadow">
                          <CardHeader><CardTitle className="text-lg text-primary">{item.disciplina.nome}</CardTitle></CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b"><span>Média:</span><span className={`font-bold ${getMediaColor(item.media)}`}>{item.media > 0 ? item.media.toFixed(1) : '-'}</span></div>
                            <div className="flex justify-between items-center pb-2 border-b"><span>Freq:</span><span className={`font-bold ${getFrequenciaColor(item.frequencia)}`}>{item.frequencia > 0 ? item.frequencia.toFixed(1) + '%' : '-'}</span></div>
                            <div className="flex justify-between items-center pb-2 border-b"><span>Situação:</span><Badge variant={getSituacaoVariant(item.situacao)}>{item.situacao}</Badge></div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="avaliacoes" className="mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <Card><CardHeader><CardTitle>Notas das Avaliações</CardTitle></CardHeader><CardContent className="space-y-4">
                        {desempenho.avaliacoes.map(({ avaliacao, nota, disciplina }, idx) => (
                          <div key={`avaliacao-${idx}`} className="flex items-center justify-between p-4 border rounded-xl bg-slate-50/50">
                            <div><p className="font-semibold">{avaliacao.titulo}</p><p className="text-xs text-muted-foreground">{disciplina} • {new Date(avaliacao.data).toLocaleDateString('pt-BR')}</p></div>
                            <div className={`text-xl font-black ${getMediaColor(nota?.valor || 0)}`}>{nota?.valor.toFixed(1) || '-'}</div>
                          </div>
                        ))}
                      </CardContent></Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="ocorrencias" className="mt-0">
                    <Card><CardHeader><CardTitle>Ocorrências Registradas</CardTitle></CardHeader><CardContent>
                      {desempenho.ocorrencias.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {desempenho.ocorrencias.map(ocorrencia => (
                            <div key={`ocorrencia-${ocorrencia.id}`} className="border rounded-xl p-5 space-y-4 bg-slate-50/30">
                              <div className="flex items-center justify-between"><Badge variant={getOcorrenciaColor(ocorrencia.tipo)}>{ocorrencia.tipo}</Badge><span>{new Date(ocorrencia.data).toLocaleDateString('pt-BR')}</span></div>
                              <p className="text-sm">{ocorrencia.descricao}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-16"><CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-4" /><h3 className="text-lg font-semibold">Tudo em ordem!</h3></div>
                      )}
                    </CardContent></Card>
                  </TabsContent>
                </div>
              </ScrollArea>
            </div>
          </Tabs>
        </div>
        
        <div className="p-6 border-t bg-slate-50 flex justify-end">
          <Button onClick={onClose} variant="outline" className="px-8 cursor-pointer">
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default BoletimModal;
