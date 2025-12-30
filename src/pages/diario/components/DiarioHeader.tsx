
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { DiarioStatusControls } from '../../../components/shared/DiarioStatusControls';
import type { Diario, Disciplina, Turma, Usuario } from '../../../services/supabaseService';

interface DiarioHeaderProps {
  currentDiario: Diario | null;
  disciplinas: Disciplina[];
  turmas: Turma[];
  currentUser: Usuario | null;
  onBackToDiarios: () => void;
  onStatusChange: () => void;
}

export function DiarioHeader({ 
  currentDiario, 
  disciplinas, 
  turmas, 
  currentUser,
  onBackToDiarios,
  onStatusChange 
}: DiarioHeaderProps) {
  if (!currentDiario) {
    return (
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={onBackToDiarios}
              className="h-9 w-9"
              title="Voltar aos Diários"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Carregando...</h1>
            </div>
          </div>
        </div>
      </header>
    );
  }

  const disciplina = disciplinas.find(d => d.id === currentDiario.disciplinaId);
  const turma = turmas.find(t => t.id === currentDiario.turmaId);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={onBackToDiarios}
            className="h-9 w-9"
            title="Voltar aos Diários"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
  <h1 className="text-2xl font-bold text-gray-900">{currentDiario.nome}</h1>
  <div className="flex items-center gap-2 mt-1">
    <span className="text-sm font-medium text-primary">
      {currentDiario.disciplina || 'Disciplina'}
    </span>
    <span className="text-base text-muted-foreground">•</span>
    <span className="text-base text-muted-foreground">
      {currentDiario.turma || 'Turma'}
    </span>
    <span className="text-base text-muted-foreground">•</span>
    <span className="text-base text-muted-foreground">
      {(currentDiario as any).bimestreAtual
        ? `${(currentDiario as any).bimestreAtual}º Bimestre`
        : (currentDiario as any).bimestre
        ? `${(currentDiario as any).bimestre}º Bimestre`
        : 'Bimestre não definido'}
    </span>
  </div>
</div>

        </div>

        {/* Controles de Status do Diário */}
        {currentUser && (
          <div className="flex items-center gap-3">
            <DiarioStatusControls 
              diario={currentDiario}
              currentUser={currentUser}
              onStatusChange={onStatusChange}
              compact={true}
            />
          </div>
        )}
      </div>
    </header>
  );
}
