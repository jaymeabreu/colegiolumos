import { useState, useEffect } from 'react';
import { X, AlertCircle, RotateCcw, CheckCircle, Download, FileText, Eye } from 'lucide-react';
import { Badge } from '../../../components/ui/badge'; 
import { Button } from '../../../components/ui/button';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { supabaseService } from '../../../services/supabaseService';
import { MarcarPresencaModal } from './MarcarPresencaModal';
import type { Diario, Aula, Aluno, Avaliacao } from '../../../services/supabaseService';

interface DiarioViewModalProps {
  diario: Diario | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDevolver?: () => void;
  onFinalizar?: () => void;
  onExportar?: () => void;
  loading?: boolean;
  userRole?: 'COORDENADOR' | 'PROFESSOR' | 'ADMIN';
}

interface BoletimRow {
  numero: number;
  nome: string;
  media: number | null;
  faltas: number | null;
  acompanhamento: string | null;
  notas: { [avaliacaoId: number]: number };
}

interface DadosIdentificacao {
  escola: string;
  turma: string;
  turno: string;
  disciplina: string;
  professor: string;
  bimestre: string;
  dataInicio: string;
  dataFim: string;
}

export function DiarioViewModal({ 
  diario, 
  open,
  onOpenChange,
  onDevolver,
  onFinalizar,
  onExportar,
  loading = false,
  userRole = 'COORDENADOR'
}: DiarioViewModalProps) {
  const [alunos, setAlunos] = useState<BoletimRow[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [identificacao, setIdentificacao] = useState<DadosIdentificacao | null>(null);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [alunosData, setAlunosData] = useState<Aluno[]>([]);
  const [isMarcarPresencaOpen, setIsMarcarPresencaOpen] = useState(false);
  const [selectedAula, setSelectedAula] = useState<Aula | null>(null);
  
  // Estados do modal de devolver INLINE
  const [isDevolverOpen, setIsDevolverOpen] = useState(false);
  const [motivoDevolucao, setMotivoDevolucao] = useState('');
  const [devolvendoDiario, setDevolvendoDiario] = useState(false);
  const [erroDevolver, setErroDevolver] = useState<string | null>(null);

  // Estado para desfinalizar
  const [isDesfinalizar, setIsDesfinalizar] = useState(false);
  const [desfinalizado, setDesfinalizado] = useState(false);

  const isReadOnly = diario?.status === 'ENTREGUE' || diario?.status === 'FINALIZADO';
  const canDevolver = userRole === 'COORDENADOR' && diario?.status === 'ENTREGUE';
  const canFinalizar = userRole === 'COORDENADOR' && (diario?.status === 'DEVOLVIDO' || diario?.status === 'ENTREGUE');
  const canDesfinalizar = userRole === 'COORDENADOR' && diario?.status === 'FINALIZADO';

  useEffect(() => {
    if (diario && open) {
      carregarDados();
    }
  }, [diario?.id, open]);

  useEffect(() => {
    if (!isDevolverOpen) {
      setMotivoDevolucao('');
      setErroDevolver(null);
      setDevolvendoDiario(false);
    }
  }, [isDevolverOpen]);

  const carregarDados = async () => {
    if (!diario) return;
    
    try {
      setCarregando(true);

      const alunosDataTemp = await supabaseService.getAlunosByDiario(diario.id);
      setAlunosData(alunosDataTemp);

      const avaliacoesData = await supabaseService.getAvaliacoesByDiario(diario.id);
      setAvaliacoes(avaliacoesData || []);

      const boletimPromises = (alunosDataTemp || []).map(async (aluno, index) => {
        try {
          const boletimAluno = await supabaseService.getBoletimAluno(diario.id, aluno.id);
          const notasAluno = await supabaseService.getNotasByAluno(aluno.id);
          const notasPorAvaliacao: { [key: number]: number } = {};
          
          notasAluno.forEach(nota => {
            const avaliacaoId = nota.avaliacao_id ?? nota.avaliacaoId;
            if (avaliacaoId) {
              notasPorAvaliacao[avaliacaoId] = nota.valor ?? 0;
            }
          });
          
          return {
            numero: index + 1,
            nome: aluno.nome,
            media: boletimAluno.mediaGeral > 0 ? boletimAluno.mediaGeral : null,
            faltas: boletimAluno.faltas > 0 ? boletimAluno.faltas : null,
            acompanhamento: boletimAluno.situacao,
            notas: notasPorAvaliacao
          };
        } catch (error) {
          return {
            numero: index + 1,
            nome: aluno.nome,
            media: null,
            faltas: null,
            acompanhamento: null,
            notas: {}
          };
        }
      });

      let boletim = await Promise.all(boletimPromises);
      
      boletim = boletim.map(aluno => ({
        ...aluno,
        acompanhamento: aluno.media === null 
          ? 'Em Análise'
          : aluno.media >= 7 
            ? 'Aprovado'
            : aluno.media >= 5
              ? 'Recuperação'
              : 'Reprovado'
      }));
      
      setAlunos(boletim);

      const aulasData = await supabaseService.getAulasByDiario(diario.id);
      setAulas(aulasData || []);

      const turma = await supabaseService.getTurmaById(diario.turma_id || diario.turmaId || 0);
      const disciplina = await supabaseService.getDisciplinaById(diario.disciplina_id || diario.disciplinaId || 0);
      const professor = await supabaseService.getProfessorById(diario.professor_id || diario.professorId || 0);

      setIdentificacao({
        escola: 'Colégio Lumos',
        turma: turma?.nome || 'N/A',
        turno: turma?.turno || 'N/A',
        disciplina: disciplina?.nome || 'N/A',
        professor: professor?.nome || 'N/A',
        bimestre: diario.bimestre ? `${diario.bimestre}º Bimestre` : 'N/A',
        dataInicio: diario.dataInicio ? new Date(diario.dataInicio).toLocaleDateString('pt-BR') : 'N/A',
        dataFim: diario.dataTermino ? new Date(diario.dataTermino).toLocaleDateString('pt-BR') : 'N/A'
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setAlunos([]);
    } finally {
      setCarregando(false);
    }
  };

  // FUNÇÃO PRINCIPAL - Devolver diário com 1 clique
  const handleDevolverDiario = async () => {
    if (!diario) return;

    try {
      setDevolvendoDiario(true);
      setErroDevolver(null);

      const resultado = await supabaseService.devolverDiario(
        diario.id,
        1,
        motivoDevolucao || undefined
      );

      if (resultado) {
        // 1. Fecha modal de devolver
        setIsDevolverOpen(false);
        // 2. Fecha modal principal  
        onOpenChange(false);
        // 3. Chama callback do pai para mostrar sucesso
        onDevolver?.();
      } else {
        setErroDevolver('Erro ao devolver o diário. Tente novamente.');
      }
    } catch (err: any) {
      console.error('Erro ao devolver diário:', err);
      setErroDevolver(err.message || 'Erro ao devolver o diário');
    } finally {
      setDevolvendoDiario(false);
    }
  };

  // FUNÇÃO PARA DESFINALIZAR
  const handleDesfinalizar = async () => {
    if (!diario) return;

    try {
      setDesfinalizado(true);
      
      // Atualizar status de FINALIZADO para ENTREGUE
      await supabaseService.updateDiario(diario.id, {
        status: 'ENTREGUE'
      });

      // Fecha modal
      onOpenChange(false);
      
      // Mostra sucesso
      alert('Diário desfinalizado com sucesso! Status voltou para ENTREGUE.');
      
    } catch (error) {
      console.error('Erro ao desfinalizar diário:', error);
      alert('Erro ao desfinalizar diário. Tente novamente.');
    } finally {
      setDesfinalizado(false);
    }
  };

  const getSituacaoColor = (situacao: string | null) => {
    if (!situacao || situacao === 'Em Análise') return 'bg-gray-100 text-gray-800 border-gray-300';
    if (situacao === 'Aprovado') return 'bg-green-100 text-green-800 border-green-300';
    if (situacao === 'Reprovado') return 'bg-red-100 text-red-800 border-red-300';
    if (situacao === 'Recuperação') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  if (!diario || !open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[0] backdrop-blur-sm">
        <div className="bg-background rounded-xl w-full max-w-[1400px] mx-4 flex flex-col shadow-2xl overflow-hidden border h-[95vh]">
          
          {/* HEADER */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">📚 Diário de Classe</h2>
              <p className="text-gray-600 text-sm">{diario.nome}</p>
            </div>
            <button 
              onClick={() => onOpenChange(false)}
              type="button"
              className="p-2 hover:bg-white rounded-full transition-colors text-gray-600 hover:text-gray-900"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* CONTEÚDO COM SCROLL */}
          <ScrollArea className="flex-1 overflow-auto">
            <div className="p-8 flex flex-col gap-6">
              
              {/* BLOCO 1: INFORMAÇÕES DA TURMA */}
              {identificacao && (
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Informações da Turma e Disciplina
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase">Escola</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{identificacao.escola}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase">Turma</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{identificacao.turma}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase">Turno</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{identificacao.turno}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase">Disciplina</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{identificacao.disciplina}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase">Professor</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{identificacao.professor}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase">Período</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{identificacao.bimestre}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase">Data Início</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{identificacao.dataInicio}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase">Data Término</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{identificacao.dataFim}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* BLOCO 2: REGISTRO DE AULAS */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  Aulas Ministradas
                </h3>

                {carregando ? (
                  <div className="text-center py-4 text-gray-500">Carregando...</div>
                ) : aulas.length === 0 ? (
                  <div className="p-6 bg-gray-50 rounded text-center text-gray-600">
                    <p className="text-sm">📝 Nenhuma aula registrada ainda</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {aulas.map((aula) => (
                      <div key={aula.id} className="p-4 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition flex flex-col">
                        <div className="flex-1">
                          <div className="mb-2">
                            <span className="text-sm font-semibold text-gray-900">
                              📅 {new Date(aula.data).toLocaleDateString('pt-BR')}
                            </span>
                            {aula.horaInicio && aula.horaFim && (
                              <span className="text-xs text-gray-600 block">
                                {aula.horaInicio} - {aula.horaFim}
                              </span>
                            )}
                          </div>
                          <p className="font-medium text-gray-900 text-sm mb-1">{aula.conteudo || 'Aula sem título'}</p>
                          {aula.observacoes && (
                            <p className="text-xs text-gray-600">{aula.observacoes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* BLOCO 3: RENDIMENTO DOS ALUNOS */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  Rendimento dos Alunos
                </h3>
                {carregando ? (
                  <div className="text-center py-4 text-gray-500">Carregando...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100 border-b-2 border-gray-300">
                          <th className="border px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">N°</th>
                          <th className="border px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap min-w-[200px]">Nome</th>
                          {avaliacoes.map((avaliacao) => (
                            <th key={avaliacao.id} className="border px-4 py-3 text-center font-semibold text-gray-700 whitespace-nowrap">
                              <div>{avaliacao.titulo}</div>
                              <div className="text-xs text-gray-500 font-normal">
                                Peso: {avaliacao.peso}
                              </div>
                            </th>
                          ))}
                          <th className="border px-4 py-3 text-center font-semibold text-gray-700 whitespace-nowrap">Média</th>
                          <th className="border px-4 py-3 text-center font-semibold text-gray-700 whitespace-nowrap">Faltas</th>
                          <th className="border px-4 py-3 text-center font-semibold text-gray-700 whitespace-nowrap">Situação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alunos.length > 0 ? (
                          alunos.map((aluno, idx) => (
                            <tr key={aluno.numero} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="border px-4 py-3 text-center font-medium">{aluno.numero}</td>
                              <td className="border px-4 py-3">{aluno.nome}</td>
                              {avaliacoes.map((avaliacao) => {
                                const nota = aluno.notas[avaliacao.id];
                                return (
                                  <td key={avaliacao.id} className="border px-4 py-3 text-center">
                                    <span className={`font-semibold ${
                                      nota === undefined ? 'text-gray-400' :
                                      nota >= 7 ? 'text-green-600' :
                                      nota >= 5 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                      {nota !== undefined ? nota.toFixed(1) : '-'}
                                    </span>
                                  </td>
                                );
                              })}
                              <td className="border px-4 py-3 text-center">
                                <span className={`font-semibold ${
                                  aluno.media === null ? 'text-gray-400' :
                                  aluno.media >= 7 ? 'text-green-600' :
                                  aluno.media >= 5 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {aluno.media !== null ? aluno.media.toFixed(1) : '-'}
                                </span>
                              </td>
                              <td className="border px-4 py-3 text-center">
                                <span className={`font-medium ${
                                  aluno.faltas === null ? 'text-gray-400' :
                                  aluno.faltas === 0 ? 'text-green-600' :
                                  aluno.faltas <= 3 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {aluno.faltas !== null ? aluno.faltas : '-'}
                                </span>
                              </td>
                              <td className="border px-4 py-3 text-center">
                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${getSituacaoColor(aluno.acompanhamento)}`}>
                                  {aluno.acompanhamento || 'Em Análise'}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5 + avaliacoes.length} className="border px-4 py-8 text-center text-gray-500">
                              Nenhum aluno encontrado
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* BLOCO 4: FREQUÊNCIA */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-600" />
                  Frequência Geral
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded border border-blue-200">
                    <p className="text-xs font-semibold text-blue-600 uppercase">Total de Aulas</p>
                    <p className="text-2xl font-bold text-blue-900 mt-2">{aulas.length}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded border border-green-200">
                    <p className="text-xs font-semibold text-green-600 uppercase">Alunos</p>
                    <p className="text-2xl font-bold text-green-900 mt-2">{alunos.length}</p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded border border-yellow-200">
                    <p className="text-xs font-semibold text-yellow-600 uppercase">Período</p>
                    <p className="text-sm font-bold text-yellow-900 mt-2">{identificacao?.bimestre || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded border border-purple-200">
                    <p className="text-xs font-semibold text-purple-600 uppercase">Status</p>
                    <p className="text-sm font-bold text-purple-900 mt-2">{diario.status || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* FOOTER */}
          <div className="border-t bg-gray-50 px-8 py-4 flex-shrink-0">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                {isReadOnly && (
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Somente leitura
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 flex-wrap justify-end">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="px-6"
                >
                  Fechar
                </Button>

                {onExportar && (
                  <Button
                    variant="outline"
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                    onClick={onExportar}
                    disabled={loading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                )}
                
                {canDevolver && (
                  <Button
                    variant="outline"
                    className="border-orange-200 text-orange-700 hover:bg-orange-50"
                    onClick={() => setIsDevolverOpen(true)}
                    disabled={loading}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Devolver
                  </Button>
                )}

                {canFinalizar && onFinalizar && (
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={onFinalizar}
                    disabled={loading}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Finalizar
                  </Button>
                )}

                {canDesfinalizar && (
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                    onClick={handleDesfinalizar}
                    disabled={desfinalizado || loading}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {desfinalizado ? 'Desfinalizado...' : 'Desfinalizar'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Marcar Presença */}
      <MarcarPresencaModal
        aula={selectedAula}
        alunos={alunosData}
        open={isMarcarPresencaOpen}
        onOpenChange={setIsMarcarPresencaOpen}
        loading={loading}
        onSave={() => carregarDados()}
      />

      {/* Modal de Devolver Diário - INLINE (sem componente separado) */}
      {isDevolverOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-200">
            
            <div className="bg-white p-6 border-b flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Devolver Diário</h2>
                <p className="text-sm text-gray-600">
                  Tem certeza que deseja devolver este diário para o professor?
                </p>
              </div>
              <button
                onClick={() => setIsDevolverOpen(false)}
                disabled={devolvendoDiario}
                type="button"
                className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 bg-white">
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-sm text-gray-600 mb-1">
                  Diário: <span className="font-semibold text-gray-900">{diario.nome}</span>
                </p>
                <p className="text-xs text-gray-500">
                  Status: <span className="font-medium">{diario.status}</span>
                </p>
              </div>

              {erroDevolver && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{erroDevolver}</p>
                </div>
              )}

              <div>
                <label htmlFor="motivo" className="block text-sm font-semibold text-gray-700 mb-2">
                  Observação (opcional)
                </label>
                <textarea
                  id="motivo"
                  value={motivoDevolucao}
                  onChange={(e) => setMotivoDevolucao(e.target.value.slice(0, 500))}
                  placeholder="Explique o motivo da devolução..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none h-32 bg-white text-gray-900 placeholder:text-gray-400"
                  disabled={devolvendoDiario}
                />
                <div className="flex justify-end mt-1">
                  <span className="text-[10px] text-gray-400">{motivoDevolucao.length}/500</span>
                </div>
              </div>
            </div>

            <div className="border-t bg-gray-50 px-6 py-4 flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDevolverOpen(false)}
                disabled={devolvendoDiario}
                className="px-6 bg-white"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="bg-[#1e4e5f] hover:bg-[#153a47] text-white px-6 min-w-[140px]"
                onClick={handleDevolverDiario}
                disabled={devolvendoDiario}
              >
                {devolvendoDiario ? 'Devolvendo...' : 'Devolver Diário'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DiarioViewModal;
