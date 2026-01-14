import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { BookOpen, Users, ClipboardList, AlertTriangle, ChevronRight, Calendar, ArrowLeft, CheckCircle, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
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

const MemoizedAulasTab = memo(AulasTab);
const MemoizedAvaliacoesTab = memo(AvaliacoesTab);
const MemoizedAlunosTab = memo(AlunosTab);
const MemoizedOcorrenciasTab = memo(OcorrenciasTab);
const MemoizedRecadosTab = memo(RecadosTab);

export function ProfessorPage() {
  const [activeTab, setActiveTab] = useState('aulas');
  const [selectedDiario, setSelectedDiario] = useState<number | null>(null);
  const [diarios, setDiarios] = useState<Diario[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = authService.getAuthState();
  const loadedRef = useRef(false);
  const tabContentRef = useRef<HTMLDivElement>(null);

  // Carregar diários uma única vez
  useEffect(() => {
    if (loadedRef.current || !user?.id) return;

    const carregarDiarios = async () => {
      try {
        // CORRIGIDO: Usar professorId (camelCase) ao invés de professor_id
        if (user.professorId) {
          const dados = await supabaseService.getDiariosByProfessor(user.professorId);
          setDiarios(dados);
        } else {
          setDiarios([]);
        }
        loadedRef.current = true;
      } catch (error) {
        console.error('Erro ao carregar diários:', error);
        setDiarios([]);
      } finally {
        setLoading(false);
      }
    };

    carregarDiarios();
  }, [user?.id, user?.professorId]);

  const currentDiario = useMemo(() => {
    return diarios.find(d => d.id === selectedDiario) || null;
  }, [diarios, selectedDiario]);

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

  // Tela de carregamento
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="loading mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando diários...</p>
        </div>
      </div>
    );
  }

  // Tela de seleção de diários (quando nenhum está selecionado)
  if (!selectedDiario) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen flex flex-col bg-background">
          <header className="sticky top-0 z-50 border-b bg-card px-6 py-4 flex-shrink-0 h-20 flex items-center">
            <div className="flex items-center justify-between w-full">
              <div>
                <h1 className="text-2xl font-bold">Área do Professor</h1>
                <p className="text-base text-muted-foreground">Selecione um diário para gerenciar</p>
              </div>
              <AuthHeader />
            </div>
          </header>

          <main className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              {diarios.length === 0 ? (
                <Card>
                  <CardHeader className="text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <CardTitle>Nenhum diário encontrado</CardTitle>
                  </CardHeader>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {diarios.map((diario) => (
                    <Card 
                      key={diario.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => {
                        setSelectedDiario(diario.id);
                        setActiveTab('aulas');
                      }}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle>{diario.nome}</CardTitle>
                            <div className="mt-2">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                diario.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-800' :
                                diario.status === 'ENTREGUE' ? 'bg-blue-100 text-blue-800' :
                                diario.status === 'DEVOLVIDO' ? 'bg-orange-100 text-orange-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {diario.status}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{diario.bimestre}º Bimestre</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </ErrorBoundary>
    );
  }

  // Tela de visualização do diário
  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-background">
        <header className="sticky top-0 z-50 border-b bg-card px-6 py-4 flex-shrink-0 h-20 flex items-center">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setSelectedDiario(null);
                  setActiveTab('aulas');
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{currentDiario?.nome}</h1>
                <p className="text-sm text-muted-foreground">{currentDiario?.bimestre}º Bimestre</p>
              </div>
            </div>
            <AuthHeader />
          </div>
        </header>

        <div className="sticky top-20 z-40 border-b bg-card px-6 flex-shrink-0">
          <nav className="flex space-x-8 py-0">
            {tabsConfig.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all ${
                  activeTab === id
                    ? 'text-primary border-primary'
                    : 'text-muted-foreground border-transparent hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <ErrorBoundary>
              {renderTabContent}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default ProfessorPage;
