import { useState, useEffect } from 'react';
import { Plus, Calendar, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
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
    console.log('🔍 OcorrenciasTab - diarioId recebido:', diarioId);
    loadData();
  }, [diarioId]);

  // Recarregar alunos quando abre o diálogo
  useEffect(() => {
    if (isDialogOpen) {
      loadAlunos();
    }
  }, [isDialogOpen]);

  const loadData = async () => {
    try {
      console.log('📥 loadData iniciado com diarioId:', diarioId);
      await loadAlunos();

      const ocorrenciasData = await supabaseService.getOcorrencias();
      const filtered = (ocorrenciasData || []).filter(o => {
        const oDiarioId = o.diario_id ?? o.diarioId;
        return oDiarioId === diarioId;
      });
      setOcorrencias(filtered);
      console.log('✅ Ocorrências carregadas:', filtered);
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      setOcorrencias([]);
    }
  };

  const loadAlunos = async () => {
    try {
      console.log('📥 loadAlunos - diarioId:', diarioId);
      const alunosData = await supabaseService.getAlunosByDiario(diarioId);
      console.log('✅ Alunos carregados:', alunosData, 'total:', alunosData?.length);
      setAlunos(alunosData || []);
    } catch (error) {
      console.error('❌ Erro ao carregar alunos:', error);
      setAlunos([]);
    }
  };

  const filteredOcorrencias = (ocorrencias || []).filter(ocorrencia => {
    const aluno = (alunos || []).find(a => a.id === (ocorrencia.alunoId || ocorrencia.aluno_id));
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
      console.log('📝 Salvando ocorrência com dados:', {
        aluno_id: parseInt(formData.alunoId),
        diario_id: diarioId,
        tipo: formData.tipo.toLowerCase(),
        data: formData.data,
        descricao: formData.descricao,
        acao_tomada: formData.acaoTomada || null
      });

      if (editingOcorrencia) {
        await supabaseService.updateOcorrencia(editingOcorrencia.id, {
          aluno_id: parseInt(formData.alunoId),
          diario_id: diarioId,
          tipo: formData.tipo.toLowerCase(),
          data: formData.data,
          descricao: formData.descricao,
          acao_tomada: formData.acaoTomada || null
        });
        console.log('✅ Ocorrência atualizada');
      } else {
        await supabaseService.createOcorrencia({
          aluno_id: parseInt(formData.alunoId),
          diario_id: diarioId,
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

  const getTipoBadgeVariant = (tipo: string) => {
    const tipoLower = (tipo || '').toLowerCase();
    switch (tipoLower) {
      case 'disciplinar':
        return 'destructive';
      case 'pedagogica':
        return 'secondary';
      case 'elogio':
        return 'default';
      default:
        return 'default';
    }
  };

  const getAlunoNome = (alunoId: number) => {
    const aluno = (alunos || []).find(a => a.id === alunoId);
    return aluno?.nome || 'Aluno não encontrado';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <CardTitle>Ocorrências</CardTitle>
            <CardDescription>
              Registre ocorrências disciplinares e pedagógicas
            </CardDescription>
          </div>
          {!readOnly && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="sm:hidden">Nova</span>
                  <span className="hidden sm:inline">Nova Ocorrência</span>
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
                    {(alunos || []).length === 0 && (
                      <p className="text-xs text-red-600">⚠️ Nenhum aluno vinculado a este diário</p>
                    )}
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
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Buscar ocorrências..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="space-y-4">
          {filteredOcorrencias.map((ocorrencia) => (
            <div key={ocorrencia.id} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">{getAlunoNome(ocorrencia.alunoId || ocorrencia.aluno_id)}</h3>
                  <Badge variant={getTipoBadgeVariant(ocorrencia.tipo)}>
                    {ocorrencia.tipo.charAt(0).toUpperCase() + ocorrencia.tipo.slice(1)}
                  </Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(ocorrencia.data).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {(ocorrencia.descricao || '').substring(0, 50)}...
                  </span>
                </div>
              </div>
              {!readOnly && (
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
              )}
            </div>
          ))}
          {filteredOcorrencias.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Nenhuma ocorrência encontrada.' : 'Nenhuma ocorrência registrada.'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
