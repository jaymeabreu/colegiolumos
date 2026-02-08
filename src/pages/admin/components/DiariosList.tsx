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
  const [loading, setLoading] = useState(false);
  
  // CORREÇÃO: Inicializa o usuário diretamente do localStorage para evitar que comece como null
  const [currentUser, setCurrentUser] = useState<Usuario | null>(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });
  
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
        const professoresIds = Array.isArray(resultado) ? resultado.map(id => Number(id)) : [];
        const professoresDaDisciplina = professores.filter(p => {
          const pId = p.id || p.ID || (p as any).professor_id;
          return pId && professoresIds.includes(Number(pId));
        });
        setProfessoresFiltrados(professoresDaDisciplina);
      } catch (error) {
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

    return diarios.filter(diario => {
      if (temSolicitacaoDevolucao(diario)) return false;
      if (searchTerm && !diario.nome?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (filters.disciplina && filters.disciplina !== 'all' && diario.disciplina_id?.toString() !== filters.disciplina) return false;
      if (filters.turma && filters.turma !== 'all' && diario.turma_id?.toString() !== filters.turma) return false;
      if (filters.professor && filters.professor !== 'all' && diario.professor_id?.toString() !== filters.professor) return false;
      if (filters.statusDiario && filters.statusDiario !== 'all' && diario.status !== filters.statusDiario) return false;
      return true;
    });
  }, [diarios, searchTerm, filters]);

  const resetForm = useCallback(() => {
    setFormData({ nome: '', disciplinaId: '', turmaId: '', professorId: '', bimestre: '', dataInicio: '', dataTermino: '' });
    setEditingDiario(null);
    setIsDialogOpen(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      nome: formData.nome,
      disciplina_id: Number(formData.disciplinaId),
      turma_id: Number(formData.turmaId),
      professor_id: Number(formData.professorId),
      bimestre: Number(formData.bimestre),
      dataInicio: formData.dataInicio,
      dataTermino: formData.dataTermino,
      status: 'PENDENTE' as const,
      ano: new Date().getFullYear()
    };

    try {
      setLoading(true);
      if (editingDiario) {
        await supabaseService.updateDiario(editingDiario.id, data);
      } else {
        await supabaseService.createDiario(data as any);
      }
      await loadData();
      resetForm();
      setSuccessToast({ open: true, message: 'Sucesso!', description: 'O diário foi salvo.' });
    } catch (error) {
      alert('Erro ao salvar diário.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizarDiario = useCallback(async () => {
    const diarioId = selectedDiario?.id || (selectedDiario as any)?.ID;
    
    // Tenta pegar o usuário do estado ou direto do localStorage se o estado falhar
    const user = currentUser || JSON.parse(localStorage.getItem('user') || 'null');
    const userId = user?.id || user?.ID || user?.usuario_id;

    if (!diarioId || !userId) {
      alert('Erro: Usuário ou Diário não identificado. Tente fazer login novamente.');
      return;
    }

    try {
      setLoading(true);
      const sucesso = await supabaseService.finalizarDiario(Number(diarioId), Number(userId));
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
    } catch (error: any) {
      alert(error.message || 'Erro ao finalizar diário.');
    } finally {
      setLoading(false);
    }
  }, [selectedDiario, currentUser, loadData]);

  const getProfessorNome = (id?: number) => {
    if (!id) return 'N/A';
    const prof = todosUsuarios.find(u => (u.id || (u as any).ID) === id);
    return prof?.nome || 'N/A';
  };

  const getStatusBadge = (status?: string) => {
    const styles: any = {
      PENDENTE: "bg-yellow-50 text-yellow-700 border-yellow-200",
      ENTREGUE: "bg-blue-50 text-blue-700 border-blue-200",
      FINALIZADO: "bg-green-50 text-green-700 border-green-200",
      DEVOLVIDO: "bg-red-50 text-red-700 border-red-200"
    };
    return <Badge variant="outline" className={styles[status || ''] || ""}>{status === 'ENTREGUE' ? 'Pendente de Revisão' : status || 'Desconhecido'}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Diários de Classe</CardTitle>
              <CardDescription>Gerencie os diários de classe da instituição</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="h-4 w-4 mr-2" /> Novo Diário
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader><DialogTitle>{editingDiario ? 'Editar' : 'Criar'} Diário</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                   <div className="grid gap-2">
                    <Label>Nome do Diário</Label>
                    <Input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Disciplina</Label>
                      <Select value={formData.disciplinaId} onValueChange={v => setFormData({...formData, disciplinaId: v})}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{disciplinas.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.nome}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Turma</Label>
                      <Select value={formData.turmaId} onValueChange={v => setFormData({...formData, turmaId: v})}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{turmas.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.nome}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Professor</Label>
                      <Select value={formData.professorId} onValueChange={v => setFormData({...formData, professorId: v})}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{professoresFiltrados.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.nome}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Bimestre</Label>
                      <Select value={formData.bimestre} onValueChange={v => setFormData({...formData, bimestre: v})}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1º Bimestre</SelectItem>
                          <SelectItem value="2">2º Bimestre</SelectItem>
                          <SelectItem value="3">3º Bimestre</SelectItem>
                          <SelectItem value="4">4º Bimestre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                    <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input className="flex-1" placeholder="Buscar diários..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>

          <div className="grid gap-4">
            {filteredDiarios.map((diario) => (
              <div key={diario.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-full"><BookOpen className="h-5 w-5" /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{diario.nome}</h4>
                      {getStatusBadge(diario.status)}
                    </div>
                    <p className="text-sm text-gray-500">Prof. {getProfessorNome(diario.professor_id)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setSelectedDiario(diario); setIsViewModalOpen(true); }}>
                    <Eye className="h-4 w-4 mr-2" /> Visualizar
                  </Button>
                  {currentUser?.papel === 'COORDENADOR' && diario.status === 'ENTREGUE' && (
                    <Button className="bg-green-600 hover:bg-green-700" size="sm" onClick={() => { setSelectedDiario(diario); setIsFinalizarDialogOpen(true); }}>
                      <CheckCircle className="h-4 w-4 mr-2" /> Finalizar
                    </Button>
                  )}
                  <Button variant="outline" size="icon" onClick={() => { setEditingDiario(diario); setFormData({
                    nome: diario.nome || '',
                    disciplinaId: diario.disciplina_id?.toString() || '',
                    turmaId: diario.turma_id?.toString() || '',
                    professorId: diario.professor_id?.toString() || '',
                    bimestre: diario.bimestre?.toString() || '',
                    dataInicio: diario.dataInicio || '',
                    dataTermino: diario.dataTermino || ''
                  }); setIsDialogOpen(true); }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <DiarioViewModal
        diario={selectedDiario}
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        onDevolver={loadData}
        onFinalizar={() => { setIsViewModalOpen(false); setIsFinalizarDialogOpen(true); }}
        loading={loading}
        userRole={currentUser?.papel as any}
      />

      <Dialog open={isFinalizarDialogOpen} onOpenChange={setIsFinalizarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Diário</DialogTitle>
            <DialogDescription>Tem certeza? Após finalizar, o diário não poderá mais ser editado.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFinalizarDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleFinalizarDiario} disabled={loading}>{loading ? 'Finalizando...' : 'Finalizar Diário'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SuccessToast
        message={successToast.message}
        description={successToast.description}
        open={successToast.open}
        onClose={() => setSuccessToast({ ...successToast, open: false })}
      />
    </div>
  );
}

export default DiariosList;
