
import { BookOpen, ClipboardList, Users, AlertTriangle } from "lucide-react"

interface DiarioTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function DiarioTabs({ activeTab, onTabChange }: DiarioTabsProps) {
  const tabs = [
    {
      id: "aulas",
      label: "Aulas",
      icon: BookOpen
    },
    {
      id: "avaliacoes",
      label: "Avaliações",
      icon: ClipboardList
    },
    {
      id: "alunos",
      label: "Alunos",
      icon: Users
    },
    {
      id: "ocorrencias",
      label: "Ocorrências",
      icon: AlertTriangle
    }
  ]

  return (
    <div className="border-b border-[#E9EDF4]">
      <div className="flex space-x-8">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors
                border-b-2 whitespace-nowrap
                ${isActive 
                  ? 'border-[#22566E] text-[#22566E]' 
                  : 'border-transparent text-[#718096] hover:text-[#1a202c] hover:border-[#E9EDF4]'
                }
              `}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
