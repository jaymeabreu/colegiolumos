import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MessageSquare, Calendar, Users, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { mockDataService, Recado, Turma, Aluno } from '../../../services/mockData';
import { authService } from '../../../services/auth';

export function RecadosTab() {
  const [recados, setRecados] = useState<Recado[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecado, setEditingRecado] = useState<Recado | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    
    const handleDataUpdate = () => {
      console.log('Evento de atualização de dados recebido');
      loadData();
    };

    const handleRecadoCreated = (event: CustomEvent) => {
      console.log('Evento de recado criado recebido:', event.detail);
      if (event.detail.professorId === user?.professorId) {
        loadData();
      }
    };

    const handleRecadoUpdated = (event: CustomEvent) => {
      console.log('Evento de recado atualizado recebido:', event.detail);
      if (event.detail.professorId === user?.professorId) {
        loadData();
      }
    };

    const handleRecadoDeleted = (event: CustomEvent) => {
      console.log('Evento de recado excluído recebido:', event.detail);
      loadData();
    };

    window.addEventListener('dataUpdated', handleDataUpdate);
    window.addEventListener('recadoCreated', handleRecadoCreated as EventListener);
    window.addEventListener('recadoUpdated', handleRecadoUpdated as EventListener);
    window.addEventListener('recadoDeleted', handleRecadoDeleted as EventListener);

    return () => {
      window.removeEventListener('dataUpdated', handleDataUpdate);
      window.removeEventListener('recadoCreated', handleRecadoCreated as EventListener);
      window.removeEventListener('recadoUpdated', handleRecadoUpdated as EventListener);
      window.removeEventListener('recadoDeleted', handleRecadoDeleted as EventListener);
    };
  }, [user?.professorId]);

  const loadData = async () => {
    try {
      console.log('Carregando dados dos recados...');
      setLoading(true);
      
      if (user?.professorId) {
        const recadosData = supabaseService.getRecadosByProfessor(user.professorId);
        console.log('Recados carregados:', recadosData);
        setRecados(
          recadosData.sort(
            (a, b) =>
              new Date(b.dataEnvio).getTime() -
              new Date(a.dataEnvio).getTime()
          )
        );
      }
      
      const turmasData = supabaseService.getTurmas();
      console.log('Turmas carregadas:', turmasData);
      setTurmas(turmasData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAlunosByTurma = (turmaId: string) => {
    if (turmaId) {
      const alunosData = supabaseService.getAlunosByTurma(parseInt(turmaId));
      console.log('Alunos da turma carregados:', alunosData);
      setAlunos(alunosData);
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

    setIsSubmitting(true);

    try {
      const turma = turmas.find(t => t.id === parseInt(formData.turmaId));
      const aluno = formData.alunoId
        ? alunos.find(a => a.id === parseInt(formData.alunoId))
        : null;

      console.log('Dados do formulário:', {
        titulo: formData.titulo,
        mensagem: formData.mensagem,
        turmaId: formData.turmaId,
        alunoId: formData.alunoId,
        turma,
        aluno,
        professorId: user?.professorId
      });

      if (editingRecado) {
        console.log('Editando recado:', editingRecado.id);
        const updatedRecado = supabaseService.updateRecado(editingRecado.id, {
          titulo: formData.titulo.trim(),
          mensagem: formData.mensagem.trim(),
          turmaId: parseInt(formData.turmaId),
          turmaNome: turma?.nome || '',
          alunoId: formData.alunoId ? parseInt(formData.alunoId) : undefined,
          alunoNome: aluno?.nome || undefined
        });
        console.log('Recado atualizado:', updatedRecado);
        
        if (updatedRecado) {
          alert('Recado atualizado com sucesso!');
          setRecados(prev =>
            prev.map(r => (r.id === updatedRecado.id ? updatedRecado : r))
          );
        } else {
          throw new Error('Falha ao atualizar recado');
        }
      } else {
        console.log('Criando novo recado...');
        const novoRecado = supabaseService.createRecado({
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
        console.log('Recado criado:', novoRecado);
        
        if (novoRecado) {
          alert('Recado enviado com sucesso!');
          setRecados(prev => [novoRecado, ...prev]);
        } else {
          throw new Error('Falha ao criar recado');
        }
      }
      
      handleCloseDialog();

      setTimeout(() => {
        loadData();
      }, 100);
    } catch (error) {
      console.error('Erro ao salvar recado:', error);
      alert('Erro ao salvar recado. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (recado: Recado) => {
    console.log('Editando recado:', recado);
    setEditingRecado(recado);
    setFormData({
      titulo: recado.titulo,
      mensagem: recado.mensagem,
      turmaId: recado.turmaId.toString(),
      alunoId: recado.alunoId?.toString() || ''
    });
    
    loadAlunosByTurma(recado.turmaId.toString());
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este recado?')) {
      try {
        console.log('Excluindo recado:', id);
        const success = supabaseService.deleteRecado(id);
        console.log('Resultado da exclusão:', success);
        
        if (success) {
          alert('Recado excluído com sucesso!');
          setRecados(prev => prev.filter(r => r.id !== id));
          setTimeout(() => {
            loadData();
          }, 100);
        } else {
          alert('Erro ao excluir recado.');
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
    console.log('Turma selecionada:', value);
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
          <div class="space-y-2">
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
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="turma">Turma *</Label>
                  <Select
                    value={formData.turmaId}
                    onValueChange={handleTurmaChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma turma" />
                    </SelectTrigger>
                    <SelectContent>
                      {turmas.map(turma => (
                        <SelectItem key={turma.id} value={turma.id.toString()}>
                          {turma.nome} - {turma.anoLetivo}
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
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Deixe vazio para toda a turma" />
                      </SelectTrigger>
                      <SelectContent>
                        {alunos
                          .filter(
                            aluno =>
                              aluno.id && aluno.id.toString().trim() !== ''
                          )
                          .map(aluno => (
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
                    disabled={isSubmitting}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    className="btn btn-outline btn-md"
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="btn btn-primary btn-md"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? 'Salvando...'
                      : editingRecado
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
        ) : recados.length === 0 ? (
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
            {recados.map(recado => (
              <div
                key={recado.id}
                className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <h3 className="font-medium">{recado.titulo}</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 text-base text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(recado.dataEnvio)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {recado.turmaNome}
                    </span>
                    {recado.alunoNome && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {recado.alunoNome}
                      </span>
                    )}
                    <span className="inline-flex items-center px-2 py-1 text-[11px] rounded-full border border-border text-muted-foreground">
                      {recado.alunoId ? (
                        <>
                          <User className="h-3 w-3 mr-1" />
                          Individual
                        </>
                      ) : (
                        <>
                          <Users className="h-3 w-3 mr-1" />
                          Turma
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(recado)}
                    title="Editar recado"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(recado.id)}
                    title="Excluir recado"
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
