import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle, RotateCcw, CheckCircle, Download, FileText, Eye, Calendar } from 'lucide-react';
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
  
  const [isDevolverOpen, setIsDevolverOpen] = useState(false);
  const [motivoDevolucao, setMotivoDevolucao] = useState('');
  const [devolvendoDiario, setDevolvendoDiario] = useState(false);
  const [erroDevolver, setErroDevolver] = useState<string | null>(null);

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
            if (avaliacaoId) notasPorAvaliacao[avaliacaoId] = nota.valor ?? 0;
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
          return { numero: index + 1, nome: aluno.nome, media: null, faltas: null, acompanhamento: null, notas: {} };
        }
      });

      let boletim = await Promise.all(boletimPromises);
      boletim = boletim.map(aluno => ({
        ...aluno,
        acompanhamento: aluno.media === null ? 'Em Análise' : aluno.media >= 7 ? 'Aprovado' : aluno.media >= 5 ? 'Recuperação' : 'Reprovado'
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

  const handleDevolverDiario = async () => {
    if (!diario) return;
    try {
      setDevolvendoDiario(true);
      setErroDevolver(null);
      const resultado = await supabaseService.devolverDiario(diario.id, 1, motivoDevolucao || undefined);
      if (resultado) {
        setIsDevolverOpen(false);
        onOpenChange(false);
        onDevolver?.();
      } else {
        setErroDevolver('Erro ao devolver o diário. Tente novamente.');
      }
    } catch (err: any) {
      setErroDevolver(err.message || 'Erro ao devolver o diário');
    } finally {
      setDevolvendoDiario(false);
    }
  };

  const handleDesfinalizar = async () => {
    if (!diario) return;
    try {
      setDesfinalizado(true);
      await supabaseService.updateDiario(diario.id, { status: 'ENTREGUE' });
      onOpenChange(false);
      alert('Diário desfinalizado com sucesso!');
    } catch (error) {
      alert('Erro ao desfinalizar diário.');
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

  // Usamos createPortal para renderizar o modal no final do <body>, 
  // escapando de qualquer div com margin/padding/relative do pai.
  return createPortal(
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] backdrop-blur-sm">
      <div className="bg-background rounded-xl w-full max-w-[1400px] mx-4 flex flex-col shadow-2xl overflow-hidden border h-[95vh]">
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">📚 Diário de Classe</h2>
            <p className="text-gray-600 text-sm">{diario.nome}</p>
          </div>
          <button onClick={() => onOpenChange(false)} type="button" className="p-2 hover:bg-white rounded-full transition-colors text-gray-600 hover:text-gray-900">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* CONTEÚDO COM SCROLL */}
        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-8 flex flex-col gap-6">
            {identificacao && (
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Informações da Turma e Disciplina
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div><p className="text-xs font-semibold text-gray-600 uppercase">Escola</p><p className="text-sm font-medium text-gray-900 mt-1">{identificacao.escola}</p></div>
                  <div><p className="text-xs font-semibold text-gray-600 uppercase">Turma</p><p className="text-sm font-medium text-gray-900 mt-1">{identificacao.turma}</p></div>
                  <div><p className="text-xs font-semibold text-gray-600 uppercase">Turno</p><p className="text-sm font-medium text-gray-900 mt-1">{identificacao.turno}</p></div>
                  <div><p className="text-xs font-semibold text-gray-600 uppercase">Disciplina</p><p className="text-sm font-medium text-gray-900 mt-1">{identificacao.disciplina}</p></div>
                  <div><p className="text-xs font-semibold text-gray-600 uppercase">Professor</p><p className="text-sm font-medium text-gray-900 mt-1">{identificacao.professor}</p></div>
                  <div><p className="text-xs font-semibold text-gray-600 uppercase">Período</p><p className="text-sm font-medium text-gray-900 mt-1">{identificacao.bimestre}</p></div>
                  <div><p className="text-xs font-semibold text-gray-600 uppercase">Data Início</p><p className="text-sm font-medium text-gray-900 mt-1">{identificacao.dataInicio}</p></div>
                  <div><p className="text-xs font-semibold text-gray-600 uppercase">Data Término</p><p className="text-sm font-medium text-gray-900 mt-1">{identificacao.dataFim}</p></div>
                </div>
              </div>
            )}

            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Aulas Ministradas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {aulas.map((aula) => (
                  <div key={aula.id} className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => { setSelectedAula(aula); setIsMarcarPresencaOpen(true); }}>
                    <div className="flex items-center gap-2 text-blue-600 mb-2"><Calendar className="h-4 w-4" /><span className="text-sm font-bold">{new Date(aula.data).toLocaleDateString('pt-BR')}</span></div>
                    <p className="text-xs font-bold text-gray-900 uppercase mb-1 line-clamp-1">{aula.conteudo}</p>
                    <p className="text-[10px] text-gray-500 line-clamp-2">{aula.observacoes || 'Sem observações'}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Rendimento dos Alunos
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border p-3 text-xs font-bold text-gray-600 uppercase text-center w-12">Nº</th>
                      <th className="border p-3 text-xs font-bold text-gray-600 uppercase text-left">Nome do Aluno</th>
                      {avaliacoes.map(av => (
                        <th key={av.id} className="border p-3 text-xs font-bold text-gray-600 uppercase text-center min-w-[80px]">
                          {av.titulo}<br /><span className="text-[10px] font-normal lowercase">Peso: {av.peso}</span>
                        </th>
                      ))}
                      <th className="border p-3 text-xs font-bold text-gray-600 uppercase text-center w-24">Média</th>
                      <th className="border p-3 text-xs font-bold text-gray-600 uppercase text-center w-20">Faltas</th>
                      <th className="border p-3 text-xs font-bold text-gray-600 uppercase text-center w-32">Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alunos.map((aluno) => (
                      <tr key={aluno.numero} className="hover:bg-gray-50">
                        <td className="border p-3 text-sm text-center">{aluno.numero}</td>
                        <td className="border p-3 text-sm font-medium text-gray-900">{aluno.nome}</td>
                        {avaliacoes.map(av => (
                          <td key={av.id} className="border p-3 text-sm text-center font-bold text-blue-600">
                            {aluno.notas[av.id] !== undefined ? aluno.notas[av.id].toFixed(1) : '-'}
                          </td>
                        ))}
                        <td className="border p-3 text-sm text-center font-bold text-gray-900">{aluno.media?.toFixed(1) || '-'}</td>
                        <td className="border p-3 text-sm text-center text-gray-500">{aluno.faltas || '-'}</td>
                        <td className="border p-3 text-center">
                          <Badge className={`text-[10px] uppercase font-bold border ${getSituacaoColor(aluno.acompanhamento)}`}>
                            {aluno.acompanhamento}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* FOOTER */}
        <div className="p-6 border-t bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isReadOnly && (
                <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                  <Eye className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase">Somente Leitura</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
              {onExportar && <Button variant="outline" onClick={onExportar}><Download className="h-4 w-4 mr-2" />Exportar PDF</Button>}
              {canDevolver && (
                <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50" onClick={() => setIsDevolverOpen(true)}>
                  <RotateCcw className="h-4 w-4 mr-2" />Devolver
                </Button>
              )}
              {canFinalizar && onFinalizar && (
                <Button className="bg-green-600 hover:bg-green-700" onClick={onFinalizar} disabled={loading}>
                  <CheckCircle className="h-4 w-4 mr-2" />Finalizar
                </Button>
              )}
              {canDesfinalizar && (
                <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={handleDesfinalizar} disabled={desfinalizado || loading}>
                  <RotateCcw className="h-4 w-4 mr-2" />{desfinalizado ? 'Desfinalizado...' : 'Desfinalizar'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modais Secundários */}
      <MarcarPresencaModal aula={selectedAula} alunos={alunosData} open={isMarcarPresencaOpen} onOpenChange={setIsMarcarPresencaOpen} loading={loading} onSave={() => carregarDados()} />
      
      {isDevolverOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-200">
            <div className="bg-white p-6 border-b flex items-start justify-between">
              <div className="flex-1"><h2 className="text-xl font-bold text-gray-900 mb-1">Devolver Diário</h2><p className="text-sm text-gray-600">Deseja devolver este diário?</p></div>
              <button onClick={() => setIsDevolverOpen(false)} type="button" className="p-1 hover:bg-gray-100 rounded-full text-gray-400"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 bg-white">
              <textarea value={motivoDevolucao} onChange={(e) => setMotivoDevolucao(e.target.value.slice(0, 500))} placeholder="Motivo..." className="w-full px-3 py-2 border rounded-lg h-32 bg-white text-gray-900" />
            </div>
            <div className="border-t bg-gray-50 px-6 py-4 flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsDevolverOpen(false)} className="px-6 bg-white">Cancelar</Button>
              <Button type="button" className="bg-[#1e4e5f] hover:bg-[#153a47] text-white px-6" onClick={handleDevolverDiario} disabled={devolvendoDiario}>{devolvendoDiario ? 'Devolvendo...' : 'Devolver'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

export default DiarioViewModal;
