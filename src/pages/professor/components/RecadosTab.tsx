import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit, Trash2, MessageSquare, Calendar, Users, User, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
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

  const loadData = async () => {
    try {
      setLoading(true);
      if (diarioId) {
        const diarios = await supabaseService.getDiarios();
        const diarioAtual = diarios.find(d => d.id === diarioId);
        if (diarioAtual) {
          setDiario(diarioAtual);
          if (diarioAtual.turma_id) {
            const alunosData = await supabaseService.getAlunosByTurma(diarioAtual.turma_id);
            setAlunos(alunosData || []);
          }
        }
      }

      if (user?.professorId) {
        const recadosData = await supabaseService.getRecadosByProfessor(user.professorId);
        let recadosFiltrados = recadosData || [];
        if (diarioId && diario?.turma_id) {
          recadosFiltrados = recadosFiltrados.filter(r => (r.turmaId || r.turma_id) === diario.turma_id);
        }
        setRecados(recadosFiltrados.sort((a, b) => 
          new Date(b.dataEnvio || b.data_envio || '').getTime() - new Date(a.dataEnvio || a.data_envio || '').getTime()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.mensagem.trim() || !diario?.turma_id) return;

    try {
      const turma = turmas.find(t => t.id === diario.turma_id);
      const aluno = formData.alunoId ? alunos.find(a => a.id === parseInt(formData.alunoId)) : null;

      const data = {
        titulo: formData.titulo.trim(),
        mensagem: formData.mensagem.trim(),
        professorId: user?.professorId || 1,
        professorNome: user?.nome || 'Professor',
        turmaId: diario.turma_id,
        turmaNome: turma?.nome || '',
        alunoId: formData.alunoId ? parseInt(formData.alunoId) : null,
        alunoNome: aluno?.nome || null,
        dataEnvio: new Date().toISOString().split('T')[0]
      };

      if (editingRecado) {
        await supabaseService.updateRecado(editingRecado.id, data);
      } else {
        await supabaseService.createRecado(data);
      }
      handleCloseDialog();
      await loadData();
    } catch (error) {
      console.error('Erro ao salvar recado:', error);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRecado(null);
    setFormData({ titulo: '', mensagem: '', alunoId: '' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <CardTitle>Recados</CardTitle>
            <CardDescription>Envie recados para a turma ou alunos específicos</CardDescription>
          </div>
          <Button onClick={() => { setEditingRecado(null); setIsDialogOpen(true); }} className="bg-[#0e4a5e] hover:bg-[#0a3645]">
            <Plus className="h-4 w-4 mr-2" />
            Novo Recado
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Listagem de recados original aqui */}
      </CardContent>

      {/* PORTAL DO MODAL DE RECADO */}
      {isDialogOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseDialog} />
          <div className="relative bg-white w-full max-w-xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold">{editingRecado ? 'Editar Recado' : 'Novo Recado'}</h2>
                <p className="text-sm text-gray-500">Envie uma mensagem para a turma ou aluno.</p>
              </div>
              <button onClick={handleCloseDialog} className="p-2 rounded-full hover:bg-gray-100"><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-2">
                <Label>Destinatário (Opcional - Vazio para toda a turma)</Label>
                <Select value={formData.alunoId} onValueChange={(val) => setFormData({ ...formData, alunoId: val })}>
                  <SelectTrigger><SelectValue placeholder="Selecione um aluno (opcional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toda a Turma</SelectItem>
                    {alunos.map(aluno => (
                      <SelectItem key={aluno.id} value={aluno.id.toString()}>{aluno.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="titulo">Título do Recado</Label>
                <Input id="titulo" value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} placeholder="Ex: Reunião de Pais" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mensagem">Mensagem</Label>
                <Textarea id="mensagem" value={formData.mensagem} onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })} placeholder="Digite o conteúdo do recado..." required className="min-h-[150px]" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
                <Button type="submit" className="bg-[#0e4a5e] hover:bg-[#0a3645]">{editingRecado ? 'Salvar' : 'Enviar Recado'}</Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </Card>
  );
}
