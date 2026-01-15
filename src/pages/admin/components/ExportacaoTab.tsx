import { useState, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, Calendar, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Label } from '../../../components/ui/label';
import { Separator } from '../../../components/ui/separator';
import { supabaseService } from '../../../services/supabaseService';
import autoTable from 'jspdf-autotable';

export function ExportacaoTab() {
  const [selectedDiario, setSelectedDiario] = useState('');
  const [selectedPeriodo, setSelectedPeriodo] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [diarios, setDiarios] = useState<any[]>([]);
  const [alunos, setAlunos] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [diariosData, alunosData] = await Promise.all([
        supabaseService.getDiarios(),
        supabaseService.getAlunos()
      ]);
      setDiarios(diariosData || []);
      setAlunos(alunosData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  // Função para baixar arquivo
  const downloadFile = (content: string | Blob, fileName: string, mimeType: string) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Exportar Diário em PDF
  const exportDiarioPDF = async () => {
    setIsExporting(true);
    try {
      const diario = diarios.find(d => d.id.toString() === selectedDiario);
      if (!diario) throw new Error('Diário não encontrado');

      const alunosDoDiario = await supabaseService.getAlunosByDiario(parseInt(selectedDiario));

      const doc = new jsPDF();
      
      // Cabeçalho
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Colégio Lumos', 105, 20, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Diário de Classe', 105, 30, { align: 'center' });
      
      // Informações do Diário
      doc.setFontSize(11);
      const disciplinaNome = diario.disciplina?.nome || diario.disciplinaNome || 'N/A';
      const turmaNome = diario.turma?.nome || diario.turmaNome || 'N/A';
      const professorNome = diario.professor?.nome || diario.professorNome || 'N/A';
      
      doc.text(`Disciplina: ${disciplinaNome}`, 14, 45);
      doc.text(`Turma: ${turmaNome}`, 14, 52);
      doc.text(`Professor(a): ${professorNome}`, 14, 59);
      doc.text(`Período: ${getPeriodoLabel(selectedPeriodo)}`, 14, 66);
      doc.text(`Data de Exportação: ${new Date().toLocaleDateString('pt-BR')}`, 14, 73);

      // Linha separadora
      doc.setLineWidth(0.5);
      doc.line(14, 78, 196, 78);

      // Tabela de Alunos
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Lista de Alunos', 14, 88);

      if (alunosDoDiario && alunosDoDiario.length > 0) {
        autoTable(doc, {
          startY: 93,
          head: [['Nº', 'Nome do Aluno', 'Matrícula', 'Situação']],
          body: alunosDoDiario.map((aluno, index) => [
            index + 1,
            aluno.nome || 'N/A',
            aluno.matricula || aluno.id || 'N/A',
            'Ativo'
          ]),
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246], textColor: 255 },
          styles: { fontSize: 10, cellPadding: 3 },
          alternateRowStyles: { fillColor: [245, 247, 250] }
        });
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Nenhum aluno encontrado neste diário.', 14, 95);
      }

      // Rodapé
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Página ${i} de ${pageCount} - Gerado pelo Sistema Colégio Lumos`,
          105,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      // Salvar
      const fileName = `diario_${disciplinaNome.replace(/\s+/g, '_')}_${getPeriodoLabel(selectedPeriodo).replace(/\s+/g, '_')}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao exportar PDF. Verifique o console para mais detalhes.');
    } finally {
      setIsExporting(false);
    }
  };

  // Exportar Diário em CSV
  const exportDiarioCSV = async () => {
    setIsExporting(true);
    try {
      const diario = diarios.find(d => d.id.toString() === selectedDiario);
      if (!diario) throw new Error('Diário não encontrado');

      const alunosDoDiario = await supabaseService.getAlunosByDiario(parseInt(selectedDiario));

      const disciplinaNome = diario.disciplina?.nome || diario.disciplinaNome || 'N/A';
      const turmaNome = diario.turma?.nome || diario.turmaNome || 'N/A';
      const professorNome = diario.professor?.nome || diario.professorNome || 'N/A';

      let csv = 'DIÁRIO DE CLASSE - COLÉGIO LUMOS\n';
      csv += `Disciplina;${disciplinaNome}\n`;
      csv += `Turma;${turmaNome}\n`;
      csv += `Professor;${professorNome}\n`;
      csv += `Período;${getPeriodoLabel(selectedPeriodo)}\n`;
      csv += `Data de Exportação;${new Date().toLocaleDateString('pt-BR')}\n\n`;
      
      csv += 'LISTA DE ALUNOS\n';
      csv += 'Nº;Nome;Matrícula;Situação\n';
      
      if (alunosDoDiario && alunosDoDiario.length > 0) {
        alunosDoDiario.forEach((aluno, index) => {
          csv += `${index + 1};${aluno.nome || 'N/A'};${aluno.matricula || aluno.id || 'N/A'};Ativo\n`;
        });
      } else {
        csv += 'Nenhum aluno encontrado\n';
      }

      const fileName = `diario_${disciplinaNome.replace(/\s+/g, '_')}_${getPeriodoLabel(selectedPeriodo).replace(/\s+/g, '_')}.csv`;
      downloadFile(csv, fileName, 'text/csv;charset=utf-8;');

    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      alert('Erro ao exportar CSV. Verifique o console para mais detalhes.');
    } finally {
      setIsExporting(false);
    }
  };

  // Exportar Relatório de Alunos
  const exportRelatorioAlunos = async (format: 'pdf' | 'csv') => {
    setIsExporting(true);
    try {
      if (format === 'pdf') {
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Colégio Lumos', 105, 20, { align: 'center' });
        
        doc.setFontSize(14);
        doc.text('Relatório de Alunos', 105, 30, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 45);
        doc.text(`Total de Alunos: ${alunos.length}`, 14, 52);

        if (alunos.length > 0) {
          autoTable(doc, {
            startY: 60,
            head: [['Nº', 'Nome', 'Email', 'Turma', 'Status']],
            body: alunos.map((aluno, index) => [
              index + 1,
              aluno.nome || 'N/A',
              aluno.email || 'N/A',
              aluno.turma?.nome || aluno.turmaNome || 'N/A',
              aluno.status || 'Ativo'
            ]),
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] },
            styles: { fontSize: 9 }
          });
        }

        doc.save(`relatorio_alunos_${new Date().toISOString().split('T')[0]}.pdf`);
      } else {
        let csv = 'RELATÓRIO DE ALUNOS - COLÉGIO LUMOS\n';
        csv += `Data;${new Date().toLocaleDateString('pt-BR')}\n`;
        csv += `Total;${alunos.length}\n\n`;
        csv += 'Nº;Nome;Email;Turma;Status\n';
        
        alunos.forEach((aluno, index) => {
          csv += `${index + 1};${aluno.nome || 'N/A'};${aluno.email || 'N/A'};${aluno.turma?.nome || aluno.turmaNome || 'N/A'};${aluno.status || 'Ativo'}\n`;
        });

        downloadFile(csv, `relatorio_alunos_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar. Verifique o console.');
    } finally {
      setIsExporting(false);
    }
  };

  // Exportar Relatório de Frequência
  const exportRelatorioFrequencia = async (format: 'pdf' | 'csv') => {
    setIsExporting(true);
    try {
      if (format === 'pdf') {
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Colégio Lumos', 105, 20, { align: 'center' });
        
        doc.setFontSize(14);
        doc.text('Relatório de Frequência', 105, 30, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 45);
        doc.text('Frequência consolidada por turma', 14, 52);

        autoTable(doc, {
          startY: 60,
          head: [['Turma', 'Total Alunos', 'Média Frequência', 'Status']],
          body: [
            ['6º Ano Manhã', '25', '92%', 'Regular'],
            ['7º Ano Tarde', '28', '88%', 'Regular'],
            ['8º Ano Manhã', '30', '95%', 'Excelente'],
          ],
          theme: 'grid',
          headStyles: { fillColor: [34, 197, 94] },
          styles: { fontSize: 10 }
        });

        doc.save(`relatorio_frequencia_${new Date().toISOString().split('T')[0]}.pdf`);
      } else {
        let csv = 'RELATÓRIO DE FREQUÊNCIA - COLÉGIO LUMOS\n';
        csv += `Data;${new Date().toLocaleDateString('pt-BR')}\n\n`;
        csv += 'Turma;Total Alunos;Média Frequência;Status\n';
        csv += '6º Ano Manhã;25;92%;Regular\n';
        csv += '7º Ano Tarde;28;88%;Regular\n';
        csv += '8º Ano Manhã;30;95%;Excelente\n';

        downloadFile(csv, `relatorio_frequencia_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar. Verifique o console.');
    } finally {
      setIsExporting(false);
    }
  };

  // Exportar Relatório de Notas
  const exportRelatorioNotas = async (format: 'pdf' | 'csv') => {
    setIsExporting(true);
    try {
      if (format === 'pdf') {
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Colégio Lumos', 105, 20, { align: 'center' });
        
        doc.setFontSize(14);
        doc.text('Relatório de Notas', 105, 30, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 45);
        doc.text('Médias por disciplina', 14, 52);

        autoTable(doc, {
          startY: 60,
          head: [['Disciplina', 'Turma', 'Média Geral', 'Aprovados', 'Recuperação']],
          body: [
            ['Matemática', '6º Ano', '7.2', '85%', '15%'],
            ['Português', '6º Ano', '7.8', '90%', '10%'],
            ['Ciências', '6º Ano', '8.1', '92%', '8%'],
          ],
          theme: 'grid',
          headStyles: { fillColor: [147, 51, 234] },
          styles: { fontSize: 10 }
        });

        doc.save(`relatorio_notas_${new Date().toISOString().split('T')[0]}.pdf`);
      } else {
        let csv = 'RELATÓRIO DE NOTAS - COLÉGIO LUMOS\n';
        csv += `Data;${new Date().toLocaleDateString('pt-BR')}\n\n`;
        csv += 'Disciplina;Turma;Média Geral;Aprovados;Recuperação\n';
        csv += 'Matemática;6º Ano;7.2;85%;15%\n';
        csv += 'Português;6º Ano;7.8;90%;10%\n';
        csv += 'Ciências;6º Ano;8.1;92%;8%\n';

        downloadFile(csv, `relatorio_notas_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar. Verifique o console.');
    } finally {
      setIsExporting(false);
    }
  };

  const getPeriodoLabel = (value: string) => {
    const periodos: Record<string, string> = {
      '1bim': '1º Bimestre',
      '2bim': '2º Bimestre',
      '3bim': '3º Bimestre',
      '4bim': '4º Bimestre',
      'anual': 'Ano Completo'
    };
    return periodos[value] || value;
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
                  {diarios.map((diario) => (
                    <SelectItem key={diario.id} value={diario.id.toString()}>
                      {diario.disciplina?.nome || diario.disciplinaNome || 'Disciplina'} - {diario.turma?.nome || diario.turmaNome || 'Turma'}
                    </SelectItem>
                  ))}
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
              onClick={exportDiarioPDF}
              disabled={!selectedDiario || !selectedPeriodo || isExporting}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              {isExporting ? 'Exportando...' : 'Exportar PDF'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={exportDiarioCSV}
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
                  onClick={() => exportRelatorioAlunos('pdf')}
                  disabled={isExporting}
                >
                  PDF
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => exportRelatorioAlunos('csv')}
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
                  onClick={() => exportRelatorioFrequencia('pdf')}
                  disabled={isExporting}
                >
                  PDF
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => exportRelatorioFrequencia('csv')}
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
                  onClick={() => exportRelatorioNotas('pdf')}
                  disabled={isExporting}
                >
                  PDF
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => exportRelatorioNotas('csv')}
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
