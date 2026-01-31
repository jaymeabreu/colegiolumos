// SUBSTITUA a função loadData() completa por esta:

const loadData = async () => {
  if (!user?.alunoId) {
    setLoading(false);
    return;
  }

  try {
    setLoading(true);
    console.log('🎓 Carregando dados do aluno (VIEW):', user.alunoId);

    // 1) Aluno
    const { data: alunoRow, error: alunoErr } = await supabase
      .from('alunos')
      .select('*')
      .eq('id', user.alunoId)
      .maybeSingle();

    if (alunoErr) throw alunoErr;
    const alunoData = (alunoRow as any) as Aluno | null;
    setAluno(alunoData ?? null);
    if (!alunoData) return;

    // 2) BUSCAR DA VIEW (já vem tudo calculado!)
    const { data: boletimRows, error: boletimErr } = await supabase
      .from('boletim_alunos')
      .select('*')
      .eq('aluno_id', user.alunoId)
      .order('disciplina', { ascending: true })
      .order('bimestre', { ascending: true });

    if (boletimErr) throw boletimErr;

    console.log('📊 Dados da VIEW:', boletimRows);

    // 3) Agrupar por disciplina (somar bimestres)
    const disciplinasMap = new Map<number, DisciplinaBoletim>();

    (boletimRows ?? []).forEach((row: any) => {
      const disciplinaId = row.disciplina_id;
      const bimestre = row.bimestre;
      const media = row.media_bimestre ? Number(row.media_bimestre) : null;
      const freq = row.frequencia_percentual ? Number(row.frequencia_percentual) : 0;

      let entry = disciplinasMap.get(disciplinaId);

      if (!entry) {
        entry = {
          disciplina: row.disciplina,
          bimestre1: null,
          bimestre2: null,
          bimestre3: null,
          bimestre4: null,
          mediaFinal: 0,
          frequencia: 0,
          situacao: 'Em Andamento',
          totalAulas: row.total_presencas_registradas || 0,
          presencas: row.total_presencas || 0,
          faltas: row.total_faltas || 0,
        };
        disciplinasMap.set(disciplinaId, entry);
      }

      // Adicionar nota do bimestre
      if (bimestre === 1) entry.bimestre1 = media;
      if (bimestre === 2) entry.bimestre2 = media;
      if (bimestre === 3) entry.bimestre3 = media;
      if (bimestre === 4) entry.bimestre4 = media;

      // Acumular totais
      entry.totalAulas += row.total_presencas_registradas || 0;
      entry.presencas += row.total_presencas || 0;
      entry.faltas += row.total_faltas || 0;
    });

    // 4) Calcular médias finais e situação
    const boletimFinal: DisciplinaBoletim[] = [];

    disciplinasMap.forEach((entry) => {
      const notas = [
        entry.bimestre1,
        entry.bimestre2,
        entry.bimestre3,
        entry.bimestre4,
      ].filter((n): n is number => n !== null);

      // Média final = média dos bimestres com nota
      entry.mediaFinal = notas.length > 0 
        ? Number((notas.reduce((s, n) => s + n, 0) / notas.length).toFixed(1))
        : 0;

      // Frequência
      entry.frequencia = entry.totalAulas > 0
        ? Number(((entry.presencas / entry.totalAulas) * 100).toFixed(1))
        : 100;

      // Situação (regras: média >= 5 E frequência >= 75%)
      if (entry.mediaFinal === 0) {
        entry.situacao = 'Em Andamento';
      } else if (entry.mediaFinal >= 5 && entry.frequencia >= 75) {
        entry.situacao = 'Aprovado';
      } else if (entry.mediaFinal < 5 || entry.frequencia < 75) {
        entry.situacao = 'Reprovado';
      } else {
        entry.situacao = 'Em Andamento';
      }

      boletimFinal.push(entry);
    });

    setBoletimCompleto(boletimFinal);

    // 5) Buscar outros dados (avaliacoes, ocorrencias) - OPCIONAL
    const diarioIds = (boletimRows ?? []).map((r: any) => r.diario_id);

    if (diarioIds.length > 0) {
      // Avaliações
      const { data: avRows } = await supabase
        .from('avaliacoes')
        .select('*')
        .in('diario_id', diarioIds);
      
      setAvaliacoes((avRows ?? []).map((a: any) => ({
        ...a,
        diarioId: a.diario_id,
      })));

      // Notas
      const { data: notasRows } = await supabase
        .from('notas')
        .select('*')
        .eq('aluno_id', user.alunoId);

      setNotas((notasRows ?? []).map((n: any) => ({
        ...n,
        alunoId: n.aluno_id,
        avaliacaoId: n.avaliacao_id,
      })));

      // Disciplinas
      const disciplinaIds = Array.from(disciplinasMap.keys());
      const { data: discRows } = await supabase
        .from('disciplinas')
        .select('*')
        .in('id', disciplinaIds);

      setDisciplinas(discRows ?? []);

      // Diários
      const { data: diariosRows } = await supabase
        .from('diarios')
        .select('*')
        .in('id', diarioIds);

      setDiarios((diariosRows ?? []).map((d: any) => ({
        ...d,
        turmaId: d.turma_id,
        professorId: d.professor_id,
        disciplinaId: d.disciplina_id,
      })));
    }

    // Ocorrências
    const { data: ocRows } = await supabase
      .from('ocorrencias')
      .select('*')
      .eq('aluno_id', user.alunoId);

    setOcorrencias((ocRows ?? []).map((o: any) => ({
      ...o,
      alunoId: o.aluno_id,
    })));

    console.log('✅ Dados carregados:', {
      boletim: boletimFinal.length,
      avaliacoes: avaliacoes.length,
      ocorrencias: ocorrencias.length,
    });

  } catch (error) {
    console.error('❌ Erro ao carregar dados:', error);
  } finally {
    setLoading(false);
  }
};
