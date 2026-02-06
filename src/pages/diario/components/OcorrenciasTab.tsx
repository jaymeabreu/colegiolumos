import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Calendar, AlertTriangle, Edit, Trash2, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { supabaseService } from '../../../services/supabaseService';
import type { Ocorrencia, Aluno } from '../../../services/supabaseService';

interface OcorrenciasTabProps {
  diarioId: number;
  readOnly?: boolean;
}

export function OcorrenciasTab({ diarioId, readOnly = false }: OcorrenciasTabProps) {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOcorrencia, setEditingOcorrencia] = useState<Ocorrencia | null>(null);
  const [formData, setFormData] = useState({
    alunoId: '',
    tipo: '',
    data: '',
    descricao: '',
    acaoTomada: ''
  });

  useEffect(() => {
    loadData();
  }, [diarioId]);

  const loadData = async () => {
    try {
      const [alunosData, ocorrenciasData] = await Promise.all([
        supabaseService.getAlunosByDiario(diarioId),
        supabaseService.getOcorrencias()
      ]);
      setAlunos(alunosData || []);
      const filtered = (ocorrenciasData || []).filter(o => (o.diario_id ?? o.diarioId) === diarioId);
      setOcorrencias(filtered);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        aluno_id: parseInt(formData.alunoId),
        diario_id: diarioId,
        tipo: formData.tipo.toLowerCase(),
        data: formData.data,
        descricao: formData.descricao,
        acao_tomada: formData.acaoTomada || null
      };

      if (editingOcorrencia) {
        await supabaseService.updateOcorrencia(editingOcorrencia.id, data);
      } else {
        await supabaseService.createOcorrencia(data);
      }

      await loadData();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar ocorrência:', error);
    }
  };

  const resetForm = () => {
    setFormData({ alunoId: '', tipo: '', data: '', descricao: '', acaoTomada: '' });
    setEditingOcorrencia(null);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <CardTitle>Ocorrências</CardTitle>
            <CardDescription>Registre ocorrências disciplinares e pedagógicas</CardDescription>
          </div>
          {!readOnly && (
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="flex items-center gap-2 bg-[#0e4a5e] hover:bg-[#0a3645]">
              <Plus className="h-4 w-4" />
              <span>Nova Ocorrência</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* ... Listagem de ocorrências ... */}
      </CardContent>

      {/* PORTAL DO MODAL DE OCORRÊNCIA */}
      {isDialogOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative bg-white w-full max-w-xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">{editingOcorrencia ? 'Editar Ocorrência' : 'Nova Ocorrência'}</h2>
              <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-100"><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-2">
                <Label>Aluno *</Label>
                <Select value={formData.alunoId} onValueChange={(val) => setFormData({ ...formData, alunoId: val })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
                  <SelectContent>
                    {alunos.map(aluno => (
                      <SelectItem key={aluno.id} value={aluno.id.toString()}>{aluno.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select value={formData.tipo} onValueChange={(val) => setFormData({ ...formData, tipo: val })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Disciplinar">Disciplinar</SelectItem>
                      <SelectItem value="Pedagogica">Pedagógica</SelectItem>
                      <SelectItem value="Elogio">Elogio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data *</Label>
                  <Input type="date" value={formData.data} onChange={(e) => setFormData({ ...formData, data: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição *</Label>
                <Textarea value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} placeholder="Descreva a ocorrência..." required className="min-h-[100px]" />
              </div>
              <div className="space-y-2">
                <Label>Ação Tomada (Opcional)</Label>
                <Textarea value={formData.acaoTomada} onChange={(e) => setFormData({ ...formData, acaoTomada: e.target.value })} placeholder="Ação tomada..." className="min-h-[80px]" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
                <Button type="submit" className="bg-[#0e4a5e] hover:bg-[#0a3645]">{editingOcorrencia ? 'Salvar' : 'Criar'}</Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </Card>
  );
}
