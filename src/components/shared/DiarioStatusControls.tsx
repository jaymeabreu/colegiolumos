import { useState } from 'react';
import { CheckCircle, RotateCcw, AlertCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { supabaseService } from '../../services/supabaseService';
import type { Diario, Usuario } from '../../services/mockData';

interface DiarioStatusControlsProps {
  diario: Diario;
  currentUser: Usuario;
  onStatusChange: () => void;
  compact?: boolean;
}

export function DiarioStatusControls({ diario, currentUser, onStatusChange, compact = false }: DiarioStatusControlsProps) {
  const [isEntregarDialogOpen, setIsEntregarDialogOpen] = useState(false);
  const [isPedirDevolucaoDialogOpen, setIsPedirDevolucaoDialogOpen] = useState(false);
  const [isDevolverDialogOpen, setIsDevolverDialogOpen] = useState(false);
  const [isFinalizarDialogOpen, setIsFinalizarDialogOpen] = useState(false);
  const [comentarioDevolucao, setComentarioDevolucao] = useState('');
  const [observacaoDevolucao, setObservacaoDevolucao] = useState('');

  const handleEntregarDiario = () => {
    const sucesso = supabaseService.entregarDiario(diario.id, currentUser.id);
    if (sucesso) {
      onStatusChange();
      setIsEntregarDialogOpen(false);
    }
  };

  const handlePedirDevolucao = () => {
    const sucesso = supabaseService.solicitarDevolucaoDiario(
      diario.id, 
      currentUser.id, 
      comentarioDevolucao
    );
    if (sucesso) {
      onStatusChange();
      setIsPedirDevolucaoDialogOpen(false);
      setComentarioDevolucao('');
    }
  };

  const handleDevolverDiario = () => {
    const sucesso = supabaseService.devolverDiario(
      diario.id, 
      currentUser.id, 
      observacaoDevolucao
    );
    if (sucesso) {
      onStatusChange();
      setIsDevolverDialogOpen(false);
      setObservacaoDevolucao('');
    }
  };

  const handleFinalizarDiario = () => {
    const sucesso = supabaseService.finalizarDiario(diario.id, currentUser.id);
    if (sucesso) {
      onStatusChange();
      setIsFinalizarDialogOpen(false);
    }
  };

  const getStatusInfo = () => {
    switch (diario.status) {
      case 'PENDENTE':
        return { 
          label: 'Em Edição', 
          icon: Clock, 
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          description: 'Diário em edição pelo professor'
        };
      case 'ENTREGUE':
        return { 
          label: 'Entregue', 
          icon: CheckCircle, 
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          description: 'Diário entregue para coordenação'
        };
      case 'DEVOLVIDO':
        return { 
          label: 'Devolvido', 
          icon: RotateCcw, 
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          description: 'Diário devolvido para ajustes'
        };
      case 'FINALIZADO':
        return { 
          label: 'Finalizado', 
          icon: XCircle, 
          color: 'bg-green-100 text-green-800 border-green-200',
          description: 'Diário finalizado - não pode ser editado'
        };
      default:
        return { 
          label: 'Desconhecido', 
          icon: AlertCircle, 
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          description: 'Status desconhecido'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  const podeEditar = supabaseService.professorPodeEditarDiario(diario.id, currentUser.professorId || 0);
  const permissions = supabaseService.coordenadorPodeGerenciarDiario(diario.id);

  if (compact) {
    return (
      <>
        <div className="flex items-center gap-3">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${statusInfo.color}`}>
            <StatusIcon className="h-4 w-4" />
            {statusInfo.label}
          </div>

          <div className="flex items-center gap-2">
            {currentUser.papel === 'PROFESSOR' && (
              <>
                {podeEditar && (diario.status === 'PENDENTE' || diario.status === 'DEVOLVIDO') && (
                  <Button
                    onClick={() => setIsEntregarDialogOpen(true)}
                    className="inline-flex items-center gap-2 whitespace-nowrap"
                    size="sm"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Entregar
                  </Button>
                )}

                {diario.status === 'ENTREGUE' && !diario.solicitacaoDevolucao && (
                  <Button
                    variant="outline"
                    onClick={() => setIsPedirDevolucaoDialogOpen(true)}
                    className="inline-flex items-center gap-2 whitespace-nowrap"
                    size="sm"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Pedir Devolução
                  </Button>
                )}

                {diario.status === 'ENTREGUE' && diario.solicitacaoDevolucao && (
                  <Badge variant="secondary" className="whitespace-nowrap">
                    Devolução solicitada
                  </Badge>
                )}
              </>
            )}

            {currentUser.papel === 'COORDENADOR' && (
              <>
                {permissions.canDevolver && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="inline-flex items-center gap-2 whitespace-nowrap"
                    onClick={() => setIsDevolverDialogOpen(true)}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Devolver
                  </Button>
                )}
                {permissions.canFinalizar && (
                  <Button
                    size="sm"
                    className="inline-flex items-center gap-2 whitespace-nowrap"
                    onClick={() => setIsFinalizarDialogOpen(true)}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Finalizar
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        <Dialog open={isEntregarDialogOpen} onOpenChange={setIsEntregarDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Entregar Diário</DialogTitle>
              <DialogDescription>
                Tem certeza de que deseja entregar este diário? Após a entrega você não poderá mais editar, apenas o coordenador poderá devolver.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEntregarDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={handleEntregarDiario}>
                Entregar Diário
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isPedirDevolucaoDialogOpen} onOpenChange={setIsPedirDevolucaoDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Solicitar Devolução</DialogTitle>
              <DialogDescription>
                Explique o motivo pelo qual você gostaria que o coordenador devolvesse este diário para edição.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="comentario">Motivo da solicitação</Label>
                <Textarea
                  id="comentario"
                  value={comentarioDevolucao}
                  onChange={(e) => setComentarioDevolucao(e.target.value)}
                  placeholder="Explique por que precisa editar o diário novamente..."
                  rows={3}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsPedirDevolucaoDialogOpen(false);
                  setComentarioDevolucao('');
                }}
              >
                Cancelar
              </Button>
              <Button 
                type="button" 
                onClick={handlePedirDevolucao}
                disabled={!comentarioDevolucao.trim()}
              >
                Enviar Solicitação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isDevolverDialogOpen} onOpenChange={setIsDevolverDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Devolver Diário</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja devolver este diário para o professor? Adicione uma observação explicando o motivo.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="observacao">Observação (opcional)</Label>
                <Textarea
                  id="observacao"
                  value={observacaoDevolucao}
                  onChange={(e) => setObservacaoDevolucao(e.target.value)}
                  placeholder="Explique o motivo da devolução..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsDevolverDialogOpen(false);
                  setObservacaoDevolucao('');
                }}
              >
                Cancelar
              </Button>
              <Button type="button" variant="destructive" onClick={handleDevolverDiario}>
                Devolver Diário
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isFinalizarDialogOpen} onOpenChange={setIsFinalizarDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Finalizar Diário</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja finalizar este diário? Após a finalização, nem o professor nem o coordenador poderão mais editá-lo.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsFinalizarDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={handleFinalizarDiario}>
                Finalizar Diário
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div className="bg-white border rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border ${statusInfo.color}`}>
              <StatusIcon className="h-4 w-4" />
              {statusInfo.label}
            </div>
            <span className="text-sm text-gray-600">{statusInfo.description}</span>
          </div>

          <div className="flex items-center gap-2">
            {currentUser.papel === 'PROFESSOR' && (
              <>
                {podeEditar && (diario.status === 'PENDENTE' || diario.status === 'DEVOLVIDO') && (
                  <Button
                    onClick={() => setIsEntregarDialogOpen(true)}
                    className="inline-flex items-center gap-2 whitespace-nowrap"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Entregar Diário
                  </Button>
                )}

                {diario.status === 'ENTREGUE' && !diario.solicitacaoDevolucao && (
                  <Button
                    variant="outline"
                    onClick={() => setIsPedirDevolucaoDialogOpen(true)}
                    className="inline-flex items-center gap-2 whitespace-nowrap"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Pedir Devolução
                  </Button>
                )}

                {diario.status === 'ENTREGUE' && diario.solicitacaoDevolucao && (
                  <Badge variant="secondary" className="whitespace-nowrap">
                    Devolução solicitada
                  </Badge>
                )}
              </>
            )}

            {currentUser.papel === 'COORDENADOR' && (
              <>
                {permissions.canDevolver && (
                  <Button
                    variant="outline"
                    className="inline-flex items-center gap-2 whitespace-nowrap"
                    onClick={() => setIsDevolverDialogOpen(true)}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Devolver Diário
                  </Button>
                )}
                {permissions.canFinalizar && (
                  <Button
                    className="inline-flex items-center gap-2 whitespace-nowrap"
                    onClick={() => setIsFinalizarDialogOpen(true)}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Finalizar Diário
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {diario.solicitacaoDevolucao && (
          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded text-sm">
            <div className="flex items-center gap-1 text-orange-800 font-medium mb-1">
              <AlertCircle className="h-4 w-4" />
              Solicitação de Devolução Pendente
            </div>
            <p className="text-orange-700">{diario.solicitacaoDevolucao.comentario}</p>
            <p className="text-orange-600 text-xs mt-1">
              Solicitado em: {new Date(diario.solicitacaoDevolucao.dataSolicitacao).toLocaleDateString('pt-BR')}
            </p>
          </div>
        )}

        {!podeEditar && currentUser.papel === 'PROFESSOR' && (
          <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded text-sm">
            <div className="flex items-center gap-1 text-gray-700">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">
                {diario.status === 'ENTREGUE' && 'Diário entregue - aguardando coordenação'}
                {diario.status === 'FINALIZADO' && 'Diário finalizado - não pode ser editado'}
              </span>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isEntregarDialogOpen} onOpenChange={setIsEntregarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Entregar Diário</DialogTitle>
            <DialogDescription>
              Tem certeza de que deseja entregar este diário? Após a entrega você não poderá mais editar, apenas o coordenador poderá devolver.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsEntregarDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleEntregarDiario}>
              Entregar Diário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPedirDevolucaoDialogOpen} onOpenChange={setIsPedirDevolucaoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Devolução</DialogTitle>
            <DialogDescription>
              Explique o motivo pelo qual você gostaria que o coordenador devolvesse este diário para edição.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="comentario">Motivo da solicitação</Label>
              <Textarea
                id="comentario"
                value={comentarioDevolucao}
                onChange={(e) => setComentarioDevolucao(e.target.value)}
                placeholder="Explique por que precisa editar o diário novamente..."
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsPedirDevolucaoDialogOpen(false);
                setComentarioDevolucao('');
              }}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handlePedirDevolucao}
              disabled={!comentarioDevolucao.trim()}
            >
              Enviar Solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDevolverDialogOpen} onOpenChange={setIsDevolverDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Devolver Diário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja devolver este diário para o professor? Adicione uma observação explicando o motivo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="observacao">Observação (opcional)</Label>
              <Textarea
                id="observacao"
                value={observacaoDevolucao}
                onChange={(e) => setObservacaoDevolucao(e.target.value)}
                placeholder="Explique o motivo da devolução..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsDevolverDialogOpen(false);
                setObservacaoDevolucao('');
              }}
            >
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleDevolverDiario}>
              Devolver Diário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFinalizarDialogOpen} onOpenChange={setIsFinalizarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Diário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja finalizar este diário? Após a finalização, nem o professor nem o coordenador poderão mais editá-lo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsFinalizarDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleFinalizarDiario}>
              Finalizar Diário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
