import { useState, useEffect } from 'react';
import { X, AlertCircle, RotateCcw, CheckCircle, Download, FileText } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { supabaseService } from '../../../services/supabaseService';
import type { Diario, Aluno, Disciplina, Usuario } from '../../../services/supabaseService';

interface DiarioViewModalProps {
  diario: Diario | null;
  onClose: () => void;
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
  onClose, 
  onDevolver,
  onFinalizar,
  onExportar,
  loading = false,
  userRole = 'COORDENADOR'
}: DiarioViewModalProps) {
  const [alunos, setAlunos] = useState<BoletimRow[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [identificacao, setIdentificacao] = useState<DadosIdentificacao | null>(null);
  const [activeTab, setActiveTab] = useState('alunos');

  const isReadOnly = diario?.status === 'ENTREGUE' || diario?.status === 'FINALIZADO';
  const canDevolver = userRole === 'COORDENADOR' && diario?.status === 'ENTREGUE';
  const canFinalizar = userRole === 'COORDENADOR' && (diario?.status === 'DEVOLVIDO' || diario?.status === 'ENTREGUE');

  useEffect(() => {
    if (diario) {
      carregarDados();
    }
  }, [diario?.id]);

  const carregarDados = async () => {
    if (!diario) return;
    
    try {
      setCarregando(true);

      // Carrega alunos
      const alunosData = await supabaseService.getAlunosByDiario(diario.id);
      const boletim: BoletimRow[] = (alunosData || []).map((aluno, index) => ({
        numero: index + 1,
        nome: aluno.nome,
        media: null, // TODO: Buscar do banco
        faltas: null, // TODO: Buscar do banco
        acompanhamento: null // TODO: Buscar do banco
      }));
      setAlunos(boletim);

      // Carrega dados de identificação
      const turma = await supabaseService.getTurmaById(diario.turma_id || diario.turmaId || 0);
      const disciplina = await supabaseService.getDisciplinaById(diario.disciplina_id || diario.disciplinaId || 0);
      const professor = await supabaseService.getProfessorById(diario.professor_id || diario.professorId || 0);

      setIdentificacao({
        escola: 'Escola Padrão', // TODO: Buscar do banco
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

  if (!diario) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm overflow-y-auto">
      <div 
        className="bg-background rounded-xl !w-[95vw] !max-w-none flex flex-col shadow-2xl overflow-hidden border my-4"
        style={{ width: '95vw', maxWidth: '95vw', maxHeight: '95vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-slate-50 to-white flex-shrink-0">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-2">
              📚 Diário de Classe - {diario.nome}
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(diario.status)}`}>
                {getStatusLabel(diario.status)}
              </div>
              {diario.bimestre && (
                <Badge variant="outline" className="text-sm px-3 py-1">
                  {diario.bimestre}º Bimestre
                </Badge>
              )}
              {isReadOnly && (
                <Badge variant="secondary" className="text-xs px-3 py-1 bg-blue-50 text-blue-700 border-blue-100">
                  <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                  Somente Leitura
                </Badge>
              )}
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* SEÇÃO 1: IDENTIFICAÇÃO DA TURMA */}
        {identificacao && (
          <div className="bg-white border-b p-6 flex-shrink-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              1. Identificação da Turma e Componente Curricular
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-xs font-semibold text-gray-600 uppercase">Escola/Unidade</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{identificacao.escola}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-xs font-semibold text-gray-600 uppercase">Turma</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{identificacao.turma}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-xs font-semibold text-gray-600 uppercase">Turno</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{identificacao.turno}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-xs font-semibold text-gray-600 uppercase">Disciplina</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{identificacao.disciplina}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-xs font-semibold text-gray-600 uppercase">Professor</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{identificacao.professor}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-xs font-semibold text-gray-600 uppercase">Período</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{identificacao.bimestre}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-xs font-semibold text-gray-600 uppercase">Data Início</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{identificacao.dataInicio}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-xs font-semibold text-gray-600 uppercase">Data Fim</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{identificacao.dataFim}</p>
              </div>
            </div>
          </div>
        )}

        {/* Abas com conteúdo */}
        <div className="flex-1 overflow-auto flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="border-b bg-slate-50/50 px-6 flex-shrink-0">
              <TabsList className="h-14 bg-transparent gap-2">
                <TabsTrigger 
                  value="alunos" 
                  className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-blue-600 rounded-none h-full"
                >
                  4. Avaliação / Rendimento
                </TabsTrigger>
                <TabsTrigger 
                  value="aulas" 
                  className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-blue-600 rounded-none h-full"
                >
                  2. Registro de Aulas
                </TabsTrigger>
                <TabsTrigger 
                  value="frequencia" 
                  className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-blue-600 rounded-none h-full"
                >
                  3. Frequência
                </TabsTrigger>
                <TabsTrigger 
                  value="consolidacao" 
                  className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-blue-600 rounded-none h-full"
                >
                  5. Consolidação
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-auto min-h-0 bg-white">
              <div className="p-8">
                {/* ABA: Avaliação / Rendimento (Alunos) */}
                <TabsContent value="alunos" className="mt-0 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      4. Avaliação / Rendimento dos Alunos
                    </h3>
                    {carregando ? (
                      <div className="flex items-center justify-center h-48 text-gray-500">
                        <p>Carregando alunos...</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-100 border-2 border-gray-300">
                              <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700 w-16">
                                N°
                              </th>
                              <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                                Nome do Aluno
                              </th>
                              <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 w-24">
                                Média
                              </th>
                              <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 w-24">
                                Faltas
                              </th>
                              <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 w-32">
                                Situação
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {alunos.length > 0 ? (
                              alunos.map((aluno, index) => (
                                <tr 
                                  key={aluno.numero} 
                                  className={`border border-gray-200 hover:bg-blue-50 transition-colors ${
                                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                  }`}
                                >
                                  <td className="border border-gray-200 px-4 py-3 text-center font-medium text-gray-900">
                                    {aluno.numero}
                                  </td>
                                  <td className="border border-gray-200 px-4 py-3 text-gray-900">
                                    {aluno.nome}
                                  </td>
                                  <td className="border border-gray-200 px-4 py-3 text-center font-semibold text-blue-600">
                                    {aluno.media !== null ? aluno.media.toFixed(1) : '-'}
                                  </td>
                                  <td className="border border-gray-200 px-4 py-3 text-center font-medium text-gray-700">
                                    {aluno.faltas !== null ? aluno.faltas : '-'}
                                  </td>
                                  <td className="border border-gray-200 px-4 py-3 text-center">
                                    <Badge variant={aluno.media && aluno.media >= 6 ? "default" : "destructive"}>
                                      {aluno.acompanhamento || (aluno.media && aluno.media >= 6 ? 'Aprovado' : 'Em Análise')}
                                    </Badge>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={5} className="border border-gray-200 px-4 py-8 text-center text-gray-500">
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

                {/* ABA: Registro de Aulas */}
                <TabsContent value="aulas" className="mt-0">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      2. Registro de Aulas Ministradas
                    </h3>
                    <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-600">
                      <p>📝 Conteúdos e aulas registrados serão exibidos aqui</p>
                      <p className="text-sm mt-2">Data | Conteúdo Ministrado | Habilidades/Descritores | Observações</p>
                    </div>
                  </div>
                </TabsContent>

                {/* ABA: Frequência */}
                <TabsContent value="frequencia" className="mt-0">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      3. Frequência dos Estudantes
                    </h3>
                    <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-600">
                      <p>📊 Mapa de apuração de frequência</p>
                      <p className="text-sm mt-2">Presença/Falta por dia | Total de Faltas por Aluno | Consolidação por Período</p>
                    </div>
                  </div>
                </TabsContent>

                {/* ABA: Consolidação */}
                <TabsContent value="consolidacao" className="mt-0">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      5. Consolidações e Relatórios
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="font-medium text-blue-900">📄 Documentos de Escrituração Escolar</p>
                        <p className="text-sm text-blue-700 mt-1">Registros oficiais para a Diretoria de Ensino</p>
                      </div>
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="font-medium text-green-900">📈 Relatório de Acompanhamento de Frequência</p>
                        <p className="text-sm text-green-700 mt-1">Consolidação de presença e faltas</p>
                      </div>
                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="font-medium text-purple-900">📋 Relatório de Rendimento Escolar</p>
                        <p className="text-sm text-purple-700 mt-1">Fechamento bimestral e notas dos alunos</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-8 py-5 flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div>
              {isReadOnly && (
                <p className="text-sm text-gray-500 flex items-center font-medium">
                  <AlertCircle className="h-4 w-4 mr-2 text-blue-500" />
                  Modo de visualização (somente leitura)
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-end">
              <Button
                variant="outline"
                onClick={onClose}
                className="px-6"
              >
                Fechar
              </Button>

              {onExportar && (
                <Button
                  variant="outline"
                  className="border-purple-200 text-purple-700 hover:bg-purple-50 px-6"
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
                  className="border-orange-200 text-orange-700 hover:bg-orange-50 px-6"
                  onClick={onDevolver}
                  disabled={loading}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {loading ? 'Processando...' : 'Devolver'}
                </Button>
              )}

              {canFinalizar && onFinalizar && (
                <Button
                  className="bg-green-600 hover:bg-green-700 px-8 shadow-sm"
                  onClick={onFinalizar}
                  disabled={loading}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {loading ? 'Processando...' : 'Finalizar Diário'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiarioViewModal;
