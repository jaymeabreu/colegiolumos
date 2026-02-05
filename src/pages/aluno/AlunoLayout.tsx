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
    <div className="flex min-h-screen w-full bg-background">
      {/* SIDEBAR - Fixed */}
      <AlunoSidebar onTabChange={handleTabChange} />

      {/* CONTEÚDO PRINCIPAL - Com margin-left para não ser coberto */}
      <div className="flex-1 flex flex-col overflow-hidden ml-0 min-[881px]:ml-64 w-full">
        {children || <AlunoPage currentTab={activeTab} />}
      </div>
    </div>
  );
}

export default AlunoLayout;
