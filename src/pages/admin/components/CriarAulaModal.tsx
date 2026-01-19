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
    horaInicio: '08:00',
    horaFim: '09:00',
    conteudo: '',
    quantidadeAulas: '1',
    tipoAula: 'Teórica',
    aulaAssíncrona: 'Não',
    conteudoDetalhado: '',
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
        quantidadeAulas: '1',
        tipoAula: 'Teórica',
        aulaAssíncrona: 'Não',
        conteudoDetalhado: '',
        observacoes: ''
      });

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
      {/* BOTÃO */}
      <Button 
        onClick={() => onOpenChange(true)}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <Plus className="h-4 w-4 mr-2" />
        Nova Aula
      </Button>

      {/* DIALOG */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Aula</DialogTitle>
            <DialogDescription>
              Conteúdo Ministrado da Aula
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* LINHA 1: DATA E TÍTULO */}
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

            {/* LINHA 2: HORÁRIOS */}
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

            {/* LINHA 3: QUANTIDADE, TIPO E ASSÍNCRONA */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="quantidadeAulas">Quantidade de aulas</Label>
                <Select 
                  value={formData.quantidadeAulas}
                  onValueChange={(value) => setFormData({ ...formData, quantidadeAulas: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 aula</SelectItem>
                    <SelectItem value="2">2 aulas</SelectItem>
                    <SelectItem value="3">3 aulas</SelectItem>
                    <SelectItem value="4">4 aulas</SelectItem>
                    <SelectItem value="5">5 aulas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tipoAula">Tipo de aula</Label>
                <Select 
                  value={formData.tipoAula}
                  onValueChange={(value) => setFormData({ ...formData, tipoAula: value })}
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
                <Label htmlFor="aulaAssíncrona">Aula assíncrona</Label>
                <Select 
                  value={formData.aulaAssíncrona}
                  onValueChange={(value) => setFormData({ ...formData, aulaAssíncrona: value })}
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

            {/* CONTEÚDO DETALHADO */}
            <div>
              <Label htmlFor="conteudoDetalhado">Conteúdo detalhado da aula</Label>
              <Textarea
                id="conteudoDetalhado"
                placeholder="Descrição detalhada do conteúdo ministrado na aula. Ex: Introdução às Grandes Navegações - contexto histórico, causas econômicas e tecnológicas, principais navegadores portugueses e espanhóis, descobrimento do Brasil..."
                value={formData.conteudoDetalhado}
                onChange={(e) => setFormData({ ...formData, conteudoDetalhado: e.target.value })}
                rows={4}
              />
            </div>

            {/* OBSERVAÇÕES */}
            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Observações adicionais sobre a aula, comportamento da turma, dificuldades encontradas, etc..."
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
                {loading ? 'Salvando...' : 'Salvar Aula'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Marcar Presença */}
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
