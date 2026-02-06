import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash2, Filter, AlertCircle, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { supabase } from '../../../lib/supabaseClient';
import { supabaseService } from '../../../services/supabaseService';

interface Ocorrencia {
  id: string;
  aluno_id: string;
  aluno_nome?: string;
  turma_id?: number;
  tipo: string;
  data: string;
  descricao: string;
  acao_tomada?: string;
  created_at?: string;
}

export function OcorrenciasList() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
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

  const loadTurmas = useCallback(async () => {
    try {
      const turmasData = await supabaseService.getTurmas();
      setTurmas(turmasData);
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
    }
  }, []);

  const loadOcorrencias = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ocorrencias')
        .select(`
          *,
          alunos:aluno_id (nome, turma_id)
        `)
        .order('data', { ascending: false });

      if (data) {
        const ocorrenciasComNome = data.map((occ: any) => ({
          ...occ,
          aluno_nome: occ.alunos?.nome || 'Desconhecido',
          turma_id: occ.alunos?.turma_id
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
    loadTurmas();
  }, [loadOcorrencias, loadTurmas]);

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
        return 'bg-red-500 text-white';
      case 'falta':
        return 'bg-yellow-500 text-white';
      case 'positivo':
        return 'bg-green-500 text-white';
      case 'elogio':
        return 'bg-blue-500 text-white';
      case 'disciplinar':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const capitalize = (text: string) => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const getTurmaNome = (turmaId?: number) => {
    if (!turmaId) return 'N/A';
    return turmas.find(t => t.id === turmaId)?.nome || 'N/A';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem' }}>
          <div>
            <h3 className="card-title">Ocorrências</h3>
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
                          <SelectItem value="Elogio">Elogio</SelectItem>
                          <SelectItem value="Disciplinar">Disciplinar</SelectItem>
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
                        <SelectItem value="Elogio">Elogio</SelectItem>
                        <SelectItem value="Disciplinar">Disciplinar</SelectItem>
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
                      <span className={`${getTipoColor(ocorrencia.tipo)} rounded-full px-3 py-1 text-xs font-semibold`}>
                        {capitalize(ocorrencia.tipo)}
                      </span>
                      <span className="text-sm font-medium text-gray-600">
                        {ocorrencia.aluno_nome}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      Turma: <strong>{getTurmaNome(ocorrencia.turma_id)}</strong>
                    </p>
                    <p className="text-sm text-gray-700 mb-2">{ocorrencia.descricao}</p>
                    {ocorrencia.acao_tomada && (
                      <p className="text-xs text-gray-600 mb-2">
                        <strong>Ação:</strong> {ocorrencia.acao_tomada}
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {formatDate(ocorrencia.data)}
                    </div>
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
