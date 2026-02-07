import { useState, useEffect } from 'react';
import { Plus, AlertTriangle, Edit, Trash2, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { supabaseService } from '../../../services/supabaseService';
import type { Ocorrencia, Aluno } from '../../../services/supabaseService';

// Ícone de Calendário em SVG customizado
const CalendarIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

interface OcorrenciasTabProps {
  diarioId: number;
  readOnly?: boolean;
}

export function OcorrenciasTab({ diarioId, readOnly = false }: OcorrenciasTabProps) {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOcorrencia, setEditingOcorrencia] = useState<Ocorrencia | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
      setLoading(true);
      const [alunosData, ocorrenciasData] = await Promise.all([
        supabaseService.getAlunosByDiario(diarioId),
        supabaseService.getOcorrencias()
      ]);
      setAlunos(alunosData || []);
      const filtered = (ocorrenciasData || []).filter(o => (o.diario_id ?? o.diarioId) === diarioId);
      setOcorrencias(filtered);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
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
      handleClose();
    } catch (error) {
      console.error('Erro ao salvar ocorrência:', error);
      alert('Erro ao salvar ocorrência. Tente novamente.');
    } finally {
      setSubmitting(false);
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

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta ocorrência?')) {
      try {
        await supabaseService.deleteOcorrencia(id);
        await loadData();
      } catch (error) {
        console.error('Erro ao excluir ocorrência:', error);
        alert('Erro ao excluir ocorrência. Tente novamente.');
      }
    }
  };

  const handleEdit = (ocorrencia: Ocorrencia) => {
    setEditingOcorrencia(ocorrencia);
    setFormData({
      alunoId: (ocorrencia.aluno_id ?? ocorrencia.alunoId)?.toString() || '',
      tipo: ocorrencia.tipo.charAt(0).toUpperCase() + ocorrencia.tipo.slice(1),
      data: ocorrencia.data,
      descricao: ocorrencia.descricao,
      acaoTomada: ocorrencia.acao_tomada || ocorrencia.acaoTomada || ''
    });
    setIsDialogOpen(true);
  };

  const handleOpenDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <CardTitle>Ocorrências</CardTitle>
              <CardDescription>Registre ocorrências disciplinares e pedagógicas</CardDescription>
            </div>
            {!readOnly && (
              <Button onClick={handleOpenDialog} className="flex items-center gap-2 bg-[#0e4a5e] hover:bg-[#0a3645]">
                <Plus className="h-4 w-4" />
                <span>Nova Ocorrência</span>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {ocorrencias.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma ocorrência registrada.
              </div>
            ) : (
              ocorrencias.map(ocorrencia => (
                <div key={ocorrencia.id} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={ocorrencia.tipo === 'elogio' ? 'outline' : 'destructive'} className="capitalize">
                        {ocorrencia.tipo}
                      </Badge>
                      <h3 className="font-medium text-gray-900">{alunos.find(a => a.id === (ocorrencia.aluno_id ?? ocorrencia.alunoId))?.nome || 'Aluno'}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{ocorrencia.descricao}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        {new Date(ocorrencia.data).toLocaleDateString('pt-BR')}
                      </span>
                      {(ocorrencia.acao_tomada || ocorrencia.acaoTomada) && (
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Ação: {ocorrencia.acao_tomada || ocorrencia.acaoTomada}
                        </span>
                      )}
                    </div>
                  </div>
                  {!readOnly && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(ocorrencia)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(ocorrencia.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* DIALOG DO MODAL DE OCORRÊNCIA */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOcorrencia ? 'Editar Ocorrência' : 'Nova Ocorrência'}</DialogTitle>
            <DialogDescription>
              {editingOcorrencia ? 'Edite as informações da ocorrência.' : 'Registre uma nova ocorrência.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Button type="submit" disabled={submitting} className="bg-[#0e4a5e] hover:bg-[#0a3645]">
                {submitting ? 'Salvando...' : editingOcorrencia ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
