import { useState, useEffect } from 'react';
import { Users, GraduationCap, Mail, Eye, TrendingUp, BarChart3, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge'; 
import { Avatar, AvatarImage, AvatarFallback } from '../../../components/ui/avatar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Dialog, DialogContent } from '../../../components/ui/dialog';
import { supabaseService } from '../../../services/supabaseService';
import type { Aluno, Diario } from '../../../services/supabaseService';

interface AlunosTabProps {
  diarioId: number;
  readOnly?: boolean;
}

export function AlunosTab({ diarioId, readOnly = false }: AlunosTabProps) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [diario, setDiario] = useState<Diario | null>(null);
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null);
  const [isBoletimOpen, setIsBoletimOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('resumo');
  const [boletimData, setBoletimData] = useState<any>(null);
  const [loadingBoletim, setLoadingBoletim] = useState(false);

  useEffect(() => {
    loadAlunos();
  }, [diarioId]);

  const loadAlunos = async () => {
    try {
      setLoading(true);
      
      const diarioData = await supabaseService.getDiarioById(diarioId);
      if (!diarioData) {
        console.error('Diário não encontrado');
        setAlunos([]);
        return;
      }
      
      setDiario(diarioData);
      
      const turmaId = diarioData.turma_id ?? diarioData.turmaId;
      const alunosDaTurma = await supabaseService.getAlunosByTurma(turmaId);
      
      let alunosVinculados: number[] = [];
      try {
        const diarioAlunos = await supabaseService.getDiarioAlunos();
        alunosVinculados = diarioAlunos
          .filter(da => da.diario_id === diarioId || da.diarioId === diarioId)
          .map(da => da.aluno_id ?? da.alunoId)
          .filter((id): id is number => id !== null && id !== undefined);
      } catch (error) {
        console.log('⚠️ Erro ao carregar alunos vinculados:', error);
      }

      if (alunosDaTurma && alunosDaTurma.length > 0) {
        for (const aluno of alunosDaTurma) {
          if (alunosVinculados.includes(aluno.id)) {
            continue;
          }

          try {
            await supabaseService.vincularAlunoAoDiario(diarioId, aluno.id);
          } catch (error) {
            console.error(`❌ Erro ao vincular ${aluno.nome}:`, error);
          }
        }
      }
      
      const alunosDoDiario = await supabaseService.getAlunosByDiario(diarioId);
      setAlunos(alunosDoDiario || []);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
      setAlunos([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlunos = (alunos || []).filter(aluno =>
    (aluno.nome?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
    (aluno.email?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
  );

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleVerBoletim = async (aluno: Aluno) => {
    setSelectedAluno(aluno);
    setActiveTab('resumo');
    setIsBoletimOpen(true);
    setLoadingBoletim(true);
    
    try {
      const dados = await supabaseService.getBoletimAluno(diarioId, aluno.id);
      setBoletimData(dados);
    } catch (error) {
      console.error('Erro ao carregar boletim:', error);
    } finally {
      setLoadingBoletim(false);
    }
  };

  const getSituacaoColor = (situacao: string) => {
    switch (situacao) {
      case 'Aprovado': return 'bg-green-100 text-green-800';
      case 'Reprovado': return 'bg-red-100 text-red-800';
      case 'Recuperação': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSituacaoIcon = (situacao: string) => {
    switch (situacao) {
      case 'Aprovado': return <CheckCircle className="h-5 w-5" />;
      case 'Reprovado': return <XCircle className="h-5 w-5" />;
      case 'Recuperação': return <Clock className="h-5 w-5" />;
      default: return <AlertTriangle className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando alunos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <CardTitle>Alunos da Turma</CardTitle>
              <CardDescription>
                Visualize informações dos alunos
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {alunos.length} alunos
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Buscar alunos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="space-y-4">
            {filteredAlunos.map((aluno) => (
              <div key={aluno.id} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                      {getInitials(aluno.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{aluno.nome}</h3>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" />
                        Matrícula: {aluno.id}
                      </span>
                      {aluno.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {aluno.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVerBoletim(aluno)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Ver Boletim
                  </Button>
                </div>
              </div>
            ))}

            {filteredAlunos.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'Nenhum aluno encontrado.' : 'Nenhum aluno matriculado.'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isBoletimOpen} onOpenChange={setIsBoletimOpen}>
        <DialogContent className="max-w-[1400px] w-[95vw] max-h-[85vh] overflow-hidden flex flex-col p-0">
          <div className="border-b p-6 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                  {selectedAluno ? getInitials(selectedAluno.nome) : ''}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Boletim Escolar</h2>
                <p className="text-sm text-gray-500">{selectedAluno?.nome}</p>
              </div>
            </div>
            <button 
              onClick={() => setIsBoletimOpen(false)}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="border-b bg-gray-50 px-6">
            <div className="flex gap-0 overflow-x-auto">
              {[
                { id: 'resumo', label: 'Resumo' },
                { id: 'notas', label: 'Notas Detalhadas' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 font-medium text-sm transition border-b-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-gray-900 border-blue-600 bg-white'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {loadingBoletim ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Carregando dados...</p>
                </div>
              </div>
            ) : activeTab === 'resumo' && boletimData ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="border rounded-lg p-6 bg-white hover:shadow-sm transition">
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-sm font-medium text-gray-700">Média Geral</p>
                      <TrendingUp className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className={`text-3xl font-bold mb-2 ${
                      boletimData.mediaGeral >= 7 ? 'text-green-600' :
                      boletimData.mediaGeral >= 5 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {boletimData.mediaGeral.toFixed(1)}
                    </div>
                    <p className="text-xs text-gray-500">De 0 a 10</p>
                  </div>

                  <div className="border rounded-lg p-6 bg-white hover:shadow-sm transition">
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-sm font-medium text-gray-700">Frequência</p>
                      <BarChart3 className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className={`text-3xl font-bold mb-2 ${
                      boletimData.frequencia >= 75 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {boletimData.frequencia.toFixed(1)}%
                    </div>
                    <p className="text-xs text-gray-500">
                      {boletimData.presencas} de {boletimData.totalAulas} aulas
                    </p>
                  </div>

                  <div className={`border rounded-lg p-6 hover:shadow-sm transition ${
                    boletimData.situacao === 'Aprovado' ? 'bg-green-50' :
                    boletimData.situacao === 'Reprovado' ? 'bg-red-50' :
                    boletimData.situacao === 'Recuperação' ? 'bg-yellow-50' : 'bg-gray-50'
                  }`}>
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-sm font-medium text-gray-700">Situação</p>
                      {getSituacaoIcon(boletimData.situacao)}
                    </div>
                    <div className="mb-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getSituacaoColor(boletimData.situacao)}`}>
                        {boletimData.situacao}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">Status atual no período</p>
                  </div>

                  <div className="border rounded-lg p-6 bg-white hover:shadow-sm transition">
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-sm font-medium text-gray-700">Faltas</p>
                      <AlertTriangle className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className={`text-3xl font-bold mb-2 ${
                      boletimData.faltas === 0 ? 'text-green-600' :
                      boletimData.faltas <= 3 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {boletimData.faltas}
                    </div>
                    <p className="text-xs text-gray-500">Total de ausências</p>
                  </div>
                </div>

                {boletimData.notas.length > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Avaliações Realizadas</h3>
                    <div className="space-y-3">
                      {boletimData.notas.map((nota: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{nota.avaliacaoTitulo}</p>
                            <p className="text-sm text-gray-600">{nota.avaliacaoTipo} • {new Date(nota.avaliacaoData).toLocaleDateString('pt-BR')}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">Peso: {nota.peso}</span>
                            <span className={`text-lg font-bold ${
                              nota.nota >= 7 ? 'text-green-600' :
                              nota.nota >= 5 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {nota.nota.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {boletimData.notas.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma avaliação registrada ainda
                  </div>
                )}
              </div>
            ) : activeTab === 'notas' && boletimData ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Histórico Completo de Notas</h3>
                {boletimData.notas.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Avaliação</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tipo</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Data</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Peso</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Nota</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {boletimData.notas.map((nota: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">{nota.avaliacaoTitulo}</td>
                            <td className="px-4 py-3 text-sm">{nota.avaliacaoTipo}</td>
                            <td className="px-4 py-3 text-sm">{new Date(nota.avaliacaoData).toLocaleDateString('pt-BR')}</td>
                            <td className="px-4 py-3 text-sm text-center">{nota.peso}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`font-bold ${
                                nota.nota >= 7 ? 'text-green-600' :
                                nota.nota >= 5 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {nota.nota.toFixed(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma nota registrada
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
