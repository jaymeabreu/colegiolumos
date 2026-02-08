import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MessageSquare, Calendar, User, Users, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'; 
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Badge } from '../../../components/ui/badge';
import { supabaseService, Comunicado, Turma, Aluno, Professor } from '../../../services/supabaseService';
import { authService } from '../../../services/auth';

type TipoDestinatario = 'geral' | 'turma' | 'usuario';

export function ComunicadosList() {
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingComunicado, setEditingComunicado] = useState<Comunicado | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [usuarioBusca, setUsuarioBusca] = useState('');
  const [showUsuariosList, setShowUsuariosList] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    mensagem: '',
    autor: '',
    tipoDestinatario: 'geral' as TipoDestinatario,
    turmaId: '',
    usuarioId: ''
  });

  // Combina alunos e professores para busca
  const todosUsuarios = [
    ...alunos.map(a => ({ id: a.id, nome: a.nome, tipo: 'Aluno' })),
    ...professores.map(p => ({ id: p.id, nome: p.nome, tipo: 'Professor' }))
  ].sort((a, b) => a.nome.localeCompare(b.nome));

  // Filtra usuários baseado na busca
  const usuariosFiltrados = todosUsuarios.filter(usuario =>
    usuario.nome.toLowerCase().includes(usuarioBusca.toLowerCase())
  ).slice(0, 50); // Limita a 50 resultados

  // Fecha a lista de usuários quando clicar fora
  useEffect(() => {
    const handleClickOutside = () => setShowUsuariosList(false);
    if (showUsuariosList) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showUsuariosList]);

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

      const [comunicadosData, turmasData, alunosData, professoresData] = await Promise.all([
        supabaseService.getComunicados(),
        supabaseService.getTurmas(),
        supabaseService.getAlunos(),
        supabaseService.getProfessores()
      ]);

      console.log('Comunicados carregados:', comunicadosData);
      setComunicados(
        comunicadosData.sort(
          (a, b) =>
            new Date(b.data_publicacao).getTime() -
            new Date(a.data_publicacao).getTime()
        )
      );
      setTurmas(turmasData);
      setAlunos(alunosData);
      setProfessores(professoresData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
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

    // Validações por tipo
    if (formData.tipoDestinatario === 'turma' && !formData.turmaId) {
      alert('Por favor, selecione uma turma.');
      return;
    }

    if (formData.tipoDestinatario === 'usuario' && !formData.usuarioId) {
      alert('Por favor, selecione um usuário.');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Dados do formulário:', formData);

      const payload: any = {
        titulo: formData.titulo.trim(),
        mensagem: formData.mensagem.trim(),
        autor: formData.autor.trim(),
        autor_id: 9,
        data_publicacao: new Date().toISOString().split('T')[0]
      };

      // Adiciona campos opcionais baseado no tipo
      if (formData.tipoDestinatario === 'turma') {
        payload.turma_id = parseInt(formData.turmaId);
      } else if (formData.tipoDestinatario === 'usuario') {
        payload.usuario_id = parseInt(formData.usuarioId);
      }

      if (editingComunicado) {
        console.log('Editando comunicado:', editingComunicado.id);
        const updatedComunicado = await supabaseService.updateComunicado(editingComunicado.id, payload);
        console.log('Comunicado atualizado:', updatedComunicado);
        
        if (updatedComunicado) {
          setComunicados(prev =>
            prev.map(c => (c.id === editingComunicado.id ? updatedComunicado : c))
          );
          alert('Comunicado atualizado com sucesso!');
        }
      } else {
        console.log('Criando novo comunicado...');
        const novoComunicado = await supabaseService.createComunicado(payload);
        console.log('Comunicado criado:', novoComunicado);
        
        if (novoComunicado) {
          setComunicados(prev => [novoComunicado, ...prev]);
          alert('Comunicado criado com sucesso!');
        }
      }

      handleCloseDialog();
      setTimeout(() => loadData(), 100);
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
    
    // Determina o tipo baseado nos campos preenchidos
    let tipoDestinatario: TipoDestinatario = 'geral';
    let turmaId = '';
    let usuarioId = '';
    let usuarioNome = '';

    if (comunicado.turma_id) {
      tipoDestinatario = 'turma';
      turmaId = comunicado.turma_id.toString();
    } else if (comunicado.usuario_id) {
      tipoDestinatario = 'usuario';
      usuarioId = comunicado.usuario_id.toString();
      
      // Busca o nome do usuário
      const aluno = alunos.find(a => a.id === comunicado.usuario_id);
      const professor = professores.find(p => p.id === comunicado.usuario_id);
      usuarioNome = aluno ? `${aluno.nome} (Aluno)` : professor ? `${professor.nome} (Professor)` : '';
    }

    setFormData({
      titulo: comunicado.titulo,
      mensagem: comunicado.mensagem,
      autor: comunicado.autor,
      tipoDestinatario,
      turmaId,
      usuarioId
    });
    
    setUsuarioBusca(usuarioNome);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este comunicado?')) {
      try {
        console.log('Excluindo comunicado:', id);
        await supabaseService.deleteComunicado(id);
        setComunicados(prev => prev.filter(c => c.id !== id));
        alert('Comunicado excluído com sucesso!');
        setTimeout(() => loadData(), 100);
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
      autor: '',
      tipoDestinatario: 'geral',
      turmaId: '',
      usuarioId: ''
    });
    setUsuarioBusca('');
    setShowUsuariosList(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getDestinatarioBadge = (comunicado: Comunicado) => {
    if (comunicado.turma_id) {
      const turma = turmas.find(t => t.id === comunicado.turma_id);
      return (
        <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-blue-500 text-white">
          <Users className="h-3 w-3 mr-1" />
          Turma: {turma?.nome || 'N/A'}
        </span>
      );
    } else if (comunicado.usuario_id) {
      // Busca o usuário (pode ser aluno ou professor)
      const aluno = alunos.find(a => a.id === comunicado.usuario_id);
      const professor = professores.find(p => p.id === comunicado.usuario_id);
      const nomeUsuario = aluno?.nome || professor?.nome || 'N/A';
      
      return (
        <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-purple-500 text-white">
          <User className="h-3 w-3 mr-1" />
          {nomeUsuario}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-green-500 text-white">
          <Globe className="h-3 w-3 mr-1" />
          Geral
        </span>
      );
    }
  };

  return (
    <div className="card">
      {/* HEADER */}
      <div className="card-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <h3 className="card-title">Comunicados</h3>
            <p className="card-description">
              Gerencie comunicados gerais, por turma ou individuais
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
  <style>{`
    [data-radix-popper-content-wrapper] {
      z-index: 99999 !important;
    }
  `}</style>
  <DialogHeader>
                <DialogTitle>
                  {editingComunicado ? 'Editar Comunicado' : 'Novo Comunicado'}
                </DialogTitle>
                <DialogDescription>
                  {editingComunicado
                    ? 'Edite as informações do comunicado abaixo.'
                    : 'Crie um novo comunicado para toda a escola, uma turma ou um usuário específico.'}
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

                {/* TIPO DE DESTINATÁRIO */}
                <div className="space-y-2">
                  <Label htmlFor="tipoDestinatario">Enviar para *</Label>
                  <Select
                    value={formData.tipoDestinatario}
                    onValueChange={(value: TipoDestinatario) => {
                      setFormData(prev => ({
                        ...prev,
                        tipoDestinatario: value,
                        turmaId: '',
                        usuarioId: ''
                      }));
                      setUsuarioBusca('');
                      setShowUsuariosList(false);
                    }}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="geral">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          <span>Toda a escola (Geral)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="turma">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>Turma específica</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="usuario">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>Usuário individual</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* SELECT DE TURMA (só aparece se tipo === 'turma') */}
                {formData.tipoDestinatario === 'turma' && (
                  <div className="space-y-2">
                    <Label htmlFor="turmaId">Selecione a turma *</Label>
                    <Select
                      value={formData.turmaId}
                      onValueChange={value =>
                        setFormData(prev => ({ ...prev, turmaId: value }))
                      }
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma turma" />
                      </SelectTrigger>
                      <SelectContent>
                        {turmas.map(turma => (
                          <SelectItem key={turma.id} value={turma.id.toString()}>
                            {turma.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* CAMPO DE BUSCA DE USUÁRIO (só aparece se tipo === 'usuario') */}
                {formData.tipoDestinatario === 'usuario' && (
                  <div className="space-y-2">
                    <Label htmlFor="usuarioSearch">Buscar usuário *</Label>
                    <div className="relative" onClick={e => e.stopPropagation()}>
                      <Input
                        id="usuarioSearch"
                        type="text"
                        placeholder="Digite o nome do aluno ou professor..."
                        value={usuarioBusca}
                        onChange={e => setUsuarioBusca(e.target.value)}
                        onFocus={() => setShowUsuariosList(true)}
                        disabled={isSubmitting}
                        autoComplete="off"
                      />
                      
                      {/* Lista de resultados filtrados */}
                      {showUsuariosList && usuariosFiltrados.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {usuariosFiltrados.map(usuario => (
                            <button
                              key={`${usuario.tipo}-${usuario.id}`}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, usuarioId: usuario.id.toString() }));
                                setUsuarioBusca(`${usuario.nome} (${usuario.tipo})`);
                                setShowUsuariosList(false);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                            >
                              <div className="font-medium">{usuario.nome}</div>
                              <div className="text-xs text-gray-500">{usuario.tipo}</div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Mostra mensagem se não encontrar nada */}
                      {showUsuariosList && usuarioBusca && usuariosFiltrados.length === 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg p-4 text-center text-gray-500">
                          Nenhum usuário encontrado
                        </div>
                      )}
                    </div>

                    {/* Mostra usuário selecionado */}
                    {formData.usuarioId && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span>Selecionado: {usuarioBusca}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, usuarioId: '' }));
                            setUsuarioBusca('');
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                )}

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

      {/* CONTEÚDO */}
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
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h4 className="font-medium text-base">
                        {comunicado.titulo}
                      </h4>
                      {getDestinatarioBadge(comunicado)}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>Por: {comunicado.autor}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(comunicado.data_publicacao)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-2">
                      {comunicado.mensagem}
                    </p>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
