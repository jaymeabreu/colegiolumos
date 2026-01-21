import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { supabaseService } from '../../../services/supabaseService';
import type { Aula, Aluno, Presenca } from '../../../services/supabaseService';

interface MarcarPresencaModalProps {
  aula: Aula;
  alunos: Aluno[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function MarcarPresencaModal({
  aula,
  alunos,
  open,
  onOpenChange,
  onSave
}: MarcarPresencaModalProps) {
  const [loading, setLoading] = useState(false);
  const [numeroAulas, setNumeroAulas] = useState<1 | 2>(1);
  const [presencas, setPresencas] = useState<{
    [key: string]: 'PRESENTE' | 'FALTA' | 'JUSTIFICADA';
  }>({});

  useEffect(() => {
    if (open && aula) {
      loadPresencas();
    }
  }, [open, aula]);

  const loadPresencas = async () => {
    try {
      const qtdAulas = aula.quantidade_aulas || 1;
      setNumeroAulas(qtdAulas >= 2 ? 2 : 1);

      const presencasData = await supabaseService.getPresencasByAula(aula.id);
      
      const presencasMap: { [key: string]: 'PRESENTE' | 'FALTA' | 'JUSTIFICADA' } = {};
      
      alunos.forEach(aluno => {
        for (let i = 1; i <= (qtdAulas >= 2 ? 2 : 1); i++) {
          presencasMap[`${aluno.id}-${i}`] = 'PRESENTE';
        }
      });

      presencasData?.forEach(p => {
        const alunoId = p.aluno_id || p.alunoId;
        if (alunoId) {
          presencasMap[`${alunoId}-1`] = p.status;
        }
      });

      setPresencas(presencasMap);
    } catch (error) {
      console.error('Erro ao carregar presenças:', error);
    }
  };

  const handlePresencaChange = (
    alunoId: number,
    aulaNum: number,
    status: 'PRESENTE' | 'FALTA' | 'JUSTIFICADA'
  ) => {
    setPresencas(prev => ({
      ...prev,
      [`${alunoId}-${aulaNum}`]: status
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Para cada aluno, salvamos apenas 1 registro de presença
      // Se for 2 aulas, salvamos o status da 1ª aula (ou podemos criar lógica diferente)
      const presencasParaSalvar: Omit<Presenca, 'id'>[] = [];

      alunos.forEach(aluno => {
        // Por enquanto, vamos salvar apenas a presença da 1ª aula
        // Se quiser salvar as 2 aulas, precisamos adicionar uma coluna na tabela
        // como "aula_numero" ou "sequencia"
        presencasParaSalvar.push({
          aula_id: aula.id,
          aluno_id: aluno.id,
          status: presencas[`${aluno.id}-1`] || 'PRESENTE'
        });
      });

      await supabaseService.savePresencas(presencasParaSalvar);
      
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar presenças:', error);
      alert('Erro ao salvar presenças. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Marcar Presença - {aula.conteudo}</DialogTitle>
          <p className="text-sm text-gray-500">
            {new Date(aula.data).toLocaleDateString('pt-BR')}
          </p>
        </DialogHeader>

        {aula.quantidade_aulas && aula.quantidade_aulas > 1 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              ℹ️ Esta é uma aula com <strong>{aula.quantidade_aulas} aulas seguidas</strong>. 
              A presença será registrada para a primeira aula.
            </p>
          </div>
        )}

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Aluno</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Presença</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {alunos.map(aluno => (
                <tr key={aluno.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{aluno.nome}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={presencas[`${aluno.id}-1`] === 'PRESENTE' ? 'default' : 'outline'}
                        onClick={() => handlePresencaChange(aluno.id, 1, 'PRESENTE')}
                        className={presencas[`${aluno.id}-1`] === 'PRESENTE' ? 'bg-green-600 hover:bg-green-700' : ''}
                        title="Presente"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={presencas[`${aluno.id}-1`] === 'FALTA' ? 'default' : 'outline'}
                        onClick={() => handlePresencaChange(aluno.id, 1, 'FALTA')}
                        className={presencas[`${aluno.id}-1`] === 'FALTA' ? 'bg-red-600 hover:bg-red-700' : ''}
                        title="Falta"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={presencas[`${aluno.id}-1`] === 'JUSTIFICADA' ? 'default' : 'outline'}
                        onClick={() => handlePresencaChange(aluno.id, 1, 'JUSTIFICADA')}
                        className={presencas[`${aluno.id}-1`] === 'JUSTIFICADA' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                        title="Falta Justificada"
                      >
                        J
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-4 text-sm text-gray-600 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 rounded"></div>
            <span>Presente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-600 rounded"></div>
            <span>Falta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-600 rounded"></div>
            <span>Justificada</span>
          </div>
        </div>

        <DialogFooter className="gap-3 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Salvando...' : 'Salvar Presenças'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
