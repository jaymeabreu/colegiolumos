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
    <div className="min-h-screen">
      {/* SIDEBAR FIXA */}
      <AlunoSidebar onTabChange={handleTabChange} />

      {/* CONTEÚDO PRINCIPAL */}
      <main
        className="
          min-h-screen
          transition-all
          max-[880px]:ml-0
          min-[881px]:ml-64
          p-4
        "
      >
        {children || <AlunoPage currentTab={activeTab} />}
      </main>
    </div>
  );
}

export default AlunoLayout;
