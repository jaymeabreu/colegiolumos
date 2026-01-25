import { useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { supabaseService } from '../../../services/supabaseService';
import type { Diario } from '../../../services/supabaseService';

interface DevolverDiarioModalProps {
  diario: Diario | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void | Promise<void>;
}

export function DevolverDiarioModal({
  diario,
  open,
  onOpenChange,
  onSuccess
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

      const resultado = await supabaseService.devolverDiario(
        diario.id,
        1,
        motivo || undefined
      );

      if (resultado) {
        // Chamar callback para recarregar dados
        if (onSuccess) {
          const result = onSuccess();
          if (result instanceof Promise) {
            await result;
          }
        }

        setSuccess(true);
        
        // Fechar modal após 1 segundo
        setTimeout(() => {
          onOpenChange(false);
          setMotivo('');
          setSuccess(false);
          setError(null);
          setIsLoading(false);
        }, 1000);

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

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !success) {
      // Resetar ao fechar
      setMotivo('');
      setError(null);
      setSuccess(false);
      setIsLoading(false);
    }
    onOpenChange(newOpen);
  };

  if (!diario) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Devolver Diário</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja devolver este diário para o professor?
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-12 w-12 text-green-600 mb-3 animate-bounce" />
            <p className="text-base font-semibold text-gray-900 mb-1">Sucesso!</p>
            <p className="text-sm text-gray-600 text-center">
              O diário foi devolvido com sucesso.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Info do Diário */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Diário:</span> {diario.nome}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Status: {diario.status}
              </p>
            </div>

            {/* Erro */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Campo de Motivo */}
            <div className="space-y-2">
              <Label htmlFor="motivo">Observação (opcional)</Label>
              <Textarea
                id="motivo"
                name="motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value.slice(0, 500))}
                placeholder="Explique o motivo da devolução para o professor..."
                disabled={isLoading}
                className="resize-none h-32 !bg-white !text-gray-900"
              />
              <p className="text-xs text-gray-500 text-right">
                {motivo.length}/500
              </p>
            </div>
          </div>
        )}

        {!success && (
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setMotivo('');
                setError(null);
                setSuccess(false);
                setIsLoading(false);
                onOpenChange(false);
              }}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleDevolver}
              disabled={isLoading}
              className="bg-[#1e4e5f] hover:bg-[#153a47]"
            >
              {isLoading ? 'Devolvendo...' : 'Devolver Diário'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default DevolverDiarioModal;
