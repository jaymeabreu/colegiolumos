import { useState } from 'react';
import { Users, BookOpen, School, GraduationCap, FileText, Download, UserCheck, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button'; 
import { AuthHeader } from '../../components/auth/AuthHeader';
import { DiariosList } from './components/DiariosList';
import { AlunosList } from './components/AlunosList';
import { ProfessoresList } from './components/ProfessoresList';
import { DisciplinasList } from './components/DisciplinasList';
import { TurmasList } from './components/TurmasList';
import { UsuariosList } from './components/UsuariosList';
import { ComunicadosList } from './components/ComunicadosList';
import { ExportacaoTab } from './components/ExportacaoTab';
import { ScrollArea } from '../../components/ui/scroll-area';

export function AdminPage() {
  const [activeTab, setActiveTab] = useState('diarios');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header Fixo */}
      <header className="sticky top-0 z-50 border-b bg-card px-6 py-4 flex-shrink-0 flex items-center">
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className="text-2xl font-bold">
              Painel Administrativo
            </h1>
            <p className="text-base text-muted-foreground">
              Gerencie usuários, turmas e configurações
            </p>
          </div>
          <AuthHeader />
        </div>
      </header>

      {/* Tabs Navigation Fixas */}
      <div className="sticky top-16 z-40 border-b bg-card px-6 flex-shrink-0">
        <nav className="flex space-x-8 py-0">
          {[
            { id: 'diarios', label: 'Diários', icon: BookOpen },
            { id: 'comunicados', label: 'Comunicados', icon: MessageSquare },
            { id: 'alunos', label: 'Alunos', icon: Users },
            { id: 'professores', label: 'Professores', icon: UserCheck },
            { id: 'disciplinas', label: 'Disciplinas', icon: School },
            { id: 'turmas', label: 'Turmas', icon: GraduationCap },
            { id: 'usuarios', label: 'Usuários', icon: Users },
            { id: 'exportacao', label: 'Exportação', icon: Download }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-fast ${
                activeTab === id
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Scrollável */}
      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full scrollbar-thin">
          <div className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsContent value="diarios">
                <DiariosList />
              </TabsContent>

              <TabsContent value="comunicados">
                <ComunicadosList />
              </TabsContent>

              <TabsContent value="alunos">
                <AlunosList />
              </TabsContent>

              <TabsContent value="professores">
                <ProfessoresList />
              </TabsContent>

              <TabsContent value="disciplinas">
                <DisciplinasList />
              </TabsContent>

              <TabsContent value="turmas">
                <TurmasList />
              </TabsContent>

              <TabsContent value="usuarios">
                <UsuariosList />
              </TabsContent>

              <TabsContent value="exportacao">
                <ExportacaoTab />
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}

export default AdminPage;
