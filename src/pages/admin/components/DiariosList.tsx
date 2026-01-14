// ================================================
// SUBSTITUA O useEffect DE FILTRAGEM (linhas ~153-178)
// NO SEU DiariosList.tsx POR ESTE CÓDIGO:
// ================================================

  // Filtrar professores quando disciplina é selecionada
  useEffect(() => {
    const filtrarProfessores = async () => {
      if (!formData.disciplinaId) {
        setProfessoresFiltrados(professores);
        return;
      }

      try {
        // Pegar os IDs dos professores que ensinam esta disciplina
        const professoresIds = await supabaseService.getProfessoresByDisciplina(Number(formData.disciplinaId));
        
        console.log('=== FILTRAGEM DE PROFESSORES ===');
        console.log('Disciplina selecionada:', formData.disciplinaId);
        console.log('IDs de professores da disciplina:', professoresIds);
        console.log('Todos os professores (usuários):', professores);
        
        // Filtrar: só pega os usuários PROFESSOR que estão na lista de IDs
        const professoresDaDisciplina = professores.filter(p => {
          console.log(`Verificando professor: ${p.nome} (professor_id: ${p.professor_id})`);
          const match = p.professor_id && professoresIds.includes(p.professor_id);
          console.log(`  → Match: ${match}`);
          return match;
        });
        
        console.log('Professores filtrados:', professoresDaDisciplina);
        console.log('=================================');
        
        setProfessoresFiltrados(professoresDaDisciplina);
        
        // Limpar professor selecionado se não está na lista filtrada
        if (formData.professorId && !professoresIds.includes(Number(formData.professorId))) {
          setFormData(prev => ({ ...prev, professorId: '' }));
        }
      } catch (error) {
        console.error('Erro ao filtrar professores:', error);
        setProfessoresFiltrados(professores);
      }
    };

    filtrarProfessores();
  }, [formData.disciplinaId, professores, formData.professorId]);
