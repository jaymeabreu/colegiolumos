
import { useState } from "react"
import { Topbar } from "../../components/layout/Topbar"
import { Sidebar } from "../../components/layout/Sidebar"
import { PageHeader } from "../../components/layout/PageHeader"
import { WelcomeBanner } from "../../components/widgets/WelcomeBanner"
import { DonutMetric } from "../../components/widgets/DonutMetric"
import { OccurrencesList } from "../../components/widgets/OccurrencesList"
import { MessagesList } from "../../components/widgets/MessagesList"
import { MiniCalendar } from "../../components/widgets/MiniCalendar"
import { UpcomingEvents } from "../../components/widgets/UpcomingEvents"
import { Sheet, SheetContent } from "../../components/ui/sheet"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog"
import { Input } from "../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { AlunoDetalhes } from "../diario/components/AlunoDetalhes"
import { mockDataService } from "../../services/mockData"
import { FileText, Search, User, X } from "lucide-react"
import { studentsData, teachersData, staffData } from "../../mocks/dashboard-data"
import { BoletimModal } from '../../components/shared/BoletimModal';

export function OverviewCoordinator() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [boletimModalOpen, setBoletimModalOpen] = useState(false)
  const [selectedAluno, setSelectedAluno] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTurma, setSelectedTurma] = useState("all")
  
  // Carregar dados
  const alunos = mockDataService.getAlunos()
  const turmas = mockDataService.getTurmas()
  
  // Filtrar alunos
  const filteredAlunos = alunos.filter(aluno => {
    const matchesSearch = aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         aluno.matricula.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTurma = selectedTurma === "all" || aluno.turmaId === parseInt(selectedTurma)
    return matchesSearch && matchesTurma
  })

  const handleAlunoSelect = (aluno: any) => {
    setSelectedAluno(aluno)
  }

  const handleCloseBoletim = () => {
    setSelectedAluno(null)
    setSearchTerm("")
    setSelectedTurma("all")
  }

  const handleBackToList = () => {
    setSelectedAluno(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <Topbar onMenuClick={() => setSidebarOpen(true)} />
      
      <div className="flex pt-16">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 fixed left-0 top-16 bottom-0">
          <Sidebar />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-6 space-y-6">
          <PageHeader />
          
          <WelcomeBanner />

          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DonutMetric
              title="Total de alunos"
              total={studentsData.total}
              active={studentsData.active}
              inactive={studentsData.inactive}
            />
            <DonutMetric
              title="Total de professores"
              total={teachersData.total}
              active={teachersData.active}
              inactive={teachersData.inactive}
            />
            <DonutMetric
              title="Total de funcionários"
              total={staffData.total}
              active={staffData.active}
              inactive={staffData.inactive}
            />
          </div>

          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {/* Modal do Boletim do Aluno */}
                {selectedAluno && (
                  <BoletimModal 
                    aluno={selectedAluno} 
                    onClose={() => setSelectedAluno(null)} 
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - 2/3 width */}
            <div className="lg:col-span-2 space-y-6">
              <OccurrencesList />
              <MessagesList />
            </div>

            {/* Right Column - 1/3 width */}
            <div className="space-y-6">
              <MiniCalendar />
              <UpcomingEvents />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
