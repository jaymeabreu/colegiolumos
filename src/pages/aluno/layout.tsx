import { useState } from 'react';
import { AlunoSidebar } from '../../components/layout/AlunoSidebar';
import { AlunoPage } from './page';

interface AlunoLayoutProps {
  children?: React.ReactNode;
}

export function AlunoLayout({ children }: AlunoLayoutProps) {
  const [activeTab, setActiveTab] = useState<string>('avisos');

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* SIDEBAR */}
      <AlunoSidebar onTabChange={handleTabChange} />
      
      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-4 lg:p-6">
          {children || <AlunoPage currentTab={activeTab} />}
        </div>
      </main>
    </div>
  );
}

export default AlunoLayout;
