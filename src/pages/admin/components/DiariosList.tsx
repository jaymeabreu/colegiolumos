import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash2, Users, Filter, CheckCircle, Clock, RotateCcw, XCircle, AlertCircle, Eye, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
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
      } catch (error) {
        console.error('Erro ao filtrar professores:', error);
        setProfessoresFiltrados(professores);
      }
    };
    filtrarProfessores();
  }, [formData.disciplinaId, professores]);

  const filteredDiarios = useMemo(() => {
    return diarios.filter(diario => {
      if (searchTerm && diario.nome && !diario.nome.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (filters.disciplina && filters.disciplina !== 'all' && diario.disciplina_id?.toString() !== filters.disciplina) return false;
      if (filters.turma && filters.turma !== 'all' && diario.turma_id?.toString() !== filters.turma) return false;
      if (filters.professor && filters.professor !== 'all' && diario.professor_id?.toString() !== filters.professor) return false;
      if (filters.statusDiario && filters.statusDiario !== 'all' && diario.status !== filters.statusDiario) return false;
      return true;
    });
  }, [diarios, searchTerm, filters]);

  const resetForm = () => {
    setFormData({ nome: '', disciplinaId: '', turmaId: '', professorId: '', bimestre: '', dataInicio: '', dataTermino: '' });
    setEditingDiario(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (diario: Diario) => {
    setEditingDiario(diario);
    setFormData({
      nome: diario.nome || '',
      disciplinaId: diario.disciplina_id?.toString() || '',
      turmaId: diario.turma_id?.toString() || '',
      professorId: diario.professor_id?.toString() || '',
      bimestre: diario.bimestre?.toString() || '1',
      dataInicio: diario.dataInicio || '',
      dataTermino: diario.dataTermino || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este diário?')) {
      try {
        setLoading(true);
        await supabaseService.deleteDiario(id);
        await loadData();
      } finally {
        setLoading(false);
      }
    }
  };

  const handleViewDiario = (diario: Diario) => {
    setSelectedDiario(diario);
    setIsViewModalOpen(true);
  };

  const handleFinalizarDiario = async () => {
    if (!selectedDiario || !currentUser) return;
    try {
      setLoading(true);
      const sucesso = await supabaseService.finalizarDiario(selectedDiario.id, currentUser.id);
      if (sucesso) {
        await loadData();
        setIsFinalizarDialogOpen(false);
        setIsViewModalOpen(false);
        setSelectedDiario(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const getDisciplinaNome = (id?: number) => disciplinas.find(d => d.id === id)?.nome || 'N/A';
  const getTurmaNome = (id?: number) => turmas.find(t => t.id === id)?.nome || 'N/A';
  const getStatusDiarioInfo = (status?: string) => {
    switch (status) {
      case 'ENTREGUE': return { label: 'Pendente de Revisão', color: 'text-blue-600 bg-blue-50', icon: Clock };
      case 'DEVOLVIDO': return { label: 'Devolvido', color: 'text-orange-600 bg-orange-50', icon: RotateCcw };
      case 'FINALIZADO': return { label: 'Finalizado', color: 'text-green-600 bg-green-50', icon: CheckCircle };
      default: return { label: 'Pendente', color: 'text-gray-600 bg-gray-50', icon: Clock };
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Diários de Classe</CardTitle>
            <CardDescription>Gerencie os diários de classe da instituição</CardDescription>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}><Plus className="h-4 w-4 mr-2" /> Novo Diário</Button>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input placeholder="Buscar diários..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="space-y-4">
            {filteredDiarios.map((diario) => {
              const statusInfo = getStatusDiarioInfo(diario.status);
              const StatusIcon = statusInfo.icon;
              return (
                <div key={diario.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{diario.nome}</h3>
                    <div className="text-sm text-gray-500">
                      {getDisciplinaNome(diario.disciplina_id)} - {getTurmaNome(diario.turma_id)}
                    </div>
                    <Badge className={`mt-2 ${statusInfo.color}`} variant="outline">
                      <StatusIcon className="h-3 w-3 mr-1" /> {statusInfo.label}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewDiario(diario)}>Revisar</Button>
                    <Button variant="outline" size="icon" onClick={() => handleEdit(diario)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(diario.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <DiarioViewModal
        diario={selectedDiario}
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        onDevolver={() => {
          setIsViewModalOpen(false);
          setTimeout(() => setIsDevolverModalOpen(true), 100);
        }}
        onFinalizar={() => {
          setIsViewModalOpen(false);
          setTimeout(() => setIsFinalizarDialogOpen(true), 100);
        }}
        loading={loading}
        userRole={currentUser?.papel as any}
      />

      <DevolverDiarioModal
        diario={selectedDiario}
        open={isDevolverModalOpen}
        onOpenChange={(open) => {
          setIsDevolverModalOpen(open);
          if (!open) setSelectedDiario(null);
        }}
        onSuccess={async () => {
          await loadData();
          setIsDevolverModalOpen(false);
          setSelectedDiario(null);
        }}
      />

      <Dialog open={isFinalizarDialogOpen} onOpenChange={setIsFinalizarDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Finalizar Diário</DialogTitle></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFinalizarDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleFinalizarDiario} disabled={loading}>Finalizar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DiariosList;
