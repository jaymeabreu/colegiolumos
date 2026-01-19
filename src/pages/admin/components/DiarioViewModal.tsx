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

  const isReadOnly = diario.status === 'ENTREGUE' || diario.status === 'FINALIZADO';
  const canDevolver = userRole === 'COORDENADOR' && diario.status === 'ENTREGUE';
  const canFinalizar = userRole === 'COORDENADOR' && (diario.status === 'DEVOLVIDO' || diario.status === 'ENTREGUE');

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'PENDENTE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ENTREGUE': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DEVOLVIDO': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'FINALIZADO': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'PENDENTE': return 'Pendente';
      case 'ENTREGUE': return 'Pendente de Revisão';
      case 'DEVOLVIDO': return 'Devolvido';
      case 'FINALIZADO': return 'Finalizado';
      default: return 'Desconhecido';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* 
          IMPORTANTE: 
          1. Usamos !max-w-none e !w-[95vw] para forçar o Tailwind a ignorar qualquer limite do componente base.
          2. Adicionamos style={{ maxWidth: '95vw' }} como garantia extra caso o CSS global seja muito restritivo.
      */}
      <DialogContent 
        className="!max-w-none !w-[95vw] h-[92vh] p-0 flex flex-col overflow-hidden border-none shadow-2xl"
        style={{ maxWidth: '95vw' }}
      >
        {/* Header */}
        <div className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="h-7 w-7 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">{diario.nome}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(diario.status)}`}>
                  {diario.status === 'FINALIZADO' && <CheckCircle className="h-4 w-4" />}
                  {diario.status === 'ENTREGUE' && <Eye className="h-4 w-4" />}
                  {diario.status === 'DEVOLVIDO' && <RotateCcw className="h-4 w-4" />}
                  {getStatusLabel(diario.status)}
                </div>
                {diario.bimestre && (
                  <Badge variant="outline" className="text-sm px-3 py-1">{diario.bimestre}º Bimestre</Badge>
                )}
                {isReadOnly && (
                  <Badge variant="secondary" className="text-xs px-3 py-1 bg-blue-50 text-blue-700 border-blue-100">
                    <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                    Somente Leitura
                  </Badge>
                )}
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-white/50 rounded-full"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-white">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-full justify-start rounded-none border-b bg-gray-50/50 px-6 py-0 h-14 gap-2">
              <TabsTrigger 
                value="aulas"
                className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-white px-8 font-medium text-gray-600 data-[state=active]:text-blue-700 transition-all"
              >
                <BookOpen className="h-4.5 w-4.5 mr-2.5" />
                Aulas
              </TabsTrigger>
              <TabsTrigger 
                value="avaliacoes"
                className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-white px-8 font-medium text-gray-600 data-[state=active]:text-blue-700 transition-all"
              >
                <AlertTriangle className="h-4.5 w-4.5 mr-2.5" />
                Avaliações
              </TabsTrigger>
              <TabsTrigger 
                value="alunos"
                className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-white px-8 font-medium text-gray-600 data-[state=active]:text-blue-700 transition-all"
              >
                <Users className="h-4.5 w-4.5 mr-2.5" />
                Alunos
              </TabsTrigger>
              <TabsTrigger 
                value="ocorrencias"
                className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-white px-8 font-medium text-gray-600 data-[state=active]:text-blue-700 transition-all"
              >
                <AlertCircle className="h-4.5 w-4.5 mr-2.5" />
                Ocorrências
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-7xl mx-auto"> {/* Container interno para o conteúdo não ficar esticado demais em telas ultra-wide */}
                <TabsContent value="aulas" className="m-0 focus-visible:outline-none">
                  <AulasTab diarioId={diario.id} readOnly={isReadOnly} />
                </TabsContent>
                <TabsContent value="avaliacoes" className="m-0 focus-visible:outline-none">
                  <AvaliacoesTab diarioId={diario.id} readOnly={isReadOnly} />
                </TabsContent>
                <TabsContent value="alunos" className="m-0 focus-visible:outline-none">
                  <AlunosTab diarioId={diario.id} readOnly={isReadOnly} />
                </TabsContent>
                <TabsContent value="ocorrencias" className="m-0 focus-visible:outline-none">
                  <OcorrenciasTab diarioId={diario.id} readOnly={isReadOnly} />
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-8 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              {isReadOnly && (
                <p className="text-sm text-gray-500 flex items-center font-medium">
                  <AlertCircle className="h-4 w-4 mr-2 text-blue-500" />
                  Modo de visualização (somente leitura)
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="px-6"
              >
                Fechar
              </Button>
              
              {canDevolver && (
                <Button
                  variant="outline"
                  className="border-orange-200 text-orange-700 hover:bg-orange-50 px-6"
                  onClick={onDevolver}
                  disabled={loading}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {loading ? 'Processando...' : 'Devolver'}
                </Button>
              )}

              {canFinalizar && (
                <Button
                  className="bg-green-600 hover:bg-green-700 px-8 shadow-sm"
                  onClick={onFinalizar}
                  disabled={loading}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {loading ? 'Processando...' : 'Finalizar Diário'}
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
