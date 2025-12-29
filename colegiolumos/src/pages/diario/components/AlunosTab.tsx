
import { useState, useEffect } from 'react';
import { Eye, Users, GraduationCap, Mail, FileText } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../../../components/ui/avatar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { mockDataService, Aluno } from '../../../services/mockData';
import { BoletimModal } from '../../../components/shared/BoletimModal';

interface AlunosTabProps {
  diarioId: number;
  readOnly?: boolean;
}

export function AlunosTab({ diarioId, readOnly = false }: AlunosTabProps) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadAlunos();
  }, [diarioId]);

  const loadAlunos = () => {
    const alunosData = mockDataService.getAlunosByDiario(diarioId);
    setAlunos(alunosData);
  };

  const getStatusBadgeVariant = (status: string) => {
    if (!status) return 'default';
    
    switch (status.toLowerCase()) {
      case 'ativo':
        return 'default';
      case 'inativo':
        return 'secondary';
      case 'transferido':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const filteredAlunos = alunos.filter(aluno =>
    aluno.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aluno.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aluno.matricula?.includes(searchTerm)
  );

  const handleViewDetails = (aluno: Aluno) => {
    setSelectedAluno(aluno);
    setIsDialogOpen(true);
  };

  // Novo handler para atender ao botão "Ver Boletim"
  const handleViewBoletim = (aluno: Aluno) => {
    setSelectedAluno(aluno);
    setIsDialogOpen(true);
  };

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="space-y-2">
            <CardTitle>Alunos da Turma</CardTitle>
            <CardDescription>
              Visualize informações e desempenho dos alunos
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
            className="input"
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
                  {aluno.foto ? (
                    <AvatarImage 
                      src={aluno.foto} 
                      alt={aluno.nome}
                      className="object-cover"
                    />
                  ) : null}
                  <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                    {getInitials(aluno.nome)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{aluno.nome}</h3>
                    <Badge variant={getStatusBadgeVariant(aluno.situacao || 'ativo')}>
                      {aluno.situacao || 'Ativo'}
                    </Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" />
                      Matrícula: {aluno.matricula}
                    </span>
                    {aluno.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {aluno.email}
                      </span>
                    )}
                    {aluno.contato && (
                      <span>Tel: {aluno.contato}</span>
                    )}
                  </div>
                </div>
              </div>
              

              {/* Botão adicional "Ver Boletim" conforme modificação */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewBoletim(aluno)}
                  className="inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <FileText className="h-4 w-4" />
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

          {/* Modal do Boletim */}
          {isDialogOpen && selectedAluno && (
            <BoletimModal 
              aluno={selectedAluno} 
              diarioId={diarioId.toString()}
              onClose={() => setIsDialogOpen(false)}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
