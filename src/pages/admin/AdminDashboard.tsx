import { useState } from 'react';
import { Settings, FileText, Users, BarChart3, Cog } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { useNavigate } from 'react-router-dom';


interface DashboardSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  badge?: string;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const sections: DashboardSection[] = [
    {
      id: 'diarios',
      title: 'Diários de Classe',
      description: 'Gerencie os diários de classe, acompanhe entregas e devoluções',
      icon: <FileText className="h-8 w-8" />,
      path: '/app/admin/diarios',
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700'
    },
    {
      id: 'professores',
      title: 'Professores',
      description: 'Gerencie professores, disciplinas e vinculações',
      icon: <Users className="h-8 w-8" />,
      path: '/app/admin/professores',
      color: 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700'
    },
    {
      id: 'alunos',
      title: 'Alunos',
      description: 'Gerencie matriculas, turmas e informações dos alunos',
      icon: <Users className="h-8 w-8" />,
      path: '/app/admin/alunos',
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700'
    },
    {
      id: 'relatorios',
      title: 'Relatórios',
      description: 'Visualize gráficos, estatísticas e relatórios da instituição',
      icon: <BarChart3 className="h-8 w-8" />,
      path: '/app/admin/relatorios',
      color: 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700'
    }
  ];

  const handleNavigate = (path: string) => {
    setLoading(true);
    setTimeout(() => {
      navigate(path);
      setLoading(false);
    }, 300);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* SIDEBAR */}


      {/* CONTEÚDO PRINCIPAL - COM MARGEM ESQUERDA PARA O SIDEBAR */}
      <div className="flex-1 ml-64 p-4 md:p-8">
        {/* HEADER */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Painel Administrativo
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Bem-vindo ao Colégio Lumos. Gerencie todos os aspectos da instituição
              </p>
            </div>
            <Cog className="h-12 w-12 text-gray-400 opacity-50" />
          </div>
        </div>

        {/* GRID DE SEÇÕES */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleNavigate(section.path)}
                disabled={loading}
                className={`block text-left transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Card className={`h-full border-2 cursor-pointer ${section.color} transition-all duration-300`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg opacity-70">
                          {section.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{section.title}</CardTitle>
                          {section.badge && (
                            <span className="inline-block mt-1 px-2 py-1 text-xs font-semibold bg-white rounded-full">
                              {section.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-700 dark:text-gray-300">
                      {section.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </div>

        {/* QUICK STATS */}
        <div className="max-w-7xl mx-auto mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Resumo Rápido
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Diários Entregues', value: '12', color: 'bg-blue-500' },
              { label: 'Professores Ativos', value: '24', color: 'bg-green-500' },
              { label: 'Alunos Matriculados', value: '156', color: 'bg-purple-500' },
              { label: 'Pendências', value: '3', color: 'bg-orange-500' }
            ].map((stat, idx) => (
              <Card key={idx} className="bg-white dark:bg-gray-800">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </p>
                      <div className={`w-1 h-8 rounded-full ${stat.color}`}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
