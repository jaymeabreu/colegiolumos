import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit, Trash2, MessageSquare, Calendar, Users, User, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
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
      const aluno = (formData.alunoId && formData.alunoId !== 'all') ? alunos.find(a => a.id === parseInt(formData.alunoId)) : null;

      // SOLUÇÃO DEFINITIVA: Mapeamento para snake_case compatível com Supabase
      const dataToSave = {
        titulo: formData.titulo.trim(),
        mensagem: formData.mensagem.trim(),
        professor_id: user?.professorId || 1,
        professor_nome: user?.nome || 'Professor',
        turma_id: diario.turma_id,
        turma_nome: turma?.nome || '',
        aluno_id: (formData.alunoId && formData.alunoId !== 'all') ? parseInt(formData.alunoId) : null,
        aluno_nome: aluno?.nome || null,
        data_envio: new Date().toISOString().split('T')[0]
      };

      if (editingRecado) {
        await supabaseService.updateRecado(editingRecado.id, dataToSave);
      } else {
        await supabaseService.createRecado(dataToSave);
      }
      handleCloseDialog();
      await loadData();
    } catch (error) {
      console.error('Erro ao salvar recado:', error);
      alert('Erro ao salvar recado. Tente novamente.');
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRecado(null);
    setFormData({ titulo: '', mensagem: '', alunoId: '' });
  };

  const handleEdit = (recado: Recado) => {
    setEditingRecado(recado);
    setFormData({
      titulo: recado.titulo,
      mensagem: recado.mensagem,
      alunoId: (recado.aluno_id ?? recado.alunoId)?.toString() || 'all'
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este recado?')) {
      try {
        await supabaseService.deleteRecado(id);
        await loadData();
      } catch (error) {
        console.error('Erro ao excluir recado:', error);
      }
    }
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
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : recados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum recado enviado.</div>
          ) : (
            recados.map(recado => (
              <div key={recado.id} className="p-4 border rounded-lg flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{recado.titulo}</h3>
                    <p className="text-xs text-gray-500">
                      Para: {recado.aluno_nome || recado.alunoNome || 'Toda a Turma'} • 
                      {new Date(recado.data_envio || recado.dataEnvio || '').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(recado)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(recado.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{recado.mensagem}</p>
              </div>
            ))
          )}
        </div>
      </CardContent>

      {isDialogOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseDialog} />
          <div className="relative bg-white w-full max-w-xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold">{editingRecado ? 'Editar Recado' : 'Novo Recado'}</h2>
                <p className="text-sm text-gray-500">Envie uma mensagem para a turma ou aluno.</p>
              </div>
              <button onClick={handleCloseDialog} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-2">
                <Label htmlFor="aluno">Destinatário (Opcional - Vazio para toda a turma)</Label>
                {/* SOLUÇÃO DEFINITIVA: Select nativo estilizado para evitar conflitos de foco do Radix UI */}
                <select
                  id="aluno"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.alunoId}
                  onChange={(e) => setFormData({ ...formData, alunoId: e.target.value })}
                >
                  <option value="all">Toda a Turma</option>
                  {alunos.map(aluno => (
                    <option key={aluno.id} value={aluno.id.toString()}>{aluno.nome}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="titulo">Título do Recado</Label>
                <Input id="titulo" value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} placeholder="Ex: Reunião de Pais" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mensagem">Mensagem</Label>
                <Textarea id="mensagem" value={formData.mensagem} onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })} placeholder="Digite o conteúdo do recado..." required className="min-h-[150px]" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
                <Button type="submit" className="bg-[#0e4a5e] hover:bg-[#0a3645]">{editingRecado ? 'Salvar Alterações' : 'Enviar Recado'}</Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </Card>
  );
}
