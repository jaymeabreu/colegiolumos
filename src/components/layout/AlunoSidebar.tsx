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
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-background">
      {/* SIDEBAR - Fixed */}
      <div className="flex-shrink-0">
        <AlunoSidebar onTabChange={handleTabChange} />
      </div>

      {/* CONTEÚDO PRINCIPAL - Scrollável */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children || <AlunoPage currentTab={activeTab} />}
      </div>
    </div>
  );
}

export default AlunoLayout;
