import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash2, Filter, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { supabase } from '../../../lib/supabaseClient';

interface Ocorrencia {
  id: string;
  aluno_id: string;
  aluno_nome?: string;
  tipo: string;
  data: string;
  descricao: string;
  acao_tomada?: string;
  created_at?: string;
}

export function OcorrenciasList() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [editingOcorrencia, setEditingOcorrencia] = useState<Ocorrencia | null>(null);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    tipo: '',
    dataInicio: '',
    dataFim: ''
  });

  const [formData, setFormData] = useState({
    aluno_id: '',
    tipo: '',
    data: '',
    descricao: '',
    acao_tomada: ''
  });

  const loadOcorrencias = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ocorrencias')
        .select(`
          *,
          alunos:aluno_id (nome)
        `)
        .order('data', { ascending: false });

      if (data) {
        // Mapeia os dados para incluir o nome do aluno
        const ocorrenciasComNome = data.map((occ: any) => ({
          ...occ,
          aluno_nome: occ.alunos?.nome || 'Desconhecido'
        }));
        setOcorrencias(ocorrenciasComNome);
      }
    } catch (error) {
      console.error('Erro ao carregar ocorrências:', error);
      alert('Erro ao carregar ocorrências');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOcorrencias();
  }, [loadOcorrencias]);

  const filteredOcorrencias = useMemo(() => {
    return ocorrencias.filter(ocorrencia => {
      if (searchTerm && !ocorrencia.aluno_id.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !ocorrencia.descricao.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      if (filters.tipo && ocorrencia.tipo !== filters.tipo) {
        return false;
      }

      if (filters.dataInicio && new Date(ocorrencia.data) < new Date(filters.dataInicio)) {
        return false;
      }

      if (filters.dataFim && new Date(ocorrencia.data) > new Date(filters.dataFim)) {
        return false;
      }

      return true;
    });
  }, [ocorrencias, searchTerm, filters]);

  const resetForm = useCallback(() => {
    setFormData({
      aluno_id: '',
      tipo: '',
      data: '',
      descricao: '',
      acao_tomada: ''
    });
    setEditingOcorrencia(null);
    setIsDialogOpen(false);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.aluno_id || !formData.tipo || !formData.data || !formData.descricao) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);

      if (editingOcorrencia) {
        const { error } = await supabase
          .from('ocorrencias')
          .update(formData)
          .eq('id', editingOcorrencia.id);

        if (error) throw error;
        alert('Ocorrência atualizada!');
      } else {
        const { error } = await supabase
          .from('ocorrencias')
          .insert([formData]);

        if (error) throw error;
        alert('Ocorrência criada!');
      }

      await loadOcorrencias();
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar ocorrência:', error);
      alert('Erro ao salvar ocorrência');
    } finally {
      setLoading(false);
    }
  }, [formData, editingOcorrencia, loadOcorrencias, resetForm]);

  const handleEdit = useCallback((ocorrencia: Ocorrencia) => {
    setEditingOcorrencia(ocorrencia);
    setFormData({
      aluno_id: ocorrencia.aluno_id,
      tipo: ocorrencia.tipo,
      data: ocorrencia.data,
      descricao: ocorrencia.descricao,
      acao_tomada: ocorrencia.acao_tomada || ''
    });
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta ocorrência?')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('ocorrencias')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadOcorrencias();
      alert('Ocorrência excluída!');
    } catch (error) {
      console.error('Erro ao excluir ocorrência:', error);
      alert('Erro ao excluir ocorrência');
    } finally {
      setLoading(false);
    }
  }, [loadOcorrencias]);

  const getTipoColor = (tipo: string) => {
    switch(tipo?.toLowerCase()) {
      case 'comportamento':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'falta':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'positivo':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl font-bold">Ocorrências</CardTitle>
            <CardDescription>Registre e gerencie ocorrências dos alunos</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Ocorrência
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingOcorrencia ? 'Editar Ocorrência' : 'Nova Ocorrência'}</DialogTitle>
                <DialogDescription>
                  {editingOcorrencia ? 'Atualize a ocorrência' : 'Registre uma nova ocorrência de aluno'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="aluno">ID do Aluno *</Label>
                      <Input
                        id="aluno"
                        value={formData.aluno_id}
                        onChange={(e) => setFormData({ ...formData, aluno_id: e.target.value })}
                        placeholder="ID do aluno"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="tipo">Tipo *</Label>
                      <Select 
                        value={formData.tipo}
                        onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Comportamento">Comportamento</SelectItem>
                          <SelectItem value="Falta">Falta</SelectItem>
                          <SelectItem value="Positivo">Positivo</SelectItem>
                          <SelectItem value="Outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="data">Data *</Label>
                    <Input
                      id="data"
                      type="date"
                      value={formData.data}
                      onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="descricao">Descrição *</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Descreva a ocorrência..."
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="acao">Ação Tomada (opcional)</Label>
                    <Textarea
                      id="acao"
                      value={formData.acao_tomada}
                      onChange={(e) => setFormData({ ...formData, acao_tomada: e.target.value })}
                      placeholder="Qual ação foi tomada?"
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : (editingOcorrencia ? 'Atualizar' : 'Criar')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por aluno ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Filtrar Ocorrências</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="filterTipo">Tipo</Label>
                    <Select 
                      value={filters.tipo}
                      onValueChange={(value) => setFilters({ ...filters, tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos</SelectItem>
                        <SelectItem value="Comportamento">Comportamento</SelectItem>
                        <SelectItem value="Falta">Falta</SelectItem>
                        <SelectItem value="Positivo">Positivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dataInicio">Data Início</Label>
                    <Input
                      id="dataInicio"
                      type="date"
                      value={filters.dataInicio}
                      onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="dataFim">Data Fim</Label>
                    <Input
                      id="dataFim"
                      type="date"
                      value={filters.dataFim}
                      onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFilters({ tipo: '', dataInicio: '', dataFim: '' })}
                  >
                    Limpar
                  </Button>
                  <Button type="button" onClick={() => setIsFilterDialogOpen(false)}>
                    Aplicar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loading && <div className="text-center py-8 text-gray-500">Carregando...</div>}

          {!loading && (
            <div className="space-y-4">
              {filteredOcorrencias.map((ocorrencia) => (
                <div key={ocorrencia.id} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getTipoColor(ocorrencia.tipo)}>
                        {ocorrencia.tipo}
                      </Badge>
                      <span className="text-sm font-medium text-gray-600">
                        {ocorrencia.aluno_nome || `Aluno #${ocorrencia.aluno_id}`}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{ocorrencia.descricao}</p>
                    {ocorrencia.acao_tomada && (
                      <p className="text-xs text-gray-600 mb-2">
                        <strong>Ação:</strong> {ocorrencia.acao_tomada}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      📅 {formatDate(ocorrencia.data)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(ocorrencia)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(ocorrencia.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {filteredOcorrencias.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma ocorrência encontrada</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default OcorrenciasList;
