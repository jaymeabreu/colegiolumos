// ... (mantenha seus imports iguais)

// Procure a parte final do seu arquivo DiariosList.tsx e substitua as chamadas das modais por esta versão:

      <DiarioViewModal
        diario={selectedDiario}
        open={isViewModalOpen}
        onOpenChange={(open) => {
          setIsViewModalOpen(open);
          if (!open && !isDevolverModalOpen && !isFinalizarDialogOpen) {
            setSelectedDiario(null);
          }
        }}
        onDevolver={() => {
          // Sequência correta para evitar conflito de renderização
          setIsViewModalOpen(false);
          setTimeout(() => {
            setIsDevolverModalOpen(true);
          }, 100);
        }}
        onFinalizar={() => {
          setIsViewModalOpen(false);
          setTimeout(() => {
            setIsFinalizarDialogOpen(true);
          }, 100);
        }}
        loading={loading}
        userRole={currentUser?.papel as 'COORDENADOR' | 'PROFESSOR' | 'ADMIN' | undefined}
      />

      <DevolverDiarioModal
        diario={selectedDiario}
        open={isDevolverModalOpen}
        onOpenChange={(newOpen) => {
          setIsDevolverModalOpen(newOpen);
          if (!newOpen) {
            setSelectedDiario(null);
            setObservacaoDevolucao('');
          }
        }}
        onSuccess={async () => {
          await loadData();
          // CORREÇÃO: Fechar a modal após o sucesso
          setIsDevolverModalOpen(false);
          setSelectedDiario(null);
        }}
      />

      <Dialog open={isFinalizarDialogOpen} onOpenChange={(open) => {
        setIsFinalizarDialogOpen(open);
        if (!open) setSelectedDiario(null);
      }}>
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
              onClick={() => {
                setIsFinalizarDialogOpen(false);
                setSelectedDiario(null);
              }}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleFinalizarDiario} disabled={loading}>
              {loading ? 'Finalizando...' : 'Finalizar Diário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
