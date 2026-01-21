import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
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
    conteudo: '',
    quantidade_aulas: '1',
    tipo_aula: 'Teórica',
    aula_assincrona: false,
    conteudo_detalhado: '',
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

      onOpenChange(false);

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

  return (
    <>
      <Button 
        onClick={() => onOpenChange(true)}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <Plus className="h-4 w-4 mr-2" />
        Nova Aula
      </Button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Aula</DialogTitle>
            <DialogDescription>Conteúdo Ministrado da Aula</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  onValueChange={(value) => setFormData({ ...formData, quantidade_aulas: value })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                  onValueChange={(value) => setFormData({ ...formData, tipo_aula: value })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                  onValueChange={(value) => setFormData({ ...formData, aula_assincrona: value === 'Sim' })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                onChange={(e) => setFormData({ ...formData, conteudo_detalhado: e.target.value })}
                rows={5}
              />
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                placeholder="Observações..."
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={4}
              />
            </div>

            <DialogFooter className="gap-3 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? 'Salvando...' : 'Salvar Aula'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {aulaCriada && (
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
