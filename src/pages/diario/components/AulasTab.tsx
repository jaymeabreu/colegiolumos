import { useState, useEffect } from 'react';
import { Trash2, Users, Edit } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { supabaseService } from '../../../services/supabaseService';
import type { Aula, Aluno } from '../../../services/supabaseService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { CriarAulaModal } from './CriarAulaModal';
import { MarcarPresencaModal } from './MarcarPresencaModal';

interface AulasTabProps {
  diarioId: number;
  readOnly?: boolean;
}

export function AulasTab({ diarioId, readOnly = false }: AulasTabProps) {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCriarAulaOpen, setIsCriarAulaOpen] = useState(false);
  const [selectedAula, setSelectedAula] = useState<Aula | null>(null);
  const [isPresencaDialogOpen, setIsPresencaDialogOpen] = useState(false);
  const [isEditingAula, setIsEditingAula] = useState<Aula | null>(null);

  useEffect(() => {
    loadAulas();
    loadAlunos();
  }, [diarioId]);

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

  const filteredAulas = (aulas || []).filter(
    aula =>
      (aula.conteudo?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
      (aula.data ?? '').includes(searchTerm)
  );

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

  const handleMarcarPresenca = (aula: Aula) => {
    setSelectedAula(aula);
    setIsPresencaDialogOpen(true);
  };

  const handleEditAula = (aula: Aula) => {
    setIsEditingAula(aula);
    setIsCriarAulaOpen(true);
  };

  return (
    <>
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
              <CriarAulaModal
                diarioId={diarioId}
                alunos={alunos}
                open={isCriarAulaOpen}
                onOpenChange={(open) => {
                  setIsCriarAulaOpen(open);
                  if (!open) {
                    setIsEditingAula(null);
                  }
                }}
                onAulaCriada={loadAulas}
                aulaEditando={isEditingAula}
              />
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-4">
            <Input
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
                    <span>📅 {new Date(aula.data).toLocaleDateString('pt-BR')}</span>
                    {aula.quantidade_aulas && aula.quantidade_aulas > 1 && (
                      <span className="text-blue-600 font-medium">
                        {aula.quantidade_aulas} aulas
                      </span>
                    )}
                    {aula.tipo_aula && <span>{aula.tipo_aula}</span>}
                    {aula.aula_assincrona && <span className="text-purple-600">Assíncrona</span>}
                  </div>
                </div>

                {!readOnly && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarcarPresenca(aula)}
                      className="bg-green-50 hover:bg-green-100 text-green-700"
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Presença
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAula(aula)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
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
                Nenhuma aula cadastrada.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedAula && (
        <MarcarPresencaModal
          aula={selectedAula}
          alunos={alunos}
          open={isPresencaDialogOpen}
          onOpenChange={setIsPresencaDialogOpen}
          onSave={() => {
            setIsPresencaDialogOpen(false);
            setSelectedAula(null);
            loadAulas();
          }}
        />
      )}
    </>
  );
}
