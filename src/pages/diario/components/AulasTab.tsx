
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
import {
  mockDataService,
  Aula,
  Aluno,
  Presenca
} from '../../../services/mockData';
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

  // Dados do diário
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
    loadDiarioInfo();
  }, [diarioId]);

  const loadDiarioInfo = () => {
    try {
      const diario = supabaseService.getDiarios().find(d => d.id === diarioId);
      if (diario) {
        const professor = mockDataService
          .getProfessores()
          .find(p => p.id === diario.professorId);
        const turma = mockDataService
          .getTurmas()
          .find(t => t.id === diario.turmaId);
        const disciplina = mockDataService
          .getDisciplinas()
          .find(d => d.id === diario.disciplinaId);

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

  const loadAulas = () => {
    try {
      const aulasData = supabaseService.getAulasByDiario(diarioId);
      setAulas(aulasData);
    } catch (error) {
      console.error('Erro ao carregar aulas:', error);
    }
  };

  const loadAlunos = () => {
    try {
      const alunosData = supabaseService.getAlunosByDiario(diarioId);
      setAlunos(alunosData);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                Filtros e UI                               */
  /* -------------------------------------------------------------------------- */
  const filteredAulas = aulas.filter(
    aula =>
      aula.conteudo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aula.data.includes(searchTerm)
  );

  /* -------------------------------------------------------------------------- */
  /*                               Manipulação de Form                           */
  /* -------------------------------------------------------------------------- */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const aulaData = {
      ...formData
    };

    try {
      if (editingAula) {
        supabaseService.updateAula(editingAula.id, aulaData);
      } else {
        supabaseService.createAula({
          ...aulaData,
          diarioId,
          professorId: 1
        });
      }
      loadAulas();
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
      horario: aula.horario,
      conteudo: aula.conteudo,
      conteudoDetalhado: aula.observacoes ?? '',
      observacoes: ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (aulaId: number) => {
    if (confirm('Tem certeza que deseja excluir esta aula?')) {
      try {
        supabaseService.deleteAula(aulaId);
        loadAulas();
      } catch (error) {
        console.error('Erro ao excluir aula:', error);
      }
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                              Presença (Diálogo)                           */
  /* -------------------------------------------------------------------------- */
  const handlePresenca = (aula: Aula) => {
    setSelectedAula(aula);

    const isDouble = isAulaDupla(aula.id);
    setNumeroAulas(isDouble ? 2 : 1);

    // Carrega presenças já registradas (primeira e, se houver, segunda aula)
    const presencasPrimeira = supabaseService.getPresencasByAula(aula.id);
    const presencasSegunda = supabaseService.getPresencasByAula(aula.id + 10000);

    const map: { [key: string]: 'PRESENTE' | 'FALTA' | 'JUSTIFICADA' } = {};

    alunos.forEach(aluno => {
      const p1 = presencasPrimeira.find(p => p.alunoId === aluno.id);
      map[`${aluno.id}-1`] = p1?.status ?? 'PRESENTE';

      if (isDouble) {
        const p2 = presencasSegunda.find(p => p.alunoId === aluno.id);
        map[`${aluno.id}-2`] = p2?.status ?? 'PRESENTE';
      }
    });

    setPresencas(map);
    setIsPresencaDialogOpen(true);
  };

  // Wrapper to keep compatibility with modified button name
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

  const handleSavePresencas = () => {
    if (!selectedAula) return;

    try {
      // Salva presenças da primeira (e da segunda, quando houver)
      for (let aulaNum = 1; aulaNum <= numeroAulas; aulaNum++) {
        const presencasParaSalvar: Omit<Presenca, 'id'>[] = alunos.map(aluno => ({
          aulaId:
            aulaNum === 1 ? selectedAula.id : selectedAula.id + 10000,
          alunoId: aluno.id,
          status: presencas[`${aluno.id}-${aulaNum}`] ?? 'PRESENTE'
        }));

        supabaseService.savePresencas(presencasParaSalvar);
      }

      // Marca a aula como dupla, se necessário
      if (numeroAulas === 2) {
        supabaseService.updateAula(selectedAula.id, {
          observacoes: `${
            selectedAula.observacoes ?? ''
          }${selectedAula.observacoes ? ' | ' : ''}Aula dupla`
        });
      }

      loadAulas();
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
  const getPresencaCount = (aulaId: number) => {
    const presencasAula = supabaseService.getPresencasByAula(aulaId);
    const presencasSegundaAula = supabaseService.getPresencasByAula(
      aulaId + 10000
    );

    // Caso exista segunda aula (dupla)
    if (presencasSegundaAula.length > 0) {
      const presentesPrimeira = presencasAula.filter(
        p => p.status === 'PRESENTE'
      ).length;
      const presentesSegunda = presencasSegundaAula.filter(
        p => p.status === 'PRESENTE'
      ).length;
      const total = alunos.length;
      return `${presentesPrimeira}/${total} | ${presentesSegunda}/${total}`;
    }

    const presentes = presencasAula.filter(p => p.status === 'PRESENTE')
      .length;
    const total = alunos.length;
    return `${presentes}/${total}`;
  };

  const isAulaDupla = (aulaId: number) => {
    const segunda = supabaseService.getPresencasByAula(aulaId + 10000);
    return segunda.length > 0;
  };

  /* -------------------------------------------------------------------------- */
  /*                                   Render                                   */
  /* -------------------------------------------------------------------------- */
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="space-y-2">
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
                  {/* Conteúdo ministrado */}
                  <div>
                    <h4 className="text-lg font-medium mb-4">
                      Conteúdo Ministrado da Aula
                    </h4>

                    {/* Linha 1 */}
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

                    {/* Linha 2 */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                      <div>
                        <Label htmlFor="quantidadeAulas">Quantidade de aulas</Label>
                        <select
                          id="quantidadeAulas"
                          value={numeroAulas}
                          onChange={e =>
                            setNumeroAulas(Number(e.target.value))
                          }
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={1}>1 aula</option>
                          <option value={2}>2 aulas</option>
                          <option value={3}>3 aulas</option>
                          <option value={4}>4 aulas</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="tipoAula">Tipo de aula</Label>
                        <select
                          id="tipoAula"
                          value={tipoAula}
                          onChange={e => setTipoAula(e.target.value)}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="teorica">Teórica</option>
                          <option value="pratica">Prática</option>
                          <option value="projeto">Projeto</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="aulaAssincrona">Aula assíncrona</Label>
                        <select
                          id="aulaAssincrona"
                          value={aulaAssincrona}
                          onChange={e => setAulaAssincrona(e.target.value)}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="nao">Não</option>
                          <option value="sim">Sim</option>
                        </select>
                      </div>
                    </div>

                    {/* Conteúdo detalhado */}
                    <div className="mb-4">
                      <Label htmlFor="conteudoDetalhado">
                        Conteúdo detalhado da aula
                      </Label>
                      <Textarea
                        id="conteudoDetalhado"
                        value={formData.conteudoDetalhado}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            conteudoDetalhado: e.target.value
                          })
                        }
                        placeholder="Descrição detalhada do conteúdo ministrado na aula. Ex: Introdução às Grandes Navegações - contexto histórico, causas econômicas e tecnológicas, principais navegadores portugueses e espanhóis, descobrimento do Brasil..."
                        className="mt-1"
                        rows={8}
                      />
                    </div>

                    {/* Observações */}
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
                        placeholder="Observações adicionais sobre a aula, comportamento da turma, dificuldades encontradas, etc..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="btn btn-outline btn-md"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="btn btn-primary btn-md">
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
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {aula.horario}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Presença: {getPresencaCount(aula.id)}
                    {isAulaDupla(aula.id) && (
                      <span className="ml-1 px-1 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                        Dupla
                      </span>
                    )}
                  </span>
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
                    onClick={() => handlePresencas(aula)}
                    className="inline-flex items-center gap-1 whitespace-nowrap"
                  >
                    <Users className="h-4 w-4" />
                    Presença
                  </Button>

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

      {/* Diálogo de Presença */}
      <Dialog open={isPresencaDialogOpen} onOpenChange={setIsPresencaDialogOpen}>
        <DialogContent className="max-w-[95vw] lg:max-w-[800px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Marcar Presença - {selectedAula?.conteudo}
            </DialogTitle>
            <p className="text-base text-muted-foreground">
              {selectedAula &&
                `${new Date(selectedAula.data).toLocaleDateString('pt-BR')} - ${selectedAula.horario}`}
            </p>
          </DialogHeader>

          <div className="space-y-4">
            {/* Seletor de número de aulas */}
            <div className="space-y-2">
              <Label>Número de aulas seguidas</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={numeroAulas === 1 ? 'default' : 'outline'}
                  onClick={() => {
                    setNumeroAulas(1);
                    const novo = { ...presencas };
                    alunos.forEach(aluno => delete novo[`${aluno.id}-2`]);
                    setPresencas(novo);
                  }}
                  className="btn btn-none"
                >
                  1 Aula
                </Button>
                <Button
                  type="button"
                  variant={numeroAulas === 2 ? 'default' : 'outline'}
                  onClick={() => {
                    setNumeroAulas(2);
                    const novo = { ...presencas };
                    alunos.forEach(aluno => {
                      if (!novo[`${aluno.id}-2`]) {
                        novo[`${aluno.id}-2`] = 'PRESENTE';
                      }
                    });
                    setPresencas(novo);
                  }}
                  className="btn btn-none"
                >
                  2 Aulas
                </Button>
              </div>
            </div>

            {/* Lista de alunos */}
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                <div className="col-span-4">Aluno</div>
                <div className="col-span-4 text-center">1ª Aula</div>
                {numeroAulas === 2 && (
                  <div className="col-span-4 text-center">2ª Aula</div>
                )}
              </div>

              {alunos.map(aluno => (
                <div
                  key={aluno.id}
                  className="grid grid-cols-12 gap-2 items-center py-2 border-b"
                >
                  <div className="col-span-4 text-sm font-medium">
                    {aluno.nome}
                  </div>

                  {/* Presença 1ª Aula */}
                  <div className="col-span-4 flex justify-center gap-1">
                    <Button
                      type="button"
                      variant={presencas[`${aluno.id}-1`] === 'PRESENTE' ? 'default' : 'outline'}
                      size="none"
                      onClick={() => handlePresencaChange(aluno.id, 1, 'PRESENTE')}
                      className="h-8 w-8 p-0"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant={presencas[`${aluno.id}-1`] === 'FALTA' ? 'destructive' : 'outline'}
                      size="none"
                      onClick={() => handlePresencaChange(aluno.id, 1, 'FALTA')}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant={presencas[`${aluno.id}-1`] === 'JUSTIFICADA' ? 'secondary' : 'outline'}
                      size="none"
                      onClick={() => handlePresencaChange(aluno.id, 1, 'JUSTIFICADA')}
                      className="h-8 px-2 text-xs"
                    >
                      J
                    </Button>
                  </div>

                  {/* Presença 2ª Aula */}
                  {numeroAulas === 2 && (
                    <div className="col-span-4 flex justify-center gap-1">
                      <Button
                        type="button"
                        variant={presencas[`${aluno.id}-2`] === 'PRESENTE' ? 'default' : 'outline'}
                        size="none"
                        onClick={() => handlePresencaChange(aluno.id, 2, 'PRESENTE')}
                        className="h-8 w-8 p-0"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant={presencas[`${aluno.id}-2`] === 'FALTA' ? 'destructive' : 'outline'}
                        size="none"
                        onClick={() => handlePresencaChange(aluno.id, 2, 'FALTA')}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant={presencas[`${aluno.id}-2`] === 'JUSTIFICADA' ? 'secondary' : 'outline'}
                        size="none"
                        onClick={() => handlePresencaChange(aluno.id, 2, 'JUSTIFICADA')}
                        className="h-8 px-2 text-xs"
                      >
                        J
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Legenda */}
            <div className="flex gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                Presente
              </div>
              <div className="flex items-center gap-1">
                <X className="h-3 w-3" />
                Falta
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 bg-secondary rounded text-center text-xs">
                  J
                </span>
                Justificada
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handlePresencaDialogClose}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSavePresencas} className="btn btn-primary">
                Salvar Presenças
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
