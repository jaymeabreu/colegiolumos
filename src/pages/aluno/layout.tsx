import { useState } from 'react';
import { AlunoSidebar } from '../../components/layout/AlunoSidebar';
import { AlunoPage } from './page';
import { authService } from '../../services/auth';

interface AlunoLayoutProps {
  children?: React.ReactNode;
}

export function AlunoLayout({ children }: AlunoLayoutProps) {
  const [activeTab, setActiveTab] = useState<string>('avisos');
  const { user } = authService.getAuthState();

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <AlunoSidebar onTabChange={handleTabChange} alunoNome={user?.name} />
      
      <main className="flex-1 overflow-auto w-full">
        {children || <AlunoPage currentTab={activeTab} />}
      </main>
    </div>
  );
}

export default AlunoLayout;
