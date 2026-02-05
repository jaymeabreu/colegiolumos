import { useState } from 'react';
import { ProfessorSidebar } from '../../components/layout/ProfessorSidebar';
import { ProfessorPage } from './page';
import { authService } from '../../services/auth';

interface ProfessorLayoutProps {
  children?: React.ReactNode;
}

export function ProfessorLayout({ children }: ProfessorLayoutProps) {
  const [activeTab, setActiveTab] = useState<string>('aulas');
  const { user } = authService.getAuthState();

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <ProfessorSidebar onTabChange={handleTabChange} professorNome={user?.name} />
      
      <main className="flex-1 overflow-auto w-full">
        {children || <ProfessorPage currentTab={activeTab} />}
      </main>
    </div>
  );
}

export default ProfessorLayout;
