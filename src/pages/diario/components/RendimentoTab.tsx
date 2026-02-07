import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea'; 
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { supabaseService } from '../../../services/supabaseService';
import type { Aluno } from '../../../services/supabaseService';

interface RendimentoData {
  id?: number;
  aluno_id: number;
  alunoId?: number;
  diario_id: number;
  diarioId?: number;
  tipo: string;
  percentual: number;
  observacoes?: string;
  data: string;
}

interface RendimentoTabProps {
  diarioId: number;
  readOnly?: boolean;
}

export function RendimentoTab({ diarioId, readOnly = false }: RendimentoTabProps) {
  const [rendimentos, setRendimentos] = useState<RendimentoData[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRendimento, setEditingRendimento] = useState<RendimentoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    alunoId: '',
    tipo: 'Excelente',
    percentual: '100',
    observacoes: '',
    data: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, [diarioId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const alunosData = await supabaseService.getAlunosByDiario(diarioId);
      setAlunos(alunosData || []);
      setRendimentos([]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.alunoId || !formData.tipo) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setSubmitting(true);
      const data: RendimentoData = {
        aluno_id: parseInt(formData.alunoId),
        diario_id: diarioId,
        tipo: formData.tipo,
        percentual: parseInt(formData.percentual),
        observacoes: formData.observacoes || undefined,
        data: formData.data
      };

      if (editingRendimento) {
        const updatedRendimento: RendimentoData = {
          ...data,
          id: editingRendimento.id
        };
        setRendimentos(prev => 
          prev.map(r => r.id === editingRendimento.id ? updatedRendimento : r)
        );
      } else {
        const novoRendimento: RendimentoData = {
          ...data,
          id: Date.now()
        };
        setRendimentos(prev => [novoRendimento, ...prev]);
      }

      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar rendimento:', error);
      alert('Erro ao salvar rendimento. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (rendimento: RendimentoData) => {
    setEditingRendimento(rendimento);
    setFormData({
      alunoId: (rendimento.aluno_id ?? rendimento.alunoId)?.toString() || '',
      tipo: rendimento.tipo,
      percentual: rendimento.percentual.toString(),
      observacoes: rendimento.observacoes || '',
      data: rendimento.data
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number | undefined) => {
    if (window.confirm('Tem certeza que deseja excluir este rendimento?')) {
      if (id) {
        setRendimentos(prev => prev.filter(r => r.id !== id));
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRendimento(null);
    setFormData({
      alunoId: '',
      tipo: 'Excelente',
      percentual: '100',
      observacoes: '',
      data: new Date().toISOString().split('T')[0]
    });
  };

  const getPerformanceColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'excelente':
        return 'bg-green-100 text-green-800';
      case 'bom':
        return 'bg-blue-100 text-blue-800';
      case 'satisfatório':
        return 'bg-yellow-100 text-yellow-800';
      case 'inadequado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRendimento ? 'Editar Rendimento' : 'Novo Rendimento'}</DialogTitle>
            <DialogDescription>
              {editingRendimento
                ? 'Edite os dados de rendimento do aluno.'
                : 'Registre o rendimento de um aluno.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="aluno">Aluno *</Label>
              <Select value={formData.alunoId} onValueChange={value => setFormData(prev => ({ ...prev, alunoId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o aluno" />
                </SelectTrigger>
                <SelectContent>
                  {alunos.map(aluno => (
                    <SelectItem key={aluno.id} value={aluno.id.toString()}>
                      {aluno.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Rendimento *</Label>
                <Select value={formData.tipo} onValueChange={value => setFormData(prev => ({ ...prev, tipo: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Excelente">Excelente</SelectItem>
                    <SelectItem value="Bom">Bom</SelectItem>
                    <SelectItem value="Satisfatório">Satisfatório</SelectItem>
                    <SelectItem value="Inadequado">Inadequado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="percentual">Percentual *</Label>
                <Input
                  id="percentual"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.percentual}
                  onChange={e => setFormData(prev => ({ ...prev, percentual: e.target.value }))}
                  placeholder="0-100"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data">Data *</Label>
              <Input
                id="data"
                type="date"
                value={formData.data}
                onChange={e => setFormData(prev => ({ ...prev, data: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={e => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações sobre o rendimento..."
                className="min-h-[80px]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Salvando...' : editingRendimento ? 'Salvar Alterações' : 'Adicionar Rendimento'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Rendimento
              </CardTitle>
              <CardDescription>Acompanhe o rendimento dos alunos</CardDescription>
            </div>
            {!readOnly && (
              <Button 
                onClick={() => { handleCloseModal(); setIsModalOpen(true); }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Novo Rendimento
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando rendimentos...</p>
              </div>
            </div>
          ) : rendimentos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium mb-1">Nenhum rendimento registrado</p>
              <p className="text-sm">Comece registrando o rendimento dos alunos.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rendimentos.map(rendimento => (
                <div 
                  key={rendimento.id} 
                  className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">
                        {alunos.find(a => a.id === (rendimento.aluno_id ?? rendimento.alunoId))?.nome || 'Aluno'}
                      </h3>
                      <Badge className={getPerformanceColor(rendimento.tipo)}>
                        {rendimento.tipo}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mb-2 text-sm text-gray-600">
                      <span>Percentual: <strong>{rendimento.percentual}%</strong></span>
                      <span>Data: {new Date(rendimento.data).toLocaleDateString('pt-BR')}</span>
                    </div>
                    {rendimento.observacoes && (
                      <p className="text-sm text-gray-600">{rendimento.observacoes}</p>
                    )}
                  </div>
                  {!readOnly && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(rendimento)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDelete(rendimento.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
