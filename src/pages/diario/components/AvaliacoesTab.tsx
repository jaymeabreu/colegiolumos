import { useState, useEffect } from 'react';
import { Plus, Calendar, Edit, Trash2, GraduationCap } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
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

  const loadNotasAvaliacao = async (avaliacaoId: number) => {
    try {
      const notasData = await supabaseService.getNotasByAvaliacao(avaliacaoId);
      const notasMap: { [alunoId: number]: string } = {};

      (alunos || []).forEach(aluno => {
        const nota = (notasData || []).find(n => (n.alunoId || n.avaliacaoId) === aluno.id);
        notasMap[aluno.id] = nota ? nota.valor.toString() : '';
      });

      setNotas(notasMap);
    } catch (error) {
      console.error('Erro ao carregar notas:', error);
    }
  };

  const filteredAvaliacoes = (avaliacoes || []).filter(avaliacao =>
    (avaliacao.titulo?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
    (avaliacao.tipo?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
    }
  };

  const handleSaveNotas = async () => {
    if (!selectedAvaliacao) return;

    try {
      const notasToSave = (alunos || [])
        .filter(aluno => notas[aluno.id] && notas[aluno.id].trim() !== '')
        .map(aluno => ({
          avaliacaoId: selectedAvaliacao.id,
          alunoId: aluno.id,
          valor: parseFloat(notas[aluno.id])
        }));

      await supabaseService.saveNotas(notasToSave);
      setIsNotasDialogOpen(false);
      setSelectedAvaliacao(null);
      setNotas({});
    } catch (error) {
      console.error('Erro ao salvar notas:', error);
    }
  };

  const handleEdit = (avaliacao: Avaliacao) => {
    setEditingAvaliacao(avaliacao);
    setFormData({
      titulo: avaliacao.titulo,
      tipo: avaliacao.tipo,
      data: avaliacao.data,
      peso: avaliacao.peso?.toString() || '',
      descricao: ''
    });
    setIsDialogOpen(true);
  };

  const handleEditNotas = async (avaliacao: Avaliacao) => {
    setSelectedAvaliacao(avaliacao);
    await loadNotasAvaliacao(avaliacao.id);
    setIsNotasDialogOpen(true);
  };

  const handleDelete = async (avaliacaoId: number) => {
    if (confirm('Tem certeza que deseja excluir esta avaliação?')) {
      try {
        await supabaseService.deleteAvaliacao(avaliacaoId);
        await loadAvaliacoes();
      } catch (error) {
        console.error('Erro ao excluir avaliação:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      tipo: '',
      data: '',
      peso: '',
      descricao: ''
    });
    setEditingAvaliacao(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleNotasDialogClose = () => {
    setIsNotasDialogOpen(false);
    setSelectedAvaliacao(null);
    setNotas({});
  };

  const getTipoBadgeVariant = (tipo: string) => {
    switch (tipo?.toLowerCase()) {
      case 'prova':
        return 'destructive';
      case 'trabalho':
        return 'default';
      case 'seminário':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getNotasCount = async (avaliacaoId: number) => {
    try {
      const notasData = await supabaseService.getNotasByAvaliacao(avaliacaoId);
      return (notasData || []).length;
    } catch {
      return 0;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <CardTitle>Avaliações</CardTitle>
            <CardDescription>
              Gerencie as avaliações e notas dos alunos
            </CardDescription>
          </div>
          {!readOnly && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="sm:hidden">Nova</span>
                  <span className="hidden sm:inline">Nova Avaliação</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] lg:max-w-[800px] max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingAvaliacao ? 'Editar Avaliação' : 'Nova Avaliação'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="titulo">Título</Label>
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
                      <Label htmlFor="tipo">Tipo</Label>
                      <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Prova">Prova</SelectItem>
                          <SelectItem value="Trabalho">Trabalho</SelectItem>
                          <SelectItem value="Seminário">Seminário</SelectItem>
                          <SelectItem value="Exercício">Exercício</SelectItem>
                          <SelectItem value="Projeto">Projeto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="peso">Peso</Label>
                      <Input
                        id="peso"
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={formData.peso}
                        onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                        placeholder="1.0"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data">Data</Label>
                    <Input
                      id="data"
                      type="date"
                      value={formData.data}
                      onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={handleDialogClose}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingAvaliacao ? 'Salvar' : 'Criar'}
                    </Button>
                  </div>
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
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">{avaliacao.titulo}</h3>
                  <Badge variant={getTipoBadgeVariant(avaliacao.tipo)}>
                    {avaliacao.tipo}
                  </Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(avaliacao.data).toLocaleDateString('pt-BR')}
                  </span>
                  <span>Peso: {avaliacao.peso}</span>
                </div>
              </div>
              {!readOnly && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditNotas(avaliacao)}
                    className="inline-flex items-center gap-1 whitespace-nowrap"
                  >
                    <GraduationCap className="h-4 w-4" />
                    Nota
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(avaliacao)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(avaliacao.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
          {filteredAvaliacoes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Nenhuma avaliação encontrada.' : 'Nenhuma avaliação cadastrada.'}
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={isNotasDialogOpen} onOpenChange={setIsNotasDialogOpen}>
        <DialogContent className="max-w-[95vw] lg:max-w-[800px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Notas - {selectedAvaliacao?.titulo}</DialogTitle>
            <p className="text-sm text-gray-600">
              Peso: {selectedAvaliacao?.peso}
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4">
              {(alunos || []).map((aluno) => (
                <div key={aluno.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{aluno.nome}</p>
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      placeholder="0.0"
                      value={notas[aluno.id] || ''}
                      onChange={(e) => setNotas({ ...notas, [aluno.id]: e.target.value })}
                      className="text-center"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleNotasDialogClose}>
                Cancelar
              </Button>
              <Button onClick={handleSaveNotas}>
                Salvar Notas
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
