import { useState, useEffect, useCallback } from 'react';
import { X, GraduationCap, TrendingUp, Calendar, AlertCircle, BookOpen, Award, User, RotateCcw, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { supabaseService, Aluno, Avaliacao, Nota, Disciplina, Diario, Aula, Presenca, Ocorrencia } from '../../services/supabaseService';

interface DiarioViewModalProps {
  diario: Diario | null;
  onClose: () => void;
  onDevolver?: () => void;
  onFinalizar?: () => void;
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

export function DiarioViewModal({ 
  diario, 
  onClose, 
  onDevolver,
  onFinalizar,
  loading = false,
  userRole = 'COORDENADOR'
}: DiarioViewModalProps) {
  const [alunos, setAlunos] = useState<BoletimRow[]>([]);
  const [carregando, setCarregando] = useState(true);

  const isReadOnly = diario?.status === 'ENTREGUE' || diario?.status === 'FINALIZADO';
  const canDevolver = userRole === 'COORDENADOR' && diario?.status === 'ENTREGUE';
  const canFinalizar = userRole === 'COORDENADOR' && (diario?.status === 'DEVOLVIDO' || diario?.status === 'ENTREGUE');

  useEffect(() => {
    if (diario) {
      carregarAlunos();
    }
  }, [diario?.id]);

  const carregarAlunos = async () => {
    if (!diario) return;
    
    try {
      setCarregando(true);
      const alunosData = await supabaseService.getAlunosByDiario(diario.id);
      
      const boletim: BoletimRow[] = (alunosData || []).map((aluno, index) => ({
        numero: index + 1,
        nome: aluno.nome,
        media: null, // TODO: Buscar do banco
        faltas: null, // TODO: Buscar do banco
        acompanhamento: null // TODO: Buscar do banco
      }));
      
      setAlunos(boletim);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
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
        className="bg-background rounded-xl !w-[95vw] !max-w-none h-[92vh] flex flex-col shadow-2xl overflow-hidden border"
        style={{ width: '95vw', maxWidth: '95vw' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              {diario.nome}
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-3">
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
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabela de Boletim */}
        <div className="flex-1 overflow-auto bg-white">
          <div className="p-8">
            {carregando ? (
              <div className="flex items-center justify-center h-full text-gray-500">
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
                        Nome
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 w-24">
                        M (Média)
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 w-24">
                        F (Faltas)
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 w-32">
                        AC (Acompanhamento)
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
                            {aluno.acompanhamento ? (
                              <Badge variant="outline">{aluno.acompanhamento}</Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
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
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-8 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              {isReadOnly && (
                <p className="text-sm text-gray-500 flex items-center font-medium">
                  <AlertCircle className="h-4 w-4 mr-2 text-blue-500" />
                  Modo de visualização (somente leitura)
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="px-6"
              >
                Fechar
              </Button>
              
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
