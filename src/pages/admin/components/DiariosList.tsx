import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash2, Users, Filter, CheckCircle, Clock, RotateCcw, XCircle, AlertCircle, Eye } from 'lucide-react';
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
        setSuccessToast({
          open: true,
          message: 'Diário Finalizado!',
          description: 'O diário foi finalizado com sucesso.'
        });
      }
    } catch (error) {
      console.error('Erro ao finalizar diário:', error);
      alert('Erro ao finalizar diário. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [selectedDiario, currentUser, loadData]);

  // CORRIGIDO: Callback simples que só atualiza dados e mostra toast
  const handleDevolucaoSuccess = useCallback(async () => {
    await loadData();
    setSelectedDiario(null);
    setSuccessToast({
      open: true,
      message: 'Diário Enviado!',
      description: 'O diário foi devolvido com sucesso para o professor.'
    });
  }, [loadData]);

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

  const getStatusDiario = (diario: Diario) => {
    const hoje = new Date();
    const dataInicio = diario.dataInicio ? new Date(diario.dataInicio) : null;
    const dataTermino = diario.dataTermino ? new Date(diario.dataTermino) : null;

    if (dataInicio && hoje < dataInicio) return { label: 'Futuro', variant: 'secondary' as const };
    if (dataTermino && hoje > dataTermino) return { label: 'Finalizado', variant: 'outline' as const };
    return { label: 'Ativo', variant: 'default' as const };
  };

  const getStatusDiarioInfo = (status?: string) => {
    switch (status) {
      case 'ENTREGUE':
        return { label: 'Pendente de Revisão', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: Clock };
      case 'DEVOLVIDO':
        return { label: 'Devolvido', color: 'text-orange-600 bg-orange-50 border-orange-200', icon: RotateCcw };
      case 'FINALIZADO':
        return { label: 'Finalizado', color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle };
      case 'PENDENTE':
      default:
        return { label: 'Pendente', color: 'text-gray-600 bg-gray-50 border-gray-200', icon: Clock };
    }
  };

  const canManageDiario = (diario: Diario) => {
    if (!currentUser) return { canEdit: false, canDelete: false, canView: true };
    const isCoordenador = currentUser.papel === 'COORDENADOR' || currentUser.papel === 'ADMIN';
    return {
      canEdit: isCoordenador || (currentUser.papel === 'PROFESSOR' && diario.status !== 'FINALIZADO'),
      canDelete: isCoordenador,
      canView: true
    };
  };

  const diasEntreguesPendentesRevisao = useMemo(() => {
    return diarios.filter(d => d.status === 'ENTREGUE');
  }, [diarios]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl font-bold">Diários de Classe</CardTitle>
            <CardDescription>Gerencie os diários de classe da instituição</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Diário
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingDiario ? 'Editar Diário' : 'Novo Diário'}</DialogTitle>
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
                        placeholder="Ex: Matemática - 1º Ano A - 2024"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="disciplina">Disciplina</Label>
                        <Select 
                          value={formData.disciplinaId} 
                          onValueChange={(value) => setFormData({ ...formData, disciplinaId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a disciplina" />
                          </SelectTrigger>
                          <SelectContent>
                            {disciplinas.map((d) => (
                              <SelectItem key={d.id} value={d.id.toString()}>{d.nome}</SelectItem>
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
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a turma" />
                          </SelectTrigger>
                          <SelectContent>
                            {turmas.map((t) => (
                              <SelectItem key={t.id} value={t.id.toString()}>{t.nome}</SelectItem>
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
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o professor" />
                          </SelectTrigger>
                          <SelectContent>
                            {professoresFiltrados.map((p) => (
                              <SelectItem key={p.id} value={p.id.toString()}>{p.nome}</SelectItem>
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
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o bimestre" />
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

          {diasEntreguesPendentesRevisao.length > 0 && (
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
                      
                      {permissions.canEdit && (
                        <>
                          {diario.status === 'ENTREGUE' && (currentUser?.papel === 'COORDENADOR' || currentUser?.papel === 'ADMIN') && (
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
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

      {/* CORRIGIDO: onDevolver agora só chama o callback, não abre outro modal */}
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
