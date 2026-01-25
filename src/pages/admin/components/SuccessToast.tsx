import { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface SuccessToastProps {
  message: string;
  description?: string;
  open: boolean;
  onClose: () => void;
  autoCloseDelay?: number;
}

export function SuccessToast({
  message,
  description,
  open,
  onClose,
  autoCloseDelay = 3000
}: SuccessToastProps) {
  
  useEffect(() => {
    if (open && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      
      return () => clearTimeout(timer);
    }
  }, [open, autoCloseDelay, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[80] backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden border border-gray-200 animate-in zoom-in-95 fade-in duration-200">
        <div className="p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{message}</h3>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
          <button
            onClick={onClose}
            className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export default SuccessToast;
