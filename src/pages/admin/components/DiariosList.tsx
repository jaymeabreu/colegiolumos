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
  const [isFinalizarDialogOpen, setIsFinalizarDialogOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingDiario, setEditingDiario] = useState<Diario | null>(null);
  const [selectedDiario, setSelectedDiario] = useState<Diario | null>(null);
  const [loading, setLoading] = useState(false);
  
  // ✅ CORREÇÃO: Pega o usuário diretamente do localStorage para não falhar
  const [currentUser] = useState<Usuario | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [successToast, setSuccessToast] = useState({ open: false, message: '', description: '' });
  
  const [formData, setFormData] = useState({
    nome: '', disciplinaId: '', turmaId: '', professorId: '', bimestre: '', dataInicio: '', dataTermino: ''
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [d, t, disc, u] = await Promise.all([
        supabaseService.getDiarios(),
        supabaseService.getTurmas(),
        supabaseService.getDisciplinas(),
        supabaseService.getUsuarios()
      ]);
      setDiarios(d); setTurmas(t); setDisciplinas(disc); setTodosUsuarios(u);
      setProfessores(u.filter(i => i.papel === 'PROFESSOR'));
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleFinalizarDiario = async () => {
    const diarioId = selectedDiario?.id || (selectedDiario as any)?.ID;
    // Tenta pegar o user do estado ou do storage agora mesmo
    const user = currentUser || JSON.parse(localStorage.getItem('user') || 'null');
    const userId = user?.id || user?.ID || user?.usuario_id;

    if (!diarioId || !userId) {
      alert('Erro: Usuário não identificado. Tente fazer login novamente.');
      return;
    }

    try {
      setLoading(true);
      const ok = await supabaseService.finalizarDiario(Number(diarioId), Number(userId));
      if (ok) {
        await loadData();
        setIsFinalizarDialogOpen(false); setIsViewModalOpen(false);
        setSuccessToast({ open: true, message: 'Finalizado!', description: 'Diário finalizado com sucesso.' });
      }
    } catch (e: any) { alert(e.message || 'Erro ao finalizar.'); } finally { setLoading(false); }
  };

  const getProfessorNome = (id?: number) => {
    if (!id) return 'N/A';
    return todosUsuarios.find(u => Number(u.id || (u as any).ID) === Number(id))?.nome || 'N/A';
  };

  return (
    <div className="space-y-6">
      <style>{`[data-radix-popper-content-wrapper] { z-index: 99999 !important; }`}</style>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Diários de Classe</CardTitle>
            <Button className="bg-teal-600" onClick={() => { setEditingDiario(null); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Novo Diário
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Input placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="mb-4" />
          <div className="grid gap-4">
            {diarios.filter(d => d.nome.toLowerCase().includes(searchTerm.toLowerCase())).map(diario => (
              <div key={diario.id} className="p-4 border rounded-lg flex justify-between items-center">
                <div>
                  <h4 className="font-bold">{diario.nome}</h4>
                  <p className="text-sm text-gray-500">Prof. {getProfessorNome(diario.professor_id)}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setSelectedDiario(diario); setIsViewModalOpen(true); }}><Eye className="h-4 w-4" /></Button>
                  {currentUser?.papel === 'COORDENADOR' && diario.status === 'ENTREGUE' && (
                    <Button className="bg-green-600" size="sm" onClick={() => { setSelectedDiario(diario); setIsFinalizarDialogOpen(true); }}>Finalizar</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <DiarioViewModal
        diario={selectedDiario} open={isViewModalOpen} onOpenChange={setIsViewModalOpen}
        onDevolver={loadData} onFinalizar={() => { setIsViewModalOpen(false); setIsFinalizarDialogOpen(true); }}
        loading={loading} userRole={currentUser?.papel as any}
      />

      <Dialog open={isFinalizarDialogOpen} onOpenChange={setIsFinalizarDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Finalizar Diário</DialogTitle></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFinalizarDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleFinalizarDiario} disabled={loading}>Finalizar Diário</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SuccessToast
        message={successToast.message} description={successToast.description} open={successToast.open}
        onClose={() => setSuccessToast({ ...successToast, open: false })}
      />
    </div>
  );
}
export default DiariosList;
