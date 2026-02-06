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
      {/* Botão de Gatilho (fica onde o componente for chamado) */}
      <Button 
        onClick={() => onOpenChange(true)}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <Plus className="h-4 w-4 mr-2" />
        {aulaEditando ? 'Editar Aula' : 'Nova Aula'}
      </Button>

      {/* PORTAL - RENDERIZA NO FINAL DO BODY */}
      {open && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden">
          {/* OVERLAY ESCURO - Cobre tudo inclusive sidebar */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={handleClose}
          />

          {/* CARD DO MODAL - Centralizado e flutuante */}
          <div 
            className="relative bg-white w-full max-w-2xl mx-4 rounded-xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {aulaEditando ? 'Editar Aula' : 'Nova Aula'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {aulaEditando ? 'Atualize os dados da aula' : 'Preencha os dados abaixo para registrar a aula'}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* CONTEÚDO COM SCROLL SE NECESSÁRIO */}
            <div className="flex-1 overflow-y-auto p-6">
              <form id="aula-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data">Data da aula</Label>
                    <Input
                      id="data"
                      type="date"
                      value={formData.data}
                      onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
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

                  <div className="space-y-2">
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

                  <div className="space-y-2">
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

                <div className="space-y-2">
                  <Label>Conteúdo detalhado</Label>
                  <Textarea
                    placeholder="Descrição detalhada..."
                    value={formData.conteudo_detalhado}
                    onChange={(e) => setFormData({ ...formData, conteudo_detalhado: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    placeholder="Observações..."
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    rows={3}
                  />
                </div>
              </form>
            </div>

            {/* FOOTER */}
            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50/50">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                className="px-6"
              >
                Cancelar
              </Button>
              <Button 
                form="aula-form"
                type="submit" 
                disabled={loading} 
                className="bg-[#0e4a5e] hover:bg-[#0a3645] text-white px-8"
              >
                {loading ? 'Salvando...' : aulaEditando ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Presença (Também deve usar portal internamente se necessário) */}
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
