
import { useState, useEffect } from 'react';
import { MessageSquare, Calendar, User, Users, Bell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Separator } from '../../../components/ui/separator';
import { supabaseService } from '../../../services/supabaseService';
import type { Comunicado, Recado } from '../../../services/supabaseService';
import { authService } from '../../../services/auth';

export function AvisosTab() {
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [recados, setRecados] = useState<Recado[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = authService.getAuthState();

  useEffect(() => {
    loadData();
    
    // Configurar intervalo para recarregar dados periodicamente
    const interval = setInterval(loadData, 3000); // Recarrega a cada 3 segundos
    
    // Escutar eventos de atualização de dados
    const handleDataUpdate = () => {
      console.log('Evento de atualização de dados recebido na área do aluno');
      loadData();
    };

    const handleRecadoCreated = () => {
      console.log('Evento de recado criado recebido na área do aluno');
      loadData();
    };

    const handleRecadoUpdated = () => {
      console.log('Evento de recado atualizado recebido na área do aluno');
      loadData();
    };

    const handleRecadoDeleted = () => {
      console.log('Evento de recado excluído recebido na área do aluno');
      loadData();
    };

    window.addEventListener('dataUpdated', handleDataUpdate);
    window.addEventListener('recadoCreated', handleRecadoCreated);
    window.addEventListener('recadoUpdated', handleRecadoUpdated);
    window.addEventListener('recadoDeleted', handleRecadoDeleted);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('dataUpdated', handleDataUpdate);
      window.removeEventListener('recadoCreated', handleRecadoCreated);
      window.removeEventListener('recadoUpdated', handleRecadoUpdated);
      window.removeEventListener('recadoDeleted', handleRecadoDeleted);
    };
  }, [user?.alunoId]);

  const loadData = () => {
    try {
      console.log('Carregando avisos para o aluno...', { userId: user?.id, alunoId: user?.alunoId });
      
      // Carregar comunicados gerais - sempre recarregar do localStorage
      const comunicadosData = supabaseService.getComunicados();
      console.log('Comunicados carregados:', comunicadosData);
      setComunicados(comunicadosData.sort((a, b) => new Date(b.dataPublicacao).getTime() - new Date(a.dataPublicacao).getTime()));

      // Carregar recados para o aluno
      if (user?.alunoId) {
        const aluno = supabaseService.getAlunos().find(a => a.id === user.alunoId);
        console.log('Aluno encontrado:', aluno);
        
        if (aluno?.turmaId) {
          const recadosData = supabaseService.getRecadosForAluno(user.alunoId, aluno.turmaId);
          console.log('Recados carregados para o aluno:', recadosData);
          setRecados(recadosData.sort((a, b) => new Date(b.dataEnvio).getTime() - new Date(a.dataEnvio).getTime()));
        } else {
          console.log('Aluno não tem turma definida');
          setRecados([]);
        }
      } else {
        console.log('Usuário não tem alunoId definido');
        setRecados([]);
      }
    } catch (error) {
      console.error('Erro ao carregar avisos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando avisos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Avisos e Comunicados</h2>
        <p className="text-muted-foreground">
          Fique por dentro das novidades da escola e recados dos professores
        </p>
      </div>

      {/* Comunicados Gerais */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-semibold text-foreground">Comunicados Gerais</h3>
          {comunicados.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {comunicados.length}
            </Badge>
          )}
        </div>

        {comunicados.length === 0 ? (
          <Card className="border-border shadow-sm">
            <CardHeader className="text-center py-8">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle className="text-lg">Nenhum comunicado</CardTitle>
              <CardDescription>
                Não há comunicados gerais no momento.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-3">
            {comunicados.map((comunicado) => (
              <Card key={comunicado.id} className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{comunicado.titulo}</CardTitle>
                      <div className="flex items-center gap-4 text-base text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{comunicado.autor}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(comunicado.dataPublicacao)}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      <Bell className="h-3 w-3 mr-1" />
                      Geral
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap">{comunicado.mensagem}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Recados dos Professores */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-semibold text-foreground">Recados dos Professores</h3>
          {recados.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {recados.length}
            </Badge>
          )}
        </div>

        {recados.length === 0 ? (
          <Card className="border-border shadow-sm">
            <CardHeader className="text-center py-8">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                <MessageSquare className="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle className="text-lg">Nenhum recado</CardTitle>
              <CardDescription>
                Não há recados dos professores no momento.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-3">
            {recados.map((recado) => (
              <Card key={recado.id} className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{recado.titulo}</CardTitle>
                        {recado.alunoId ? (
                          <Badge variant="default" className="text-xs">
                            <User className="h-3 w-3 mr-1" />
                            Individual
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            Turma
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-base text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{recado.professorNome}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(recado.dataEnvio)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{recado.turmaNome}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap">{recado.mensagem}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
