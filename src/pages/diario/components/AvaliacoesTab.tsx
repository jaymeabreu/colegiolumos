import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Calendar, Edit, Trash2, GraduationCap, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { supabaseService } from '../../../services/supabaseService';
import type { Avaliacao, Aluno, Nota } from '../../../services/supabaseService';

interface AvaliacoesTabProps {
  diarioId: number;
  readOnly?: boolean;
}

export function AvaliacoesTab({ diarioId, readOnly = false }: AvaliacoesTabProps) {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNotasDialogOpen, setIsNotasDialogOpen] = useState(false);
  const [editingAvaliacao, setEditingAvaliacao] = useState<Avaliacao | null>(null);
  const [selectedAvaliacao, setSelectedAvaliacao] = useState<Avaliacao | null>(null);
  const [notas, setNotas] = useState<{ [alunoId: number]: string }>({});
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: '',
    data: '',
    peso: '',
    descricao: ''
  });

  useEffect(() => {
    loadAvaliacoes();
    loadAlunos();
  }, [diarioId]);

  const loadAvaliacoes = async () => {
    try {
      const avaliacoesData = await supabaseService.getAvaliacoesByDiario(diarioId);
      setAvaliacoes(avaliacoesData || []);
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
      setAvaliacoes([]);
    }
  };

  const loadAlunos = async () => {
    try {
      const alunosData = await supabaseService.getAlunosByDiario(diarioId);
      setAlunos(alunosData || []);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
      setAlunos([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.tipo || !formData.data || !formData.peso) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      if (editingAvaliacao) {
        await supabaseService.updateAvaliacao(editingAvaliacao.id, {
          titulo: formData.titulo,
          tipo: formData.tipo,
          data: formData.data,
          peso: parseFloat(formData.peso)
        });
      } else {
        await supabaseService.createAvaliacao({
          titulo: formData.titulo,
          tipo: formData.tipo,
          data: formData.data,
          peso: parseFloat(formData.peso),
          diarioId
        });
      }
      await loadAvaliacoes();
      setIsDialogOpen(false);
      resetForm();
      alert('Avaliação salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      alert('Erro ao salvar avaliação');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta avaliação?')) return;
    
    try {
      await supabaseService.deleteAvaliacao(id);
      await loadAvaliacoes();
      alert('Avaliação excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir avaliação:', error);
      alert('Erro ao excluir avaliação');
    }
  };

  const handleEdit = (avaliacao: Avaliacao) => {
    setEditingAvaliacao(avaliacao);
    setFormData({
      titulo: avaliacao.titulo,
      tipo: avaliacao.tipo,
      data: avaliacao.data,
      peso: avaliacao.peso.toString(),
      descricao: ''
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ titulo: '', tipo: '', data: '', peso: '', descricao: '' });
    setEditingAvaliacao(null);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const filteredAvaliacoes = avaliacoes.filter(av =>
    av.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    av.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <CardTitle>Avaliações</CardTitle>
            <CardDescription>Gerencie as avaliações e notas dos alunos</CardDescription>
          </div>
          {!readOnly && (
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="flex items-center gap-2 bg-[#0e4a5e] hover:bg-[#0a3645]">
              <Plus className="h-4 w-4" />
              <span>Nova Avaliação</span>
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Buscar avaliações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          {filteredAvaliacoes.map((avaliacao) => (
            <div key={avaliacao.id} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 border rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium">{avaliacao.titulo}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600">
                  <Badge variant="outline">{avaliacao.tipo}</Badge>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(avaliacao.data).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="text-blue-600 font-medium">Peso: {avaliacao.peso}</span>
                </div>
              </div>
              {!readOnly && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(avaliacao)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(avaliacao.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}

          {filteredAvaliacoes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma avaliação cadastrada.
            </div>
          )}
        </div>
      </CardContent>

      {/* MODAL DE AVALIAÇÃO */}
      {isDialogOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">{editingAvaliacao ? 'Editar Avaliação' : 'Nova Avaliação'}</h2>
              <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input 
                  id="titulo" 
                  value={formData.titulo} 
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} 
                  placeholder="Ex: Prova Bimestral" 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select 
                    value={formData.tipo} 
                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Prova">Prova</SelectItem>
                      <SelectItem value="Trabalho">Trabalho</SelectItem>
                      <SelectItem value="Seminário">Seminário</SelectItem>
                      <SelectItem value="Atividade">Atividade</SelectItem>
                      <SelectItem value="Projeto">Projeto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="peso">Peso *</Label>
                  <Input 
                    id="peso" 
                    type="number" 
                    step="0.1" 
                    min="0"
                    value={formData.peso} 
                    onChange={(e) => setFormData({ ...formData, peso: e.target.value })} 
                    placeholder="1.0" 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data">Data *</Label>
                <Input 
                  id="data" 
                  type="date" 
                  value={formData.data} 
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })} 
                  required 
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#0e4a5e] hover:bg-[#0a3645]">
                  {editingAvaliacao ? 'Salvar Alterações' : 'Criar Avaliação'}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </Card>
  );
}
