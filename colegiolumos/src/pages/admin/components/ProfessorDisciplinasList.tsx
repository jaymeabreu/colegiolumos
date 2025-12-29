import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Trash2, Link, BookOpen, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { supabaseService } from '../../../services/supabaseService';
import type { Professor, Disciplina, Usuario } from '../../../services/supabaseService';

interface Vinculo {
  professor_id: number;
  disciplina_id: number;
}

export function ProfessorDisciplinasList() {
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    professorId: '',
    disciplinaId: ''
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [professoresData, disciplinasData, usuariosData, vinculosData] = await Promise.all([
        supabaseService.getProfessores(),
        supabaseService.getDisciplinas(),
        supabaseService.getUsuarios(),
        supabaseService.getVinculosProfessorDisciplina()
      ]);
      setProfessores(professoresData);
      setDisciplinas(disciplinasData);
      setUsuarios(usuariosData);
      setVinculos(vinculosData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Agrupar vínculos por professor
  const vinculosPorProfessor = useMemo(() => {
    const grouped = new Map<number, number[]>();
    
    vinculos.forEach(v => {
      if (!grouped.has(v.professor_id)) {
        grouped.set(v.professor_id, []);
      }
      grouped.get(v.professor_id)!.push(v.disciplina_id);
    });
    
    return grouped;
  }, [vinculos]);

  const getProfessorNome = useCallback((professorId: number) => {
    return professores.find(p => p.id === professorId)?.nome || 'N/A';
  }, [professores]);

  const getDisciplinaNome = useCallback((disciplinaId: number) => {
    return disciplinas.find(d => d.id === disciplinaId)?.nome || 'N/A';
  }, [disciplinas]);

  const getDisciplinasByProfessor = useCallback((professorId: number) => {
    return vinculosPorProfessor.get(professorId) || [];
  }, [vinculosPorProfessor]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.professorId || !formData.disciplinaId) {
      alert('Selecione professor e disciplina!');
      return;
    }

    // Verificar se já existe
    const jaExiste = vinculos.some(
      v => v.professor_id === Number(formData.professorId) && 
           v.disciplina_id === Number(formData.disciplinaId)
    );

    if (jaExiste) {
      alert('Este vínculo já existe!');
      return;
    }

    try {
      setLoading(true);
      await supabaseService.vincularProfessorDisciplina(
        Number(formData.professorId),
        Number(formData.disciplinaId)
      );
      await loadData();
      resetForm();
      alert('Vínculo criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar vínculo:', error);
      alert('Erro ao criar vínculo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [formData, vinculos, loadData]);

  const handleDelete = useCallback(async (professorId: number, disciplinaId: number) => {
    if (confirm('Tem certeza que deseja remover este vínculo?')) {
      try {
        setLoading(true);
        await supabaseService.desvincularProfessorDisciplina(professorId, disciplinaId);
        await loadData();
        alert('Vínculo removido com sucesso!');
      } catch (error) {
        console.error('Erro ao remover vínculo:', error);
        alert('Erro ao remover vínculo. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }
  }, [loadData]);

  const resetForm = useCallback(() => {
    setFormData({
      professorId: '',
      disciplinaId: ''
    });
    setIsDialogOpen(false);
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h3 className="card-title">Professor-Disciplina</h3>
            <p className="card-description">
              Vincule professores às disciplinas que eles lecionam
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Vínculo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Vínculo Professor-Disciplina</DialogTitle>
                <DialogDescription>
                  Selecione o professor e a disciplina que ele leciona
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="professor">Professor</Label>
                    <Select 
                      value={formData.professorId} 
                      onValueChange={(value) => setFormData({ ...formData, professorId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o professor" />
                      </SelectTrigger>
                      <SelectContent>
                        {professores.map((professor) => (
                          <SelectItem key={professor.id} value={professor.id.toString()}>
                            {professor.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="disciplina">Disciplina</Label>
                    <Select 
                      value={formData.disciplinaId} 
                      onValueChange={(value) => setFormData({ ...formData, disciplinaId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a disciplina" />
                      </SelectTrigger>
                      <SelectContent>
                        {disciplinas.map((disciplina) => (
                          <SelectItem key={disciplina.id} value={disciplina.id.toString()}>
                            {disciplina.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Criando...' : 'Criar Vínculo'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="text-center py-8 text-gray-500">
            <p>Carregando...</p>
          </div>
        )}

        {!loading && (
          <div className="space-y-6">
            {professores.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum professor cadastrado</p>
                <p className="text-sm mt-2">Cadastre professores primeiro em "Professores"</p>
              </div>
            )}

            {disciplinas.length === 0 && professores.length > 0 && (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma disciplina cadastrada</p>
                <p className="text-sm mt-2">Cadastre disciplinas primeiro em "Disciplinas"</p>
              </div>
            )}

            {professores.length > 0 && disciplinas.length > 0 && professores.map((professor) => {
              const disciplinasProfessor = getDisciplinasByProfessor(professor.id);
              
              return (
                <div key={professor.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{professor.nome}</h3>
                      <p className="text-sm text-gray-600">{professor.email}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {disciplinasProfessor.length} disciplina(s)
                    </div>
                  </div>

                  {disciplinasProfessor.length > 0 && (
                    <div className="ml-13 space-y-2">
                      {disciplinasProfessor.map((disciplinaId) => (
                        <div 
                          key={`${professor.id}-${disciplinaId}`}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{getDisciplinaNome(disciplinaId)}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(professor.id, disciplinaId)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {disciplinasProfessor.length === 0 && (
                    <div className="ml-13 text-sm text-gray-400 italic">
                      Nenhuma disciplina vinculada
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ProfessorDisciplinasList;
