import { useState, useEffect } from 'react';
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

  const getStatusColor = (status: string) => {
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
  };

  const handleEntregarDiario = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading(true);
    try {
      await supabaseService.entregarDiario(diario.id);
      onStatusChange?.();
    } catch (error) {
      console.error('Erro ao entregar diário:', error);
      alert('Erro ao entregar diário');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSolicitarDevolucao = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const motivo = prompt('Motivo da solicitação de devolução:');
    if (!motivo) return;

    setActionLoading(true);
    try {
      await supabaseService.solicitarDevolucaoDiario(diario.id, motivo);
      onStatusChange?.();
    } catch (error) {
      console.error('Erro ao solicitar devolução:', error);
      alert('Erro ao solicitar devolução');
    } finally {
      setActionLoading(false);
    }
  };

  const canDeliver = diario.status === 'PENDENTE' || diario.status === 'DEVOLVIDO';
  const canRequestReturn = diario.status === 'ENTREGUE';

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 cursor-pointer" onClick={onClick}>
            <CardTitle className="text-lg">{diario.nome}</CardTitle>
            <div className="mt-2">
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(diario.status)}`}>
                {diario.status}
              </span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 cursor-pointer" onClick={onClick} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Informações */}
          <div className="space-y-3">
            {/* Período/Bimestre */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer" onClick={onClick}>
              <Calendar className="h-4 w-4" />
              <span>{diario.bimestre}º Bimestre</span>
            </div>

            {/* Alunos Matriculados */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer" onClick={onClick}>
              <Users className="h-4 w-4" />
              <span>
                {loading ? 'Carregando...' : `${stats.alunosMatriculados} alunos matriculados`}
              </span>
            </div>

            {/* Aulas Dadas */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer" onClick={onClick}>
              <BookOpen className="h-4 w-4" />
              <span>
                {loading ? 'Carregando...' : `${stats.aulasCount} aulas dadas`}
              </span>
            </div>
          </div>

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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
