import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash2, Filter, AlertCircle, Calendar, Search, X } from 'lucide-react';
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
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [editingOcorrencia, setEditingOcorrencia] = useState<Ocorrencia | null>(null);
  const [loading, setLoading] = useState(false);

  // Estados para busca de usuário
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

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
      // Carregar alunos
      const alunos = await supabaseService.getAlunos();
      const alunosFormatados: Usuario[] = alunos.map((aluno: any) => ({
        id: aluno.id,
        nome: aluno.nome,
        tipo: 'aluno' as const,
        turma_id: aluno.turma_id
      }));

      // Carregar professores
      const professores = await supabaseService.getProfessores();
      const professoresFormatados: Usuario[] = professores.map((prof: any) => ({
        id: prof.id,
        nome: prof.nome,
        tipo: 'professor' as const
      }));

      setUsuarios([...alunosFormatados, ...professoresFormatados]);
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
          const usuario = usuarios.find(u => u.id === occ.usuario_id);
          return {
            ...occ,
            usuario_nome: usuario?.nome || 'Desconhecido',
            turma_id: usuario?.turma_id,
            tipo_usuario: occ.tipo_usuario || usuario?.tipo
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
  }, [usuarios]);

  useEffect(() => {
    loadTurmas();
    loadUsuarios();
  }, [loadTurmas, loadUsuarios]);

  useEffect(() => {
    if (usuarios.length > 0) {
      loadOcorrencias();
    }
  }, [usuarios, loadOcorrencias]);

  // Filtrar usuários pela busca
  const filteredUsers = useMemo(() => {
    if (!userSearchTerm.trim()) return usuarios;
    
    const searchLower = userSearchTerm.toLowerCase();
    return usuarios.filter(user => 
      user.nome.toLowerCase().includes(searchLower)
    );
  }, [usuarios, userSearchTerm]);

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
    setSelectedUser(null);
    setUserSearchTerm('');
    setEditingOcorrencia(null);
    setIsDialogOpen(false);
  }, []);

  const handleUserSelect = useCallback((user: Usuario) => {
    setSelectedUser(user);
    setUserSearchTerm(user.nome);
    setShowUserDropdown(false);
    setFormData(prev => ({
      ...prev,
      usuario_id: user.id,
      tipo_usuario: user.tipo
    }));
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
    
    const usuario = usuarios.find(u => u.id === ocorrencia.usuario_id);
    if (usuario) {
      setSelectedUser(usuario);
      setUserSearchTerm(usuario.nome);
    }

    setFormData({
      usuario_id: ocorrencia.usuario_id,
      tipo_usuario: ocorrencia.tipo_usuario || '',
      tipo: ocorrencia.tipo,
      data: ocorrencia.data,
      descricao: ocorrencia.descricao,
      acao_tomada: ocorrencia.acao_tomada || ''
    });
    setIsDialogOpen(true);
  }, [usuarios]);

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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingOcorrencia ? 'Editar Ocorrência' : 'Nova Ocorrência'}</DialogTitle>
                <DialogDescription>
                  {editingOcorrencia ? 'Atualize a ocorrência' : 'Registre uma nova ocorrência de aluno ou professor'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  {/* Campo de busca de usuário */}
                  <div className="grid gap-2 relative">
                    <Label htmlFor="usuario">Buscar usuário *</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="usuario"
                        value={userSearchTerm}
                        onChange={(e) => {
                          setUserSearchTerm(e.target.value);
                          setShowUserDropdown(true);
                        }}
                        onFocus={() => setShowUserDropdown(true)}
                        placeholder="Digite o nome do aluno ou professor..."
                        className="pl-9 pr-9"
                        required
                      />
                      {userSearchTerm && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserSearchTerm('');
                            setSelectedUser(null);
                            setFormData(prev => ({ ...prev, usuario_id: '', tipo_usuario: '' }));
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Dropdown de resultados */}
                    {showUserDropdown && filteredUsers.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                        {filteredUsers.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => handleUserSelect(user)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b last:border-b-0"
                          >
                            <div>
                              <p className="font-medium text-gray-900">{user.nome}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {user.tipo === 'aluno' ? 'Aluno' : 'Professor'}
                                {user.turma_id && ` • Turma: ${getTurmaNome(user.turma_id)}`}
                              </p>
                            </div>
                            {user.tipo === 'aluno' ? (
                              <Badge className="bg-blue-500 text-white text-xs">Aluno</Badge>
                            ) : (
                              <Badge className="bg-purple-500 text-white text-xs">Professor</Badge>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Usuário selecionado */}
                    {selectedUser && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{selectedUser.nome}</p>
                            <p className="text-xs text-gray-500">
                              {selectedUser.tipo === 'aluno' ? 'Aluno' : 'Professor'}
                              {selectedUser.turma_id && ` • Turma: ${getTurmaNome(selectedUser.turma_id)}`}
                            </p>
                          </div>
                          {getTipoUsuarioBadge(selectedUser.tipo)}
                        </div>
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
                  <Button type="submit" disabled={loading || !selectedUser}>
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
