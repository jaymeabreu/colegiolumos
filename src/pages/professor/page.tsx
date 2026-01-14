import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { BookOpen, Users, ClipboardList, AlertTriangle, ChevronRight, Calendar, Clock, GraduationCap, ArrowLeft, CheckCircle, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ScrollArea } from '../../components/ui/scroll-area';
import { AuthHeader } from '../../components/auth/AuthHeader';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { authService } from '../../services/auth';
import type { Diario } from '../../services/supabaseService';
import { supabaseService } from '../../services/supabaseService';
import { AulasTab } from '../diario/components/AulasTab';
import { AvaliacoesTab } from '../diario/components/AvaliacoesTab';
import { AlunosTab } from '../diario/components/AlunosTab';
import { OcorrenciasTab } from '../diario/components/OcorrenciasTab';
import { RecadosTab } from './components/RecadosTab';

// Memoização dos componentes de tab para melhor performance
const MemoizedAulasTab = memo(AulasTab);
const MemoizedAvaliacoesTab = memo(AvaliacoesTab);
const MemoizedAlunosTab = memo(AlunosTab);
const MemoizedOcorrenciasTab = memo(OcorrenciasTab);
const MemoizedRecadosTab = memo(RecadosTab);

export function ProfessorPage() {
  const [activeTab, setActiveTab] = useState('aulas');
  const [selectedDiario, setSelectedDiario] = useState<number | null>(null);
  const [diarios, setDiarios] = useState<Diario[]>([]);
  const [diarioExtras, setDiarioExtras] = useState<Record<number, {
    disciplinaNome: string;
    turmaNome: string;
    alunosCount: number;
  }>>({});
  const [loading, setLoading] = useState(true);
  const [showDiarioSelection, setShowDiarioSelection] = useState(true);
  const { user } = authService.getAuthState();
  const loadedRef = useRef(false);
  const tabContentRef = useRef<HTMLDivElement>(null);

  const loadDiarios = useCallback(async () => {
    if (!user || !user.professor_id || loadedRef.current) return;
    
    try {
      // CORRIGIDO: Usar professor_id ao invés de id
      const professorDiarios = await supabaseService.getDiariosByProfessor(user.professor_id);
      setDiarios(professorDiarios);

      // Monta extras (disciplina/turma/qtd alunos) ANTES do render
      const extrasEntries = await Promise.all(
        professorDiarios.map(async (d) => {
          const [disciplina, turma, alunos] = await Promise.all([
            supabaseService.getDisciplinaById(d.disciplina_id ?? d.disciplinaId),
            supabaseService.getTurmaById(d.turma_id ?? d.turmaId),
            supabaseService.getAlunosByDiario(d.id),
          ]);

          return [
            d.id,
            {
              disciplinaNome: (disciplina as any)?.nome ?? '—',
              turmaNome: (turma as any)?.nome ?? '—',
              alunosCount: Array.isArray(alunos) ? alunos.length : 0,
            },
          ] as const;
        })
      );

      setDiarioExtras(Object.fromEntries(extrasEntries));

      // Se só tem um diário, seleciona automaticamente
      if (professorDiarios.length === 1) {
        setSelectedDiario(professorDiarios[0].id);
        setShowDiarioSelection(false);
      }
      
      loadedRef.current = true;
    } catch (error) {
      console.error('Erro ao carregar diários:', error);
      setDiarios([]);
    } finally {
      setLoading(false);
    }
  }, [user?.professor_id, user?.id]);

  useEffect(() => {
    if (!loadedRef.current) {
      loadDiarios();
    }
  }, [loadDiarios]);

  // Função para recarregar diários após mudança de status
  const handleStatusChange = useCallback(() => {
    loadedRef.current = false;
    loadDiarios();
  }, [loadDiarios]);

  const currentDiario = useMemo(() => {
    return diarios.find(d => d.id === selectedDiario) || null;
  }, [diarios, selectedDiario]);

  const handleDiarioSelect = useCallback((diarioId: number) => {
    setSelectedDiario(diarioId);
    setShowDiarioSelection(false);
    setActiveTab('aulas');
  }, []);

  const handleBackToDiarios = useCallback(() => {
    setShowDiarioSelection(true);
    setSelectedDiario(null);
    setActiveTab('aulas');
    handleStatusChange();
  }, [handleStatusChange]);

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    if (tabContentRef.current) {
      tabContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const tabsConfig = useMemo(() => [
    { id: 'aulas', label: 'Aulas', icon: BookOpen },
    { id: 'avaliacoes', label: 'Avaliações', icon: ClipboardList },
    { id: 'alunos', label: 'Alunos', icon: Users },
    { id: 'ocorrencias', label: 'Ocorrências', icon: AlertTriangle },
    { id: 'recados', label: 'Recados', icon: MessageSquare }
  ], []);

  const renderTabContent = useMemo(() => {
    if (activeTab === 'recados') {
      return <MemoizedRecadosTab key="recados" />;
    }
    
    if (!selectedDiario) return null;

    switch (activeTab) {
      case 'aulas':
        return <MemoizedAulasTab key={`aulas-${selectedDiario}`} diarioId={selectedDiario} />;
      case 'avaliacoes':
        return <MemoizedAvaliacoesTab key={`avaliacoes-${selectedDiario}`} diarioId={selectedDiario} />;
      case 'alunos':
        return <MemoizedAlunosTab key={`alunos-${selectedDiario}`} diarioId={selectedDiario} />;
      case 'ocorrencias':
        return <MemoizedOcorrenciasTab key={`ocorrencias-${selectedDiario}`} diarioId={selectedDiario} />;
      default:
        return null;
    }
  }, [activeTab, selectedDiario]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="loading mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Tela de seleção de diários
  if (showDiarioSelection || (!selectedDiario && activeTab !== 'recados')) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen flex flex-col bg-background">
          {/* Header */}
          <header className="sticky top-0 z-50 border-b bg-card px-6 py-4 flex-shrink-0 h-20 flex items-center">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold">
                    Área do Professor
                  </h1>
                  <p className="text-base text-muted-foreground">
                    Selecione um diário para gerenciar
                  </p>
                </div>
              </div>
              <AuthHeader />
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              {diarios.length === 0 ? (
                <Card className="border-border shadow-sm">
                  <CardHeader className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                      <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <CardTitle>Nenhum diário encontrado</CardTitle>
                    <CardDescription>
                      Você não possui diários atribuídos. Entre em contato com a coordenação.
                    </CardDescription>
                  </CardHeader>
                </Card>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="card-title">
                      Meus Diários - Ano Letivo 2025
                    </h3>
                    <p className="text-muted-foreground">
                      Você possui {diarios.length} {diarios.length === 1 ? 'diário' : 'diários'} atribuído{diarios.length === 1 ? '' : 's'}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {diarios.map((diario) => {
                      const extra = diarioExtras[diario.id];
                      const alunosCount = extra?.alunosCount ?? 0;
                      const disciplinaNome = extra?.disciplinaNome ?? 'Disciplina';
                      const turmaNome = extra?.turmaNome ?? 'Turma';

                      const podeEditar = supabaseService.professorPodeEditarDiario(diario, user?.professor_id || 0);
                      
                      const getStatusInfo = () => {
                        switch (diario.status) {
                          case 'PENDENTE':
                            return { 
                              label: 'Em Edição', 
                              color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            };
                          case 'ENTREGUE':
                            return { 
                              label: 'Entregue', 
                              color: 'bg-blue-100 text-blue-800 border-blue-200'
                            };
                          case 'DEVOLVIDO':
                            return { 
                              label: 'Devolvido', 
                              color: 'bg-orange-100 text-orange-800 border-orange-200'
                            };
                          case 'FINALIZADO':
                            return { 
                              label: 'Finalizado', 
                              color: 'bg-green-100 text-green-800 border-green-200'
                            };
                          default:
                            return { 
                              label: 'Em Edição', 
                              color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            };
                        }
                      };

                      const statusInfo = getStatusInfo();

                      const handleEntregarDiario = async (e: React.MouseEvent) => {
                        e.stopPropagation();
                        const sucesso = await supabaseService.entregarDiario(diario.id);
                        if (sucesso) {
                          handleStatusChange();
                        }
                      };

                      return (
                        <Card 
                          key={diario.id} 
                          className="border-border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
                          onClick={() => handleDiarioSelect(diario.id)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                                    {diario.nome}
                                  </CardTitle>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                                    {statusInfo.label}
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-base text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>Bimestre: {diario.bimestre}º</span>
                              </div>
                              <div className="flex items-center gap-2 text-base text-muted-foreground">
                                <BookOpen className="h-4 w-4" />
                                <span>{disciplinaNome}</span>
                              </div>
                              <div className="flex items-center gap-2 text-base text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>{alunosCount} alunos matriculados</span>
                              </div>
                            </div>
                            
                            <div className="mt-4 space-y-2">
                              {podeEditar && (diario.status === 'PENDENTE' || diario.status === 'DEVOLVIDO') && (
                                <Button 
                                  className="w-full"
                                  variant="default"
                                  onClick={handleEntregarDiario}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Entregar Diário
                                </Button>
                              )}
                              
                              <Button 
                                className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDiarioSelect(diario.id);
                                }}
                              >
                                Acessar Diário
                                <ChevronRight className="h-4 w-4 ml-2" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header Fixo */}
        <header className="sticky top-0 z-50 border-b bg-card px-6 py-4 flex-shrink-0 h-20 flex items-center">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-6">
              <Button
                variant="outline"
                size="icon"
                onClick={handleBackToDiarios}
                className="h-9 w-9 border-border hover:bg-muted"
                title="Voltar aos Diários">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold">{currentDiario?.nome}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-base text-muted-foreground">
                    {currentDiario?.bimestre ? `${currentDiario.bimestre}º Bimestre` : 'Bimestre não definido'}
                  </span>
                </div>
              </div>
            </div>
            <AuthHeader />
          </div>
        </header>

        {/* Tabs Navigation Fixas */}
        <div className="sticky top-20 z-40 border-b bg-card px-6 flex-shrink-0">
          <nav className="flex space-x-8 py-0">
            {tabsConfig.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                  activeTab === id
                    ? 'text-primary border-primary'
                    : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Scrollável */}
        <main className="flex-1 relative overflow-hidden">
          <div 
            ref={tabContentRef}
            className="absolute inset-0 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground"
          >
            <div className="p-6 space-y-6">
              <ErrorBoundary>
                {renderTabContent}
              </ErrorBoundary>
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default ProfessorPage;
