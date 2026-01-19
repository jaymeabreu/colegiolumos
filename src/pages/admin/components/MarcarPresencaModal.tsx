import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { supabaseService } from '../../../services/supabaseService';
import type { Aula, Aluno, Presenca } from '../../../services/supabaseService';

interface MarcarPresencaModalProps {
  aula: Aula | null;
  alunos: Aluno[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
  onSave?: () => void;
}

export function MarcarPresencaModal({
  aula,
  alunos,
  open,
  onOpenChange,
  loading = false,
  onSave
}: MarcarPresencaModalProps) {
  const [presencas, setPresencas] = useState<Map<number, 'PRESENTE' | 'FALTA' | 'JUSTIFICADA'>>(new Map());
  const [carregando, setCarregando] = useState(false);

  // Carregar presenças existentes
  useEffect(() => {
    if (aula && open) {
      carregarPresencas();
    }
  }, [aula?.id, open]);

  const carregarPresencas = async () => {
    if (!aula) return;

    try {
      setCarregando(true);
      const presencasData = await supabaseService.getPresencasByAula(aula.id);
      
      const mapa = new Map<number, 'PRESENTE' | 'FALTA' | 'JUSTIFICADA'>();
      presencasData.forEach(p => {
        mapa.set(p.aluno_id ?? p.alunoId ?? 0, p.status);
      });
      
      setPresencas(mapa);
    } catch (error) {
      console.error('Erro ao carregar presenças:', error);
    } finally {
      setCarregando(false);
    }
  };

  const handleTogglePresenca = (alunoId: number) => {
    const statusAtual = presencas.get(alunoId) || 'PRESENTE';
    let novoStatus: 'PRESENTE' | 'FALTA' | 'JUSTIFICADA';

    if (statusAtual === 'PRESENTE') {
      novoStatus = 'FALTA';
    } else if (statusAtual === 'FALTA') {
      novoStatus = 'JUSTIFICADA';
    } else {
      novoStatus = 'PRESENTE';
    }

    const novasPresencas = new Map(presencas);
    novasPresencas.set(alunoId, novoStatus);
    setPresencas(novasPresencas);
  };

  const handleSalvarPresencas = async () => {
    if (!aula) return;

    try {
      setCarregando(true);

      // Converter mapa para array
      const presencasArray = Array.from(presencas.entries()).map(([alunoId, status]) => ({
        aula_id: aula.id,
        aluno_id: alunoId,
        status
      }));

      // Adicionar alunos sem presença marcada como PRESENTE (padrão)
      const alunosComPresenca = new Set(presencas.keys());
      alunos.forEach(aluno => {
        if (!alunosComPresenca.has(aluno.id)) {
          presencasArray.push({
            aula_id: aula.id,
            aluno_id: aluno.id,
            status: 'PRESENTE'
          });
        }
      });

      await supabaseService.savePresencas(presencasArray as any);
      alert('Presenças salvas com sucesso!');
      onOpenChange(false);
      onSave?.();
    } catch (error) {
      console.error('Erro ao salvar presenças:', error);
      alert('Erro ao salvar presenças. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const getStatusColor = (status: 'PRESENTE' | 'FALTA' | 'JUSTIFICADA') => {
    switch (status) {
      case 'PRESENTE':
        return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
      case 'FALTA':
        return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
      case 'JUSTIFICADA':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200';
    }
  };

  const getStatusLabel = (status: 'PRESENTE' | 'FALTA' | 'JUSTIFICADA') => {
    switch (status) {
      case 'PRESENTE':
        return '✓ Presente';
      case 'FALTA':
        return '✕ Falta';
      case 'JUSTIFICADA':
        return 'J Justificada';
    }
  };

  const getContagem = () => {
    let presente = 0, falta = 0, justificada = 0;
    presencas.forEach(status => {
      if (status === 'PRESENTE') presente++;
      else if (status === 'FALTA') falta++;
      else justificada++;
    });
    return { presente, falta, justificada };
  };

  const contagem = getContagem();

  if (!aula || !open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
      <div className="bg-background rounded-xl w-[95vw] max-w-2xl flex flex-col shadow-2xl overflow-hidden border" style={{ maxHeight: '95vh' }}>
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Marcar Presença</h2>
            <p className="text-gray-600 text-sm mt-1">
              Aula de {new Date(aula.data).toLocaleDateString('pt-BR')} - {aula.conteudo || 'Sem título'}
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            type="button"
            className="p-2 hover:bg-white rounded-full transition-colors text-gray-600 hover:text-gray-900"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* CONTADORES */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 border-b flex-shrink-0">
          <div className="text-center p-2 bg-green-50 rounded border border-green-200">
            <p className="text-2xl font-bold text-green-700">{contagem.presente}</p>
            <p className="text-xs text-green-600">Presente</p>
          </div>
          <div className="text-center p-2 bg-red-50 rounded border border-red-200">
            <p className="text-2xl font-bold text-red-700">{contagem.falta}</p>
            <p className="text-xs text-red-600">Falta</p>
          </div>
          <div className="text-center p-2 bg-yellow-50 rounded border border-yellow-200">
            <p className="text-2xl font-bold text-yellow-700">{contagem.justificada}</p>
            <p className="text-xs text-yellow-600">Justificada</p>
          </div>
        </div>

        {/* LISTA DE ALUNOS */}
        <div className="flex-1 overflow-y-auto p-4">
          {carregando ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Carregando...</p>
            </div>
          ) : alunos.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Nenhum aluno encontrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alunos.map((aluno, index) => {
                const status = presencas.get(aluno.id) || 'PRESENTE';
                return (
                  <div
                    key={aluno.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{aluno.nome}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleTogglePresenca(aluno.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors cursor-pointer ${getStatusColor(status)}`}
                      type="button"
                    >
                      {getStatusLabel(status)}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="border-t bg-gray-50 px-6 py-4 flex items-center justify-between flex-shrink-0 gap-3">
          <div className="text-sm text-gray-600">
            <p>Total de alunos: <span className="font-semibold">{alunos.length}</span></p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSalvarPresencas}
              disabled={loading || carregando}
            >
              {loading || carregando ? 'Salvando...' : 'Salvar Presenças'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarcarPresencaModal;
