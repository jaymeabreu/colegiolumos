import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MessageSquare, Calendar, Users, User, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { supabaseService } from '../../../services/supabaseService';
import type { Recado, Turma, Aluno, Diario } from '../../../services/supabaseService';
import { authService } from '../../../services/auth';

interface RecadosTabProps {
  diarioId?: number;
}

export function RecadosTab({ diarioId }: RecadosTabProps) {
  const [recados, setRecados] = useState<Recado[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [diario, setDiario] = useState<Diario | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecado, setEditingRecado] = useState<Recado | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    titulo: '',
    mensagem: '',
    alunoId: ''
  });

  const { user } = authService.getAuthState();

  useEffect(() => {
    loadData();
  }, [user?.professorId, diarioId]);

  // Controlar visibilidade do sidebar
  useEffect(() => {
    if (isDialogOpen) {
      // Ocultar sidebar quando modal abrir
      const sidebarElement = document.querySelector('[data-sidebar="sidebar"]');
      if (sidebarElement) {
        (sidebarElement as HTMLElement).style.display = 'none';
      }
      // Também ocultar o main
      const mainElement = document.querySelector('main');
      if (mainElement) {
        (mainElement as HTMLElement).style.display = 'none';
      }
    } else {
      // Mostrar sidebar quando modal fechar
      const sidebarElement = document.querySelector('[data-sidebar="sidebar"]');
      if (sidebarElement) {
        (sidebarElement as HTMLElement).style.display = '';
      }
      // Mostrar o main
      const mainElement = document.querySelector('main');
      if (mainElement) {
        (mainElement as HTMLElement).style.display = '';
      }
    }

    return () => {
      // Garantir que sidebar volte ao normal ao desmontar
      const sidebarElement = document.querySelector('[data-sidebar="sidebar"]');
      if (sidebarElement) {
        (sidebarElement as HTMLElement).style.display = '';
      }
      const mainElement = document.querySelector('main');
      if (mainElement) {
        (mainElement as HTMLElement).style.display = '';
      }
    };
  }, [isDialogOpen]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar dados do diário atual para pegar a turma
      if (diarioId) {
        const diarios = await supabaseService.getDiarios();
        const diarioAtual = diarios.find(d => d.id === diarioId);
        if (diarioAtual) {
          setDiario(diarioAtual);
          
          // Carregar alunos da turma do diário
          if (diarioAtual.turma_id) {
            const alunosData = await supabaseService.getAlunosByTurma(diarioAtual.turma_id);
            setAlunos(alunosData || []);
          }
        }
      }

      if (user?.professorId) {
        const recadosData = await supabaseService.getRecadosByProfessor(user.professorId);
        
        // Se tem diarioId, filtra recados apenas da turma desse diário
        let recadosFiltrados = recadosData || [];
        if (diarioId && diario?.turma_id) {
          recadosFiltrados = recadosFiltrados.filter(r => 
            (r.turmaId || r.turma_id) === diario.turma_id
          );
        }
        
        setRecados(recadosFiltrados.sort(
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

  // Recarregar quando diario mudar
  useEffect(() => {
    if (diario?.turma_id) {
      loadAlunosByTurma(diario.turma_id);
    }
  }, [diario?.turma_id]);

  const loadAlunosByTurma = async (turmaId: number) => {
    try {
      const alunosData = await supabaseService.getAlunosByTurma(turmaId);
      setAlunos(alunosData || []);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
      setAlunos([]);
    }
  };

  // Pegar nome da turma do diário atual
  const getTurmaNome = () => {
    if (diario?.turma_id) {
      const turma = turmas.find(t => t.id === diario.turma_id);
      return turma?.nome || 'Turma';
    }
    return 'Turma';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo.trim() || !formData.mensagem.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Usa a turma do diário automaticamente
    if (!diario?.turma_id) {
      alert('Erro: Turma do diário não encontrada.');
      return;
    }

    try {
      const turma = turmas.find(t => t.id === diario.turma_id);
      const aluno = formData.alunoId && formData.alunoId.trim()
        ? alunos.find(a => a.id === parseInt(formData.alunoId))
        : null;

      if (editingRecado) {
        const updatedRecado = await supabaseService.updateRecado(editingRecado.id, {
          titulo: formData.titulo.trim(),
          mensagem: formData.mensagem.trim(),
          turmaId: diario.turma_id,
          turmaNome: turma?.nome || '',
          alunoId: formData.alunoId && formData.alunoId.trim() ? parseInt(formData.alunoId) : null,
          alunoNome: aluno?.nome || null
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
          turmaId: diario.turma_id,
          turmaNome: turma?.nome || '',
          alunoId: formData.alunoId && formData.alunoId.trim() ? parseInt(formData.alunoId) : null,
          alunoNome: aluno?.nome || null,
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
      alunoId: (recado.alunoId || recado.aluno_id)?.toString() || ''
    });
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
      alunoId: ''
    });
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
              Envie recados para {getTurmaNome()} ou para um aluno específico
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
            <DialogContent 
              className="!fixed !inset-0 !w-screen !h-screen !max-w-none !max-h-none !rounded-none !p-0 !m-0 !border-0"
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#ffffff',
                zIndex: 9999
              }}
            >
              {/* Header com fechar button */}
              <div className="flex items-center justify-between p-6 border-b bg-white sticky top-0 z-50 flex-shrink-0">
                <div>
                  <DialogTitle className="text-2xl font-bold">
                    {editingRecado ? 'Editar Recado' : 'Novo Recado'}
                  </DialogTitle>
                  <DialogDescription className="mt-2">
                    {editingRecado
                      ? 'Edite as informações do recado abaixo.'
                      : `Crie um novo recado para ${getTurmaNome()} ou aluno específico.`}
                  </DialogDescription>
                </div>
                <button
                  onClick={handleCloseDialog}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                >
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              {/* Conteúdo scrollável */}
              <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
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

                  {/* Mostra a turma como informação (não editável) */}
                  <div className="space-y-2">
                    <Label>Turma</Label>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{getTurmaNome()}</span>
                      <span className="text-xs text-muted-foreground">(turma do diário atual)</span>
                    </div>
                  </div>

                  {/* Select de aluno (opcional) */}
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

                  {/* Spacer */}
                  <div className="h-4" />
                </form>
              </div>

              {/* Footer fixo */}
              <div className="flex gap-3 justify-end p-6 border-t bg-white sticky bottom-0 z-50 flex-shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  className="min-w-24"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  className="min-w-24"
                >
                  {editingRecado
                    ? 'Salvar Alterações'
                    : 'Enviar Recado'}
                </Button>
              </div>
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
              Crie o primeiro recado para {getTurmaNome()}.
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
