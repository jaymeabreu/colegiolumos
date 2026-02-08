import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash2, Users, Filter, CheckCircle, Clock, RotateCcw, XCircle, AlertCircle, Eye, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button'; 
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { supabaseService } from '../../../services/supabaseService';
import { DiarioViewModal } from './DiarioViewModal';
import { SuccessToast } from './SuccessToast';
import type { Diario, Turma, Disciplina, Usuario } from '../../../services/supabaseService';

export function DiariosList() {
  const [diarios, setDiarios] = useState<Diario[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [professores, setProfessores] = useState<Usuario[]>([]);
  const [todosUsuarios, setTodosUsuarios] = useState<Usuario[]>([]);
  const [professoresFiltrados, setProfessoresFiltrados] = useState<Usuario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [isFinalizarDialogOpen, setIsFinalizarDialogOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingDiario, setEditingDiario] = useState<Diario | null>(null);
  const [selectedDiario, setSelectedDiario] = useState<Diario | null>(null);
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [successToast, setSuccessToast] = useState({
    open: false,
    message: '',
    description: ''
  });
  
  const [filters, setFilters] = useState({
    disciplina: '',
    turma: '',
    professor: '',
    bimestre: '',
    status: '',
    statusDiario: ''
  });
  const [formData, setFormData] = useState({
    nome: '',
    disciplinaId: '',
    turmaId: '',
    professorId: '',
    bimestre: '',
    dataInicio: '',
    dataTermino: ''
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [diariosData, turmasData, disciplinasData, usuariosData] = await Promise.all([
        supabaseService.getDiarios(),
        supabaseService.getTurmas(),
        supabaseService.getDisciplinas(),
        supabaseService.getUsuarios()
      ]);
      setDiarios(diariosData);
      setTurmas(turmasData);
      setDisciplinas(disciplinasData);
      setTodosUsuarios(usuariosData);
      setProfessores(usuariosData.filter(u => u.papel === 'PROFESSOR'));
      
      const userData = localStorage.getItem('user');
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const filtrarProfessores = async () => {
      if (!formData.disciplinaId) {
        setProfessoresFiltrados(professores);
        return;
      }

      try {
        const resultado = await supabaseService.getProfessoresByDisciplina(Number(formData.disciplinaId));
        
        let professoresIds: number[] = [];
        if (Array.isArray(resultado)) {
          professoresIds = resultado.map(item => {
            if (typeof item === 'number') return item;
            if (typeof item === 'object' && item.professor_id) return item.professor_id;
            return parseInt(item);
          }).filter(id => !isNaN(id));
        }
        
        const professoresDaDisciplina = professores.filter(p => {
          const pId = p.id || p.ID || (p as any).professor_id;
          return pId !== undefined && pId !== null && professoresIds.includes(Number(pId));
        });
        
        setProfessoresFiltrados(professoresDaDisciplina);
      } catch (error) {
        console.error('Erro ao filtrar professores:', error);
        setProfessoresFiltrados(professores);
      }
    };

    filtrarProfessores();
  }, [formData.disciplinaId, professores]);

  const filteredDiarios = useMemo(() => {
    const temSolicitacaoDevolucao = (diario: Diario) => {
      if (!diario.solicitacao_devolucao) return false;
      const temMotivo = diario.solicitacao_devolucao.motivo || diario.solicitacao_devolucao.comentario;
      return !!temMotivo && diario.status === 'ENTREGUE';
    };

    if (!searchTerm && !Object.values(filters).some(v => v && v !== 'all')) {
      return diarios.filter(d => !temSolicitacaoDevolucao(d));
    }

    return diarios.filter(diario => {
      if (temSolicitacaoDevolucao(diario)) return false;

      if (searchTerm && diario.nome && !diario.nome.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      if (filters.disciplina && filters.disciplina !== 'all' && 
          diario.disciplina_id?.toString() !== filters.disciplina) return false;
      
      if (filters.turma && filters.turma !== 'all' && 
          diario.turma_id?.toString() !== filters.turma) return false;
      
      if (filters.professor && filters.professor !== 'all' && 
          diario.professor_id?.toString() !== filters.professor) return false;
      
      if (filters.bimestre && filters.bimestre !== 'all' && diario.bimestre && 
          diario.bimestre.toString() !== filters.bimestre) return false;

      if (filters.statusDiario && filters.statusDiario !== 'all' && 
          diario.status !== filters.statusDiario) return false;

      if (filters.status && filters.status !== 'all' && diario.dataInicio && diario.dataTermino) {
        const hoje = new Date();
        const dataInicio = new Date(diario.dataInicio);
        const dataTermino = new Date(diario.dataTermino);
        
        if (filters.status === 'ativo' && !(hoje >= dataInicio && hoje <= dataTermino)) return false;
        if (filters.status === 'finalizado' && !(hoje > dataTermino)) return false;
        if (filters.status === 'futuro' && !(hoje < dataInicio)) return false;
      }

      return true;
    });
  }, [diarios, searchTerm, filters]);

  const resetForm = useCallback(() => {
    setFormData({
      nome: '',
      disciplinaId: '',
      turmaId: '',
      professorId: '',
      bimestre: '',
      dataInicio: '',
      dataTermino: ''
    });
    setEditingDiario(null);
    setIsDialogOpen(false);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      nome: formData.nome,
      disciplina_id: Number(formData.disciplinaId),
      turma_id: Number(formData.turmaId),
      professor_id: Number(formData.professorId),
      bimestre: Number(formData.bimestre),
      dataInicio: formData.dataInicio,
      dataTermino: formData.dataTermino,
      status: 'PENDENTE',
      ano: new Date().getFullYear()
    };

    try {
      setLoading(true);
      if (editingDiario) {
        await supabaseService.updateDiario(editingDiario.id, data);
      } else {
        await supabaseService.createDiario(data);
      }
      await loadData();
      resetForm();
      setSuccessToast({
        open: true,
        message: editingDiario ? 'Diário Atualizado!' : 'Diário Criado!',
        description: editingDiario ? 'O diário foi atualizado com sucesso.' : 'O diário foi criado com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao salvar diário:', error);
      alert('Erro ao salvar diário. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [formData, editingDiario, loadData, resetForm]);

  const handleEdit = useCallback((diario: Diario) => {
    setEditingDiario(diario);
    setFormData({
      nome: diario.nome || '',
      disciplinaId: diario.disciplina_id?.toString() || '',
      turmaId: diario.turma_id?.toString() || '',
      professorId: diario.professor_id?.toString() || '',
      bimestre: diario.bimestre ? diario.bimestre.toString() : '1',
      dataInicio: diario.dataInicio || '',
      dataTermino: diario.dataTermino || ''
    });
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este diário?')) {
      try {
        setLoading(true);
        await supabaseService.deleteDiario(id);
        await loadData();
        setSuccessToast({
          open: true,
          message: 'Diário Excluído!',
          description: 'O diário foi excluído com sucesso.'
        });
      } catch (error) {
        console.error('Erro ao excluir diário:', error);
        alert('Erro ao excluir diário. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }
  }, [loadData]);

  const handleViewDiario = useCallback((diario: Diario) => {
    setSelectedDiario(diario);
    setIsViewModalOpen(true);
  }, []);

  // ✅ CORREÇÃO PROBLEMA 3: Função melhorada para finalizar diário com validação completa
  const handleFinalizarDiario = useCallback(async () => {
    if (!selectedDiario) {
      alert('Erro: Nenhum diário selecionado.');
      return;
    }

    if (!currentUser) {
      alert('Erro: Usuário não identificado. Tente fazer login novamente.');
      return;
    }
    
    // Extrair ID do diário de forma mais robusta
    const diarioId = selectedDiario.id || (selectedDiario as any).ID;
    
    if (!diarioId) {
      console.error('ID do diário não encontrado. Objeto completo:', selectedDiario);
      alert('Erro: ID do diário não identificado.');
      return;
    }

    // Converter para número e validar
    const idNumerico = Number(diarioId);
    if (isNaN(idNumerico) || idNumerico <= 0) {
      console.error('ID do diário inválido:', diarioId);
      alert('Erro: ID do diário inválido.');
      return;
    }

    // Extrair ID do usuário
    const userId = currentUser.id || currentUser.ID || (currentUser as any).usuario_id;
    const userIdNumerico = Number(userId);
    
    if (isNaN(userIdNumerico) || userIdNumerico <= 0) {
      console.error('ID do usuário inválido:', userId);
      alert('Erro: ID do usuário inválido.');
      return;
    }

    console.log('Finalizando diário:', { diarioId: idNumerico, userId: userIdNumerico });
    
    try {
      setLoading(true);
      const sucesso = await supabaseService.finalizarDiario(idNumerico, userIdNumerico);
      
      if (sucesso) {
        await loadData();
        setIsFinalizarDialogOpen(false);
        setIsViewModalOpen(false);
        setSelectedDiario(null);
        setSuccessToast({
          open: true,
          message: 'Diário Finalizado!',
          description: 'O diário foi finalizado com sucesso e não pode mais ser editado.'
        });
      } else {
        throw new Error('Falha na resposta do servidor ao finalizar diário.');
      }
    } catch (error) {
      console.error('Erro ao finalizar diário:', error);
      alert(`Erro ao finalizar diário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  }, [selectedDiario, currentUser, loadData]);

  const handleDevolucaoSuccess = useCallback(() => {
    loadData();
    setIsViewModalOpen(false);
    setSuccessToast({
      open: true,
      message: 'Diário Devolvido!',
      description: 'O diário foi devolvido ao professor com sucesso.'
    });
  }, [loadData]);

  const handleApplyFilters = () => setIsFilterDialogOpen(false);
  const handleClearFilters = () => {
    setFilters({
      disciplina: '',
      turma: '',
      professor: '',
      bimestre: '',
      status: '',
      statusDiario: ''
    });
    setIsFilterDialogOpen(false);
  };

  const getActiveFiltersCount = useMemo(() => {
    return Object.values(filters).filter(v => v && v !== 'all').length;
  }, [filters]);

  const getDisciplinaNome = (id?: number) => {
    return disciplinas.find(d => d.id === id)?.nome || 'N/A';
  };

  const getTurmaNome = (id?: number) => {
    return turmas.find(t => t.id === id)?.nome || 'N/A';
  };

  // ✅ CORREÇÃO PROBLEMA 2: Função melhorada para buscar nome do professor
  const getProfessorNome = (id?: number) => {
    if (!id) {
      console.warn('getProfessorNome: ID não fornecido');
      return 'N/A';
    }
    
    // Normalizar id para número
    const idNormalizado = Number(id);
    
    if (isNaN(idNormalizado)) {
      console.warn('getProfessorNome: ID inválido', id);
      return 'N/A';
    }
    
    // Buscar em todosUsuarios primeiro (mais completo)
    if (todosUsuarios && todosUsuarios.length > 0) {
      const usuario = todosUsuarios.find(u => {
        const uId = Number(u.id || u.ID || (u as any).usuario_id || (u as any).professor_id);
        return uId === idNormalizado;
      });
      
      if (usuario?.nome) {
        return usuario.nome;
      }
    }
    
    // Fallback para lista de professores
    if (professores && professores.length > 0) {
      const prof = professores.find(p => {
        const pId = Number(p.id || p.ID || (p as any).usuario_id || (p as any).professor_id);
        return pId === idNormalizado;
      });
      
      if (prof?.nome) {
        return prof.nome;
      }
    }
    
    console.warn('getProfessorNome: Professor não encontrado para ID', idNormalizado);
    return 'N/A';
  };

  const getStatusBadge = (status?: string) => {
    switch(status) {
      case 'PENDENTE':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Em Aberto</Badge>;
      case 'ENTREGUE':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Pendente de Revisão</Badge>;
      case 'FINALIZADO':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Finalizado</Badge>;
      case 'DEVOLVIDO':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Devolvido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const diasComSolicitacaoDevolucao = useMemo(() => {
    return diarios.filter(d => {
      if (!d.solicitacao_devolucao) return false;
      const temMotivo = d.solicitacao_devolucao.motivo || d.solicitacao_devolucao.comentario;
      return !!temMotivo && d.status === 'ENTREGUE';
    });
  }, [diarios]);

  return (
    <div className="space-y-6">
      <Card>
        {/* ✅ CORREÇÃO PROBLEMA 1: Título à esquerda e botão à direita na mesma linha */}
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Diários de Classe</CardTitle>
              <CardDescription>Gerencie os diários de classe da instituição</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-teal-600 hover:bg-teal-700 whitespace-nowrap">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Diário
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingDiario ? 'Editar Diário' : 'Criar Novo Diário'}</DialogTitle>
                <DialogDescription>
                  Preencha as informações abaixo para {editingDiario ? 'atualizar o' : 'criar um novo'} diário.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nome">Nome do Diário</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Diário de Matemática - 1º Ano A"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="disciplina">Disciplina</Label>
                      <Select
                        value={formData.disciplinaId}
                        onValueChange={(value) => setFormData({ ...formData, disciplinaId: value, professorId: '' })}
                      >
                        <SelectTrigger id="disciplina">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {disciplinas.map((disciplina) => (
                            <SelectItem key={disciplina.id} value={disciplina.id.toString()}>
                              {disciplina.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="turma">Turma</Label>
                      <Select
                        value={formData.turmaId}
                        onValueChange={(value) => setFormData({ ...formData, turmaId: value })}
                      >
                        <SelectTrigger id="turma">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {turmas.map((turma) => (
                            <SelectItem key={turma.id} value={turma.id.toString()}>
                              {turma.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="professor">Professor</Label>
                      <Select
                        value={formData.professorId}
                        onValueChange={(value) => setFormData({ ...formData, professorId: value })}
                      >
                        <SelectTrigger id="professor">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {professoresFiltrados.map((professor) => (
                            <SelectItem key={professor.id || professor.ID || (professor as any).professor_id} value={(professor.id || professor.ID || (professor as any).professor_id).toString()}>
                              {professor.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="bimestre">Bimestre</Label>
                      <Select
                        value={formData.bimestre}
                        onValueChange={(value) => setFormData({ ...formData, bimestre: value })}
                      >
                        <SelectTrigger id="bimestre">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1º Bimestre</SelectItem>
                          <SelectItem value="2">2º Bimestre</SelectItem>
                          <SelectItem value="3">3º Bimestre</SelectItem>
                          <SelectItem value="4">4º Bimestre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="dataInicio">Data de Início</Label>
                      <Input
                        id="dataInicio"
                        type="date"
                        value={formData.dataInicio}
                        onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="dataTermino">Data de Término</Label>
                      <Input
                        id="dataTermino"
                        type="date"
                        value={formData.dataTermino}
                        onChange={(e) => setFormData({ ...formData, dataTermino: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : (editingDiario ? 'Salvar Alterações' : 'Criar Diário')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar diários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant={getActiveFiltersCount > 0 ? "default" : "outline"}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filtros</span>
                  {getActiveFiltersCount > 0 && (
                    <span className="bg-white text-blue-600 rounded-full px-1.5 py-0.5 text-xs font-medium">
                      {getActiveFiltersCount}
                    </span>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <style>{`
                  [data-radix-popper-content-wrapper] {
                    z-index: 99999 !important;
                  }
                `}</style>
                <DialogHeader>
                  <DialogTitle>Filtrar Diários</DialogTitle>
                  <DialogDescription>
                    Use os filtros abaixo para refinar a lista de diários
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="filterStatusDiario">Status do Diário</Label>
                    <Select 
                      value={filters.statusDiario} 
                      onValueChange={(value) => setFilters({ ...filters, statusDiario: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="PENDENTE">Pendente</SelectItem>
                        <SelectItem value="ENTREGUE">Pendente de Revisão</SelectItem>
                        <SelectItem value="DEVOLVIDO">Devolvido</SelectItem>
                        <SelectItem value="FINALIZADO">Finalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="filterDisciplina">Disciplina</Label>
                    <Select 
                      value={filters.disciplina} 
                      onValueChange={(value) => setFilters({ ...filters, disciplina: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as disciplinas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as disciplinas</SelectItem>
                        {disciplinas.map((disciplina) => (
                          <SelectItem key={disciplina.id} value={disciplina.id.toString()}>
                            {disciplina.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="filterTurma">Turma</Label>
                    <Select 
                      value={filters.turma} 
                      onValueChange={(value) => setFilters({ ...filters, turma: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as turmas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as turmas</SelectItem>
                        {turmas.map((turma) => (
                          <SelectItem key={turma.id} value={turma.id.toString()}>
                            {turma.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="filterProfessor">Professor</Label>
                    <Select 
                      value={filters.professor} 
                      onValueChange={(value) => setFilters({ ...filters, professor: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os professores" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os professores</SelectItem>
                        {professores.map((professor) => (
                          <SelectItem key={professor.id || professor.ID || (professor as any).professor_id} value={(professor.id || professor.ID || (professor as any).professor_id).toString()}>
                            {professor.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="filterBimestre">Bimestre</Label>
                    <Select 
                      value={filters.bimestre} 
                      onValueChange={(value) => setFilters({ ...filters, bimestre: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os bimestres" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os bimestres</SelectItem>
                        <SelectItem value="1">1º Bimestre</SelectItem>
                        <SelectItem value="2">2º Bimestre</SelectItem>
                        <SelectItem value="3">3º Bimestre</SelectItem>
                        <SelectItem value="4">4º Bimestre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="filterStatus">Status</Label>
                    <Select 
                      value={filters.status} 
                      onValueChange={(value) => setFilters({ ...filters, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="finalizado">Finalizado</SelectItem>
                        <SelectItem value="futuro">Futuro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleClearFilters}>
                    Limpar Filtros
                  </Button>
                  <Button type="button" onClick={handleApplyFilters}>
                    Aplicar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {diasComSolicitacaoDevolucao.length > 0 && (
            <div className="mb-6 p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <h4 className="font-semibold text-orange-900">
                  {diasComSolicitacaoDevolucao.length} Diário(s) com Solicitação de Devolução
                </h4>
              </div>
              <div className="space-y-3">
                {diasComSolicitacaoDevolucao.map(diario => (
                  <div key={diario.id} className="p-3 bg-white rounded border border-orange-100">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{diario.nome}</p>
                        <p className="text-sm text-gray-600 mb-2">
                          {getDisciplinaNome(diario.disciplina_id)} - {getTurmaNome(diario.turma_id)} • Prof. {getProfessorNome(diario.professor_id)}
                        </p>
                        {diario.solicitacao_devolucao && (
                          <div className="bg-orange-50 p-2 rounded border border-orange-100">
                            <p className="text-xs font-semibold text-orange-800 mb-1">Motivo da Devolução:</p>
                            <p className="text-sm text-orange-700">
                              {diario.solicitacao_devolucao.motivo || diario.solicitacao_devolucao.comentario || 'Sem motivo especificado'}
                            </p>
                            <p className="text-xs text-orange-600 mt-1">
                              Solicitado em: {new Date(diario.solicitacao_devolucao.at || diario.solicitacao_devolucao.dataSolicitacao).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleViewDiario(diario)}
                        className="whitespace-nowrap"
                      >
                        Revisar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando diários...</div>
          ) : (
            <div className="grid gap-4">
              {filteredDiarios.map((diario) => {
                const hoje = new Date();
                const dataTermino = diario.dataTermino ? new Date(diario.dataTermino) : null;
                const isExpirado = dataTermino && hoje > dataTermino;

                return (
                  <div key={diario.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${diario.status === 'FINALIZADO' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{diario.nome}</h4>
                          {getStatusBadge(diario.status)}
                          {isExpirado && diario.status !== 'FINALIZADO' && (
                            <Badge variant="destructive" className="text-[10px]">Prazo Encerrado</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {getDisciplinaNome(diario.disciplina_id)} - {getTurmaNome(diario.turma_id)} • Prof. {getProfessorNome(diario.professor_id)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => handleViewDiario(diario)}
                      >
                        <Eye className="h-4 w-4" />
                        Visualizar
                      </Button>

                      {currentUser?.papel === 'COORDENADOR' && (
                        <>
                          {diario.status === 'ENTREGUE' && (
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                              onClick={() => {
                                setSelectedDiario(diario);
                                setIsFinalizarDialogOpen(true);
                              }}
                            >
                              <CheckCircle className="h-4 w-4" />
                              Finalizar
                            </Button>
                          )}
                        </>
                      )}
                      
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(diario)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDelete(diario.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              
              {filteredDiarios.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum diário encontrado</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <DiarioViewModal
        diario={selectedDiario}
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        onDevolver={handleDevolucaoSuccess}
        onFinalizar={() => {
          setIsViewModalOpen(false);
          setTimeout(() => setIsFinalizarDialogOpen(true), 100);
        }}
        loading={loading}
        userRole={currentUser?.papel as any}
      />

    <Dialog open={isFinalizarDialogOpen} onOpenChange={setIsFinalizarDialogOpen}>
        <DialogContent>
          <style>{`
            [data-radix-popper-content-wrapper] {
              z-index: 99999 !important;
            }
          `}</style>
          <DialogHeader>
            <DialogTitle>Finalizar Diário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja finalizar este diário? Após a finalização, nem o professor nem o coordenador poderão mais editá-lo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsFinalizarDialogOpen(false);
                setSelectedDiario(null);
              }}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleFinalizarDiario} disabled={loading}>
              {loading ? 'Finalizando...' : 'Finalizar Diário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SuccessToast
        message={successToast.message}
        description={successToast.description}
        open={successToast.open}
        onClose={() => setSuccessToast({ ...successToast, open: false })}
        autoCloseDelay={3000}
      />
    </div>
  );
}

export default DiariosList;
