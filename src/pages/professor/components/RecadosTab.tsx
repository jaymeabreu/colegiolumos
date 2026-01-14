import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MessageSquare, Calendar, Users, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { supabaseService } from '../../../services/supabaseService';
import type { Recado, Turma, Aluno } from '../../../services/supabaseService';
import { authService } from '../../../services/auth';

export function RecadosTab() {
  const [recados, setRecados] = useState<Recado[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecado, setEditingRecado] = useState<Recado | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    titulo: '',
    mensagem: '',
    turmaId: '',
    alunoId: ''
  });

  const { user } = authService.getAuthState();

  useEffect(() => {
    loadData();
  }, [user?.professorId]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (user?.professorId) {
        const recadosData = await supabaseService.getRecadosByProfessor(user.professorId);
        setRecados((recadosData || []).sort(
          (a, b) =>
            new Date(b.dataEnvio || b.data_envio || '').getTime() -
            new Date(a.dataEnvio || a.data_envio || '').getTime()
        ));
      }

      const turmasData = await supabaseService.getTurmas();
      setTurmas(turmasData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAlunosByTurma = async (turmaId: string) => {
    if (turmaId) {
      try {
        const alunosData = await supabaseService.getAlunosByTurma(parseInt(turmaId));
        setAlunos(alunosData || []);
      } catch (error) {
        console.error('Erro ao carregar alunos:', error);
        setAlunos([]);
      }
    } else {
      setAlunos([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo.trim() || !formData.mensagem.trim() || !formData.turmaId) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      const turma = (turmas || []).find(t => t.id === parseInt(formData.turmaId));
      const aluno = formData.alunoId
        ? (alunos || []).find(a => a.id === parseInt(formData.alunoId))
        : null;

      if (editingRecado) {
        const updatedRecado = await supabaseService.updateRecado(editingRecado.id, {
          titulo: formData.titulo.trim(),
          mensagem: formData.mensagem.trim(),
          turmaId: parseInt(formData.turmaId),
          turmaNome: turma?.nome || '',
          alunoId: formData.alunoId ? parseInt(formData.alunoId) : undefined,
          alunoNome: aluno?.nome || undefined
        });

        if (updatedRecado) {
          setRecados(prev =>
            prev.map(r => (r.id === updatedRecado.id ? updatedRecado : r))
          );
        }
      } else {
        const novoRecado = await supabaseService.createRecado({
          titulo: formData.titulo.trim(),
          mensagem: formData.mensagem.trim(),
          professorId: user?.professorId || 1,
          professorNome: user?.nome || 'Professor',
          turmaId: parseInt(formData.turmaId),
          turmaNome: turma?.nome || '',
          alunoId: formData.alunoId ? parseInt(formData.alunoId) : undefined,
          alunoNome: aluno?.nome || undefined,
          dataEnvio: new Date().toISOString().split('T')[0]
        });

        if (novoRecado) {
          setRecados(prev => [novoRecado, ...prev]);
        }
      }

      handleCloseDialog();
      await loadData();
    } catch (error) {
      console.error('Erro ao salvar recado:', error);
      alert('Erro ao salvar recado. Tente novamente.');
    }
  };

  const handleEdit = (recado: Recado) => {
    setEditingRecado(recado);
    setFormData({
      titulo: recado.titulo,
      mensagem: recado.mensagem,
      turmaId: (recado.turmaId || recado.turma_id).toString(),
      alunoId: (recado.alunoId || recado.aluno_id)?.toString() || ''
    });

    loadAlunosByTurma((recado.turmaId || recado.turma_id).toString());
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este recado?')) {
      try {
        const success = await supabaseService.deleteRecado(id);

        if (success) {
          setRecados(prev => prev.filter(r => r.id !== id));
          await loadData();
        }
      } catch (error) {
        console.error('Erro ao excluir recado:', error);
        alert('Erro ao excluir recado. Tente novamente.');
      }
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRecado(null);
    setFormData({
      titulo: '',
      mensagem: '',
      turmaId: '',
      alunoId: ''
    });
    setAlunos([]);
  };

  const handleTurmaChange = (value: string) => {
    setFormData(prev => ({ ...prev, turmaId: value, alunoId: '' }));
    loadAlunosByTurma(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <CardTitle>Recados</CardTitle>
            <CardDescription>
              Envie recados individuais ou para toda a turma
            </CardDescription>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCloseDialog} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span className="sm:hidden">Novo</span>
                <span className="hidden sm:inline">Novo Recado</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] lg:max-w-[800px] max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingRecado ? 'Editar Recado' : 'Novo Recado'}
                </DialogTitle>
                <DialogDescription>
                  {editingRecado
                    ? 'Edite as informações do recado abaixo.'
                    : 'Crie um novo recado para uma turma ou aluno específico.'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, titulo: e.target.value }))
                    }
                    placeholder="Digite o título do recado"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="turma">Turma *</Label>
                  <Select
                    value={formData.turmaId}
                    onValueChange={handleTurmaChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma turma" />
                    </SelectTrigger>
                    <SelectContent>
                      {(turmas || []).map(turma => (
                        <SelectItem key={turma.id} value={turma.id.toString()}>
                          {turma.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.turmaId && (
                  <div className="space-y-2">
                    <Label htmlFor="aluno">Aluno (Opcional)</Label>
                    <Select
                      value={formData.alunoId}
                      onValueChange={value =>
                        setFormData(prev => ({ ...prev, alunoId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Deixe vazio para toda a turma" />
                      </SelectTrigger>
                      <SelectContent>
                        {(alunos || []).map(aluno => (
                          <SelectItem
                            key={aluno.id}
                            value={aluno.id.toString()}
                          >
                            {aluno.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Deixe vazio para enviar para toda a turma
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="mensagem">Mensagem *</Label>
                  <Textarea
                    id="mensagem"
                    value={formData.mensagem}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        mensagem: e.target.value
                      }))
                    }
                    placeholder="Digite a mensagem do recado"
                    rows={6}
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingRecado
                      ? 'Salvar Alterações'
                      : 'Enviar Recado'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando recados...</p>
            </div>
          </div>
        ) : (recados || []).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 opacity-60" />
            </div>
            <p className="font-medium mb-1">Nenhum recado encontrado</p>
            <p className="text-sm">
              Crie o primeiro recado para suas turmas ou alunos.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {(recados || []).map(recado => (
              <div
                key={recado.id}
                className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <h3 className="font-medium">{recado.titulo}</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 text-base text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(recado.dataEnvio || recado.data_envio || '')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {recado.turmaNome || recado.turma_nome}
                    </span>
                    {(recado.alunoNome || recado.aluno_nome) && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {recado.alunoNome || recado.aluno_nome}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(recado)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(recado.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
