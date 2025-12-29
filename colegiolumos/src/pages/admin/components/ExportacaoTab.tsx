
import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Calendar, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Label } from '../../../components/ui/label';
import { Separator } from '../../../components/ui/separator';

export function ExportacaoTab() {
  const [selectedDiario, setSelectedDiario] = useState('');
  const [selectedPeriodo, setSelectedPeriodo] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'pdf' | 'csv', type: 'diario' | 'relatorio') => {
    setIsExporting(true);
    
    // Simular exportação
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simular download
    const fileName = `${type}_${format}_${new Date().toISOString().split('T')[0]}.${format}`;
    
    // Mostrar feedback de sucesso
    alert(`Arquivo ${fileName} exportado com sucesso!`);
    
    setIsExporting(false);
  };

  return (
    <div className="space-y-6">
      {/* Exportação de Diários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Exportação de Diários
          </CardTitle>
          <CardDescription>
            Exporte diários completos com aulas, avaliações e ocorrências
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="diario">Selecionar Diário</Label>
              <Select value={selectedDiario} onValueChange={setSelectedDiario}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um diário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">História - 6º Ano Manhã</SelectItem>
                  <SelectItem value="2">Matemática - 7º Ano Tarde</SelectItem>
                  <SelectItem value="3">Português - 8º Ano Manhã</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="periodo">Período</Label>
              <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1bim">1º Bimestre</SelectItem>
                  <SelectItem value="2bim">2º Bimestre</SelectItem>
                  <SelectItem value="3bim">3º Bimestre</SelectItem>
                  <SelectItem value="4bim">4º Bimestre</SelectItem>
                  <SelectItem value="anual">Ano Completo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex gap-4">
            <Button 
              onClick={() => handleExport('pdf', 'diario')}
              disabled={!selectedDiario || !selectedPeriodo || isExporting}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              {isExporting ? 'Exportando...' : 'Exportar PDF'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => handleExport('csv', 'diario')}
              disabled={!selectedDiario || !selectedPeriodo || isExporting}
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {isExporting ? 'Exportando...' : 'Exportar CSV'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Relatórios Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Relatórios Gerais
          </CardTitle>
          <CardDescription>
            Exporte relatórios consolidados da escola
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">Relatório de Alunos</h4>
                  <p className="text-sm text-gray-600">Lista completa de alunos</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => handleExport('pdf', 'relatorio')}
                  disabled={isExporting}
                >
                  PDF
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleExport('csv', 'relatorio')}
                  disabled={isExporting}
                >
                  CSV
                </Button>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">Relatório de Frequência</h4>
                  <p className="text-sm text-gray-600">Frequência por turma</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm"
                  onClick={() => handleExport('pdf', 'relatorio')}
                  disabled={isExporting}
                >
                  PDF
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleExport('csv', 'relatorio')}
                  disabled={isExporting}
                >
                  CSV
                </Button>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium">Relatório de Notas</h4>
                  <p className="text-sm text-gray-600">Notas por disciplina</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm"
                  onClick={() => handleExport('pdf', 'relatorio')}
                  disabled={isExporting}
                >
                  PDF
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleExport('csv', 'relatorio')}
                  disabled={isExporting}
                >
                  CSV
                </Button>
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Informações sobre Exportação */}
      <Card>
        <CardHeader>
          <CardTitle>Informações sobre Exportação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>PDF:</strong> Formato ideal para impressão e visualização. Inclui cabeçalho da escola e formatação completa.</p>
            <p><strong>CSV:</strong> Formato para planilhas. Ideal para análise de dados e importação em outros sistemas.</p>
            <p><strong>Conteúdo dos Diários:</strong> Aulas, presenças, avaliações, notas, ocorrências e médias calculadas.</p>
            <p><strong>Relatórios Gerais:</strong> Dados consolidados para análise administrativa e pedagógica.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
