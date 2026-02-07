import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Filter, AlertCircle, Calendar, User } from 'lucide-react';
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
  usuario_id: string;
  usuario_nome?: string;
  tipo_usuario?: 'aluno' | 'professor';
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
  const [alunos, setAlunos] = useState<any[]>([]);
  const [professores, setProfessores] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [editingOcorrencia, setEditingOcorrencia] = useState<Ocorrencia | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [usuarioBusca, setUsuarioBusca] = useState('');
  const [showUsuariosList, setShowUsuariosList] = useState(false);

  const [filters, setFilters] = useState<{
    tipo: string | undefined;
    dataInicio: string;
    dataFim: string;
  }>({
    tipo: undefined,
    dataInicio: '',
    dataFim: ''
  });

  const [formData, setFormData] = useState({
    usuarioId: '',
    tipo: '',
    data: '',
    descricao: '',
    acao_tomada: ''
  });

  const todosUsuarios = [
    ...alunos.map(a => ({ id: a.id, nome: a.nome, tipo: 'Aluno', turma_id: a.turma_id })),
    ...professores.map(p => ({ id: p.id, nome: p.nome, tipo: 'Professor' }))
  ].sort((a, b) => a.nome.localeCompare(b.nome));

  const usuariosFiltrados = todosUsuarios.filter(usuario =>
    usuario.nome.toLowerCase().includes(usuarioBusca.toLowerCase())
  ).slice(0, 50);

  useEffect(() => {
    const handleClickOutside = () => setShowUsuariosList(false);
    if (showUsuariosList) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showUsuariosList]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [turmasData, alunosData, professoresData] = await Promise.all([
        supabaseService.getTurmas(),
        supabaseService.getAlunos(),
        supabaseService.getProfessores()
      ]);
      
      setTurmas(turmasData);
      setAlunos(alunosData);
      setProfessores(professoresData);
      
      await loadOcorrencias(alunosData, professoresData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOcorrencias = async (alunosData?: any[], professoresData?: any[]) => {
    try {
      const { data, error } = await supabase
        .from('ocorrencias')
        .select('*')
        .order('data', { ascending: false });

      if (error) {
        console.error('Erro ao carregar ocorrências:', error);
        return;
      }

      if (data) {
        const alunosList = alunosData || alunos;
        const professoresList = professoresData || professores;
        
        const ocorrenciasComNome = data.map((occ: any) => {
          const aluno = alunosList.find(a => a.id.toString() === occ.usuario_id);
          const professor = professoresList.find(p => p.id.toString() === occ.usuario_id);
          const usuario = aluno || professor;
          
          return {
            ...occ,
            usuario_nome: usuario?.nome || 'Desconhecido',
            turma_id: aluno?.turma_id,
            tipo_usuario: occ.tipo_usuario
          };
        });
        setOcorrencias(ocorrenciasComNome);
      }
    } catch (error) {
      console.error('Erro ao carregar ocorrências:', error);
    }
  };

  const filteredOcorrencias = ocorrencias.filter(ocorrencia => {
    if (searchTerm && !ocorrencia.usuario_nome?.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !ocorrencia.descricao.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    if (filters.tipo && filters.tipo !== 'todos' && ocorrencia.tipo !== filters.tipo) {
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

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingOcorrencia(null);
    setFormData({
      usuarioId: '',
      tipo: '',
      data: '',
      descricao: '',
      acao_tomada: ''
    });
    setUsuarioBusca('');
    setShowUsuariosList(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.usuarioId || !formData.tipo || !formData.data || !formData.descricao) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);

      const aluno = alunos.find(a => a.id.toString() === formData.usuarioId);
      const tipoUsuario = aluno ? 'aluno' : 'professor';

      const dataToSave = {
        usuario_id: formData.usuarioId,
        tipo_usuario: tipoUsuario,
        tipo: formData.tipo,
        data: formData.data,
        descricao: formData.descricao,
        acao_tomada: formData.acao_tomada || null
      };

      if (editingOcorrencia) {
        const { error } = await supabase
          .from('ocorrencias')
          .update(dataToSave)
          .eq('id', editingOcorrencia.id);

        if (error) {
          console.error('Erro do Supabase:', error);
          throw error;
        }
        alert('Ocorrência atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('ocorrencias')
          .insert([dataToSave]);

        if (error) {
          console.error('Erro do Supabase:', error);
          throw error;
        }
        alert('Ocorrência criada com sucesso!');
      }

      await loadOcorrencias();
      handleCloseDialog();
    } catch (error: any) {
      console.error('Erro completo ao salvar ocorrência:', error);
      alert(`Erro ao salvar ocorrência: ${error.message || 'Tente novamente'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ocorrencia: Ocorrencia) => {
    setEditingOcorrencia(ocorrencia);
    
    const aluno = alunos.find(a => a.id.toString() === ocorrencia.usuario_id);
    const professor = professores.find(p => p.id.toString() === ocorrencia.usuario_id);
    const usuarioNome = aluno ? `${aluno.nome} (Aluno)` : professor ? `${professor.nome} (Professor)` : '';

    setFormData({
      usuarioId: ocorrencia.usuario_id,
      tipo: ocorrencia.tipo,
      data: ocorrencia.data,
      descricao: ocorrencia.descricao,
      acao_tomada: ocorrencia.acao_tomada || ''
    });
    
    setUsuarioBusca(usuarioNome);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta ocorrência?')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('ocorrencias')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadOcorrencias();
      alert('Ocorrência excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir ocorrência:', error);
      alert('Erro ao excluir ocorrência');
    } finally {
      setLoading(false);
    }
  };

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

  const getTipoUsuarioBadge = (tipo?: 'aluno' | 'professor') => {
    if (tipo === 'professor') {
      return <Badge className="bg-purple-500 text-white">Professor</Badge>;
    }
    return <Badge className="bg-blue-500 text-white">Aluno</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem' }}>
          <div>
            <h3 className="card-title">Ocorrências</h3>
            <CardDescription>Registre e gerencie ocorrências de alunos e professores</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { handleCloseDialog(); setIsDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Ocorrência
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] lg:max-w-[800px] max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingOcorrencia ? 'Editar Ocorrência' : 'Nova Ocorrência'}</DialogTitle>
                <DialogDescription>
                  {editingOcorrencia ? 'Atualize a ocorrência' : 'Registre uma nova ocorrência de aluno ou professor'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="usuarioSearch">Buscar usuário *</Label>
                  <div className="relative" onClick={e => e.stopPropagation()}>
                    <Input
                      id="usuarioSearch"
                      type="text"
                      placeholder="Digite o nome do aluno ou professor..."
                      value={usuarioBusca}
                      onChange={e => setUsuarioBusca(e.target.value)}
                      onFocus={() => setShowUsuariosList(true)}
                      disabled={loading}
                      autoComplete="off"
                    />
                    
                    {showUsuariosList && usuariosFiltrados.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {usuariosFiltrados.map(usuario => (
                          <button
                            key={`${usuario.tipo}-${usuario.id}`}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, usuarioId: usuario.id.toString() }));
                              setUsuarioBusca(`${usuario.nome} (${usuario.tipo})`);
                              setShowUsuariosList(false);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          >
                            <div className="font-medium">{usuario.nome}</div>
                            <div className="text-xs text-gray-500">
                              {usuario.tipo}
                              {usuario.turma_id && ` • Turma: ${getTurmaNome(usuario.turma_id)}`}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {showUsuariosList && usuarioBusca && usuariosFiltrados.length === 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg p-4 text-center text-gray-500">
                        Nenhum usuário encontrado
                      </div>
                    )}
                  </div>

                  {formData.usuarioId && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      <span>Selecionado: {usuarioBusca}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, usuarioId: '' }));
                          setUsuarioBusca('');
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo de Ocorrência *</Label>
                    <Select 
                      value={formData.tipo}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}
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

                  <div className="space-y-2">
                    <Label htmlFor="data">Data *</Label>
                    <Input
                      id="data"
                      type="date"
                      value={formData.data}
                      onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição *</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Descreva a ocorrência..."
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="acao">Ação Tomada (opcional)</Label>
                  <Textarea
                    id="acao"
                    value={formData.acao_tomada}
                    onChange={(e) => setFormData(prev => ({ ...prev, acao_tomada: e.target.value }))}
                    placeholder="Qual ação foi tomada?"
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : (editingOcorrencia ? 'Salvar Alterações' : 'Criar Ocorrência')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por usuário ou descrição..."
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
                  <DialogDescription>
                    Filtre as ocorrências por tipo e período
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="filterTipo">Tipo</Label>
                    <Select 
                      value={filters.tipo}
                      onValueChange={(value) => setFilters({ ...filters, tipo: value === 'todos' ? undefined : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
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
                    onClick={() => setFilters({ tipo: undefined, dataInicio: '', dataFim: '' })}
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
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`${getTipoColor(ocorrencia.tipo)} rounded-full px-3 py-1 text-xs font-semibold`}>
                        {capitalize(ocorrencia.tipo)}
                      </span>
                      {getTipoUsuarioBadge(ocorrencia.tipo_usuario)}
                      <span className="text-sm font-medium text-gray-600">
                        {ocorrencia.usuario_nome}
                      </span>
                    </div>
                    {ocorrencia.tipo_usuario === 'aluno' && (
                      <p className="text-xs text-gray-600 mb-2">
                        Turma: <strong>{getTurmaNome(ocorrencia.turma_id)}</strong>
                      </p>
                    )}
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
