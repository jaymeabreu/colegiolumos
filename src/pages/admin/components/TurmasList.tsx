import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash2, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { supabaseService, Turma } from '../../../services/supabaseService';

export function TurmasList() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    ano: 2025,
    turno: 'MATUTINO' as 'MATUTINO' | 'VESPERTINO' | 'NOTURNO'
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

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      if (editingTurma) {
        await supabaseService.updateTurma(editingTurma.id, formData);
      } else {
        await supabaseService.createTurma(formData);
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
  }, [formData, editingTurma, loadData]);

  const handleEdit = useCallback((turma: Turma) => {
    setEditingTurma(turma);
    setFormData({
      nome: turma.nome,
      ano: turma.ano,
      turno: turma.turno
    });
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: number) => {
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
  }, [loadData]);

  const resetForm = useCallback(() => {
    setFormData({
      nome: '',
      ano: 2025,
      turno: 'MATUTINO'
    });
    setEditingTurma(null);
    setIsDialogOpen(false);
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h3 className="card-title">Turmas</h3>
            <p className="card-description">
              Gerencie as turmas da escola
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Turma
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] lg:max-w-[800px] max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTurma ? 'Editar Turma' : 'Nova Turma'}
                </DialogTitle>
                <DialogDescription>
                  Preencha as informações da turma
                </DialogDescription>
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
                      onChange={(e) => setFormData({ ...formData, ano: parseInt(e.target.value) })}
                      placeholder="Ex: 9"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="turno">Turno</Label>
                    <Select 
                      value={formData.turno} 
                      onValueChange={(value: 'MATUTINO' | 'VESPERTINO' | 'NOTURNO') => setFormData({ ...formData, turno: value })}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o turno" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MATUTINO">Matutino</SelectItem>
                        <SelectItem value="VESPERTINO">Vespertino</SelectItem>
                        <SelectItem value="NOTURNO">Noturno</SelectItem>
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
        </div>
      </CardHeader>
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
                    <span>Turno: {turma.turno}</span>
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
      </CardContent>
    </Card>
  );
}
