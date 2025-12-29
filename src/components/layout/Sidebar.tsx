
import { useState, useCallback, memo } from "react"
import { 
  LayoutDashboard, 
  GraduationCap, 
  Users, 
  UserCheck, 
  BookOpen, 
  Calendar, 
  FileText, 
  Settings, 
  HelpCircle,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { Button } from "../ui/button"
import { ScrollArea } from "../ui/scroll-area"
import { Separator } from "../ui/separator"
import { clsx } from "clsx"

interface SidebarProps {
  className?: string
}

interface MenuItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  children?: MenuItem[]
  active?: boolean
}

const menuItems: MenuItem[] = [
  {
    id: "painel",
    label: "Painel",
    icon: LayoutDashboard,
    children: [
      { id: "visao-geral", label: "Visão geral", icon: LayoutDashboard, active: true }
    ]
  },
  {
    id: "gestao-escolar",
    label: "Gestão Escolar",
    icon: GraduationCap,
    children: [
      { id: "disciplinas", label: "Disciplinas", icon: BookOpen },
      { id: "turmas", label: "Turmas", icon: Users },
      { id: "alunos", label: "Alunos", icon: Users },
      { id: "professores", label: "Professores", icon: UserCheck },
      { id: "funcionarios", label: "Funcionários", icon: Users },
      { id: "responsaveis", label: "Responsáveis", icon: Users }
    ]
  },
  {
    id: "area-pedagogica",
    label: "Área Pedagógica",
    icon: BookOpen,
    children: [
      { id: "diarios", label: "Diários", icon: BookOpen },
      { id: "calendario-escolar", label: "Calendário Escolar", icon: Calendar },
      { id: "agenda-recados", label: "Agenda de Recados", icon: FileText }
    ]
  },
  {
    id: "secretaria",
    label: "Secretaria",
    icon: FileText,
    children: [
      { id: "matriculas", label: "Matrículas", icon: FileText },
      { id: "historico-escolar", label: "Histórico escolar", icon: FileText },
      { id: "transferencias", label: "Transferências", icon: FileText },
      { id: "portal-aluno", label: "Portal do aluno", icon: Users }
    ]
  },
  {
    id: "relatorios",
    label: "Relatórios",
    icon: FileText
  }
]

const MenuItem = memo(({ item, level = 0, expandedItems, onToggle }: {
  item: MenuItem
  level?: number
  expandedItems: string[]
  onToggle: (itemId: string) => void
}) => {
  const hasChildren = item.children && item.children.length > 0
  const isExpanded = expandedItems.includes(item.id)
  const Icon = item.icon

  const handleClick = useCallback(() => {
    if (hasChildren) {
      onToggle(item.id)
    }
  }, [hasChildren, item.id, onToggle])

  return (
    <div>
      <Button
        variant={item.active ? "secondary" : "ghost"}
        className={clsx(
          "w-full justify-start gap-2 h-9",
          level > 0 && "ml-6 w-[calc(100%-1.5rem)]",
          item.active && "bg-primary/10 text-primary"
        )}
        onClick={handleClick}
      >
        <Icon className="h-4 w-4" />
        <span className="flex-1 text-left">{item.label}</span>
        {hasChildren && (
          isExpanded ? 
            <ChevronDown className="h-4 w-4" /> : 
            <ChevronRight className="h-4 w-4" />
        )}
      </Button>
      
      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {item.children!.map(child => (
            <MenuItem 
              key={child.id}
              item={child} 
              level={level + 1}
              expandedItems={expandedItems}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
})

MenuItem.displayName = "MenuItem"

export const Sidebar = memo(({ className }: SidebarProps) => {
  const [expandedItems, setExpandedItems] = useState<string[]>(["painel"])

  const toggleExpanded = useCallback((itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }, [])

  return (
    <div className={clsx("flex flex-col h-full bg-background border-r border-border", className)}>
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-2">
          {menuItems.map(item => (
            <MenuItem 
              key={item.id}
              item={item}
              expandedItems={expandedItems}
              onToggle={toggleExpanded}
            />
          ))}
        </div>
      </ScrollArea>
      
      <div className="p-3 border-t border-border">
        <Separator className="mb-3" />
        <div className="space-y-1">
          <Button variant="ghost" className="w-full justify-start gap-2 h-9">
            <HelpCircle className="h-4 w-4" />
            Documentação
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2 h-9">
            <Settings className="h-4 w-4" />
            Configurações
          </Button>
        </div>
      </div>
    </div>
  )
})

Sidebar.displayName = "Sidebar"
