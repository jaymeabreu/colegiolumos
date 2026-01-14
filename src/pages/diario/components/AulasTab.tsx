import { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, Edit, Trash2, Users, Check, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { supabaseService } from '../../../services/supabaseService';
import type { Aula, Aluno, Presenca } from '../../../services/supabaseService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';

interface AulasTabProps {
  diarioId: number;
  readOnly?: boolean;
}

export function AulasTab({ diarioId, readOnly = false }: AulasTabProps) {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPresencaDialogOpen, setIsPresencaDialogOpen] = useState(false);
  const [editingAula, setEditingAula] = useState<Aula | null>(null);
  const [selectedAula, setSelectedAula] = useState<Aula | null>(null);
  const [presencas, setPresencas] = useState<{
    [key: string]: 'PRESENTE' | 'FALTA' | 'JUSTIFICADA';
  }>({});
  const [numeroAulas, setNumeroAulas] = useState(1);
  const [aulaAssincrona, setAulaAssincrona] = useState('nao');
  const [tipoAula, setTipoAula] = useState('teorica');
  const [formData, setFormData] = useState({
    data: '',
    horario: '',
    conteudo: '',
    conteudoDetalhado: '',
    observacoes: ''
  });

  const [diarioInfo, setDiarioInfo] = useState({
    nome: '',
    professor: '',
    turma: '',
    disciplina: '',
    bimestre: ''
  });

  /* -------------------------------------------------------------------------- */
  /*                                Carregamento                               */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    loadAulas();
    loadAlunos();
    void loadDiarioInfo();
  }, [diarioId]);

  const loadDiarioInfo = async () => {
    try {
      const diario = await supabaseService.getDiarioById(diarioId);
      if (diario) {
        const professor = await supabaseService.getProfessorById(diario.professorId || diario.professor_id || 0);
        const turma = await supabaseService.getTurmaById(diario.turmaId || diario.turma_id || 0);
        const disciplina = await supabaseService.getDisciplinaById(diario.disciplinaId || diario.disciplina_id || 0);

        setDiarioInfo({
          nome: diario.nome,
          professor: professor?.nome ?? 'Professor não encontrado',
          turma: turma?.nome ?? 'Turma não encontrada',
          disciplina: disciplina?.nome ?? 'Disciplina não encontrada',
          bimestre: diario.bimestre?.toString() ?? '1'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar informações do diário:', error);
    }
  };

  const loadAulas = async () => {
    try {
      const aulasData = await supabaseService.getAulasByDiario(diarioId);
      setAulas(aulasData || []);
    } catch (error) {
      console.error('Erro ao carregar aulas:', error);
      setAulas([]);
    }
  };

  const loadAlunos = async () => {
    try {
      const alunosData = await supabaseService.getAlunosByDiario(diarioId);
      setAlunos(alunosData || []);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
      setAlunos([]);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                Filtros e UI                               */
  /* -------------------------------------------------------------------------- */
  const filteredAulas = (aulas || []).filter(
    aula =>
      (aula.conteudo?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
      (aula.data ?? '').includes(searchTerm)
  );

  /* -------------------------------------------------------------------------- */
  /*                               Manipulação de Form                           */
  /* -------------------------------------------------------------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingAula) {
        await supabaseService.updateAula(editingAula.id, {
          data: formData.data,
          horario: formData.horario,
          conteudo: formData.conteudo,
          observacoes: formData.observacoes
        });
      } else {
        await supabaseService.createAula({
          diarioId,
          data: formData.data,
          horario: formData.horario,
          conteudo: formData.conteudo,
          observacoes: formData.observacoes
        });
      }
      await loadAulas();
    } catch (error) {
      console.error('Erro ao salvar aula:', error);
    } finally {
      setIsDialogOpen(false);
      resetForm();
    }
  };

  const handleEdit = (aula: Aula) => {
    setEditingAula(aula);
    setFormData({
      data: aula.data,
      horario: aula.horario || '',
      conteudo: aula.conteudo || '',
      conteudoDetalhado: aula.observacoes ?? '',
      observacoes: ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (aulaId: number) => {
    if (confirm('Tem certeza que deseja excluir esta aula?')) {
      try {
        await supabaseService.deleteAula(aulaId);
        await loadAulas();
      } catch (error) {
        console.error('Erro ao excluir aula:', error);
      }
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                              Presença (Diálogo)                           */
  /* -------------------------------------------------------------------------- */
  const handlePresenca = async (aula: Aula) => {
    setSelectedAula(aula);

    const isDouble = isAulaDupla(aula.id);
    setNumeroAulas(isDouble ? 2 : 1);

    try {
      const presencasPrimeira = await supabaseService.getPresencasByAula(aula.id);
      const presencasSegunda = await supabaseService.getPresencasByAula(aula.id + 10000);

      const map: { [key: string]: 'PRESENTE' | 'FALTA' | 'JUSTIFICADA' } = {};

      (alunos || []).forEach(aluno => {
        const p1 = (presencasPrimeira || []).find(p => (p.alunoId || p.aluno_id) === aluno.id);
        map[`${aluno.id}-1`] = p1?.status ?? 'PRESENTE';

        if (isDouble) {
          const p2 = (presencasSegunda || []).find(p => (p.alunoId || p.aluno_id) === aluno.id);
          map[`${aluno.id}-2`] = p2?.status ?? 'PRESENTE';
        }
      });

      setPresencas(map);
      setIsPresencaDialogOpen(true);
    } catch (error) {
      console.error('Erro ao carregar presenças:', error);
    }
  };

  const handlePresencas = (aula: Aula) => {
    handlePresenca(aula);
  };

  const handlePresencaChange = (
    alunoId: number,
    aulaNum: number,
    status: 'PRESENTE' | 'FALTA' | 'JUSTIFICADA'
  ) => {
    setPresencas(prev => ({
      ...prev,
      [`${alunoId}-${aulaNum}`]: status
    }));
  };

  const handleSavePresencas = async () => {
    if (!selectedAula) return;

    try {
      for (let aulaNum = 1; aulaNum <= numeroAulas; aulaNum++) {
        const presencasParaSalvar: Omit<Presenca, 'id'>[] = (alunos || []).map(aluno => ({
          aulaId: aulaNum === 1 ? selectedAula.id : selectedAula.id + 10000,
          alunoId: aluno.id,
          status: presencas[`${aluno.id}-${aulaNum}`] ?? 'PRESENTE'
        }));

        await supabaseService.savePresencas(presencasParaSalvar);
      }

      if (numeroAulas === 2) {
        await supabaseService.updateAula(selectedAula.id, {
          observacoes: `${selectedAula.observacoes ?? ''}${selectedAula.observacoes ? ' | ' : ''}Aula dupla`
        });
      }

      await loadAulas();
    } catch (error) {
      console.error('Erro ao salvar presenças:', error);
    } finally {
      setIsPresencaDialogOpen(false);
      setSelectedAula(null);
      setPresencas({});
    }
  };

  const resetForm = () => {
    setFormData({
      data: '',
      horario: '',
      conteudo: '',
      conteudoDetalhado: '',
      observacoes: ''
    });
    setAulaAssincrona('nao');
    setTipoAula('teorica');
    setNumeroAulas(1);
    setEditingAula(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handlePresencaDialogClose = () => {
    setIsPresencaDialogOpen(false);
    setSelectedAula(null);
    setPresencas({});
  };

  /* -------------------------------------------------------------------------- */
  /*                             Funções auxiliares                             */
  /* -------------------------------------------------------------------------- */
  const getPresencaCount = async (aulaId: number) => {
    try {
      const presencasAula = await supabaseService.getPresencasByAula(aulaId);
      const presencasSegundaAula = await supabaseService.getPresencasByAula(aulaId + 10000);

      if ((presencasSegundaAula || []).length > 0) {
        const presentesPrimeira = (presencasAula || []).filter(
          p => p.status === 'PRESENTE'
        ).length;
        const presentesSegunda = (presencasSegundaAula || []).filter(
          p => p.status === 'PRESENTE'
        ).length;
        const total = (alunos || []).length;
        return `${presentesPrimeira}/${total} | ${presentesSegunda}/${total}`;
      }

      const presentes = (presencasAula || []).filter(p => p.status === 'PRESENTE').length;
      const total = (alunos || []).length;
      return `${presentes}/${total}`;
    } catch (error) {
      console.error('Erro ao contar presenças:', error);
      return '0/0';
    }
  };

  const isAulaDupla = async (aulaId: number) => {
    try {
      const segunda = await supabaseService.getPresencasByAula(aulaId + 10000);
      return (segunda || []).length > 0;
    } catch {
      return false;
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                   Render                                   */
  /* -------------------------------------------------------------------------- */
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <CardTitle>Aulas Ministradas</CardTitle>
            <CardDescription>
              Registre as aulas ministradas e gerencie a presença dos alunos
            </CardDescription>
          </div>
          {!readOnly && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="sm:hidden">Nova</span>
                  <span className="hidden sm:inline">Nova Aula</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] lg:max-w-[800px] max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingAula ? 'Editar Aula' : 'Nova Aula'}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium mb-4">
                      Conteúdo Ministrado da Aula
                    </h4>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label htmlFor="dataAula">Data da aula</Label>
                        <Input
                          id="dataAula"
                          type="date"
                          value={formData.data}
                          onChange={e =>
                            setFormData({ ...formData, data: e.target.value })
                          }
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="titulo">Título do conteúdo</Label>
                        <Input
                          id="titulo"
                          value={formData.conteudo}
                          onChange={e =>
                            setFormData({ ...formData, conteudo: e.target.value })
                          }
                          placeholder="Ex: As Grandes Navegações"
                          required
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <Label htmlFor="observacoes">Observações</Label>
                      <Textarea
                        id="observacoes"
                        value={formData.observacoes}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            observacoes: e.target.value
                          })
                        }
                        placeholder="Observações adicionais sobre a aula..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingAula ? 'Salvar Alterações' : 'Salvar Aula'}
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
            className="input"
            placeholder="Buscar aulas..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          {filteredAulas.map(aula => (
            <div
              key={aula.id}
              className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 border rounded-lg"
            >
              <div className="flex-1">
                <h3 className="font-medium">{aula.conteudo}</h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(aula.data).toLocaleDateString('pt-BR')}
                  </span>
                  {aula.horario && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {aula.horario}
                    </span>
                  )}
                  {aula.observacoes && (
                    <span className="text-muted-foreground">
                      {aula.observacoes.substring(0, 50)}...
                    </span>
                  )}
                </div>
              </div>

              {!readOnly && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(aula)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(aula.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}

          {filteredAulas.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Nenhuma aula encontrada.' : 'Nenhuma aula cadastrada.'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
