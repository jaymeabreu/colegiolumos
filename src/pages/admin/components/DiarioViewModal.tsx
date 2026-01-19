import { useState, useEffect } from 'react';
import { X, AlertCircle, RotateCcw, CheckCircle, Download, FileText, Eye } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { supabaseService } from '../../../services/supabaseService';
import { MarcarPresencaModal } from './MarcarPresencaModal';
import type { Diario, Aula, Aluno } from '../../../services/supabaseService';

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
  const [activeTab, setActiveTab] = useState('rendimento');
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [alunosData, setAlunosData] = useState<Aluno[]>([]);
  const [isMarcarPresencaOpen, setIsMarcarPresencaOpen] = useState(false);
  const [selectedAula, setSelectedAula] = useState<Aula | null>(null);

  const isReadOnly = diario?.status === 'ENTREGUE' || diario?.status === 'FINALIZADO';
  const canDevolver = userRole === 'COORDENADOR' && diario?.status === 'ENTREGUE';
  const canFinalizar = userRole === 'COORDENADOR' && (diario?.status === 'DEVOLVIDO' || diario?.status === 'ENTREGUE');

  useEffect(() => {
    if (diario && open) {
      carregarDados();
    }
  }, [diario?.id, open]);

  const carregarDados = async () => {
    if (!diario) return;
    
    try {
      setCarregando(true);

      // Carrega alunos
      const alunosDataTemp = await supabaseService.getAlunosByDiario(diario.id);
      setAlunosData(alunosDataTemp);

      const boletim: BoletimRow[] = (alunosDataTemp || []).map((aluno, index) => ({
        numero: index + 1,
        nome: aluno.nome,
        media: null,
        faltas: null,
        acompanhamento: null
      }));
      setAlunos(boletim);

      // Carrega aulas
      const aulasData = await supabaseService.getAulasByDiario(diario.id);
      setAulas(aulasData || []);

      // Carrega dados de identificação
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

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'PENDENTE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ENTREGUE': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DEVOLVIDO': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'FINALIZADO': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'PENDENTE': return 'Pendente';
      case 'ENTREGUE': return 'Pendente de Revisão';
      case 'DEVOLVIDO': return 'Devolvido';
      case 'FINALIZADO': return 'Finalizado';
      default: return 'Desconhecido';
    }
  };

  if (!diario || !open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
        <div className="bg-background rounded-xl !w-[95vw] !max-w-none flex flex-col shadow-2xl overflow-hidden border h-[95vh]" style={{ width: '95vw', maxWidth: '95vw' }}>
          
          {/* HEADER COM TÍTULO E FECHAR */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">📚 Diário de Classe</h2>
              <p className="text-gray-600 text-sm">{diario.nome}</p>
            </div>
            <button 
              onClick={() => onOpenChange(false)}
              type="button"
              className="p-2 hover:bg-white rounded-full transition-colors text-gray-600 hover:text-gray-900 flex-shrink-0"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* SCROLL AREA PARA CONTEÚDO */}
          <ScrollArea className="flex-1 overflow-auto">
            <div className="p-8 space-y-8">
              
              {/* BLOCO 1: INFORMAÇÕES DA TURMA */}
              {identificacao && (
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Informações da Turma
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
                      <p className="text-xs font-semibold text-gray-600 uppercase">Data Fim</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{identificacao.dataFim}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ABAS COM CONTEÚDO */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-gray-100">
                  <TabsTrigger value="rendimento">Rendimento</TabsTrigger>
                  <TabsTrigger value="frequencia">Frequência</TabsTrigger>
                  <TabsTrigger value="aulas">Aulas</TabsTrigger>
                  <TabsTrigger value="consolidacao">Consolidação</TabsTrigger>
                </TabsList>

                {/* ABA: RENDIMENTO */}
                <TabsContent value="rendimento" className="mt-6">
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Rendimento dos Alunos</h3>
                    {carregando ? (
                      <div className="flex items-center justify-center h-48 text-gray-500">
                        <p>Carregando...</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border px-4 py-3 text-left font-semibold text-gray-700">N°</th>
                              <th className="border px-4 py-3 text-left font-semibold text-gray-700">Nome</th>
                              <th className="border px-4 py-3 text-center font-semibold text-gray-700">Média</th>
                              <th className="border px-4 py-3 text-center font-semibold text-gray-700">Faltas</th>
                              <th className="border px-4 py-3 text-center font-semibold text-gray-700">Situação</th>
                            </tr>
                          </thead>
                          <tbody>
                            {alunos.length > 0 ? (
                              alunos.map((aluno, idx) => (
                                <tr key={aluno.numero} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="border px-4 py-3 text-center font-medium">{aluno.numero}</td>
                                  <td className="border px-4 py-3">{aluno.nome}</td>
                                  <td className="border px-4 py-3 text-center font-semibold text-blue-600">
                                    {aluno.media !== null ? aluno.media.toFixed(1) : '-'}
                                  </td>
                                  <td className="border px-4 py-3 text-center">{aluno.faltas !== null ? aluno.faltas : '-'}</td>
                                  <td className="border px-4 py-3 text-center">
                                    <Badge variant={aluno.media && aluno.media >= 6 ? "default" : "destructive"}>
                                      {aluno.media && aluno.media >= 6 ? 'Aprovado' : 'Em Análise'}
                                    </Badge>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={5} className="border px-4 py-8 text-center text-gray-500">
                                  Nenhum aluno encontrado
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* ABA: FREQUÊNCIA */}
                <TabsContent value="frequencia" className="mt-6">
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Mapa de Frequência</h3>
                    <div className="p-8 bg-gray-50 rounded-lg text-center text-gray-600">
                      <p className="text-sm">📊 Mapa de apuração de frequência</p>
                      <p className="text-xs mt-2">Presença/Falta por dia • Total de Faltas por Aluno</p>
                    </div>
                  </div>
                </TabsContent>

                {/* ABA: AULAS */}
                <TabsContent value="aulas" className="mt-6">
                  <div className="bg-white border rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900">
                        Registro de Aulas ({aulas.length})
                      </h3>
                    </div>

                    {aulas.length === 0 ? (
                      <div className="p-8 bg-gray-50 rounded-lg text-center text-gray-600">
                        <p className="text-sm">📝 Nenhuma aula registrada ainda</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {aulas.map((aula) => (
                          <div key={aula.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm font-semibold text-gray-700">
                                    📅 {new Date(aula.data).toLocaleDateString('pt-BR')}
                                  </span>
                                  {aula.horaInicio && aula.horaFim && (
                                    <span className="text-xs text-gray-500">
                                      {aula.horaInicio} - {aula.horaFim}
                                    </span>
                                  )}
                                </div>
                                <p className="font-semibold text-gray-900 mb-1">
                                  {aula.conteudo || 'Aula sem título'}
                                </p>
                                {aula.observacoes && (
                                  <p className="text-sm text-gray-600">
                                    📝 {aula.observacoes}
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-green-200 text-green-700 hover:bg-green-50 ml-4 flex-shrink-0"
                                onClick={() => {
                                  setSelectedAula(aula);
                                  setIsMarcarPresencaOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Presença
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* ABA: CONSOLIDAÇÃO */}
                <TabsContent value="consolidacao" className="mt-6">
                  <div className="bg-white border rounded-lg p-6 space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Consolidações e Relatórios</h3>
                    
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="font-medium text-blue-900">📄 Documentos de Escrituração Escolar</p>
                      <p className="text-sm text-blue-700 mt-1">Registros oficiais para a Diretoria de Ensino</p>
                    </div>

                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="font-medium text-green-900">📈 Relatório de Frequência</p>
                      <p className="text-sm text-green-700 mt-1">Consolidação de presença e faltas</p>
                    </div>

                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="font-medium text-purple-900">📋 Relatório de Rendimento</p>
                      <p className="text-sm text-purple-700 mt-1">Fechamento bimestral e notas</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>

          {/* FOOTER COM BOTÕES */}
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
                
                {canDevolver && onDevolver && (
                  <Button
                    variant="outline"
                    className="border-orange-200 text-orange-700 hover:bg-orange-50"
                    onClick={onDevolver}
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
    </>
  );
}

export default DiarioViewModal;
