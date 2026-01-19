import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { supabaseService } from '../../../services/supabaseService';
import { MarcarPresencaModal } from './MarcarPresencaModal';
import type { Aula, Aluno } from '../../../services/supabaseService';

interface CriarAulaModalProps {
  diarioId: number;
  alunos: Aluno[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAulaCriada?: () => void;
}

export function CriarAulaModal({
  diarioId,
  alunos,
  open,
  onOpenChange,
  onAulaCriada
}: CriarAulaModalProps) {
  const [loading, setLoading] = useState(false);
  const [aulaCriada, setAulaCriada] = useState<Aula | null>(null);
  const [isMarcarPresencaOpen, setIsMarcarPresencaOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    horaInicio: '08:00',
    horaFim: '09:00',
    conteudo: '',
    observacoes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.conteudo.trim()) {
      alert('Preencha o título do conteúdo');
      return;
    }

    try {
      setLoading(true);

      // Criar aula
      const novaAula = await supabaseService.createAula({
        diario_id: diarioId,
        data: formData.data,
        hora_inicio: formData.horaInicio,
        hora_fim: formData.horaFim,
        conteudo: formData.conteudo,
        observacoes: formData.observacoes || null
      });

      setAulaCriada(novaAula);
      setFormData({
        data: new Date().toISOString().split('T')[0],
        horaInicio: '08:00',
        horaFim: '09:00',
        conteudo: '',
        observacoes: ''
      });

      // Mostrar opção de marcar presença
      setTimeout(() => {
        setIsMarcarPresencaOpen(true);
      }, 300);

      onAulaCriada?.();
    } catch (error) {
      console.error('Erro ao criar aula:', error);
      alert('Erro ao criar aula. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setAulaCriada(null);
    setIsMarcarPresencaOpen(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Nova Aula
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Aula</DialogTitle>
            <DialogDescription>
              Preencha os dados da aula que deseja registrar
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* DATA */}
            <div>
              <Label htmlFor="data">Data da Aula</Label>
              <Input
                id="data"
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                required
              />
            </div>

            {/* HORÁRIOS */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="horaInicio">Hora Início</Label>
                <Input
                  id="horaInicio"
                  type="time"
                  value={formData.horaInicio}
                  onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="horaFim">Hora Fim</Label>
                <Input
                  id="horaFim"
                  type="time"
                  value={formData.horaFim}
                  onChange={(e) => setFormData({ ...formData, horaFim: e.target.value })}
                />
              </div>
            </div>

            {/* CONTEÚDO */}
            <div>
              <Label htmlFor="conteudo">Título do Conteúdo</Label>
              <Input
                id="conteudo"
                placeholder="Ex: Introdução às Grandes Navegações"
                value={formData.conteudo}
                onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                required
              />
            </div>

            {/* OBSERVAÇÕES */}
            <div>
              <Label htmlFor="observacoes">Observações (opcional)</Label>
              <Textarea
                id="observacoes"
                placeholder="Descrição detalhada do conteúdo, habilidades, etc..."
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Salvando...' : 'Criar Aula'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Marcar Presença - aparece automaticamente após criar aula */}
      {aulaCriada && (
        <MarcarPresencaModal
          aula={aulaCriada}
          alunos={alunos}
          open={isMarcarPresencaOpen}
          onOpenChange={(isOpen) => {
            setIsMarcarPresencaOpen(isOpen);
            if (!isOpen) {
              handleCloseDialog();
            }
          }}
          onSave={() => {
            handleCloseDialog();
          }}
        />
      )}
    </>
  );
}

export default CriarAulaModal;
