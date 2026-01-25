import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash2, Users, Filter, CheckCircle, Clock, RotateCcw, XCircle, AlertCircle, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { supabaseService } from '../../../services/supabaseService';
import { DiarioViewModal } from './DiarioViewModal';
import { DevolverDiarioModal } from './DevolverDiarioModal';
import type { Diario, Turma, Disciplina, Usuario } from '../../../services/supabaseService';

export function DiariosList() {
  const [diarios, setDiarios] = useState<Diario[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [professores, setProfessores] = useState<Usuario[]>([]);
  const [professoresFiltrados, setProfessoresFiltrados] = useState<Usuario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [isDevolverModalOpen, setIsDevolverModalOpen] = useState(false);
  const [isFinalizarDialogOpen, setIsFinalizarDialogOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingDiario, setEditingDiario] = useState<Diario | null>(null);
  const [selectedDiario, setSelectedDiario] = useState<Diario | null>(null);
  const [observacaoDevolucao, setObservacaoDevolucao] = useState('');
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(false);
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
      setProfessores(usuariosData.filter(u => u.papel === 'PROFESSOR'));
      
      const userData = localStorage.getItem('user');
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrar professores quando disciplina é selecionada
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
          return p.professor_id !== undefined && p.professor_id !== null && professoresIds.includes(p.professor_id);
        });
        
        setProfessoresFiltrados(professoresDaDisciplina);
        
        if (formData.professorId && !professoresIds.includes(Number(formData.professorId))) {
          setFormData(prev => ({ ...prev, professorId: '' }));
        }
      } catch (error) {
        console.error('Erro ao filtrar professores:', error);
        setProfessoresFiltrados(professores);
      }
    };

    filtrarProfessores();
  }, [formData.disciplinaId, professores, formData.professorId]);

  const filteredDiarios = useMemo(() => {
    if (!searchTerm && !Object.values(filters).some(v => v && v !== 'all')) {
      return diarios;
    }

    return diarios.filter(diario => {
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
      alert(editingDiario ? 'Diário atualizado com sucesso!' : 'Diário criado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar diário:', error);
      alert('Erro ao salvar diário. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [formData, editingDiario, loadData]);

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
        alert('Diário excluído com sucesso!');
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

  const handleFinalizarDiario = useCallback(async () => {
    if (!selectedDiario || !currentUser) return;
    
    try {
      setLoading(true);
      const sucesso = await supabaseService.finalizarDiario(selectedDiario.id, currentUser.id);
      
      if (sucesso) {
        await loadData();
        setIsFinalizarDialogOpen(false);
        setIsViewModalOpen(false);
        setSelectedDiario(null);
        alert('Diário finalizado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao finalizar diário:', error);
      alert('Erro ao finalizar diário. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [selectedDiario, currentUser, loadData]);

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

  const handleApplyFilters = useCallback(() => {
    setIsFilterDialogOpen(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      disciplina: '',
      turma: '',
      professor: '',
      bimestre: '',
      status: '',
      statusDiario: ''
    });
  }, []);

  const getActiveFiltersCount = useMemo(() => {
    return Object.values(filters).filter(value => value !== '' && value !== 'all').length;
  }, [filters]);

  const getTurmaNome = useCallback((turmaId?: number) => {
    if (!turmaId) return 'N/A';
    return turmas.find(t => t.id === turmaId)?.nome || 'N/A';
  }, [turmas]);

  const getDisciplinaNome = useCallback((disciplinaId?: number) => {
    if (!disciplinaId) return 'N/A';
    return disciplinas.find(d => d.id === disciplinaId)?.nome || 'N/A';
  }, [disciplinas]);

  const getProfessorNome = useCallback((professorId?: number) => {
    if (!professorId) return 'N/A';
    return professores.find(p => p.id === professorId)?.nome || 'N/A';
  }, [professores]);

  const getStatusDiario = useCallback((diario: Diario) => {
    if (!diario.dataInicio || !diario.dataTermino) {
      return { label: 'Sem data', variant: 'secondary' as const };
    }
    const hoje = new Date();
    const dataInicio = new Date(diario.dataInicio);
    const dataTermino = new Date(diario.dataTermino);
    
    if (hoje < dataInicio) return { label: 'Futuro', variant: 'secondary' as const };
    if (hoje > dataTermino) return { label: 'Finalizado', variant: 'outline' as const };
    return { label: 'Ativo', variant: 'default' as const };
  }, []);

  const getStatusDiarioInfo = useCallback((status?: string) => {
    switch (status) {
      case 'PENDENTE':
        return { 
          label: 'Pendente', 
          variant: 'secondary' as const, 
          icon: Clock,
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
      case 'ENTREGUE':
        return { 
          label: 'Pendente de Revisão', 
          variant: 'default' as const, 
          icon: Eye,
          color: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'DEVOLVIDO':
        return { 
          label: 'Devolvido', 
          variant: 'destructive' as const, 
          icon: RotateCcw,
          color: 'bg-orange-100 text-orange-800 border-orange-200'
        };
      case 'FINALIZADO':
        return { 
          label: 'Finalizado', 
          variant: 'outline' as const, 
          icon: CheckCircle,
          color: 'bg-green-100 text-green-800 border-green-200'
        };
      default:
        return { 
          label: 'Desconhecido', 
          variant: 'secondary' as const, 
          icon: AlertCircle,
          color: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  }, []);

  const canManageDiario = useCallback((diario: Diario) => {
    if (!currentUser || currentUser.papel !== 'COORDENADOR') return { canDevolver: false, canFinalizar: false };
    const canDevolver = diario.status === 'ENTREGUE';
    const canFinalizar = diario.status === 'DEVOLVIDO' || diario.status === 'PENDENTE';
    return { canDevolver, canFinalizar };
  }, [currentUser]);

  // Destacar diários entregues
  const diasEntreguesPendentesRevisao = useMemo(() => {
    return filteredDiarios.filter(d => d.status === 'ENTREGUE');
  }, [filteredDiarios]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <h3 className="card-title">Diários</h3>
              <p className="card-description">
                Gerencie os diários de classe e controle o status de entrega
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={resetForm}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span className="sm:hidden">Novo</span>
                  <span className="hidden sm:inline">Novo Diário</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] lg:max-w-[800px] max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingDiario ? 'Editar Diário' : 'Novo Diário'}
                  </DialogTitle>
                  <DialogDescription>
                    Preencha as informações do diário de classe
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Nome do Diário"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Select 
                          value={formData.disciplinaId} 
                          onValueChange={(value) => setFormData({ ...formData, disciplinaId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Disciplina" />
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

                      <div>
                        <Select 
                          value={formData.turmaId} 
                          onValueChange={(value) => setFormData({ ...formData, turmaId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Turma" />
                          </SelectTrigger>
                          <SelectContent>
                            {turmas.map((turma) => (
                              <SelectItem key={turma.id} value={turma.id.toString()}>
                                {turma.nome} - {turma.turno}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Select 
                          value={formData.professorId} 
                          onValueChange={(value) => setFormData({ ...formData, professorId: value })}
                          disabled={!formData.disciplinaId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={formData.disciplinaId ? "Professor" : "Selecione disciplina primeiro"} />
                          </SelectTrigger>
                          <SelectContent>
                            {professoresFiltrados.length === 0 && formData.disciplinaId && (
                              <div className="p-2 text-sm text-gray-500 text-center">
                                Nenhum professor vinculado a esta disciplina
                              </div>
                            )}
                            {professoresFiltrados.map((professor) => (
                              <SelectItem key={professor.id} value={professor.professor_id?.toString() || ''}>
                                {professor.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formData.disciplinaId && professoresFiltrados.length === 0 && (
                          <p className="text-xs text-orange-600 mt-1">
                            Vincule professores à disciplina em "Professores"
                          </p>
                        )}
                      </div>

                      <div>
                        <Select 
                          value={formData.bimestre} 
                          onValueChange={(value) => setFormData({ ...formData, bimestre: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Bimestre" />
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dataInicio">Data de Início</Label>
                        <Input
                          id="dataInicio"
                          type="date"
                          value={formData.dataInicio}
                          onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                          required
                        />
                      </div>

                      <div>
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
                          <SelectItem key={professor.id} value={professor.id.toString()}>
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

          {/* SEÇÃO DESTACADA: Diários Entregues Pendentes de Revisão */}
          {filteredDiarios.filter(d => d.status === 'ENTREGUE').length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900">
                  {diasEntreguesPendentesRevisao.length} Diário(s) Pendente(s) de Revisão
                </h4>
              </div>
              <div className="space-y-2">
                {diasEntreguesPendentesRevisao.map(diario => (
                  <div key={diario.id} className="p-3 bg-white rounded border border-blue-100 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{diario.nome}</p>
                      <p className="text-sm text-gray-600">
                        {getDisciplinaNome(diario.disciplina_id)} - {getTurmaNome(diario.turma_id)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleViewDiario(diario)}
                    >
                      Revisar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {loading && (
            <div className="text-center py-8 text-gray-500">
              <p>Carregando...</p>
            </div>
          )}

          {!loading && (
            <div className="space-y-4">
              {filteredDiarios.map((diario) => {
                const status = getStatusDiario(diario);
                const statusDiario = getStatusDiarioInfo(diario.status);
                const StatusIcon = statusDiario.icon;
                const permissions = canManageDiario(diario);
                
                return (
                  <div key={diario.id} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-medium">{diario.nome || 'Sem nome'}</h3>
                        {diario.bimestre && <Badge variant="outline">{diario.bimestre}º Bimestre</Badge>}
                        <Badge variant={status.variant}>{status.label}</Badge>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusDiario.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusDiario.label}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                        <span>Disciplina: {getDisciplinaNome(diario.disciplina_id)}</span>
                        <span>Turma: {getTurmaNome(diario.turma_id)}</span>
                        <span>Professor: {getProfessorNome(diario.professor_id)}</span>
                      </div>
                      {diario.dataInicio && diario.dataTermino && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 text-sm text-gray-500">
                          <span>Início: {new Date(diario.dataInicio).toLocaleDateString('pt-BR')}</span>
                          <span>Término: {new Date(diario.dataTermino).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                      {diario.solicitacao_devolucao && (
                        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm">
                          <div className="flex items-center gap-1 text-orange-800 font-medium">
                            <AlertCircle className="h-4 w-4" />
                            Solicitação de Devolução
                          </div>
                          <p className="text-orange-700 mt-1">{diario.solicitacao_devolucao.motivo || diario.solicitacao_devolucao.comentario}</p>
                          <p className="text-orange-600 text-xs mt-1">
                            Solicitado em: {new Date(diario.solicitacao_devolucao.at || diario.solicitacao_devolucao.dataSolicitacao).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                      {/* Botão "Ver Diário" - Sempre visível */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="inline-flex items-center gap-1 whitespace-nowrap"
                        onClick={() => handleViewDiario(diario)}
                      >
                        <Eye className="h-4 w-4" />
                        Ver
                      </Button>

                      {currentUser?.papel === 'COORDENADOR' && (
                        <>
                          {permissions.canDevolver && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="inline-flex items-center gap-1 whitespace-nowrap"
                              onClick={() => {
                                setSelectedDiario(diario);
                                setIsDevolverModalOpen(true);
                              }}
                            >
                              <RotateCcw className="h-4 w-4" />
                              Devolver
                            </Button>
                          )}
                          {permissions.canFinalizar && (
                            <Button
                              variant="default"
                              size="sm"
                              className="inline-flex items-center gap-1 whitespace-nowrap"
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
                        size="none"
                        className="h-8 w-8 p-0 inline-flex items-center justify-center"
                        onClick={() => handleEdit(diario)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="none"
                        className="h-8 w-8 p-0 inline-flex items-center justify-center"
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

      {/* Modal de Visualização do Diário */}
      <DiarioViewModal
        diario={selectedDiario}
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        onDevolver={() => {
          setIsViewModalOpen(false);
          setIsDevolverModalOpen(true);
        }}
        onFinalizar={() => {
          setIsViewModalOpen(false);
          setIsFinalizarDialogOpen(true);
        }}
        loading={loading}
        userRole={currentUser?.papel as 'COORDENADOR' | 'PROFESSOR' | 'ADMIN' | undefined}
      />

      {/* Modal de Devolução */}
      <DevolverDiarioModal
        diario={selectedDiario}
        open={isDevolverModalOpen}
        onOpenChange={setIsDevolverModalOpen}
        onSuccess={async () => {
          await loadData();
          setSelectedDiario(null);
          setObservacaoDevolucao('');
        }}
      />

      {/* Dialog de Finalização */}
      <Dialog open={isFinalizarDialogOpen} onOpenChange={setIsFinalizarDialogOpen}>
        <DialogContent>
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
    </>
  );
}

export default DiariosList;
