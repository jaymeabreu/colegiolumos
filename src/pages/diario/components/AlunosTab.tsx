import { useState, useEffect } from 'react';
import { Users, GraduationCap, Mail, TrendingUp, Calendar, Info, AlertCircle, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../../components/ui/avatar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Dialog, DialogContent } from '../../../components/ui/dialog';
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
      const diarioData = await supabaseService.getDiarioById(diarioId);
      if (!diarioData) {
        setAlunos([]);
        return;
      }
      setDiario(diarioData);
      const turmaId = diarioData.turma_id ?? diarioData.turmaId;
      const alunosDaTurma = await supabaseService.getAlunosByTurma(turmaId);
      const alunosDoDiario = await supabaseService.getAlunosByDiario(diarioId);
      setAlunos(alunosDoDiario || []);
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
    return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
              <CardDescription>Visualize informações e desempenho dos alunos</CardDescription>
            </div>
            <Badge variant="outline" className="flex items-center gap-1 text-xs font-normal text-gray-500 border-none">
              <Users className="h-3 w-3" />
              {alunos.length} alunos
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Input
              placeholder="Buscar alunos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
          <div className="space-y-4">
            {filteredAlunos.map((aluno) => (
              <div key={aluno.id} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-slate-100 text-slate-500 text-xs font-semibold">
                      {getInitials(aluno.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm text-gray-900">{aluno.nome}</h3>
                      <Badge className="bg-blue-600 hover:bg-blue-700 text-[10px] h-4 px-1.5">Ativo</Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-0.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> Matrícula: {aluno.id}</span>
                      {aluno.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {aluno.email}</span>}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleVerBoletim(aluno)} className="flex items-center gap-2 text-xs font-medium border-gray-300">
                  <TrendingUp className="h-3.5 w-3.5" /> Ver Boletim
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal Boletim Corrigido - LARGURA AMPLIADA */}
      <Dialog open={isBoletimOpen} onOpenChange={setIsBoletimOpen}>
        <DialogContent className="max-w-[1100px] w-[95vw] p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-white">
          {/* Header */}
          <div className="px-10 py-8 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <Avatar className="h-14 w-14 border border-gray-100 shadow-sm">
                <AvatarFallback className="bg-slate-50 text-slate-400 text-base font-bold">
                  {selectedAluno ? getInitials(selectedAluno.nome) : ''}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Boletim Escolar</h2>
                <p className="text-base font-medium text-gray-400">{selectedAluno?.nome}</p>
              </div>
            </div>
            <button onClick={() => setIsBoletimOpen(false)} className="p-2 hover:bg-gray-50 rounded-full transition-colors group">
              <X className="h-6 w-6 text-gray-300 group-hover:text-gray-600" />
            </button>
          </div>

          {/* Navigation Tabs - Estilo Segmentado */}
          <div className="px-10 mb-2">
            <div className="flex items-center p-1.5 bg-[#f1f5f9] rounded-xl w-full">
              {[
                { id: 'resumo', label: 'Resumo' },
                { id: 'completo', label: 'Boletim Completo' },
                { id: 'disciplina', label: 'Por Disciplina' },
                { id: 'avaliacoes', label: 'Avaliações' },
                { id: 'ocorrencias', label: 'Ocorrências' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2.5 text-[14px] font-bold rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="p-10 pt-6">
            {activeTab === 'resumo' && (
              <div className="space-y-12">
                {/* Summary Cards Grid - Forçando 4 colunas horizontais */}
                <div className="grid grid-cols-4 gap-6">
                  {/* Média Geral */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-7 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col min-h-[160px]">
                    <div className="flex justify-center items-center mb-auto">
                      <span className="text-[14px] font-bold text-gray-800">Média Geral</span>
                      <TrendingUp className="h-4 w-4 text-gray-300 ml-2" />
                    </div>
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-red-500 leading-none">-</span>
                      <div className="text-[12px] font-medium text-gray-300 mt-3">Sem notas</div>
                    </div>
                  </div>

                  {/* Frequência */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-7 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col min-h-[160px]">
                    <div className="flex justify-center items-center mb-auto">
                      <span className="text-[14px] font-bold text-gray-800">Frequência</span>
                      <Calendar className="h-4 w-4 text-gray-300 ml-2" />
                    </div>
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-red-500 leading-none">-</span>
                    </div>
                  </div>

                  {/* Situação */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-7 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col min-h-[160px]">
                    <div className="flex justify-center items-center mb-auto">
                      <span className="text-[14px] font-bold text-gray-800">Situação</span>
                      <Info className="h-4 w-4 text-gray-300 ml-2" />
                    </div>
                    <div className="mt-4 flex flex-col items-start gap-3">
                      <Badge className="bg-orange-400 hover:bg-orange-400 text-white text-[12px] font-bold px-4 py-1 rounded-full border-none">
                        Sem Dados
                      </Badge>
                      <span className="text-[12px] font-medium text-gray-300">Status atual no período</span>
                    </div>
                  </div>

                  {/* Ocorrências */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-7 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col min-h-[160px]">
                    <div className="flex justify-center items-center mb-auto">
                      <span className="text-[14px] font-bold text-gray-800">Ocorrências</span>
                      <AlertCircle className="h-4 w-4 text-gray-300 ml-2" />
                    </div>
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-slate-800 leading-none">1</span>
                      <div className="text-[12px] font-medium text-gray-300 mt-3">Registros no período</div>
                    </div>
                  </div>
                </div>

                {/* Performance Section */}
                <div className="space-y-8">
                  <div className="space-y-1.5">
                    <h3 className="text-2xl font-bold text-gray-800 tracking-tight">Performance por Disciplina</h3>
                    <p className="text-base font-medium text-gray-400">Visão geral do desempenho</p>
                  </div>
                  
                  <div className="divide-y divide-gray-50 border-t border-gray-50">
                    <div className="flex justify-between items-center py-6">
                      <span className="text-[15px] font-bold text-gray-800">Ciências</span>
                      <div className="flex items-center gap-8">
                        <span className="text-base font-bold text-red-500">-</span>
                        <Badge variant="outline" className="bg-white text-gray-800 text-[12px] font-bold px-4 py-1.5 rounded-full border-gray-200 shadow-sm">
                          Em Andamento
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-6">
                      <span className="text-[15px] font-bold text-gray-800">Geografia</span>
                      <div className="flex items-center gap-8">
                        <span className="text-base font-bold text-red-500">-</span>
                        <Badge variant="outline" className="bg-white text-gray-800 text-[12px] font-bold px-4 py-1.5 rounded-full border-gray-200 shadow-sm">
                          Em Andamento
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
