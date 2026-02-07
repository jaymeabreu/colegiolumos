import { useState, useEffect } from 'react';
import { Plus, Calendar, Edit, Trash2, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { supabaseService } from '../../../services/supabaseService';
import type { Avaliacao } from '../../../services/supabaseService';

interface AvaliacoesTabProps {
  diarioId: number;
  readOnly?: boolean;
}

export function AvaliacoesTab({ diarioId, readOnly = false }: AvaliacoesTabProps) {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAvaliacao, setEditingAvaliacao] = useState<Avaliacao | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: '',
    data: '',
    peso: ''
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
      peso: avaliacao.peso.toString()
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ titulo: '', tipo: '', data: '', peso: '' });
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
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="flex items-center gap-2 bg-[#0e4a5e] hover:bg-[#0a3645]">
                  <Plus className="h-4 w-4" />
                  <span>Nova Avaliação</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg !z-[99999]">
                <DialogHeader>
                  <DialogTitle>{editingAvaliacao ? 'Editar Avaliação' : 'Nova Avaliação'}</DialogTitle>
                  <DialogDescription>
                    {editingAvaliacao ? 'Atualize os dados da avaliação' : 'Preencha os dados para criar uma nova avaliação'}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
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
                      <Label htmlFor="tipo">Tipo *</Label>
                      <select
                        id="tipo"
                        value={formData.tipo}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      >
                        <option value="">Selecione</option>
                        <option value="Prova">Prova</option>
                        <option value="Trabalho">Trabalho</option>
                        <option value="Seminário">Seminário</option>
                        <option value="Atividade">Atividade</option>
                        <option value="Projeto">Projeto</option>
                      </select>
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

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleClose}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-[#0e4a5e] hover:bg-[#0a3645]">
                      {editingAvaliacao ? 'Salvar Alterações' : 'Criar Avaliação'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
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
    </Card>
  );
}
