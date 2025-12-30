import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { DiarioHeader } from "./components/DiarioHeader"
import { DiarioTabs } from "./components/DiarioTabs"
import { AulasTab } from "./components/AulasTab"
import { AvaliacoesTab } from "./components/AvaliacoesTab"
import { AlunosTab } from "./components/AlunosTab"
import { OcorrenciasTab } from "./components/OcorrenciasTab"
import { DiarioStatusControls } from "../../components/shared/DiarioStatusControls"
import { supabaseService, Diario } from "../../services/supabaseService"

export function DiarioPage() {
  const [activeTab, setActiveTab] = useState("aulas")
  const [user, setUser] = useState<any>(null)
  const [diario, setDiario] = useState<Diario | null>(null)
  const navigate = useNavigate()

  const loadDiario = () => {
    // Por enquanto carregando o primeiro diário - em produção seria baseado na URL ou seleção
    const diarios = supabaseService.getDiarios()
    if (diarios.length > 0) {
      setDiario(diarios[0])
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")
    
    if (!token || !userData) {
      navigate("/login")
      return
    }

    setUser(JSON.parse(userData))
    loadDiario()
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/login")
  }

  const handleStatusChange = () => {
    loadDiario() // Recarregar dados do diário
  }

  if (!user || !diario) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  const podeEditar = supabaseService.professorPodeEditarDiario(diario.id, user.professorId || 0)

  const renderTabContent = () => {
    const tabProps = { 
      diarioId: diario.id, 
      readOnly: !podeEditar 
    }
    
    switch (activeTab) {
      case "aulas":
        return <AulasTab {...tabProps} />
      case "avaliacoes":
        return <AvaliacoesTab {...tabProps} />
      case "alunos":
        return <AlunosTab {...tabProps} />
      case "ocorrencias":
        return <OcorrenciasTab {...tabProps} />
      default:
        return <AulasTab {...tabProps} />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header fixo */}
      <DiarioHeader user={user} onLogout={handleLogout} />
      
      {/* Container principal com scroll */}
      <div className="relative h-screen pt-20">
        {/* Área de conteúdo com scroll absoluto */}
        <main className="absolute inset-0 top-20 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Título da disciplina no topo */}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-foreground">Diário do Professor</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-medium">História</span>
                <span>•</span>
                <span>6º Ano - Manhã</span>
                <span>•</span>
                <span>Ano Letivo 2025</span>
              </div>
            </div>

            {/* Controles de Status do Diário */}
            <DiarioStatusControls 
              diario={diario}
              currentUser={user}
              onStatusChange={handleStatusChange}
            />

            {/* Aviso de modo somente leitura */}
            {!podeEditar && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-amber-800">
                  <span className="font-medium">Modo Somente Leitura</span>
                </div>
                <p className="text-amber-700 text-sm mt-1">
                  Este diário não pode ser editado no momento. 
                  {diario.status === 'ENTREGUE' && ' O diário foi entregue e está aguardando análise da coordenação.'}
                  {diario.status === 'FINALIZADO' && ' O diário foi finalizado pela coordenação.'}
                </p>
              </div>
            )}

            {/* Tabs fixas */}
            <DiarioTabs activeTab={activeTab} onTabChange={setActiveTab} />
            
            {/* Conteúdo das tabs */}
            <div className="pb-6">
              {renderTabContent()}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
