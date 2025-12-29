
import { ChevronRight, Search } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"

export function PageHeader() {
  return (
    <div className="space-y-4">
      {/* Secondary header with student selector */}
      <div className="flex justify-end">
        <div className="flex items-center gap-2 w-80">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Selecione o Aluno" 
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Breadcrumb and title */}
      <div className="space-y-2">
        <nav className="flex items-center space-x-1 text-base text-muted-foreground">
          <span>Painel</span>
          <ChevronRight className="h-4 w-4" />
          <span>Visão geral</span>
        </nav>
        <h1 className="text-2xl font-bold text-foreground">Painel administrativo</h1>
      </div>
    </div>
  )
}
