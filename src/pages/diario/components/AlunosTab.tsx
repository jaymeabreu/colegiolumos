import { useState, useEffect } from 'react';
import { Users, GraduationCap, Mail, FileText } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../../../components/ui/avatar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { supabaseService } from '../../../services/supabaseService';
import type { Aluno } from '../../../services/supabaseService';

interface AlunosTabProps {
  diarioId: number;
  readOnly?: boolean;
}

export function AlunosTab({ diarioId, readOnly = false }: AlunosTabProps) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlunos();
  }, [diarioId]);

  const loadAlunos = async () => {
    try {
      const alunosData = await supabaseService.getAlunosByDiario(diarioId);
      setAlunos(alunosData || []);
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
  );
}
