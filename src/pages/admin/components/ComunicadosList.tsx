import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MessageSquare, Calendar, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Badge } from '../../../components/ui/badge';
import { supabaseService, Comunicado } from '../../../services/supabaseService';
import { authService } from '../../../services/auth';

export function ComunicadosList() {
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingComunicado, setEditingComunicado] = useState<Comunicado | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    titulo: '',
    mensagem: '',
    autor: ''
  });

  const { user } = authService.getAuthState();

  useEffect(() => {
    loadData();
    
    const handleDataUpdate = () => {
      console.log('Evento de atualização de dados recebido');
      loadData();
    };

    window.addEventListener('dataUpdated', handleDataUpdate);

    return () => {
      window.removeEventListener('dataUpdated', handleDataUpdate);
    };
  }, []);

  const loadData = async () => {
    try {
      console.log('Carregando comunicados...');
      setLoading(true);

      const comunicadosData = await supabaseService.getComunicados();
      console.log('Comunicados carregados:', comunicadosData);
      setComunicados(
        comunicadosData.sort(
          (a, b) =>
            new Date(b.dataPublicacao).getTime() -
            new Date(a.dataPublicacao).getTime()
        )
      );
    } catch (error) {
      console.error('Erro ao carregar comunicados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo.trim() || !formData.mensagem.trim() || !formData.autor.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Dados do formulário:', formData);

      if (editingComunicado) {
        console.log('Editando comunicado:', editingComunicado.id);
        const updatedComunicado = await supabaseService.updateComunicado(editingComunicado.id, {
          titulo: formData.titulo.trim(),
          mensagem: formData.mensagem.trim(),
          autor: formData.autor.trim()
        });
        console.log('Comunicado atualizado:', updatedComunicado);
        
        if (updatedComunicado) {
          setComunicados(prev =>
            prev.map(c => (c.id === editingComunicado.id ? updatedComunicado : c))
          );
          alert('Comunicado atualizado com sucesso!');
        } else {
          throw new Error('Falha ao atualizar comunicado');
        }
      } else {
        console.log('Criando novo comunicado...');
        const novoComunicado = await supabaseService.createComunicado({
          titulo: formData.titulo.trim(),
          mensagem: formData.mensagem.trim(),
          autor: formData.autor.trim(),
          autorId: user?.id || 1,
          dataPublicacao: new Date().toISOString().split('T')[0]
        });
        console.log('Comunicado criado:', novoComunicado);
        
        if (novoComunicado) {
          setComunicados(prev => [novoComunicado, ...prev]);
          alert('Comunicado criado com sucesso!');
        } else {
          throw new Error('Falha ao criar comunicado');
        }
      }

      handleCloseDialog();

      setTimeout(() => {
        loadData();
      }, 100);
    } catch (error) {
      console.error('Erro ao salvar comunicado:', error);
      alert('Erro ao salvar comunicado. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (comunicado: Comunicado) => {
    console.log('Editando comunicado:', comunicado);
    setEditingComunicado(comunicado);
    setFormData({
      titulo: comunicado.titulo,
      mensagem: comunicado.mensagem,
      autor: comunicado.autor
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este comunicado?')) {
      try {
        console.log('Excluindo comunicado:', id);
        const success = await supabaseService.deleteComunicado(id);
        console.log('Resultado da exclusão:', success);
        
        if (success) {
          setComunicados(prev => prev.filter(c => c.id !== id));
          alert('Comunicado excluído com sucesso!');

          setTimeout(() => {
            loadData();
          }, 100);
        } else {
          alert('Erro ao excluir comunicado.');
        }
      } catch (error) {
        console.error('Erro ao excluir comunicado:', error);
        alert('Erro ao excluir comunicado. Tente novamente.');
      }
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingComunicado(null);
    setFormData({
      titulo: '',
      mensagem: '',
      autor: ''
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="card">
      {/* HEADER NO MESMO PADRÃO DA TELA DE ALUNOS */}
      <div className="card-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <h3 className="card-title">Comunicados</h3>
            <p className="card-description">
              Gerencie os comunicados gerais da escola
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn btn-primary btn-md flex items-center gap-2 whitespace-nowrap">
                <Plus className="h-4 w-4" />
                <span className="sm:hidden">Novo</span>
                <span className="hidden sm:inline">Novo Comunicado</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] lg:max-w-[800px] max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingComunicado ? 'Editar Comunicado' : 'Novo Comunicado'}
                </DialogTitle>
                <DialogDescription>
                  {editingComunicado
                    ? 'Edite as informações do comunicado abaixo.'
                    : 'Crie um novo comunicado para toda a escola.'}
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
                    placeholder="Digite o título do comunicado"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="autor">Autor *</Label>
                  <Input
                    id="autor"
                    value={formData.autor}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, autor: e.target.value }))
                    }
                    placeholder="Ex: Coordenação Pedagógica, Direção Escolar"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mensagem">Mensagem *</Label>
                  <Textarea
                    id="mensagem"
                    value={formData.mensagem}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, mensagem: e.target.value }))
                    }
                    placeholder="Digite a mensagem do comunicado"
                    rows={8}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                      ? 'Salvando...'
                      : editingComunicado
                      ? 'Salvar Alterações'
                      : 'Criar Comunicado'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* CONTEÚDO NO MESMO PADRÃO DA TELA DE ALUNOS */}
      <div className="card-content">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando comunicados...</p>
            </div>
          </div>
        ) : comunicados.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 opacity-60" />
            </div>
            <p className="font-medium mb-1">Nenhum comunicado encontrado</p>
            <p className="text-sm">
              Crie o primeiro comunicado para a escola.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comunicados.map(comunicado => (
              <div
                key={comunicado.id}
                className="p-4 border rounded-lg flex flex-col gap-3"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-base">
                        {comunicado.titulo}
                      </h4>
                      <span className="inline-flex items-center px-2 py-1 text-[11px] rounded-full border border-border text-muted-foreground">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Geral
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{comunicado.autor}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(comunicado.dataPublicacao)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="none"
                      className="h-8 w-8 p-0 inline-flex items-center justify-center"
                      onClick={() => handleEdit(comunicado)}
                      title="Editar comunicado"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="none"
                      className="h-8 w-8 p-0 inline-flex items-center justify-center"
                      onClick={() => handleDelete(comunicado.id)}
                      title="Excluir comunicado"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {comunicado.mensagem}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
