import { useState, useEffect } from 'react';
import { Users, GraduationCap, Mail, FileText, Eye } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../../../components/ui/avatar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { supabaseService } from '../../../services/supabaseService';
import type { Aluno, Diario } from '../../../services/supabaseService';

interface AlunosTabProps {
  diarioId: number;
  readOnly?: boolean;
}

export function AlunosTab({ diarioId, readOnly = false }: AlunosTabProps) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [diario, setDiario] = useState<Diario | null>(null);
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null);
  const [isBoletimOpen, setIsBoletimOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('resumo');

  useEffect(() => {
    loadAlunos();
  }, [diarioId]);

  const loadAlunos = async () => {
    try {
      setLoading(true);
      
      // 1. Carregar o diário para pegar a turma_id
      const diarioData = await supabaseService.getDiarioById(diarioId);
      if (!diarioData) {
        console.error('Diário não encontrado');
        setAlunos([]);
        return;
      }
      
      setDiario(diarioData);
      console.log('📚 Diário carregado:', diarioData);
      
      // 2. Buscar alunos da turma (não do diário)
      const turmaId = diarioData.turma_id ?? diarioData.turmaId;
      const alunosDaTurma = await supabaseService.getAlunosByTurma(turmaId);
      console.log('👥 Alunos da turma:', alunosDaTurma);
      
      // 3. Carregar alunos já vinculados ao diário
      let alunosVinculados: number[] = [];
      try {
        const diarioAlunos = await supabaseService.getDiarioAlunos();
        alunosVinculados = diarioAlunos
          .filter(da => da.diario_id === diarioId || da.diarioId === diarioId)
          .map(da => da.aluno_id ?? da.alunoId)
          .filter((id): id is number => id !== null && id !== undefined);
        console.log('📌 Alunos já vinculados:', alunosVinculados);
      } catch (error) {
        console.log('⚠️ Erro ao carregar alunos vinculados:', error);
      }

      // 4. Vincular apenas os alunos que NÃO estão vinculados
      if (alunosDaTurma && alunosDaTurma.length > 0) {
        for (const aluno of alunosDaTurma) {
          // Pula se já está vinculado
          if (alunosVinculados.includes(aluno.id)) {
            console.log(`⏭️ Aluno ${aluno.nome} já vinculado, pulando...`);
            continue;
          }

          try {
            await supabaseService.vincularAlunoAoDiario(diarioId, aluno.id);
            console.log(`✅ Aluno ${aluno.nome} vinculado ao diário`);
          } catch (error) {
            console.error(`❌ Erro ao vincular ${aluno.nome}:`, error);
          }
        }
      }
      
      // 5. Carregar alunos do diário (agora que foram vinculados)
      const alunosDoDiario = await supabaseService.getAlunosByDiario(diarioId);
      setAlunos(alunosDoDiario || []);
      console.log('📋 Alunos do diário:', alunosDoDiario);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
      setAlunos([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlunos = (alunos || []).filter(aluno =>
    (aluno.nome?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
    (aluno.email?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
  );

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleVerBoletim = (aluno: Aluno) => {
    setSelectedAluno(aluno);
    setActiveTab('resumo');
    setIsBoletimOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando alunos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <CardTitle>Alunos da Turma</CardTitle>
              <CardDescription>
                Visualize informações dos alunos
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {alunos.length} alunos
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Buscar alunos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="space-y-4">
            {filteredAlunos.map((aluno) => (
              <div key={aluno.id} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                      {getInitials(aluno.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{aluno.nome}</h3>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" />
                        Matrícula: {aluno.id}
                      </span>
                      {aluno.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {aluno.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVerBoletim(aluno)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Ver Boletim
                  </Button>
                </div>
              </div>
            ))}

            {filteredAlunos.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'Nenhum aluno encontrado.' : 'Nenhum aluno matriculado.'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal Boletim */}
      <Dialog open={isBoletimOpen} onOpenChange={setIsBoletimOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-blue-100 text-blue-600 font-medium text-sm">
                  {selectedAluno ? getInitials(selectedAluno.nome) : ''}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-lg">{selectedAluno?.nome}</DialogTitle>
                <p className="text-sm text-gray-500">Boletim Escolar</p>
              </div>
              <button 
                onClick={() => setIsBoletimOpen(false)}
                className="ml-auto text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex gap-0 border-b bg-gray-50">
              {['resumo', 'completo', 'disciplina', 'avaliacoes', 'ocorrencias'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-medium transition ${
                    activeTab === tab
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab === 'resumo' && 'Resumo'}
                  {tab === 'completo' && 'Boletim Completo'}
                  {tab === 'disciplina' && 'Por Disciplina'}
                  {tab === 'avaliacoes' && 'Avaliações'}
                  {tab === 'ocorrencias' && 'Ocorrências'}
                </button>
              ))}
            </div>

            {/* Conteúdo Resumo */}
            {activeTab === 'resumo' && (
              <>
                {/* Cards */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <div className="text-3xl font-bold text-gray-400">-</div>
                    <div className="text-sm font-medium text-gray-700 mt-2">Média Geral</div>
                    <div className="text-xs text-gray-500 mt-1">Sem notas</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <div className="text-3xl font-bold text-gray-400">-</div>
                    <div className="text-sm font-medium text-gray-700 mt-2">Frequência</div>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg text-center">
                    <div className="inline-block px-3 py-1 bg-yellow-300 text-yellow-900 rounded-full text-xs font-medium">
                      Sem Dados
                    </div>
                    <div className="text-sm font-medium text-gray-700 mt-2">Situação</div>
                    <div className="text-xs text-gray-500 mt-1">Status atual no período</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <div className="text-3xl font-bold text-gray-900">1</div>
                    <div className="text-sm font-medium text-gray-700 mt-2">Ocorrências</div>
                    <div className="text-xs text-gray-500 mt-1">Registros no período</div>
                  </div>
                </div>

                {/* Performance */}
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Performance por Disciplina</h3>
                  <p className="text-sm text-gray-600 mb-4">Visão geral do desempenho</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium text-gray-900">Ciências</span>
                      <span className="text-sm text-gray-600">Em Andamento</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium text-gray-900">Geografia</span>
                      <span className="text-sm text-gray-600">Em Andamento</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Outros Tabs - Placeholder */}
            {activeTab !== 'resumo' && (
              <div className="text-center py-8 text-gray-500">
                Conteúdo em desenvolvimento
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
