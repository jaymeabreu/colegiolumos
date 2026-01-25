import { useState } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { supabaseService } from '../../../services/supabaseService';
import type { Diario } from '../../../services/supabaseService';

interface DevolverDiarioModalProps {
  diario: Diario | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void | Promise<void>;
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

      // Devolver no banco de dados
      const resultado = await supabaseService.devolverDiario(
        diario.id,
        1,
        motivo || undefined
      );

      if (resultado) {
        // Sucesso - chamar callback
        if (onSuccess) {
          const res = onSuccess();
          if (res instanceof Promise) await res;
        }

        // Mostrar sucesso brevemente
        setSuccess(true);
        
        // Fechar modal após 500ms
        setTimeout(() => {
          setMotivo('');
          setSuccess(false);
          setError(null);
          setIsLoading(false);
          onOpenChange(false);
        }, 500);

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

  if (!open || !diario) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        
        {/* HEADER */}
        <div className="border-b px-6 py-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Devolver Diário</h2>
            <p className="text-sm text-gray-600 mt-1">
              Tem certeza que deseja devolver este diário para o professor?
            </p>
          </div>
          <button
            onClick={() => {
              setMotivo('');
              setError(null);
              setSuccess(false);
              setIsLoading(false);
              onOpenChange(false);
            }}
            disabled={isLoading || success}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* CONTEÚDO */}
        <div className="px-6 py-4 min-h-[280px]">
          {success ? (
            <div className="flex flex-col items-center justify-center h-full">
              <CheckCircle className="h-12 w-12 text-green-600 mb-3 animate-pulse" />
              <p className="text-base font-semibold text-gray-900">Diário devolvido com sucesso!</p>
              <p className="text-sm text-gray-500 mt-2">Fechando...</p>
            </div>
          ) : (
            <>
              {/* Info do Diário */}
              <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                <p className="text-sm text-gray-600">
                  Diário: <span className="font-bold text-gray-900">{diario.nome}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Status atual: {diario.status}
                </p>
              </div>

              {/* Erro */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex gap-2 text-red-700 text-sm">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Campo de Motivo */}
              <div>
                <label htmlFor="motivo" className="block text-sm font-semibold text-gray-700 mb-2">
                  Observação (opcional)
                </label>
                <textarea
                  id="motivo"
                  name="motivo"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value.slice(0, 500))}
                  placeholder="Explique o motivo da devolução para o professor..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-28 text-gray-900"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {motivo.length}/500
                </p>
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        {!success && (
          <div className="border-t bg-gray-50 px-6 py-3 flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setMotivo('');
                setError(null);
                setSuccess(false);
                setIsLoading(false);
                onOpenChange(false);
              }}
              disabled={isLoading}
              size="sm"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDevolver}
              disabled={isLoading}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
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
