// TRECHO A SER CORRIGIDO NO DiariosList.tsx
// Substitua este useEffect (linhas ~153-178):

  // Filtrar professores quando disciplina é selecionada
  useEffect(() => {
    const filtrarProfessores = async () => {
      if (!formData.disciplinaId) {
        setProfessoresFiltrados(professores);
        return;
      }

      try {
        // Pegar IDs dos professores que ensinam esta disciplina
        const professoresIds = await supabaseService.getProfessoresByDisciplina(Number(formData.disciplinaId));
        
        // Filtrar os usuários PROFESSOR que estão na lista acima
        const professoresDaDisciplina = professores.filter(p => {
          // Verificar se o professor_id do usuário está na lista de IDs retornada
          if (p.professor_id && professoresIds.includes(p.professor_id)) {
            return true;
          }
          return false;
        });

        console.log('Professores da disciplina:', professoresDaDisciplina);
        console.log('IDs esperados:', professoresIds);
        console.log('Todos os professores:', professores);
        
        setProfessoresFiltrados(professoresDaDisciplina);
        
        // Limpar professor selecionado se não está na lista filtrada
        if (formData.professorId) {
          const professorValido = professoresDaDisciplina.some(p => p.professor_id?.toString() === formData.professorId);
          if (!professorValido) {
            setFormData(prev => ({ ...prev, professorId: '' }));
          }
        }
      } catch (error) {
        console.error('Erro ao filtrar professores:', error);
        setProfessoresFiltrados(professores);
      }
    };

    filtrarProfessores();
  }, [formData.disciplinaId, professores, formData.professorId]);

// APÓS CORRIGIR, ABRA O CONSOLE DO NAVEGADOR (F12)
// E VEJA QUAL SÃO OS LOGS PARA DIAGNOSTICAR O PROBLEMA
