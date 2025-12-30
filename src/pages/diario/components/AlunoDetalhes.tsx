
import { BoletimModal } from '../../../components/shared/BoletimModal';
import type { Aluno } from '../../../services/supabaseService';

interface AlunoDetalhesProps {
  aluno: Aluno;
  diarioId: string | number;
  onClose: () => void;
}

export function AlunoDetalhes({ aluno, diarioId, onClose }: AlunoDetalhesProps) {
  return (
    <BoletimModal 
      aluno={aluno} 
      onClose={onClose} 
      diarioId={diarioId?.toString()}
    />
  );
}
