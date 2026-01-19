import { useState, useEffect } from 'react';
import { ChevronRight, Users, BookOpen, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { supabaseService } from '../../services/supabaseService';
import type { Diario } from '../../services/supabaseService';

interface TurmaCardProps {
  diario: Diario;
  onClick: () => void;
}

interface DiarioStats {
  alunosMatriculados: number;
  aulasCount: number;
}

export function TurmaCard({ diario, onClick }: TurmaCardProps) {
  const [stats, setStats] = useState<DiarioStats>({
    alunosMatriculados: 0,
    aulasCount: 0
  });
  const [loading, setLoading] = useState(true);

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

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{diario.nome}</CardTitle>
            <div className="mt-2">
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(diario.status)}`}>
                {diario.status}
              </span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Período/Bimestre */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{diario.bimestre}º Bimestre</span>
          </div>

          {/* Alunos Matriculados */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {loading ? 'Carregando...' : `${stats.alunosMatriculados} alunos matriculados`}
            </span>
          </div>

          {/* Aulas Dadas */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>
              {loading ? 'Carregando...' : `${stats.aulasCount} aulas dadas`}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
