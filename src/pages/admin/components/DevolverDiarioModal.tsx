import { useState } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { supabaseService } from '../../../services/supabaseService';
import type { Diario } from '../../../services/supabaseService';

interface DevolverDiarioModalProps {
  diario: Diario | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  loading?: boolean;
}

export function DevolverDiarioModal({
  diario,
  open,
  onOpenChange,
  onSuccess,
  loading = false
}: DevolverDiarioModalProps) {
  const [motivo, setMotivo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleDevolver = async () => {
    if (!diario) return;

    try {
      setIsLoading(true);
      setError(null);

      // Chamar a função do serviço para devolver o diário
      const resultado = await supabaseService.devolverDiario(
        diario.id,
        1, // usuarioId (você pode pegar do contexto/localStorage)
        motivo || undefined
      );

      if (resultado) {
        setSuccess(true);
        
        // Fechar após 2 segundos
        setTimeout(() => {
          onOpenChange(false);
          setMotivo('');
          setSuccess(false);
          onSuccess?.();
        }, 2000);
      } else {
        setError('Erro ao devolver o diário. Tente novamente.');
      }
    } catch (err: any) {
      console.error('Erro ao devolver diário:', err);
      setError(err.message || 'Erro ao devolver o diário');
    } finally {
      setIsLoading(false);
    }
  };

  if (!open || !diario) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 border-b flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Devolver Diário</h2>
            <p className="text-sm text-gray-600">
              Tem certeza que deseja devolver este diário para o professor?
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 hover:bg-white rounded-full transition-colors text-gray-600 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* CONTEÚDO */}
        <div className="p-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mb-3" />
              <p className="text-lg font-semibold text-gray-900 mb-1">Diário devolvido com sucesso!</p>
              <p className="text-sm text-gray-600 text-center">
                O professor será notificado sobre a devolução.
              </p>
            </div>
          ) : (
            <>
              {/* Informações do Diário */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-semibold text-gray-900">{diario.nome}</span>
                </p>
                <p className="text-xs text-gray-500">
                  Status atual: <span className="font-semibold">{diario.status}</span>
                </p>
              </div>

              {/* Erro */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Campo de Motivo */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Observação (opcional)
                </label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Explique o motivo da devolução para o professor..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  rows={4}
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {motivo.length}/500 caracteres
                </p>
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        {!success && (
          <div className="border-t bg-gray-50 px-6 py-4 flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="px-6"
            >
              Cancelar
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white px-6"
              onClick={handleDevolver}
              disabled={isLoading}
            >
              {isLoading ? 'Devolvendo...' : 'Devolver Diário'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DevolverDiarioModal;
