import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, AlertTriangle, Edit, Trash2, ArrowLeft, Filter, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { ScrollArea } from '../../components/ui/scroll-area';
import { supabaseService } from '../../services/supabaseService';
import { supabase } from '../../lib/supabaseClient';
import { CoordinadorSidebar } from '../../components/admin/CoordinadorSidebar';
import type { Ocorrencia, Aluno } from '../../services/supabaseService';

interface Turma {
  id: number;
  nome: string;
}

interface FiltersState {
  turmaId: string;
  tipo: string;
  dataInicio: string;
  dataFim: string;
}

export function OcorrenciasPage() {
  const navigate = useNavigate();
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOcorrencia, setEditingOcorrencia] = useState<Ocorrencia | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<{ nome: string; email: string } | null>(null);
  
  const [filters, setFilters] = useState<FiltersState>({
    turmaId: '',
    tipo: '',
    dataInicio: '',
    dataFim: ''
  });

  const [formData, setFormData] = useState({
    alunoId: '',
    tipo: '',
    data: '',
    descricao: '',
    acaoTomada: ''
  });

  useEffect(() => {
    loadData();
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data } = await supabase
        .from('configuracoes_escola')
        .select('nome_escola')
        .maybeSingle();
      
      if (data?.nome_escola) {
        setUserProfile({ nome: data.nome_escola, email: '' });
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar todas as ocorrências
      const ocorrenciasData = await supabaseService.getOcorrencias();
      setOcorrencias(ocorrenciasData || []);
      
      // Carregar todos os alunos
      const alunosData = await supabaseService.getAlunos();
      setAlunos(alunosData || []);
      
      // Carregar todas as turmas
      const turmasData = await supabaseService.getTurmas();
      setTurmas(turmasData || []);
      
      console.log('✅ Dados carregados:', {
        ocorrencias: ocorrenciasData?.length,
        alunos: alunosData?.length,
        turmas: turmasData?.length
      });
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOcorrencias = (ocorrencias || []).filter(ocorrencia => {
    const aluno = (alunos || []).find(a => a.id === (ocorrencia.alunoId || ocorrencia.aluno_id));
    const turmaAluno = aluno?.turma_id;
    
    // Filtro por turma
    if (filters.turmaId && turmaAluno !== parseInt(filters.turmaId)) {
      return false;
    }
    
    // Filtro por tipo
    if (filters.tipo && (ocorrencia.tipo?.toLowerCase() ?? '') !== filters.tipo.toLowerCase()) {
      return false;
    }
    
    // Filtro por data inicial
    if (filters.dataInicio && ocorrencia.data < filters.dataInicio) {
      return false;
    }
    
    // Filtro por data final
    if (filters.dataFim && ocorrencia.data > filters.dataFim) {
      return false;
    }
    
    // Filtro por busca
    return (
      (aluno?.nome?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
      (ocorrencia.tipo?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
      (ocorrencia.descricao?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.alunoId || !formData.tipo || !formData.data || !formData.descricao) {
      alert('Preencha todos os campos obrigatórios!');
      return;
    }

    try {
      if (editingOcorrencia) {
        await supabaseService.updateOcorrencia(editingOcorrencia.id, {
          aluno_id: parseInt(formData.alunoId),
          tipo: formData.tipo.toLowerCase(),
          data: formData.data,
          descricao: formData.descricao,
          acao_tomada: formData.acaoTomada || null
        });
        console.log('✅ Ocorrência atualizada');
      } else {
        await supabaseService.createOcorrencia({
          aluno_id: parseInt(formData.alunoId),
          tipo: formData.tipo.toLowerCase(),
          data: formData.data,
          descricao: formData.descricao,
          acao_tomada: formData.acaoTomada || null
        });
        console.log('✅ Ocorrência criada');
      }

      await loadData();
      setIsDialogOpen(false);
      resetForm();
      alert('Ocorrência salva com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao salvar ocorrência:', error);
      alert('Erro ao salvar ocorrência');
    }
  };

  const handleEdit = (ocorrencia: Ocorrencia) => {
    setEditingOcorrencia(ocorrencia);
    setFormData({
      alunoId: (ocorrencia.alunoId || ocorrencia.aluno_id).toString(),
      tipo: ocorrencia.tipo.charAt(0).toUpperCase() + ocorrencia.tipo.slice(1),
      data: ocorrencia.data,
      descricao: ocorrencia.descricao,
      acaoTomada: ocorrencia.acao_tomada || ocorrencia.acaoTomada || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (ocorrenciaId: number) => {
    if (confirm('Tem certeza que deseja excluir esta ocorrência?')) {
      try {
        await supabaseService.deleteOcorrencia(ocorrenciaId);
        await loadData();
        alert('Ocorrência excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir ocorrência:', error);
        alert('Erro ao excluir ocorrência');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      alunoId: '',
      tipo: '',
      data: '',
      descricao: '',
      acaoTomada: ''
    });
    setEditingOcorrencia(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleClearFilters = () => {
    setFilters({
      turmaId: '',
      tipo: '',
      dataInicio: '',
      dataFim: ''
    });
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
      case 'pedagogica':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const capitalize = (text: string) => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const getAlunoNome = (alunoId: number) => {
    const aluno = (alunos || []).find(a => a.id === alunoId);
    return aluno?.nome || 'Aluno não encontrado';
  };

  const hasActiveFilters = filters.turmaId || filters.tipo || filters.dataInicio || filters.dataFim;

  return (
    <div className="min-h-screen flex bg-background">
      {/* SIDEBAR */}
      <CoordinadorSidebar />

      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Header Fixo */}
        <header className="sticky top-0 z-50 border-b bg-teal-700 dark:bg-teal-900 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/app/admin')}
                className="text-teal-100 hover:text-white transition-colors"
                title="Voltar ao Dashboard"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-white">Ocorrências</h1>
                <p className="text-sm text-teal-100 mt-1">Gerencie todas as ocorrências da instituição</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Scrollável */}
        <main className="flex-1 overflow-hidden">
          <ScrollArea className="h-full scrollbar-thin">
            <div className="p-6 space-y-6">
              {/* TÍTULO E BOTÃO */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Registro de Ocorrências
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Total: {filteredOcorrencias.length} ocorrência(s)
                  </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetForm} className="flex items-center gap-2 w-full sm:w-auto">
                      <Plus className="h-4 w-4" />
                      <span>Nova Ocorrência</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] lg:max-w-[800px] max-h-[95vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingOcorrencia ? 'Editar Ocorrência' : 'Nova Ocorrência'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="alunoId">Aluno *</Label>
                        <Select
                          value={formData.alunoId}
                          onValueChange={(value) => setFormData({ ...formData, alunoId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={alunos.length === 0 ? "Nenhum aluno disponível" : "Selecione o aluno"} />
                          </SelectTrigger>
                          <SelectContent>
                            {(alunos || []).length === 0 ? (
                              <div className="p-2 text-sm text-muted-foreground">Nenhum aluno encontrado</div>
                            ) : (
                              (alunos || []).map((aluno) => (
                                <SelectItem key={aluno.id} value={aluno.id.toString()}>
                                  {aluno.nome}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tipo">Tipo *</Label>
                          <Select
                            value={formData.tipo}
                            onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Disciplinar">Disciplinar</SelectItem>
                              <SelectItem value="Pedagogica">Pedagógica</SelectItem>
                              <SelectItem value="Elogio">Elogio</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
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
                      <div className="space-y-2">
                        <Label htmlFor="descricao">Descrição *</Label>
                        <Textarea
                          id="descricao"
                          value={formData.descricao}
                          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                          placeholder="Descreva a ocorrência..."
                          required
                          className="min-h-[100px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="acaoTomada">Ação Tomada (Opcional)</Label>
                        <Textarea
                          id="acaoTomada"
                          value={formData.acaoTomada}
                          onChange={(e) => setFormData({ ...formData, acaoTomada: e.target.value })}
                          placeholder="Descreva a ação tomada..."
                          className="min-h-[80px]"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={handleDialogClose}>
                          Cancelar
                        </Button>
                        <Button type="submit">
                          {editingOcorrencia ? 'Salvar' : 'Registrar'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* FILTROS */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="Buscar por aluno, tipo ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 w-full sm:w-auto"
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filtros</span>
                    {hasActiveFilters && <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">Ativo</span>}
                  </Button>
                </div>

                {/* PAINEL DE FILTROS */}
                {showFilters && (
                  <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Turma</Label>
                          <Select value={filters.turmaId} onValueChange={(value) => setFilters({ ...filters, turmaId: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Todas</SelectItem>
                              {turmas.map((turma) => (
                                <SelectItem key={turma.id} value={turma.id.toString()}>
                                  {turma.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Tipo</Label>
                          <Select value={filters.tipo} onValueChange={(value) => setFilters({ ...filters, tipo: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Todos</SelectItem>
                              <SelectItem value="disciplinar">Disciplinar</SelectItem>
                              <SelectItem value="pedagogica">Pedagógica</SelectItem>
                              <SelectItem value="elogio">Elogio</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Data Início</Label>
                          <Input
                            type="date"
                            value={filters.dataInicio}
                            onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Data Fim</Label>
                          <Input
                            type="date"
                            value={filters.dataFim}
                            onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })}
                          />
                        </div>
                      </div>
                      {hasActiveFilters && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearFilters}
                          className="mt-4 text-red-600 hover:text-red-700 flex items-center gap-2"
                        >
                          <X className="h-4 w-4" />
                          Limpar Filtros
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* LISTA DE OCORRÊNCIAS */}
              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="text-muted-foreground">Carregando ocorrências...</div>
                </div>
              ) : filteredOcorrencias.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{searchTerm || hasActiveFilters ? 'Nenhuma ocorrência encontrada com os filtros aplicados.' : 'Nenhuma ocorrência registrada.'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOcorrencias.map((ocorrencia) => (
                    <div key={ocorrencia.id} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {getAlunoNome(ocorrencia.alunoId || ocorrencia.aluno_id)}
                          </h3>
                          <span className={`${getTipoColor(ocorrencia.tipo)} rounded-full px-3 py-1 text-xs font-semibold`}>
                            {capitalize(ocorrencia.tipo)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          {ocorrencia.descricao}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(ocorrencia.data).toLocaleDateString('pt-BR')}
                          </span>
                          {ocorrencia.acao_tomada && (
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Ação: {ocorrencia.acao_tomada.substring(0, 30)}...
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
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
                </div>
              )}
            </div>
          </ScrollArea>
        </main>
      </div>
    </div>
  );
}

export default OcorrenciasPage;
