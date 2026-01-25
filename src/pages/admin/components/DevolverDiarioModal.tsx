import { useState } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { supabaseService } from '../../../services/supabaseService';
import type { Diario } from '../../../services/supabaseService';

interface DevolverDiarioModalProps {
  diario: Diario;
  onClose: () => void; // Função para fechar/desmontar
  onSuccess: () => Promise<void> | void; // Função para atualizar e fechar
}

export function DevolverDiarioModal({
  diario,
  onClose,
  onSuccess
}: DevolverDiarioModalProps) {
  const [motivo, setMotivo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleDevolver = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const resultado = await supabaseService.devolverDiario(
        diario.id,
        1,
        motivo || undefined
      );

      if (resultado) {
        setSuccess(true);
        
        // Espera o callback do pai (que deve atualizar a lista e desmontar este componente)
        await onSuccess();
      } else {
        setError('Erro ao devolver o diário. Tente novamente.');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Erro ao devolver diário:', err);
      setError(err.message || 'Erro ao devolver o diário');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden border border-gray-200">
        
        {/* HEADER */}
        <div className="bg-white p-6 border-b flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Devolver Diário</h2>
            <p className="text-sm text-gray-600">
              Tem certeza que deseja devolver este diário?
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading || success}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* CONTEÚDO */}
        <div className="p-6 min-h-[280px] flex flex-col bg-white">
          {success ? (
            <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
              <CheckCircle className="h-16 w-16 text-green-600 mb-4 animate-bounce" />
              <p className="text-lg font-bold text-gray-900">Sucesso!</p>
              <p className="text-sm text-gray-500">Atualizando dados...</p>
            </div>
          ) : (
            <>
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-sm text-gray-700">
                  Diário: <span className="font-bold text-gray-900">{diario.nome}</span>
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 text-red-700 text-sm">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Observação (opcional)
                </label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Explique o motivo..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none !bg-white !text-gray-900"
                  style={{ backgroundColor: 'white', color: '#111827' }}
                  disabled={isLoading}
                />
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        {!success && (
          <div className="border-t bg-gray-50 px-6 py-4 flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="bg-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDevolver}
              disabled={isLoading}
              className="bg-[#1e4e5f] hover:bg-[#153a47] text-white px-8"
            >
              {isLoading ? 'Processando...' : 'Devolver Diário'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DevolverDiarioModal;
