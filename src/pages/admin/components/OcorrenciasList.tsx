import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash2, Filter, AlertCircle, Calendar, X } from 'lucide-react';
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

interface Usuario {
  id: string;
  nome: string;
  tipo: 'aluno' | 'professor';
  turma_id?: number;
}

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

  // Estados para busca de usuário (IGUAL AO COMUNICADO)
  const [usuarioBusca, setUsuarioBusca] = useState('');
  const [showUsuariosList, setShowUsuariosList] = useState(false);

  const [filters, setFilters] = useState({
    tipo: '',
    dataInicio: '',
    dataFim: ''
  });

  const [formData, setFormData] = useState({
    usuario_id: '',
    tipo_usuario: '' as 'aluno' | 'professor' | '',
    tipo: '',
    data: '',
    descricao: '',
    acao_tomada: ''
  });

  // Combina alunos e professores para busca (IGUAL AO COMUNICADO)
  const todosUsuarios = useMemo(() => {
    return [
      ...alunos.map(a => ({ id: a.id, nome: a.nome, tipo: 'Aluno' as const, turma_id: a.turma_id })),
      ...professores.map(p => ({ id: p.id, nome: p.nome, tipo: 'Professor' as const }))
    ].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [alunos, professores]);

  // Filtra usuários baseado na busca (IGUAL AO COMUNICADO)
  const usuariosFiltrados = useMemo(() => {
    return todosUsuarios.filter(usuario =>
      usuario.nome.toLowerCase().includes(usuarioBusca.toLowerCase())
    ).slice(0, 50); // Limita a 50 resultados
  }, [todosUsuarios, usuarioBusca]);

  // Fecha a lista de usuários quando clicar fora (IGUAL AO COMUNICADO)
  useEffect(() => {
    const handleClickOutside = () => setShowUsuariosList(false);
    if (showUsuariosList) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showUsuariosList]);

  const loadTurmas = useCallback(async () => {
    try {
      const turmasData = await supabaseService.getTurmas();
      setTurmas(turmasData);
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
    }
  }, []);

  const loadUsuarios = useCallback(async () => {
    try {
      const [alunosData, professoresData] = await Promise.all([
        supabaseService.getAlunos(),
        supabaseService.getProfessores()
      ]);
      setAlunos(alunosData);
      setProfessores(professoresData);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  }, []);

  const loadOcorrencias = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ocorrencias')
        .select('*')
        .order('data', { ascending: false });

      if (data) {
        const ocorrenciasComNome = data.map((occ: any) => {
          const aluno = alunos.find(a => a.id.toString() === occ.usuario_id);
          const professor = professores.find(p => p.id.toString() === occ.usuario_id);
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
      alert('Erro ao carregar ocorrências');
    } finally {
      setLoading(false);
    }
  }, [alunos, professores]);

  useEffect(() => {
    loadTurmas();
    loadUsuarios();
  }, [loadTurmas, loadUsuarios]);

  useEffect(() => {
    if (alunos.length > 0 || professores.length > 0) {
      loadOcorrencias();
    }
  }, [alunos, professores, loadOcorrencias]);

  const filteredOcorrencias = useMemo(() => {
    return ocorrencias.filter(ocorrencia => {
      if (searchTerm && !ocorrencia.usuario_nome?.toLowerCase().includes(searchTerm.toLowerCase()) && 
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
      usuario_id: '',
      tipo_usuario: '',
      tipo: '',
      data: '',
      descricao: '',
      acao_tomada: ''
    });
    setUsuarioBusca('');
    setShowUsuariosList(false);
    setEditingOcorrencia(null);
    setIsDialogOpen(false);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.usuario_id || !formData.tipo || !formData.data || !formData.descricao) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);

      const dataToSave = {
        usuario_id: formData.usuario_id,
        tipo_usuario: formData.tipo_usuario,
        tipo: formData.tipo,
        data: formData.data,
        descricao: formData.descricao,
        acao_tomada: formData.acao_tomada
      };

      if (editingOcorrencia) {
        const { error } = await supabase
          .from('ocorrencias')
          .update(dataToSave)
          .eq('id', editingOcorrencia.id);

        if (error) throw error;
        alert('Ocorrência atualizada!');
      } else {
        const { error } = await supabase
          .from('ocorrencias')
          .insert([dataToSave]);

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
    
    // Busca o nome do usuário
    const aluno = alunos.find(a => a.id.toString() === ocorrencia.usuario_id);
    const professor = professores.find(p => p.id.toString() === ocorrencia.usuario_id);
    const usuarioNome = aluno ? `${aluno.nome} (Aluno)` : professor ? `${professor.nome} (Professor)` : '';

    setFormData({
      usuario_id: ocorrencia.usuario_id,
      tipo_usuario: ocorrencia.tipo_usuario || '',
      tipo: ocorrencia.tipo,
      data: ocorrencia.data,
      descricao: ocorrencia.descricao,
      acao_tomada: ocorrencia.acao_tomada || ''
    });
    
    setUsuarioBusca(usuarioNome);
    setIsDialogOpen(true);
  }, [alunos, professores]);

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
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Ocorrência
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingOcorrencia ? 'Editar Ocorrência' : 'Nova Ocorrência'}</DialogTitle>
                <DialogDescription>
                  {editingOcorrencia ? 'Atualize a ocorrência' : 'Registre uma nova ocorrência de aluno ou professor'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  {/* Campo de busca de usuário (IGUAL AO COMUNICADO) */}
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
                        required
                      />
                      
                      {/* Lista de resultados filtrados */}
                      {showUsuariosList && usuariosFiltrados.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {usuariosFiltrados.map(usuario => (
                            <button
                              key={`${usuario.tipo}-${usuario.id}`}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  usuario_id: usuario.id.toString(),
                                  tipo_usuario: usuario.tipo === 'Aluno' ? 'aluno' : 'professor'
                                }));
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

                      {/* Mostra mensagem se não encontrar nada */}
                      {showUsuariosList && usuarioBusca && usuariosFiltrados.length === 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg p-4 text-center text-gray-500">
                          Nenhum usuário encontrado
                        </div>
                      )}
                    </div>

                    {/* Mostra usuário selecionado */}
                    {formData.usuario_id && (
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-sm text-gray-600 flex-1">
                          Selecionado: <strong>{usuarioBusca}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, usuario_id: '', tipo_usuario: '' }));
                            setUsuarioBusca('');
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="tipo">Tipo de Ocorrência *</Label>
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
                  <Button type="submit" disabled={loading || !formData.usuario_id}>
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
