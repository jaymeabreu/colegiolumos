import { useState, useEffect, useCallback } from 'react';
import { ChevronRight, Users, BookOpen, Calendar, Send, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { supabaseService } from '../../../services/supabaseService';
import type { Diario } from '../../../services/supabaseService';

interface TurmaCardProps {
  diario: Diario;
  onClick: () => void;
  onStatusChange?: () => void;
}

interface DiarioStats {
  alunosMatriculados: number;
  aulasCount: number;
}

export function TurmaCard({ diario, onClick, onStatusChange }: TurmaCardProps) {
  const [stats, setStats] = useState<DiarioStats>({
    alunosMatriculados: 0,
    aulasCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [disciplinaNome, setDisciplinaNome] = useState<string>('');
  const [turmaNome, setTurmaNome] = useState<string>('');
  const [statusLocal, setStatusLocal] = useState<string>(diario.status || 'PENDENTE');
  
  const diarioNome = disciplinaNome && turmaNome ? `${disciplinaNome} - ${turmaNome}` : diario.nome;

  useEffect(() => {
    // Atualizar status local quando diario muda
    setStatusLocal(diario.status || 'PENDENTE');
  }, [diario.status, diario.id]);

  useEffect(() => {
    const carregarStats = async () => {
      try {
        const data = await supabaseService.getDiarioStats(diario.id);
        setStats(data);
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarStats();
  }, [diario.id]);

  useEffect(() => {
    const carregarNomes = async () => {
      try {
        const [disciplina, turma] = await Promise.all([
          supabaseService.getDisciplinaById(diario.disciplina_id ?? diario.disciplinaId ?? 0),
          supabaseService.getTurmaById(diario.turma_id ?? diario.turmaId ?? 0)
        ]);
        
        if (disciplina) setDisciplinaNome(disciplina.nome);
        if (turma) setTurmaNome(turma.nome);
      } catch (error) {
        console.error('Erro ao carregar nomes:', error);
      }
    };

    carregarNomes();
  }, [diario.id, diario.disciplina_id, diario.disciplinaId, diario.turma_id, diario.turmaId]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'PENDENTE':
        return 'bg-yellow-100 text-yellow-800';
      case 'ENTREGUE':
        return 'bg-blue-100 text-blue-800';
      case 'DEVOLVIDO':
        return 'bg-orange-100 text-orange-800';
      case 'FINALIZADO':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const playSound = useCallback((frequency: number = 523.25) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.value = frequency;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      osc.start(audioContext.currentTime);
      osc.stop(audioContext.currentTime + 0.4);
    } catch (e) {}
  }, []);

  const handleEntregarDiario = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading(true);
    try {
      const resultado = await supabaseService.entregarDiario(diario.id);
      if (resultado) {
        playSound(523.25);
        
        // ATUALIZAR STATUS IMEDIATAMENTE (sem esperar callback)
        setStatusLocal('ENTREGUE');
        
        // Mostrar alerta
        alert('✅ Diário entregue com sucesso!');
        
        // Recarregar dados do pai
        setTimeout(() => {
          onStatusChange?.();
        }, 500);
      }
    } catch (error) {
      console.error('Erro ao entregar diário:', error);
      alert('❌ Erro ao entregar diário');
    } finally {
      setActionLoading(false);
    }
  }, [diario.id, onStatusChange, playSound]);

  const handleSolicitarDevolucao = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const motivo = prompt('Motivo da solicitação de devolução:');
    if (!motivo) return;

    setActionLoading(true);
    try {
      const resultado = await supabaseService.solicitarDevolucaoDiario(diario.id, motivo);
      if (resultado) {
        playSound(659.25);
        
        alert('✅ Solicitação enviada com sucesso!');
        onStatusChange?.();
      }
    } catch (error) {
      console.error('Erro ao solicitar devolução:', error);
      alert('❌ Erro ao solicitar devolução');
    } finally {
      setActionLoading(false);
    }
  }, [diario.id, onStatusChange, playSound]);

  const canDeliver = statusLocal === 'PENDENTE' || statusLocal === 'DEVOLVIDO';
  const canRequestReturn = statusLocal === 'ENTREGUE';
  const isLocked = statusLocal === 'ENTREGUE' || statusLocal === 'FINALIZADO';

  return (
    <Card className={`hover:shadow-lg transition-all ${isLocked ? 'opacity-70 bg-gray-50' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className={`flex-1 ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`} onClick={!isLocked ? onClick : undefined}>
            <CardTitle className="text-lg">{diarioNome}</CardTitle>
            <div className="mt-2 space-y-2">
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(statusLocal)}`}>
                {statusLocal}
              </span>
              {isLocked && (
                <div className="text-xs text-orange-600 font-medium">
                  🔒 Diário bloqueado para edição
                </div>
              )}
            </div>
          </div>
          <ChevronRight 
            className={`h-5 w-5 text-muted-foreground flex-shrink-0 ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`} 
            onClick={!isLocked ? onClick : undefined} 
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Informações */}
          <div className="space-y-3">
            {/* Período/Bimestre */}
            <div className={`flex items-center gap-2 text-sm text-muted-foreground ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`} onClick={!isLocked ? onClick : undefined}>
              <Calendar className="h-4 w-4" />
              <span>{diario.bimestre}º Bimestre</span>
            </div>

            {/* Alunos Matriculados */}
            <div className={`flex items-center gap-2 text-sm text-muted-foreground ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`} onClick={!isLocked ? onClick : undefined}>
              <Users className="h-4 w-4" />
              <span>
                {loading ? 'Carregando...' : `${stats.alunosMatriculados} alunos matriculados`}
              </span>
            </div>

            {/* Aulas Dadas */}
            <div className={`flex items-center gap-2 text-sm text-muted-foreground ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`} onClick={!isLocked ? onClick : undefined}>
              <BookOpen className="h-4 w-4" />
              <span>
                {loading ? 'Carregando...' : `${stats.aulasCount} aulas dadas`}
              </span>
            </div>
          </div>

          {/* Aviso quando bloqueado */}
          {isLocked && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded text-sm text-orange-700">
              <p className="font-medium">
                {statusLocal === 'ENTREGUE' 
                  ? '⏳ Aguardando análise do coordenador. Você não pode editar neste momento.'
                  : '✅ Diário finalizado. Não é possível fazer alterações.'
                }
              </p>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-2 pt-2 border-t">
            {canDeliver && (
              <Button
                size="sm"
                onClick={handleEntregarDiario}
                disabled={actionLoading}
                className="flex-1 flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {actionLoading ? 'Entregando...' : 'Entregar Diário'}
              </Button>
            )}

            {canRequestReturn && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSolicitarDevolucao}
                disabled={actionLoading}
                className="flex-1 flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                {actionLoading ? 'Solicitando...' : 'Solicitar Devolução'}
              </Button>
            )}

            {/* Mostrar estado bloqueado quando não pode fazer nada */}
            {isLocked && !canDeliver && !canRequestReturn && (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-500 py-2 bg-gray-100 rounded">
                Nenhuma ação disponível
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
