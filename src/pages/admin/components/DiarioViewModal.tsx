import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Badge } from '../../../components/ui/badge';
import { AlertCircle, CheckCircle, RotateCcw, Eye, BookOpen, Users, AlertTriangle, X } from 'lucide-react';
import { AulasTab } from '../../diario/components/AulasTab';
import { AvaliacoesTab } from '../../diario/components/AvaliacoesTab';
import { AlunosTab } from '../../diario/components/AlunosTab';
import { OcorrenciasTab } from '../../diario/components/OcorrenciasTab';
import type { Diario } from '../../../services/supabaseService';

interface DiarioViewModalProps {
  diario: Diario | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDevolver: () => void;
  onFinalizar: () => void;
  loading?: boolean;
  userRole?: 'COORDENADOR' | 'PROFESSOR' | 'ADMIN';
}

export function DiarioViewModal({
  diario,
  open,
  onOpenChange,
  onDevolver,
  onFinalizar,
  loading = false,
  userRole = 'COORDENADOR'
}: DiarioViewModalProps) {
  const [activeTab, setActiveTab] = useState('aulas');

  if (!diario) return null;

  // Determinar se é somente leitura
  const isReadOnly = diario.status === 'ENTREGUE' || diario.status === 'FINALIZADO';
  
  // Determinar quais botões mostrar
  const canDevolver = userRole === 'COORDENADOR' && diario.status === 'ENTREGUE';
  const canFinalizar = userRole === 'COORDENADOR' && (diario.status === 'DEVOLVIDO' || diario.status === 'ENTREGUE');

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'PENDENTE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ENTREGUE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DEVOLVIDO':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'FINALIZADO':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'PENDENTE':
        return 'Pendente';
      case 'ENTREGUE':
        return 'Pendente de Revisão';
      case 'DEVOLVIDO':
        return 'Devolvido';
      case 'FINALIZADO':
        return 'Finalizado';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] p-0 flex flex-col">
        {/* Header */}
        <div className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">{diario.nome}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(diario.status)}`}>
                  {diario.status === 'FINALIZADO' && <CheckCircle className="h-4 w-4" />}
                  {diario.status === 'ENTREGUE' && <Eye className="h-4 w-4" />}
                  {diario.status === 'DEVOLVIDO' && <RotateCcw className="h-4 w-4" />}
                  {getStatusLabel(diario.status)}
                </div>
                {diario.bimestre && (
                  <Badge variant="outline" className="text-sm">{diario.bimestre}º Bimestre</Badge>
                )}
                {isReadOnly && (
                  <Badge variant="secondary" className="text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Somente Leitura
                  </Badge>
                )}
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-1 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="w-full justify-start rounded-none border-b bg-gray-50 px-6 py-0">
              <TabsTrigger 
                value="aulas"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-white"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Aulas
              </TabsTrigger>
              <TabsTrigger 
                value="avaliacoes"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-white"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Avaliações
              </TabsTrigger>
              <TabsTrigger 
                value="alunos"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-white"
              >
                <Users className="h-4 w-4 mr-2" />
                Alunos
              </TabsTrigger>
              <TabsTrigger 
                value="ocorrencias"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-white"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Ocorrências
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-6">
              <TabsContent value="aulas" className="m-0">
                <AulasTab diarioId={diario.id} readOnly={isReadOnly} />
              </TabsContent>
              <TabsContent value="avaliacoes" className="m-0">
                <AvaliacoesTab diarioId={diario.id} readOnly={isReadOnly} />
              </TabsContent>
              <TabsContent value="alunos" className="m-0">
                <AlunosTab diarioId={diario.id} readOnly={isReadOnly} />
              </TabsContent>
              <TabsContent value="ocorrencias" className="m-0">
                <OcorrenciasTab diarioId={diario.id} readOnly={isReadOnly} />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Footer com Botões de Ação */}
        <div className="border-t bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              {isReadOnly && (
                <p className="text-sm text-gray-600">
                  <AlertCircle className="inline h-4 w-4 mr-1 text-blue-600" />
                  Este diário está em modo somente leitura
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Fechar
              </Button>
              
              {canDevolver && (
                <Button
                  variant="outline"
                  className="border-orange-200 text-orange-700 hover:bg-orange-50"
                  onClick={onDevolver}
                  disabled={loading}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {loading ? 'Devolvendo...' : 'Devolver'}
                </Button>
              )}

              {canFinalizar && (
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={onFinalizar}
                  disabled={loading}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {loading ? 'Finalizando...' : 'Finalizar'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DiarioViewModal;
