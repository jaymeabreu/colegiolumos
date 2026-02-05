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
    <>
      {/* SIDEBAR - Fixed (sem afetar o layout) */}
      <AlunoSidebar onTabChange={handleTabChange} />

      {/* CONTEÚDO PRINCIPAL - Começa após o sidebar no mobile, após 64px no desktop */}
      <div className="w-full min-h-screen">
        <div className="max-[880px]:w-full min-[881px]:w-[calc(100%-256px)] min-[881px]:ml-64">
          {children || <AlunoPage currentTab={activeTab} />}
        </div>
      </div>
    </>
  );
}

export default AlunoLayout;
