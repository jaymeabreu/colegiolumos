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

      const presencasParaSalvar: Omit<Presenca, 'id'>[] = [];

      alunos.forEach(aluno => {
        for (let aulaNum = 1; aulaNum <= numeroAulas; aulaNum++) {
          presencasParaSalvar.push({
            aula_id: aula.id,
            aluno_id: aluno.id,
            status: presencas[`${aluno.id}-${aulaNum}`] || 'PRESENTE'
          });
        }
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

        <div className="mb-6">
          <p className="text-sm font-medium mb-2">Número de aulas seguidas</p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={numeroAulas === 1 ? 'default' : 'outline'}
              onClick={() => setNumeroAulas(1)}
              size="sm"
            >
              1 Aula
            </Button>
            <Button
              type="button"
              variant={numeroAulas === 2 ? 'default' : 'outline'}
              onClick={() => setNumeroAulas(2)}
              size="sm"
            >
              2 Aulas
            </Button>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Aluno</th>
                {numeroAulas >= 1 && (
                  <th className="px-4 py-3 text-center text-sm font-medium">1ª Aula</th>
                )}
                {numeroAulas === 2 && (
                  <th className="px-4 py-3 text-center text-sm font-medium">2ª Aula</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {alunos.map(aluno => (
                <tr key={aluno.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{aluno.nome}</td>
                  
                  {numeroAulas >= 1 && (
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant={presencas[`${aluno.id}-1`] === 'PRESENTE' ? 'default' : 'outline'}
                          onClick={() => handlePresencaChange(aluno.id, 1, 'PRESENTE')}
                          className={presencas[`${aluno.id}-1`] === 'PRESENTE' ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={presencas[`${aluno.id}-1`] === 'FALTA' ? 'default' : 'outline'}
                          onClick={() => handlePresencaChange(aluno.id, 1, 'FALTA')}
                          className={presencas[`${aluno.id}-1`] === 'FALTA' ? 'bg-red-600 hover:bg-red-700' : ''}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={presencas[`${aluno.id}-1`] === 'JUSTIFICADA' ? 'default' : 'outline'}
                          onClick={() => handlePresencaChange(aluno.id, 1, 'JUSTIFICADA')}
                          className={presencas[`${aluno.id}-1`] === 'JUSTIFICADA' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                        >
                          J
                        </Button>
                      </div>
                    </td>
                  )}

                  {numeroAulas === 2 && (
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant={presencas[`${aluno.id}-2`] === 'PRESENTE' ? 'default' : 'outline'}
                          onClick={() => handlePresencaChange(aluno.id, 2, 'PRESENTE')}
                          className={presencas[`${aluno.id}-2`] === 'PRESENTE' ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={presencas[`${aluno.id}-2`] === 'FALTA' ? 'default' : 'outline'}
                          onClick={() => handlePresencaChange(aluno.id, 2, 'FALTA')}
                          className={presencas[`${aluno.id}-2`] === 'FALTA' ? 'bg-red-600 hover:bg-red-700' : ''}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={presencas[`${aluno.id}-2`] === 'JUSTIFICADA' ? 'default' : 'outline'}
                          onClick={() => handlePresencaChange(aluno.id, 2, 'JUSTIFICADA')}
                          className={presencas[`${aluno.id}-2`] === 'JUSTIFICADA' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                        >
                          J
                        </Button>
                      </div>
                    </td>
                  )}
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
