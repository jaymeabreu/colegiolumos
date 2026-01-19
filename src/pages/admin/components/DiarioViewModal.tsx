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
      const alunosData = await supabaseService.getAlunosByDiario(diario.id);
      const boletim: BoletimRow[] = (alunosData || []).map((aluno, index) => ({
        numero: index + 1,
        nome: aluno.nome,
        media: null,
        faltas: null,
        acompanhamento: null
      }));
      setAlunos(boletim);

      const turma = await supabaseService.getTurmaById(diario.turma_id || diario.turmaId || 0);
      const disciplina = await supabaseService.getDisciplinaById(diario.disciplina_id || diario.disciplinaId || 0);
      const professor = await supabaseService.getProfessorById(diario.professor_id || diario.professorId || 0);

      setIdentificacao({
        escola: 'Escola Padrão',
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div 
        className="bg-background rounded-xl !w-[95vw] !max-w-none flex flex-col shadow-2xl overflow-hidden border"
        style={{ width: '95vw', maxWidth: '95vw', maxHeight: '95vh' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b bg-gradient-to-r from-slate-50 to-white flex-shrink-0">
          <div className="flex-1 pr-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-2">
              📚 Diário de Classe - {diario.nome}
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(diario.status)}`}>
                {getStatusLabel(diario.status)}
              </div>
              {diario.bimestre && <Badge variant="outline" className="text-sm px-3 py-1">{diario.bimestre}º Bimestre</Badge>}
              {isReadOnly && (
                <Badge variant="secondary" className="text-xs px-3 py-1 bg-blue-50 text-blue-700 border-blue-100">
                  <AlertCircle className="h-3.5 w-3.5 mr-1.5" /> Somente Leitura
                </Badge>
              )}
            </div>
          </div>
          {/* BOTÃO DE FECHAR (X) - CORRIGIDO */}
          <button 
            onClick={onClose} 
            type="button"
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-muted-foreground hover:text-foreground flex-shrink-0 cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Identificação */}
        {identificacao && (
          <div className="bg-white border-b p-6 flex-shrink-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg border"><p className="text-xs font-semibold text-gray-600 uppercase">Escola</p><p className="text-sm font-medium mt-1">{identificacao.escola}</p></div>
              <div className="p-3 bg-gray-50 rounded-lg border"><p className="text-xs font-semibold text-gray-600 uppercase">Turma</p><p className="text-sm font-medium mt-1">{identificacao.turma}</p></div>
              <div className="p-3 bg-gray-50 rounded-lg border"><p className="text-xs font-semibold text-gray-600 uppercase">Disciplina</p><p className="text-sm font-medium mt-1">{identificacao.disciplina}</p></div>
              <div className="p-3 bg-gray-50 rounded-lg border"><p className="text-xs font-semibold text-gray-600 uppercase">Professor</p><p className="text-sm font-medium mt-1">{identificacao.professor}</p></div>
            </div>
          </div>
        )}

        {/* Conteúdo */}
        <div className="flex-1 overflow-auto flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="border-b bg-slate-50/50 px-6 flex-shrink-0">
              <TabsList className="h-14 bg-transparent gap-2">
                <TabsTrigger value="alunos" className="px-6 h-full">4. Avaliação / Rendimento</TabsTrigger>
                <TabsTrigger value="aulas" className="px-6 h-full">2. Registro de Aulas</TabsTrigger>
                <TabsTrigger value="frequencia" className="px-6 h-full">3. Frequência</TabsTrigger>
                <TabsTrigger value="consolidacao" className="px-6 h-full">5. Consolidação</TabsTrigger>
              </TabsList>
            </div>
            <div className="flex-1 overflow-auto min-h-0 bg-white p-8">
              <TabsContent value="alunos" className="mt-0">
                <h3 className="text-lg font-semibold mb-4">4. Avaliação / Rendimento dos Alunos</h3>
                {carregando ? <p>Carregando...</p> : (
                  <table className="w-full border-collapse border">
                    <thead><tr className="bg-gray-100"><th className="border p-2">Nº</th><th className="border p-2 text-left">Nome do Aluno</th><th className="border p-2">Média</th><th className="border p-2">Faltas</th></tr></thead>
                    <tbody>
                      {alunos.map(aluno => (
                        <tr key={aluno.numero}><td className="border p-2 text-center">{aluno.numero}</td><td className="border p-2">{aluno.nome}</td><td className="border p-2 text-center">-</td><td className="border p-2 text-center">-</td></tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Footer - CORRIGIDO */}
        <div className="p-6 border-t bg-slate-50 flex justify-end gap-3 flex-shrink-0">
          <Button onClick={onClose} variant="outline" className="px-8 cursor-pointer">
            Fechar
          </Button>
          {canDevolver && <Button onClick={onDevolver} variant="outline" className="border-orange-200 text-orange-700">Devolver</Button>}
          {canFinalizar && <Button onClick={onFinalizar} className="bg-green-600 hover:bg-green-700">Finalizar</Button>}
        </div>
      </div>
    </div>
  );
}

export default DiarioViewModal;
