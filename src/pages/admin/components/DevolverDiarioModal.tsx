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

  const closeModal = () => {
    // Chamada direta para fechar a modal no componente pai
    onOpenChange(false);
  };

  const handleDevolver = async () => {
    if (!diario) return;

    try {
      setIsLoading(true);
      setError(null);

      // 1. Tenta realizar a operação no banco de dados
      const resultado = await supabaseService.devolverDiario(
        diario.id,
        1,
        motivo || undefined
      );

      if (resultado) {
        // 2. Se deu certo, chamamos o onSuccess imediatamente
        if (onSuccess) {
          try {
            const res = onSuccess();
            if (res instanceof Promise) await res;
          } catch (e) {
            console.error("Erro no onSuccess:", e);
          }
        }

        // 3. FEEDBACK E FECHAMENTO IMEDIATO
        // Mostramos o sucesso por apenas meio segundo e fechamos
        setSuccess(true);
        setTimeout(() => {
          closeModal();
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden border border-gray-200">
        
        {/* HEADER */}
        <div className="bg-white p-6 border-b flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Devolver Diário</h2>
            <p className="text-sm text-gray-600">
              Tem certeza que deseja devolver este diário para o professor?
            </p>
          </div>
          <button
            onClick={closeModal}
            disabled={isLoading || success}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* CONTEÚDO */}
        <div className="p-6 min-h-[280px] flex flex-col bg-white">
          {success ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <CheckCircle className="h-16 w-16 text-green-600 mb-4 animate-bounce" />
              <p className="text-lg font-bold text-gray-900">Sucesso!</p>
              <p className="text-sm text-gray-500">Fechando janela...</p>
            </div>
          ) : (
            <>
              {/* Info do Diário */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-sm text-gray-700">
                  Diário: <span className="font-bold text-gray-900">{diario.nome}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Status: {diario.status}
                </p>
              </div>

              {/* Erro */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 text-red-700 text-sm">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {/* Campo de Motivo - FORÇADO BRANCO */}
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Observação (opcional)
                </label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Explique o motivo da devolução..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none !bg-white !text-gray-900 placeholder:text-gray-400"
                  style={{ backgroundColor: 'white', color: '#111827' }}
                  disabled={isLoading}
                />
                <p className="text-[10px] text-gray-400 mt-1 text-right">
                  {motivo.length}/500
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
              onClick={closeModal}
              disabled={isLoading}
              className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
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
