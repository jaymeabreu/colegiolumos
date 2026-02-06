import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { supabaseService } from '../../../services/supabaseService';
import type { Disciplina } from '../../../services/supabaseService';

// Paleta de cores para disciplinas - distribuindo de forma equilibrada
const DISCIPLINE_COLORS = [
  'bg-red-500',      // Vermelho
  'bg-yellow-500',   // Amarelo
  'bg-green-500',    // Verde
  'bg-blue-500',     // Azul
  'bg-orange-500',   // Laranja
  'bg-purple-500',   // Roxo
];

// Função para obter cor consistente baseada no ID da disciplina
const getDisciplinaColor = (disciplinaId: number): string => {
  return DISCIPLINE_COLORS[disciplinaId % DISCIPLINE_COLORS.length];
};

// Função para capitalizar a primeira letra
const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export function DisciplinasList() {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDisciplina, setEditingDisciplina] = useState<Disciplina | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    codigo: '',
    cargaHoraria: ''
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await supabaseService.getDisciplinas();
      setDisciplinas(data);
    } catch (error) {
      console.error('Erro ao carregar disciplinas:', error);
      alert('Erro ao carregar disciplinas. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtro otimizado
  const filteredDisciplinas = useMemo(() => {
    if (!searchTerm) return disciplinas; // Sem processamento se não há busca
    
    return disciplinas.filter(disciplina =>
      disciplina.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (disciplina.codigo && disciplina.codigo.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [disciplinas, searchTerm]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      nome: formData.nome,
      codigo: formData.codigo || formData.nome.substring(0, 3).toUpperCase(),
      carga_horaria: Number(formData.cargaHoraria)
    };

    try {
      setLoading(true);
      if (editingDisciplina) {
        await supabaseService.updateDisciplina(editingDisciplina.id, data);
        alert('Disciplina atualizada com sucesso!');
      } else {
        await supabaseService.createDisciplina(data);
        alert('Disciplina criada com sucesso!');
      }
      await loadData();
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar disciplina:', error);
      alert('Erro ao salvar disciplina. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [formData, editingDisciplina, loadData]);

  const handleEdit = useCallback((disciplina: Disciplina) => {
    setEditingDisciplina(disciplina);
    setFormData({
      nome: disciplina.nome,
      codigo: disciplina.codigo || '',
      cargaHoraria: disciplina.carga_horaria?.toString() || ''
    });
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta disciplina?')) {
      try {
        setLoading(true);
        await supabaseService.deleteDisciplina(id);
        await loadData();
        alert('Disciplina excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir disciplina:', error);
        alert('Erro ao excluir disciplina. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }
  }, [loadData]);

  const resetForm = useCallback(() => {
    setFormData({
      nome: '',
      codigo: '',
      cargaHoraria: ''
    });
    setEditingDisciplina(null);
    setIsDialogOpen(false);
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h3 className="card-title">Disciplinas</h3>
            <p className="card-description">
              Gerencie as disciplinas da escola
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Disciplina
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] lg:max-w-[800px] max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingDisciplina ? 'Editar Disciplina' : 'Nova Disciplina'}
                </DialogTitle>
                <DialogDescription>
                  Preencha as informações da disciplina
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome da Disciplina</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Matemática"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="codigo">Código da Disciplina (opcional)</Label>
                    <Input
                      id="codigo"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                      placeholder="Ex: MAT (deixe vazio para gerar automaticamente)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cargaHoraria">Carga Horária (horas)</Label>
                    <Input
                      id="cargaHoraria"
                      type="number"
                      value={formData.cargaHoraria}
                      onChange={(e) => setFormData({ ...formData, cargaHoraria: e.target.value })}
                      placeholder="Ex: 200"
                      required
                    />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : (editingDisciplina ? 'Salvar' : 'Criar')}
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
            placeholder="Buscar disciplinas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {loading && (
          <div className="text-center py-8 text-gray-500">
            <p>Carregando...</p>
          </div>
        )}

        {!loading && (
          <div className="space-y-4">
            {filteredDisciplinas.map((disciplina) => (
              <div key={disciplina.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{disciplina.nome}</h3>
                    {disciplina.codigo && (
                      <span className={`${getDisciplinaColor(disciplina.id)} text-white rounded-full px-3 py-1 text-xs font-semibold`}>
                        {capitalize(disciplina.codigo)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Carga horária: {disciplina.carga_horaria} horas
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="none"
                    className="h-8 w-8 p-0 inline-flex items-center justify-center"
                    onClick={() => handleEdit(disciplina)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="none"
                    className="h-8 w-8 p-0 inline-flex items-center justify-center"
                    onClick={() => handleDelete(disciplina.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredDisciplinas.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma disciplina encontrada</p>
                {!searchTerm && (
                  <p className="text-sm mt-2">Clique em "Nova Disciplina" para começar</p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
