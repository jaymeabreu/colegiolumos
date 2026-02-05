import { useState, useEffect } from 'react';
import { Bell, Calendar, User, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { supabase } from '../../../lib/supabaseClient';

interface Comunicado {
  id: number;
  titulo: string;
  mensagem: string;
  tipo: 'geral' | 'turma' | 'individual';
  data_envio: string;
  autor_nome?: string;
  lido?: boolean;
}

export function AvisosTab() {
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComunicados();
  }, []);

  const loadComunicados = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('comunicados')
        .select('*')
        .order('data_envio', { ascending: false });

      if (error) throw error;
      setComunicados(data || []);
    } catch (error) {
      console.error('Erro ao carregar comunicados:', error);
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
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'geral':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Geral</Badge>;
      case 'turma':
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Turma</Badge>;
      case 'individual':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Individual</Badge>;
      default:
        return <Badge variant="outline">Aviso</Badge>;
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const comunicadosGerais = comunicados.filter(c => c.tipo === 'geral');
  const outrosComunicados = comunicados.filter(c => c.tipo !== 'geral');

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Avisos e Comunicados
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Fique por dentro das novidades da escola e recados dos professores
        </p>
      </div>

      {/* COMUNICADOS GERAIS */}
      {comunicadosGerais.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Comunicados Gerais
            </h3>
            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
              {comunicadosGerais.length}
            </Badge>
          </div>

          <div className="space-y-3">
            {comunicadosGerais.map((comunicado) => {
              const isExpanded = expandedId === comunicado.id;
              const previewText = comunicado.mensagem.slice(0, 100);
              const needsExpand = comunicado.mensagem.length > 100;

              return (
                <Card 
                  key={comunicado.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => needsExpand && toggleExpand(comunicado.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        {/* TÍTULO E BADGE */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-base">
                            {comunicado.titulo}
                          </h4>
                          {getTipoBadge(comunicado.tipo)}
                        </div>

                        {/* MENSAGEM */}
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 whitespace-pre-wrap">
                          {isExpanded ? comunicado.mensagem : previewText}
                          {!isExpanded && needsExpand && '...'}
                        </p>

                        {/* FOOTER */}
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            {comunicado.autor_nome && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {comunicado.autor_nome}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(comunicado.data_envio)}
                            </span>
                          </div>

                          {needsExpand && (
                            <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                              {isExpanded ? (
                                <>
                                  Ver menos <ChevronUp className="h-3 w-3" />
                                </>
                              ) : (
                                <>
                                  Ver mais <ChevronDown className="h-3 w-3" />
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* OUTROS COMUNICADOS */}
      {outrosComunicados.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Outros Avisos
            </h3>
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
              {outrosComunicados.length}
            </Badge>
          </div>

          <div className="space-y-3">
            {outrosComunicados.map((comunicado) => {
              const isExpanded = expandedId === comunicado.id;
              const previewText = comunicado.mensagem.slice(0, 100);
              const needsExpand = comunicado.mensagem.length > 100;

              return (
                <Card 
                  key={comunicado.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => needsExpand && toggleExpand(comunicado.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-base">
                            {comunicado.titulo}
                          </h4>
                          {getTipoBadge(comunicado.tipo)}
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 whitespace-pre-wrap">
                          {isExpanded ? comunicado.mensagem : previewText}
                          {!isExpanded && needsExpand && '...'}
                        </p>

                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            {comunicado.autor_nome && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {comunicado.autor_nome}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(comunicado.data_envio)}
                            </span>
                          </div>

                          {needsExpand && (
                            <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                              {isExpanded ? (
                                <>
                                  Ver menos <ChevronUp className="h-3 w-3" />
                                </>
                              ) : (
                                <>
                                  Ver mais <ChevronDown className="h-3 w-3" />
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {comunicados.length === 0 && (
        <div className="text-center py-16">
          <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nenhum aviso ainda
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Quando houver novos comunicados, eles aparecerão aqui
          </p>
        </div>
      )}
    </div>
  );
}
