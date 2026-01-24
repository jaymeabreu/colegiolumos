import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button'; 
import { Eye, Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabaseService } from '../../../services/supabaseService';
import type { Aluno, Diario } from '../../../services/supabaseService';

interface RendimentoTabProps {
  diarioId: number;
}

interface AlunoRendimento {
  id: number;
  nome: string;
  media: number;
  faltas: number;
  situacao: 'Aprovado' | 'Reprovado' | 'Em Análise' | 'Recuperação';
  frequencia: number;
}

export function RendimentoTab({ diarioId }: RendimentoTabProps) {
  const [alunos, setAlunos] = useState<AlunoRendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [diario, setDiario] = useState<Diario | null>(null);

  useEffect(() => {
    loadRendimento();
  }, [diarioId]);

  const loadRendimento = async () => {
    try {
      setLoading(true);

      // Buscar informações do diário
      const diarioData = await supabaseService.getDiarioById(diarioId);
      setDiario(diarioData);

      if (!diarioData) {
        console.error('Diário não encontrado');
        setAlunos([]);
        return;
      }

      // Buscar alunos do diário
      const alunosDoDiario = await supabaseService.getAlunosByDiario(diarioId);

      // Buscar rendimento de cada aluno
      const rendimentos = await Promise.all(
        alunosDoDiario.map(async (aluno) => {
          try {
            const boletim = await supabaseService.getBoletimAluno(diarioId, aluno.id);
            
            return {
              id: aluno.id,
              nome: aluno.nome,
              media: boletim.mediaGeral,
              faltas: boletim.faltas,
              situacao: boletim.situacao as AlunoRendimento['situacao'],
              frequencia: boletim.frequencia
            };
          } catch (error) {
            console.error(`Erro ao buscar rendimento de ${aluno.nome}:`, error);
            return {
              id: aluno.id,
              nome: aluno.nome,
              media: 0,
              faltas: 0,
              situacao: 'Em Análise' as const,
              frequencia: 0
            };
          }
        })
      );

      setAlunos(rendimentos);
    } catch (error) {
      console.error('Erro ao carregar rendimento:', error);
      setAlunos([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlunos = alunos.filter(aluno =>
    aluno.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSituacaoColor = (situacao: string) => {
    switch (situacao) {
      case 'Aprovado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Reprovado':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Recuperação':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMediaIcon = (media: number) => {
    if (media >= 7) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (media >= 5) return <Minus className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const getMediaColor = (media: number) => {
    if (media >= 7) return 'text-green-600 font-bold';
    if (media >= 5) return 'text-yellow-600 font-bold';
    return 'text-red-600 font-bold';
  };

  const stats = {
    total: alunos.length,
    aprovados: alunos.filter(a => a.situacao === 'Aprovado').length,
    reprovados: alunos.filter(a => a.situacao === 'Reprovado').length,
    recuperacao: alunos.filter(a => a.situacao === 'Recuperação').length,
    mediaGeral: alunos.length > 0 
      ? (alunos.reduce((acc, a) => acc + a.media, 0) / alunos.length).toFixed(1)
      : '0.0'
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando rendimento dos alunos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Total de Alunos</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.aprovados}</div>
            <p className="text-xs text-muted-foreground mt-1">Aprovados</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.recuperacao}</div>
            <p className="text-xs text-muted-foreground mt-1">Recuperação</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.reprovados}</div>
            <p className="text-xs text-muted-foreground mt-1">Reprovados</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{stats.mediaGeral}</div>
            <p className="text-xs text-muted-foreground mt-1">Média Geral</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Rendimento */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span className="text-purple-600">📊</span>
                Rendimento dos Alunos
              </CardTitle>
              <CardDescription>
                Acompanhamento de notas, faltas e situação dos alunos
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadRendimento}
            >
              Atualizar
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Campo de Busca */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar aluno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabela */}
          {filteredAlunos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="font-medium mb-2">
                {searchTerm ? 'Nenhum aluno encontrado' : 'Nenhum aluno matriculado'}
              </p>
              {!searchTerm && (
                <p className="text-sm">
                  Os alunos serão listados automaticamente quando matriculados no diário
                </p>
              )}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Nº
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Nome
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                        Média
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                        Faltas
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                        Situação
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredAlunos.map((aluno, index) => (
                      <tr key={aluno.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 text-sm text-gray-900 font-medium">
                          {index + 1}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {aluno.nome}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {getMediaIcon(aluno.media)}
                            <span className={getMediaColor(aluno.media)}>
                              {aluno.media > 0 ? aluno.media.toFixed(1) : '-'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`font-medium ${
                            aluno.faltas === 0 ? 'text-green-600' :
                            aluno.faltas <= 3 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {aluno.faltas > 0 ? aluno.faltas : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <Badge 
                            variant="outline" 
                            className={getSituacaoColor(aluno.situacao)}
                          >
                            {aluno.situacao}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Legenda */}
          {filteredAlunos.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Legenda:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-muted-foreground">Média ≥ 7.0</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-muted-foreground">Média 5.0 - 6.9</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-muted-foreground">Média {'<'} 5.0</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  <span className="text-muted-foreground">Sem avaliações</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
