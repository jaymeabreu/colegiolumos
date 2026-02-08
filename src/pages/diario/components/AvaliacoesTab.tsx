import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Calendar, Edit, Trash2, X, GraduationCap } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { supabaseService } from '../../../services/supabaseService';
import type { Avaliacao } from '../../../services/supabaseService';

interface AvaliacoesTabProps {
  diarioId: number;
  readOnly?: boolean;
}

export function AvaliacoesTab({ diarioId, readOnly = false }: AvaliacoesTabProps) {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNotasDialogOpen, setIsNotasDialogOpen] = useState(false);
  const [editingAvaliacao, setEditingAvaliacao] = useState<Avaliacao | null>(null);
  const [selectedAvaliacao, setSelectedAvaliacao] = useState<Avaliacao | null>(null);
  const [notas, setNotas] = useState<{ [alunoId: number]: string }>({});
  const [loadingNotas, setLoadingNotas] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: '',
    data: '',
    peso: ''
  });

  useEffect(() => {
    loadAvaliacoes();
    loadAlunos();
  }, [diarioId]);

  const loadAvaliacoes = async () => {
    try {
      const avaliacoesData = await supabaseService.getAvaliacoesByDiario(diarioId);
      setAvaliacoes(avaliacoesData || []);
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
      setAvaliacoes([]);
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

  const loadNotas = async (avaliacaoId: number) => {
    try {
      setLoadingNotas(true);
      const notasData = await supabaseService.getNotasByAvaliacao(avaliacaoId);
      
      console.log('📊 Notas carregadas do banco:', notasData);
      
      const notasMap: { [alunoId: number]: string } = {};
      notasData.forEach(nota => {
        notasMap[nota.aluno_id] = nota.valor.toString();
      });
      
      console.log('✅ Notas mapeadas:', notasMap);
      
      setNotas(notasMap);
    } catch (error) {
      console.error('Erro ao carregar notas:', error);
    } finally {
      setLoadingNotas(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.tipo || !formData.data || !formData.peso) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      if (editingAvaliacao) {
        await supabaseService.updateAvaliacao(editingAvaliacao.id, {
          titulo: formData.titulo,
          tipo: formData.tipo,
          data: formData.data,
          peso: parseFloat(formData.peso)
        });
      } else {
        await supabaseService.createAvaliacao({
          titulo: formData.titulo,
          tipo: formData.tipo,
          data: formData.data,
          peso: parseFloat(formData.peso),
          diarioId
        });
      }
      await loadAvaliacoes();
      setIsDialogOpen(false);
      resetForm();
      alert('Avaliação salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      alert('Erro ao salvar avaliação');
    }
  };

  const handleSaveNotas = async () => {
    if (!selectedAvaliacao) return;

    try {
      setLoadingNotas(true);
      
      console.log('💾 Salvando notas:', notas);
      
      // Salva cada nota individualmente
      for (const aluno of alunos) {
        const notaValue = notas[aluno.id];
        
        // Se tem valor, salva
        if (notaValue && notaValue.trim() !== '') {
          console.log(`Salvando nota do aluno ${aluno.id}: ${notaValue}`);
          
          await supabaseService.saveNota({
            avaliacaoId: selectedAvaliacao.id,
            alunoId: aluno.id,
            valor: parseFloat(notaValue)
          });
        }
      }

      alert('Notas salvas com sucesso!');
      setIsNotasDialogOpen(false);
      setSelectedAvaliacao(null);
      setNotas({});
    } catch (error) {
      console.error('❌ Erro ao salvar notas:', error);
      alert('Erro ao salvar notas');
    } finally {
      setLoadingNotas(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta avaliação?')) return;
    
    try {
      await supabaseService.deleteAvaliacao(id);
      await loadAvaliacoes();
      alert('Avaliação excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir avaliação:', error);
      alert('Erro ao excluir avaliação');
    }
  };

  const handleEdit = (avaliacao: Avaliacao) => {
    setEditingAvaliacao(avaliacao);
    setFormData({
      titulo: avaliacao.titulo,
      tipo: avaliacao.tipo,
      data: avaliacao.data,
      peso: avaliacao.peso.toString()
    });
    setIsDialogOpen(true);
  };

  const handleOpenNotas = async (avaliacao: Avaliacao) => {
    setSelectedAvaliacao(avaliacao);
    setIsNotasDialogOpen(true);
    await loadNotas(avaliacao.id);
  };

  const resetForm = () => {
    setFormData({ titulo: '', tipo: '', data: '', peso: '' });
    setEditingAvaliacao(null);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleCloseNotas = () => {
    setIsNotasDialogOpen(false);
    setSelectedAvaliacao(null);
    setNotas({});
  };

  const filteredAvaliacoes = avaliacoes.filter(av =>
    av.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    av.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <CardTitle>Avaliações</CardTitle>
              <CardDescription>Gerencie as avaliações e notas dos alunos</CardDescription>
            </div>
            {!readOnly && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="flex items-center gap-2 bg-[#0e4a5e] hover:bg-[#0a3645]">
                    <Plus className="h-4 w-4" />
                    <span>Nova Avaliação</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg !z-[99999]">
                  <DialogHeader>
                    <DialogTitle>{editingAvaliacao ? 'Editar Avaliação' : 'Nova Avaliação'}</DialogTitle>
                    <DialogDescription>
                      {editingAvaliacao ? 'Atualize os dados da avaliação' : 'Preencha os dados para criar uma nova avaliação'}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="titulo">Título *</Label>
                      <Input 
                        id="titulo" 
                        value={formData.titulo} 
                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} 
                        placeholder="Ex: Prova Bimestral" 
                        required 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tipo">Tipo *</Label>
                        <select
                          id="tipo"
                          value={formData.tipo}
                          onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          required
                        >
                          <option value="">Selecione</option>
                          <option value="Prova">Prova</option>
                          <option value="Trabalho">Trabalho</option>
                          <option value="Seminário">Seminário</option>
                          <option value="Atividade">Atividade</option>
                          <option value="Projeto">Projeto</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="peso">Peso *</Label>
                        <Input 
                          id="peso" 
                          type="number" 
                          step="0.1" 
                          min="0"
                          value={formData.peso} 
                          onChange={(e) => setFormData({ ...formData, peso: e.target.value })} 
                          placeholder="1.0" 
                          required 
                        />
                      </div>
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

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={handleClose}>
                        Cancelar
                      </Button>
                      <Button type="submit" className="bg-[#0e4a5e] hover:bg-[#0a3645]">
                        {editingAvaliacao ? 'Salvar Alterações' : 'Criar Avaliação'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Buscar avaliações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            {filteredAvaliacoes.map((avaliacao) => (
              <div key={avaliacao.id} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">{avaliacao.titulo}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600">
                    <Badge variant="outline">{avaliacao.tipo}</Badge>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(avaliacao.data).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="text-blue-600 font-medium">Peso: {avaliacao.peso}</span>
                  </div>
                </div>
                {!readOnly && (
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleOpenNotas(avaliacao)}
                      className="bg-green-50 hover:bg-green-100 text-green-700"
                    >
                      <GraduationCap className="h-4 w-4 mr-1" />
                      Notas
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(avaliacao)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(avaliacao.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {filteredAvaliacoes.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma avaliação cadastrada.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* MODAL DE NOTAS */}
      {isNotasDialogOpen && selectedAvaliacao && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseNotas} />
          
          <div className="relative bg-white w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold">Lançar Notas</h2>
                <p className="text-sm text-gray-600 mt-1">{selectedAvaliacao.titulo}</p>
              </div>
              <button onClick={handleCloseNotas} className="p-2 rounded-full hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {loadingNotas ? (
                <div className="text-center py-8 text-gray-500">Carregando...</div>
              ) : (
                <div className="space-y-3">
                  {alunos.map((aluno) => (
                    <div key={aluno.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{aluno.nome}</p>
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          placeholder="0.0"
                          value={notas[aluno.id] || ''}
                          onChange={(e) => setNotas({ ...notas, [aluno.id]: e.target.value })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t">
              <Button type="button" variant="outline" onClick={handleCloseNotas}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveNotas} 
                disabled={loadingNotas}
                className="bg-[#0e4a5e] hover:bg-[#0a3645]"
              >
                {loadingNotas ? 'Salvando...' : 'Salvar Notas'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
