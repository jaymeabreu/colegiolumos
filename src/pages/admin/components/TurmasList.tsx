import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash2, GraduationCap } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { supabaseService } from '../../../services/supabaseService';
import type { Turma } from '../../../services/supabaseService';

type TurnoDB = 'MANHA' | 'TARDE' | 'NOITE' | 'INTEGRAL';

const TURNO_LABEL: Record<TurnoDB, string> = {
  MANHA: 'Manhã',
  TARDE: 'Tarde',
  NOITE: 'Noite',
  INTEGRAL: 'Integral'
};

export function TurmasList() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<{
    nome: string;
    ano: number;
    turno: TurnoDB;
  }>({
    nome: '',
    ano: 2025,
    turno: 'MANHA'
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await supabaseService.getTurmas();
      setTurmas(data);
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
      alert('Erro ao carregar turmas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredTurmas = useMemo(() => {
    if (!searchTerm) return turmas;

    return turmas.filter(turma =>
      turma.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [turmas, searchTerm]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        setLoading(true);

        const payload = {
          nome: formData.nome.trim(),
          ano: Number(formData.ano),
          turno: formData.turno
        };

        if (editingTurma) {
          await supabaseService.updateTurma(editingTurma.id, payload);
        } else {
          await supabaseService.createTurma(payload);
        }

        await loadData();
        resetForm();
        alert(editingTurma ? 'Turma atualizada com sucesso!' : 'Turma criada com sucesso!');
      } catch (error) {
        console.error('Erro ao salvar turma:', error);
        alert('Erro ao salvar turma');
      } finally {
        setLoading(false);
      }
    },
    [formData, editingTurma, loadData]
  );

  const handleEdit = useCallback((turma: Turma) => {
    setEditingTurma(turma);

    setFormData({
      nome: turma.nome,
      ano: turma.ano,
      // garante que o valor esteja no padrão do banco
      turno: (turma.turno as TurnoDB) ?? 'MANHA'
    });

    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (id: number) => {
      if (confirm('Tem certeza que deseja excluir esta turma?')) {
        try {
          setLoading(true);
          await supabaseService.deleteTurma(id);
          await loadData();
          alert('Turma excluída com sucesso!');
        } catch (error) {
          console.error('Erro ao excluir turma:', error);
          alert('Erro ao excluir turma');
        } finally {
          setLoading(false);
        }
      }
    },
    [loadData]
  );

  const resetForm = useCallback(() => {
    setFormData({
      nome: '',
      ano: 2025,
      turno: 'MANHA'
    });
    setEditingTurma(null);
    setIsDialogOpen(false);
  }, []);

  return (
    <Card>
      <CardHeaderBlock />

      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Buscar turmas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading}
          />
        </div>

        {loading && turmas.length === 0 ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Carregando...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTurmas.map((turma) => (
              <div key={turma.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">{turma.nome}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span>Ano: {turma.ano}</span>
                    <span>Turno: {TURNO_LABEL[(turma.turno as TurnoDB) ?? 'MANHA']}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="none"
                    className="h-8 w-8 p-0 inline-flex items-center justify-center"
                    onClick={() => handleEdit(turma)}
                    disabled={loading}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="destructive"
                    size="none"
                    className="h-8 w-8 p-0 inline-flex items-center justify-center"
                    onClick={() => handleDelete(turma.id)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {filteredTurmas.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma turma encontrada</p>
              </div>
            )}
          </div>
        )}

        {/* Dialog fica aqui pra manter o mesmo layout/estrutura */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <span />
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] lg:max-w-[800px] max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTurma ? 'Editar Turma' : 'Nova Turma'}</DialogTitle>
              <DialogDescription>Preencha as informações da turma</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome da Turma</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: 9º Ano A"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="ano">Ano</Label>
                  <Input
                    id="ano"
                    type="number"
                    value={formData.ano}
                    onChange={(e) => setFormData({ ...formData, ano: Number(e.target.value) })}
                    placeholder="Ex: 2026"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="turno">Turno</Label>
                  <Select
                    value={formData.turno}
                    onValueChange={(value: TurnoDB) => setFormData({ ...formData, turno: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o turno" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANHA">Manhã</SelectItem>
                      <SelectItem value="TARDE">Tarde</SelectItem>
                      <SelectItem value="NOITE">Noite</SelectItem>
                      <SelectItem value="INTEGRAL">Integral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={resetForm} disabled={loading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : editingTurma ? 'Salvar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

/**
 * Mantive um Header separado só para preservar exatamente o layout/estrutura do seu arquivo
 * sem mexer na lógica. Se preferir, posso colocar isso inline novamente.
 */
function CardHeaderBlock() {
  return (
    <div className="p-6 pb-0">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h3 className="card-title">Turmas</h3>
          <p className="card-description">Gerencie as turmas da escola</p>
        </div>
      </div>
    </div>
  );
}
