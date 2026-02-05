import { useState, useEffect } from 'react';
import { MessageSquare, Calendar, User, Users, Bell, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { supabaseService } from '../../../services/supabaseService';
import type { Comunicado, Recado } from '../../../services/supabaseService';
import { authService } from '../../../services/auth';

export function AvisosTab() {
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [recados, setRecados] = useState<Recado[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = authService.getAuthState();

  useEffect(() => {
    loadData();
    
    const interval = setInterval(loadData, 3000);
    
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

  const loadData = async () => {
    try {
      console.log('Carregando avisos para o aluno...', { userId: user?.id, alunoId: user?.alunoId });
      
      if (user?.alunoId) {
        const comunicadosData = await supabaseService.getComunicadosParaAluno(user.alunoId);
        console.log('Comunicados carregados:', comunicadosData);
        setComunicados(comunicadosData.sort((a, b) => new Date(b.dataPublicacao || b.data_publicacao).getTime() - new Date(a.dataPublicacao || a.data_publicacao).getTime()));

        const recadosData = await supabaseService.getRecadosByAluno(user.alunoId);
        console.log('Recados carregados para o aluno:', recadosData);
        setRecados(recadosData.sort((a, b) => new Date(b.dataEnvio || b.data_envio).getTime() - new Date(a.dataEnvio || a.data_envio).getTime()));
      } else {
        console.log('Usuário não tem alunoId definido');
        setComunicados([]);
        setRecados([]);
      }
    } catch (error) {
      console.error('Erro ao carregar avisos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);

    if (date.toDateString() === hoje.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === ontem.toDateString()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
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
    <div className="space-y-6">
      {/* HEADER */}
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground mb-2">Avisos e Comunicados</h2>
        <p className="text-muted-foreground text-sm">
          Fique por dentro das novidades da escola e recados dos professores
        </p>
      </div>

      {/* COMUNICADOS GERAIS */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-foreground">Comunicados Gerais</h3>
          {comunicados.length > 0 && (
            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
              {comunicados.length}
            </Badge>
          )}
        </div>

        {comunicados.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground text-sm">Nenhum comunicado no momento</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {comunicados.map((comunicado) => {
              const isExpanded = expandedId === `comunicado-${comunicado.id}`;
              const previewText = comunicado.mensagem.slice(0, 120);
              const needsExpand = comunicado.mensagem.length > 120;

              return (
                <Card 
                  key={comunicado.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => needsExpand && toggleExpand(`comunicado-${comunicado.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-foreground flex-1">{comunicado.titulo}</h4>
                      <Badge variant="outline" className="text-xs shrink-0">Geral</Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">
                      {isExpanded ? comunicado.mensagem : previewText}
                      {!isExpanded && needsExpand && '...'}
                    </p>

                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {comunicado.autor}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(comunicado.dataPublicacao || comunicado.data_publicacao)}
                        </span>
                      </div>

                      {needsExpand && (
                        <button className="flex items-center gap-1 text-xs text-primary font-medium">
                          {isExpanded ? (
                            <>Ver menos <ChevronUp className="h-3 w-3" /></>
                          ) : (
                            <>Ver mais <ChevronDown className="h-3 w-3" /></>
                          )}
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* RECADOS DOS PROFESSORES */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-foreground">Recados dos Professores</h3>
          {recados.length > 0 && (
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
              {recados.length}
            </Badge>
          )}
        </div>

        {recados.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground text-sm">Nenhum recado no momento</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recados.map((recado) => {
              const isExpanded = expandedId === `recado-${recado.id}`;
              const previewText = recado.mensagem.slice(0, 120);
              const needsExpand = recado.mensagem.length > 120;

              return (
                <Card 
                  key={recado.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => needsExpand && toggleExpand(`recado-${recado.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-foreground flex-1">{recado.titulo}</h4>
                      {recado.alunoId || recado.aluno_id ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs shrink-0">
                          <User className="h-3 w-3 mr-1" />Individual
                        </Badge>
                      ) : (
                        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 text-xs shrink-0">
                          <Users className="h-3 w-3 mr-1" />Turma
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">
                      {isExpanded ? recado.mensagem : previewText}
                      {!isExpanded && needsExpand && '...'}
                    </p>

                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {recado.professorNome || recado.professor_nome}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(recado.dataEnvio || recado.data_envio)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {recado.turmaNome || recado.turma_nome}
                        </span>
                      </div>

                      {needsExpand && (
                        <button className="flex items-center gap-1 text-xs text-primary font-medium">
                          {isExpanded ? (
                            <>Ver menos <ChevronUp className="h-3 w-3" /></>
                          ) : (
                            <>Ver mais <ChevronDown className="h-3 w-3" /></>
                          )}
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
