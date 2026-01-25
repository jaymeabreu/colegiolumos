import { useState, useEffect } from 'react';
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

  // Limpar estados quando modal fecha
  useEffect(() => {
    if (!open) {
      setMotivo('');
      setError(null);
      setSuccess(false);
      setIsLoading(false);
    }
  }, [open]);

  // Função simplificada para fechar a modal
  const closeModal = () => {
    onOpenChange(false);
  };

  const handleDevolver = async () => {
    if (!diario) return;

    try {
      setIsLoading(true);
      setError(null);

      // Executa a devolução
      const resultado = await supabaseService.devolverDiario(
        diario.id,
        1,
        motivo || undefined
      );

      if (resultado) {
        // 1. Marca como sucesso para mostrar o feedback visual
        setSuccess(true);
        
        // 2. Chama o callback de sucesso imediatamente (para atualizar a lista no fundo)
        if (onSuccess) {
          try {
            const result = onSuccess();
            if (result instanceof Promise) {
              await result;
            }
          } catch (e) {
            console.error("Erro no callback onSuccess:", e);
          }
        }
        
        // 3. FECHAMENTO GARANTIDO: 
        // Esperamos um tempo curto para o usuário ver o "check" verde e fechamos.
        setTimeout(() => {
          closeModal();
        }, 800); // Reduzi para 800ms para ser mais rápido

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

  // Se não estiver aberto ou não tiver diário, não renderiza nada
  if (!open || !diario) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] backdrop-blur-sm p-4"
      onClick={(e) => {
        // Fecha ao clicar fora da modal (opcional, mas ajuda na UX)
        if (e.target === e.currentTarget && !isLoading && !success) closeModal();
      }}
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 border-b flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Devolver Diário</h2>
            <p className="text-sm text-gray-600">
              Tem certeza que deseja devolver este diário para o professor?
            </p>
          </div>
          <button
            onClick={closeModal}
            disabled={isLoading || success}
            type="button"
            className="p-1 hover:bg-white rounded-full transition-colors text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* CONTEÚDO */}
        <div className="p-6 min-h-[300px] flex flex-col">
          {success ? (
            <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
              <CheckCircle className="h-16 w-16 text-green-600 mb-4 animate-bounce" />
              <p className="text-lg font-bold text-gray-900 mb-1">Sucesso!</p>
              <p className="text-sm text-gray-600 text-center">
                O diário foi devolvido e a janela fechará em instantes.
              </p>
            </div>
          ) : (
            <>
              {/* Informações do Diário */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-sm text-gray-600 mb-1">
                  Diário: <span className="font-semibold text-gray-900">{diario.nome}</span>
                </p>
                <p className="text-xs text-gray-500">
                  Status: <span className="font-medium">{diario.status}</span>
                </p>
              </div>

              {/* Erro */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 animate-in slide-in-from-top-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Campo de Motivo */}
              <div className="flex-1">
                <label htmlFor="motivo" className="block text-sm font-semibold text-gray-700 mb-2">
                  Observação (opcional)
                </label>
                <textarea
                  id="motivo"
                  name="motivo"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value.slice(0, 500))}
                  placeholder="Explique o motivo da devolução..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none h-32 transition-all"
                  disabled={isLoading}
                />
                <div className="flex justify-end mt-1">
                  <span className={`text-[10px] ${motivo.length >= 500 ? 'text-red-500' : 'text-gray-400'}`}>
                    {motivo.length}/500
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        {!success && (
          <div className="border-t bg-gray-50 px-6 py-4 flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              disabled={isLoading}
              className="px-6"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 min-w-[140px]"
              onClick={handleDevolver}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Devolvendo...</span>
                </div>
              ) : 'Devolver Diário'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DevolverDiarioModal;
