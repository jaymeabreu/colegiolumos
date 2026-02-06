import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { supabaseService } from '../../../services/supabaseService';
import { MarcarPresencaModal } from './MarcarPresencaModal';
import type { Aula, Aluno } from '../../../services/supabaseService';

interface CriarAulaModalProps {
  diarioId: number;
  alunos: Aluno[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAulaCriada?: () => void;
  aulaEditando?: Aula | null;
}

interface AulaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  aulaEditando: Aula | null | undefined;
  formData: {
    data: string;
    conteudo: string;
    quantidade_aulas: string;
    tipo_aula: string;
    aula_assincrona: boolean;
    conteudo_detalhado: string;
    observacoes: string;
  };
  setFormData: (data: any) => void;
  loading: boolean;
}

// Componente Portal Modal
function AulaModalPortal({
  isOpen,
  onClose,
  onSubmit,
  aulaEditando,
  formData,
  setFormData,
  loading
}: AulaModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 z-[9998]"
      onClick={onClose}
    >
      <div
        className="fixed inset-0 w-screen h-screen bg-white z-[9999] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-white sticky top-0 z-50 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold">
              {aulaEditando ? 'Editar Aula' : 'Nova Aula'}
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              {aulaEditando ? 'Atualize os dados da aula' : 'Conteúdo Ministrado da Aula'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={onSubmit} className="space-y-6 max-w-3xl mx-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="data">Data da aula</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="conteudo">Título do conteúdo</Label>
                <Input
                  id="conteudo"
                  placeholder="Ex: As Grandes Navegações"
                  value={formData.conteudo}
                  onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Quantidade de aulas</Label>
                <Select
                  value={formData.quantidade_aulas}
                  onValueChange={(value) =>
                    setFormData({ ...formData, quantidade_aulas: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 aula</SelectItem>
                    <SelectItem value="2">2 aulas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tipo de aula</Label>
                <Select
                  value={formData.tipo_aula}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tipo_aula: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Teórica">Teórica</SelectItem>
                    <SelectItem value="Prática">Prática</SelectItem>
                    <SelectItem value="Teórica e Prática">Teórica e Prática</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Aula assíncrona</Label>
                <Select
                  value={formData.aula_assincrona ? 'Sim' : 'Não'}
                  onValueChange={(value) =>
                    setFormData({ ...formData, aula_assincrona: value === 'Sim' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Não">Não</SelectItem>
                    <SelectItem value="Sim">Sim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Conteúdo detalhado da aula</Label>
              <Textarea
                placeholder="Descrição detalhada..."
                value={formData.conteudo_detalhado}
                onChange={(e) =>
                  setFormData({ ...formData, conteudo_detalhado: e.target.value })
                }
                rows={5}
              />
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                placeholder="Observações..."
                value={formData.observacoes}
                onChange={(e) =>
                  setFormData({ ...formData, observacoes: e.target.value })
                }
                rows={4}
              />
            </div>

            <div className="h-4" />
          </form>
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end p-6 border-t bg-white sticky bottom-0 z-50 flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="min-w-24"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={onSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 min-w-24"
          >
            {loading ? 'Salvando...' : aulaEditando ? 'Atualizar Aula' : 'Salvar Aula'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function CriarAulaModal({
  diarioId,
  alunos,
  open,
  onOpenChange,
  onAulaCriada,
  aulaEditando
}: CriarAulaModalProps) {
  const [loading, setLoading] = useState(false);
  const [aulaCriada, setAulaCriada] = useState<Aula | null>(null);
  const [isMarcarPresencaOpen, setIsMarcarPresencaOpen] = useState(false);

  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    conteudo: '',
    quantidade_aulas: '1',
    tipo_aula: 'Teórica',
    aula_assincrona: false,
    conteudo_detalhado: '',
    observacoes: ''
  });

  // Carregar dados da aula quando estiver editando
  useEffect(() => {
    if (aulaEditando) {
      setFormData({
        data: aulaEditando.data || new Date().toISOString().split('T')[0],
        conteudo: aulaEditando.conteudo || '',
        quantidade_aulas: (aulaEditando.quantidade_aulas || 1).toString(),
        tipo_aula: aulaEditando.tipo_aula || 'Teórica',
        aula_assincrona: aulaEditando.aula_assincrona || false,
        conteudo_detalhado: aulaEditando.conteudo_detalhado || '',
        observacoes: aulaEditando.observacoes || ''
      });
    } else {
      setFormData({
        data: new Date().toISOString().split('T')[0],
        conteudo: '',
        quantidade_aulas: '1',
        tipo_aula: 'Teórica',
        aula_assincrona: false,
        conteudo_detalhado: '',
        observacoes: ''
      });
    }
  }, [aulaEditando, open]);

  // Controlar visibilidade do sidebar
  useEffect(() => {
    if (open) {
      const sidebarElement = document.querySelector('[data-sidebar="sidebar"]');
      const mainElement = document.querySelector('main');
      if (sidebarElement) {
        (sidebarElement as HTMLElement).style.display = 'none';
      }
      if (mainElement) {
        (mainElement as HTMLElement).style.display = 'none';
      }
      document.body.style.overflow = 'hidden';
    } else {
      const sidebarElement = document.querySelector('[data-sidebar="sidebar"]');
      const mainElement = document.querySelector('main');
      if (sidebarElement) {
        (sidebarElement as HTMLElement).style.display = '';
      }
      if (mainElement) {
        (mainElement as HTMLElement).style.display = '';
      }
      document.body.style.overflow = 'unset';
    }

    return () => {
      const sidebarElement = document.querySelector('[data-sidebar="sidebar"]');
      const mainElement = document.querySelector('main');
      if (sidebarElement) {
        (sidebarElement as HTMLElement).style.display = '';
      }
      if (mainElement) {
        (mainElement as HTMLElement).style.display = '';
      }
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.conteudo.trim()) {
      alert('Preencha o título do conteúdo');
      return;
    }

    try {
      setLoading(true);

      if (aulaEditando) {
        const aulaAtualizada = await supabaseService.updateAula(aulaEditando.id, {
          data: formData.data,
          conteudo: formData.conteudo,
          quantidade_aulas: parseInt(formData.quantidade_aulas),
          tipo_aula: formData.tipo_aula,
          aula_assincrona: formData.aula_assincrona,
          conteudo_detalhado: formData.conteudo_detalhado || undefined,
          observacoes: formData.observacoes || null
        });

        setAulaCriada(aulaAtualizada);
        alert('✅ Aula atualizada com sucesso!');
      } else {
        const novaAula = await supabaseService.createAula({
          diario_id: diarioId,
          data: formData.data,
          conteudo: formData.conteudo,
          quantidade_aulas: parseInt(formData.quantidade_aulas),
          tipo_aula: formData.tipo_aula,
          aula_assincrona: formData.aula_assincrona,
          conteudo_detalhado: formData.conteudo_detalhado || undefined,
          observacoes: formData.observacoes || null
        });

        setAulaCriada(novaAula);

        setFormData({
          data: new Date().toISOString().split('T')[0],
          conteudo: '',
          quantidade_aulas: '1',
          tipo_aula: 'Teórica',
          aula_assincrona: false,
          conteudo_detalhado: '',
          observacoes: ''
        });

        setTimeout(() => {
          setIsMarcarPresencaOpen(true);
        }, 300);
      }

      onOpenChange(false);
      onAulaCriada?.();
    } catch (error) {
      console.error('Erro ao salvar aula:', error);
      alert('Erro ao salvar aula. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <>
      <AulaModalPortal
        isOpen={open}
        onClose={handleClose}
        onSubmit={handleSubmit}
        aulaEditando={aulaEditando}
        formData={formData}
        setFormData={setFormData}
        loading={loading}
      />

      <Button
        onClick={() => onOpenChange(true)}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <Plus className="h-4 w-4 mr-2" />
        Nova Aula
      </Button>

      {aulaCriada && !aulaEditando && (
        <MarcarPresencaModal
          aula={aulaCriada}
          alunos={alunos}
          open={isMarcarPresencaOpen}
          onOpenChange={setIsMarcarPresencaOpen}
          onSave={() => setIsMarcarPresencaOpen(false)}
        />
      )}
    </>
  );
}
