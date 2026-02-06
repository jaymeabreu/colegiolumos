import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { BookOpen, Users, ClipboardList, AlertTriangle, ArrowLeft, MessageSquare } from 'lucide-react';
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
import { TurmaCard } from './components/TurmaCard';

const MemoizedAulasTab = memo(AulasTab);
const MemoizedAvaliacoesTab = memo(AvaliacoesTab);
const MemoizedAlunosTab = memo(AlunosTab);
const MemoizedOcorrenciasTab = memo(OcorrenciasTab);
const MemoizedRecadosTab = memo(RecadosTab);

interface ProfessorPageProps {
  currentTab?: string;
}

export function ProfessorPage({ currentTab }: ProfessorPageProps) {
  const [activeTab, setActiveTab] = useState(currentTab || 'aulas');
  const [selectedDiario, setSelectedDiario] = useState<number | null>(null);
  const [diarios, setDiarios] = useState<Diario[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = authService.getAuthState();
  const loadedRef = useRef(false);

  // Sincroniza o activeTab quando currentTab muda
  useEffect(() => {
    if (currentTab) {
      setActiveTab(currentTab);
    }
  }, [currentTab]);

  // Carregar diários uma única vez
  useEffect(() => {
    if (loadedRef.current || !user?.id) return;

    const carregarDiarios = async () => {
      try {
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

  const renderTabContent = useMemo(() => {
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
      case 'recados':
        return <MemoizedRecadosTab key={`recados-${selectedDiario}`} diarioId={selectedDiario} />;
      default:
        return null;
    }
  }, [activeTab, selectedDiario]);

  // Tela de carregamento
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando diários...</p>
        </div>
      </div>
    );
  }

  // Tela de seleção de diários (quando nenhum está selecionado)
  if (!selectedDiario) {
    return (
      <ErrorBoundary>
        <div className="w-full">
          {/* HEADER FULL WIDTH */}
          <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 lg:px-6 py-4 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1 pl-14 lg:pl-0">
                <h1 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white truncate">
                  Área do Professor
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  Selecione um diário para gerenciar
                </p>
              </div>
              <AuthHeader />
            </div>
          </div>

          {/* CONTEÚDO */}
          <div className="p-4 lg:p-6">
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
                    <TurmaCard
                      key={diario.id}
                      diario={diario}
                      onClick={() => {
                        setSelectedDiario(diario.id);
                        setActiveTab('aulas');
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Tela de visualização do diário
  return (
    <ErrorBoundary>
      <div className="w-full">
        {/* HEADER FULL WIDTH */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 lg:px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1 pl-14 lg:pl-0">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setSelectedDiario(null);
                  setActiveTab('aulas');
                }}
                className="flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white truncate">
                  {currentDiario?.nome}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {currentDiario?.bimestre}º Bimestre
                </p>
              </div>
            </div>
            <AuthHeader />
          </div>
        </div>

        {/* CONTEÚDO */}
        <div className="p-4 lg:p-6">
          <ErrorBoundary>
            {renderTabContent}
          </ErrorBoundary>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default ProfessorPage;
