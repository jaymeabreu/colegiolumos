import { useState, useCallback } from "react"
import { Bell, HelpCircle, Moon, Sun, Menu } from "lucide-react"
import { Button } from "../ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"

interface TopbarProps {
  onMenuClick: () => void
}

export interface Aluno {
  id: number;
  nome: string;
  matricula: string;
  contato: string;
  email?: string;
  dataNascimento?: string;
  cpf?: string;
  rg?: string;
  sexo?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  cep?: string;
  estado?: string;
  nomeResponsavel?: string;
  contatoResponsavel?: string;
  emailResponsavel?: string;
  parentesco?: string;
  turmaId?: number;
  anoLetivo?: string;
  situacao?: string;
  observacoes?: string;
  foto?: string; // Campo para armazenar a foto do aluno
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const [isDark, setIsDark] = useState(false)

  const toggleDarkMode = useCallback(() => {
    setIsDark(prev => {
      const newValue = !prev;
      document.documentElement.classList.toggle('dark', newValue);
      return newValue;
    });
  }, []);

  const handleMenuClick = useCallback(() => {
    onMenuClick();
  }, [onMenuClick]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <div className="flex items-center justify-between px-4 h-16">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMenuClick}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">L</span>
            </div>
            <span className="font-semibold text-lg">Colégio Lumos</span>
          </div>
        </div>

        {/* Center */}
        <div className="hidden md:block">
          <Select defaultValue="2025-s1">
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025-s1">Ano letivo: 2025/S1</SelectItem>
              <SelectItem value="2024-s2">Ano letivo: 2024/S2</SelectItem>
              <SelectItem value="2024-s1">Ano letivo: 2024/S1</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          
          <Button variant="ghost" size="icon">
            <HelpCircle className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://readdy.ai/api/search-image?query=professional%20woman%20teacher%20with%20brown%20hair%20smiling%20in%20business%20attire%20against%20simple%20white%20background&width=32&height=32&seq=9&orientation=squarish" />
                  <AvatarFallback>TM</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem>
                Meu perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
